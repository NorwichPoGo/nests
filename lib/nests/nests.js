const Utils = require('../utils');
const Nest = require('./nest');

module.exports = map => {
  map.showNests = shouldRedraw => {
    $.each(map.nests, (index, nest) => {
      if (nest.shouldShow()) {
        nest.show(map, shouldRedraw);
      } else {
        nest.hide();
      }
    });
  };

  map.getNestById = id => {
    if (!map.nests || (!map.nests.length > 0)) return;
    return map.nests.find(nest => nest.id == id);
  };

  return loadNestData()
    .then(nestData => {
      map.nests = $.map(nestData, data => new Nest(data));

      $.each(map.pokemonData, (id, pokemon) => {
        pokemon.id = id;
      });

      $.each(map.nests, (index, nest) => {
        if (!nest.pokemon) return;
        nest.pokemon = map.pokemonData[nest.pokemon];
      });

      map.showNests();

      map.nests.nameLookup = new Fuse(map.nests, {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ['name']
      });

      map.searchBox.lookup = function (value) {
        return map.nests.nameLookup.search(value);
      };

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

      map.searchBox.enable();
    });
};

const loadNestData = () =>
  Promise.resolve($.getJSON(
    'https://api.pokemongonorwich.uk/nests?action=get'
  ));

const updateNest = (map, nest, pokemon) => {
  nest.label.close();
  nest.hide();

  const request = $.getJSON(
    'https://api.pokemongonorwich.uk/nests?action=update&' +
    `id=${nest.id}&` +
    `pokemonId=${pokemon.id}`
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
