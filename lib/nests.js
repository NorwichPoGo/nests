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

  initSearchBox(map);
  initNests(map);
  initSettings(map);
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

  return loadPokemonData()
    .then(pokemonData => {
      return loadNestData()
        .then(nestData => {
          map.nests = $.map(nestData, data => new Nest(data));

          $.each(pokemonData, (id, pokemon) => {
            pokemon.id = id;
          });

          $.each(map.nests, (index, nest) => {
            if (!nest.pokemon) return;
            nest.pokemon = pokemonData[nest.pokemon];
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

          const nestName = Utils.urlParameter('nest');
          if (nestName) {
            const nest = nests.find(nest => nest.permalinkName == nestName);

            if (nest) {
              map.panTo(nest.center);
              map.setZoom(17);
            }
          }

          map.searchBox.enable();
        });
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

function loadNestData() {
  const request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/nests?action=get',
    dataType: 'json'
  });
  return Promise.resolve(request);
}

function loadPokemonData() {
  return Promise.resolve($.getJSON('/data/pokemon.json'));
}
