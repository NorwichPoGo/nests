'use strict';

const Settings = require('./settings');
const Utils = require('./utils');

const pokemonImagesUrl = 'https://raw.githubusercontent.com/pogo-excalibur' +
                         '/images/master/pogo';

window.initMap = () => {
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

  initNests(map);
  initSettings(map);
};

function initNests(map) {
  const dataPromises = [
    loadNestData(),
    loadPokemonData()
  ];

  Promise.all(dataPromises)
    .then(function (results) {
      const nestData = results[0];
      const pokemonData = results[1];

      $.each(pokemonData, function (id, pokemon) {
        pokemon.id = id;
      });

      $.each(nestData, function (index, nest) {
        if (nest.pokemon) {
          nest.pokemon = pokemonData[nest.pokemon];
        }
      });

      return nestData;
    })
    .then(function (nestData) {
      $.each(nestData, function (index, nest) {
        drawNest(map, nest);
      });
    })
    /* If a nest is given as a URL parameter then zoom to it. */
    .then(function (nestData) {
      const centerNestName = Utils.urlParameter('nest');
      if (centerNestName) {
        let centerNest;
        $.each(nestData, function (index, nest) {
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
  google.maps.event.addListener(map, 'idle', function () {
    Settings.set('mapCenter', {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    });
    Settings.set('zoomLevel', map.getZoom());
  });
}

function loadNestData() {
  return fetchNestData()
    .then(function (nestData) {
      console.log(nestData);
      $.each(nestData, function (index, nest) {
        nest.center = Utils.coordinateToLatLng([
          nest.latitude,
          nest.longitude
        ]);

        nest.region = $.map(nest.coords, function (coord) {
          return Utils.coordinateToLatLng(coord);
        });

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

  nest.polygon.addListener('click', function () {
    labelClick();
  });

  nest.marker.addListener('click', function () {
    labelClick();
  });

  map.addListener('click', function () {
    nest.label.close();
    nest.label.isOpen = false;
  });

  nest.label.addListener('closeclick', function () {
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
