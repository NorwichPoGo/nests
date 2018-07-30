const Settings = require('../settings');

module.exports = map => {
  google.maps.event.addListener(map, 'idle', () => {
    Settings.set('mapCenter', {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    });
    Settings.set('zoomLevel', map.getZoom());
  });
};
