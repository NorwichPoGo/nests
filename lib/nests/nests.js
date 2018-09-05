const Settings = require('../settings');
const Utils = require('../utils');
const DataLoader = require('../data_loader');
const Nest = require('./nest');

const DATA_API_URL =
  'https://script.google.com/macros/s' +
  '/AKfycbwvyO2lBu2l2KaS9lWg5gg8zXu2EYaAL3zZHrNSnRZqKmU8bT93/exec';

module.exports = map => {
  map.nests = $.map(Settings.get('nests'), nestData => {
    const nest = createNest(nestData);
    if (map.pokemonData && nest.pokemon) {
      nest.pokemonId = nest.pokemon;
      nest.pokemon = map.pokemonData[nest.pokemonId];
    }
    return nest;
  });

  if (map.nests.length === 0) {
    Settings.delete('lastNestUpdate');
  }

  map.showNests = shouldRedraw => {
    $.each(map.nests, (index, nest) => {
      if (nest.shouldShow()) {
        nest.show(map, shouldRedraw);
      } else {
        nest.hide();
      }
    });
  };

  map.showNests();

  map.getNestById = id => {
    if (!map.nests || (!map.nests.length > 0)) return;
    return map.nests.find(nest => nest.id == id);
  };

  const loader = $(document.createElement('div'));
  loader.attr('class', 'loader loader-center');
  loader.appendTo('body');

  const onFetch = response => {
    response.data = response.nests;
    delete response.nests;
    return response;
  };

  const onLoad = response => {
    $.each(response.data, (index, nestData) => {
      const nest = createNest(nestData);

      if (map.pokemonData && nest.pokemon) {
        nest.pokemonId = nest.pokemon;
        nest.pokemon = map.pokemonData[nest.pokemonId];
      }

      if (nest.shouldShow()) {
        nest.show(map);
      }
      nestData.object = nest;
    });

    return response;
  };

  const dataURL = `${DATA_API_URL}?action=get`;
  const lastUpdate = Settings.get('lastNestUpdate');
  const dataLoader = new DataLoader(dataURL, onFetch, onLoad, {
    batchSize: (lastUpdate > 0) ? 1 : 2,
    chunkSize: 100
  });

  const params = {
    lastUpdate: lastUpdate
  };

  return dataLoader.loadInBatches(params)
    .then(nests => {
      loader.remove();

      nests = $.map(nests, nest => {
        const object = nest.object;
        delete nest.object;
        return object;
      });

      const newNestIds = $.map(nests, nest => nest.id);

      const nestsToKeep = [];
      $.each(map.nests, (index, nest) => {
        const updated = newNestIds.includes(nest.id);
        if (updated) {
          nest.hide();
        } else {
          nestsToKeep.push(nest);
        }
      });

      map.nests = nestsToKeep.concat(nests);

      const nestData = $.map(map.nests, nest => nest.options);
      Settings.set('nests', nestData);
      Settings.set('lastNestUpdate', Date.now());

      map.nestLookup = new Fuse(map.nests, {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ['name']
      });

      map.searchBox.lookup = function (value) {
        return map.nestLookup.search(value);
      };

      map.searchBox.enable();

      map.addListener('click', () => {
        $.each(map.nests, (index, nest) => {
          if (nest.label) {
            nest.label.close();
          }
        });
      });

      $('body').on('click', '.nest-label .report', event => {
        const label = $(event.target).parents('.nest-label');
        if (!label) return;

        const nestId = label.attr('id')
          .replace(/^nest-label-/, '')
          .replace(/-/, '/');
        if (!nestId) return;

        const nest = map.getNestById(nestId);
        if (!nest) return;

        setTimeout(() => {
          map.updateSelectedNest = pokemon => {
            updateNest(map, nest, pokemon);
            map.updateSelectedNest = null;
          };
          map.nestReportOverlay.show();
        });
      });

      const nestName = Utils.urlParameter('nest');
      if (nestName) {
        const nest =
          map.nests.find(nest => nest.permalinkName == nestName);

        if (nest) {
          map.panTo(nest.center);
          map.setZoom(17);
        }
      }
    });
};

const createNest = nestData => new Nest(nestData);

const updateNest = (map, nest, pokemon) => {
  nest.label.close();
  nest.hide();

  const request = $.getJSON(
    `${DATA_API_URL}?action=update` +
    `&id=${nest.id}` +
    `&pokemonId=${pokemon.id}`
  );

  return Promise.resolve(request)
    .then(result => {
      if (!result) {
        nest.show();
        throw new Error('Could not update this nest');
      } else if (result.error) {
        nest.show();
        throw new Error(`Could not update this nest: ${result.error}`);
      }

      if (pokemon.id == 0) {
        nest.pokemon = null;
        nest.marker = null;
      } else {
        nest.pokemon = pokemon;
      }

      nest.show(map, true);
    });
};
