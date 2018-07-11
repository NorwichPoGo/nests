'use strict';

const Settings = require('./settings');
const Utils = require('./utils');
const SearchBox = require('./search_box');

const pokemonImagesUrl = 'https://raw.githubusercontent.com/pogo-excalibur' +
                         '/images/master/pogo';

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
  const dataPromises = [
    loadNestData(),
    loadPokemonData()
  ];

  Promise.all(dataPromises)
    .then(results => {
      const nestData = results[0];
      const pokemonData = results[1];

      $.each(pokemonData, (id, pokemon) => {
        pokemon.id = id;
      });

      $.each(nestData, (index, nest) => {
        if (nest.pokemon) {
          nest.pokemon = pokemonData[nest.pokemon];
        }
      });

      $.each(nestData, (index, nest) => {
        drawNest(map, nest);
      });

      map.nests = nestData;

      map.nests.nameLookup = new Fuse(map.nests, {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: [
          'name'
        ]
      });

      map.searchBox.lookup = function (value) {
        return map.nests.nameLookup.search(value);
      };

      map.searchBox.enable();

      /* If a nest is given as a URL parameter then zoom to it. */
      const centerNestName = Utils.urlParameter('nest');
      if (centerNestName) {
        let centerNest;
        $.each(nestData, (index, nest) => {
          if (nest.permalinkName == centerNestName) {
            centerNest = nest;
            return false;
          }
        });

        if (centerNest) {
          map.panTo(centerNest.center);
          map.setZoom(17);
        }
      }

      return nestData;
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
  return fetchNestData()
    .then(nestData => {
      $.each(nestData, (index, nest) => {
        nest.center = Utils.coordinateToLatLng([
          nest.latitude,
          nest.longitude
        ]);

        nest.location = nest.center;

        nest.region =
          $.map(nest.coords, coord => Utils.coordinateToLatLng(coord));

        nest.permalinkName = nest.name
          .replace(/[^\w]/g, '')
          .toLowerCase();
      });

      return nestData;
    });
}

function fetchNestData() {
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

function drawNest(map, nest) {
  nest.polygon = nestRegion(nest);
  nest.polygon.setMap(map);

  nest.marker = nestMarker(nest);
  nest.marker.setMap(map);

  nest.label = nestLabel(nest);

  function labelClick() {
    if (nest.label.isOpen) {
      nest.label.close();
      nest.label.isOpen = false;
    } else {
      nest.label.setPosition(nest.center);
      nest.label.open(map);
      nest.label.isOpen = true;
    }
  }

  nest.label.isOpen = false;

  nest.polygon.addListener('click', () => {
    labelClick();
  });

  nest.marker.addListener('click', () => {
    labelClick();
  });

  map.addListener('click', () => {
    nest.label.close();
    nest.label.isOpen = false;
  });

  nest.label.addListener('closeclick', () => {
    nest.label.isOpen = false;
  });
}

function nestRegion(nest) {
  return new google.maps.Polygon({
    paths: nest.region,
    fillColor: 'green',
    fillOpacity: 0.5,
    strokeColor: 'green',
    strokeOpacity: 1,
    strokeWeight: 0
  });
}

function nestMarker(nest) {
  const icon = nestIcon(nest);

  if (icon) {
    return new google.maps.Marker({
      position: nest.center,
      icon: nestIcon(nest)
    });
  } else {
    return new google.maps.Marker();
  }
}

function nestIcon(nest) {
  if (nest.pokemon) {
    return {
      url: `${pokemonImagesUrl}/${nest.pokemon.id}.png`,
      scaledSize: new google.maps.Size(34, 34),
      anchor: new google.maps.Point(17, 17)
    };
  }
}

function nestLabel(nest) {
  function pokemonNameStr(pokemon) {
    return pokemon ? `${pokemon.name} (#${pokemon.id})` : '?';
  }

  const baseURL = location.protocol + '//' + location.host + location.pathname;
  const permaLink = `${baseURL}?nest=${nest.permalinkName}`;

  let content = `
    <div class="nest-label">
      <div class="nest-label-name">
        <b>${nest.name}</b>
        <a href="${permaLink}"><span class="fas fa-link"></span></a>
      </div>
      <div class="nest-label-pokemon">
        Species: ${pokemonNameStr(nest.pokemon)}
      </div>
    </div>`;

  return new google.maps.InfoWindow({
    content: content
  });
}
