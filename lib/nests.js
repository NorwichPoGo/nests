'use strict';

const Settings = require('./settings');
const Utils = require('./utils');
const SearchBox = require('./search_box');
const Nest = require('./features/nest');

window.initMap = () => {
  const latLngStr = Utils.urlParameter('ll');
  const coords = Utils.coordsFromString(latLngStr);
  if (coords) {
    Settings.set('mapCenter', {
      lat: coords[0],
      lng: coords[1]
    });
  }

  const map = new google.maps.Map(document.getElementById('map'), {
    center: Settings.get('mapCenter'),
    zoom: Settings.get('zoomLevel'),
    gestureHandling: 'greedy',
    fullscreenControl: false,
    streetViewControl: true,
    mapTypeControl: true,
    clickableIcons: false,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.LEFT_BOTTOM,
      mapTypeIds: [
        google.maps.MapTypeId.ROADMAP,
        google.maps.MapTypeId.SATELLITE,
        google.maps.MapTypeId.HYBRID
      ]
    }
  });

  return Promise.resolve()
    .then(() => initSearchBox(map))
    .then(() => initPokemon(map))
    .then(() => initNestReportPopup(map))
    .then(() => initNests(map))
    .then(() => initSettings(map));
};

function initSearchBox(map) {
  map.searchBox = new SearchBox({
    map: map,
    size: 4,
    placeholder: 'Search Nests',
    startDisabled: true
  });

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(map.searchBox.input);

  $(document).click(() => {
    map.searchBox.dropdown.hide();
  });

  map.searchBox.searchBox.click(e => {
    e.stopPropagation();
  });
}

function initPokemon(map) {
  return loadPokemonData()
    .then(pokemonData => {
      map.pokemonData = pokemonData;

      $.each(map.pokemonData, (id, pokemon) => {
        pokemon.id = id;
      });

      return loadSpriteData();
    })
    .then(spriteData => {
      $.each(map.pokemonData, (id, pokemon) => {
        pokemon.sprite = spriteData.sprites.find(sp => sp.name == pokemon.id);

        if (pokemon.sprite) {
          pokemon.sprite.sheetWidth = spriteData.width;
          pokemon.sprite.sheetHeight = spriteData.height;
        }
      });
      
      return map.pokemonData;
    });
}

function initNestReportPopup(map) {
  map.nestReportOverlay = $('.nest-report-overlay');
  map.nestReportOverlay.click(() => {
    map.updateSelectedNest = null;
    map.nestReportOverlay.hide();
  });

  const nestReportCloseIcon = $('.nest-report-popup .close-icon');
  nestReportCloseIcon.click(() => {
    map.updateSelectedNest = null;
    map.nestReportOverlay.hide();
  });

  const nestReportHeading = $('.nest-report-popup .heading');
  nestReportHeading.html('Select a Pokémon:');

  const nestReportSelection = $('.nest-report-popup .selection');

  const addPokemonIcon = pokemon => {
    let pokemonIcon;
    if (pokemon.id && (pokemon.id > 0)) {
      const pokemonNum = `${pokemon.id}`.padStart(3, '0');
      pokemonIcon = $(`
        <div class="pokemon">
          <div class="icon pokemon-sprite-${pokemon.id}"></div>
          <span class="id">${pokemonNum}</span>
          <span class="name">${pokemon.name}</span>
        </div>
        `);
    } else {
      pokemonIcon = $(`
        <div class="pokemon">
          <div class="icon clear"></div>
          <span class="clear-label">${pokemon.name}</span>
        </div>
        `);
    }

    pokemonIcon.appendTo(nestReportSelection);

    pokemonIcon.click(() => {
      map.nestReportOverlay.hide();

      if (map.updateSelectedNest) {
        map.updateSelectedNest(pokemon);
      }
    });
  };

  addPokemonIcon({
    id: 0,
    name: 'Clear'
  });

  $.each(Utils.NESTING_SPECIES, (index, pokemonId) => {
    const pokemon = map.pokemonData[pokemonId];
    addPokemonIcon(pokemon);
  });
}

function initNests(map) {
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
}

function initSettings(map) {
  google.maps.event.addListener(map, 'idle', () => {
    Settings.set('mapCenter', {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    });
    Settings.set('zoomLevel', map.getZoom());
  });
}

function loadPokemonData() {
  return Promise.resolve($.getJSON('/data/pokemon.json'));
}

function loadSpriteData() {
  return Promise.resolve($.getJSON(
    'https://cdn.rawgit.com/pogo-excalibur/images/' +
    'd4b555aa/pokemon_sprites.json'
  ));
}

function loadNestData() {
  const request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/nests?action=get',
    dataType: 'json'
  });
  return Promise.resolve(request);
}

function updateNest(map, nest, pokemon) {
  nest.label.close();
  nest.hide();

  const request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/nests?action=update&' +
         `id=${nest.id}&` +
         `pokemonId=${pokemon.id}`,
    dataType: 'json'
  });

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
}
