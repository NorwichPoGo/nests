const Settings = require('../settings');
const Utils = require('../utils');

const initSearchBox = require('./search_box');
const initS2Cells = require('./s2_cells');
const initFeatures = require('./features');
const initParks = require('./parks');
const initSettings = require('./settings');

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
  initS2Cells(map);
  initFeatures(map);
  initParks(map);
  initSettings(map);
};
