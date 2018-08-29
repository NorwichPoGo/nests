const Settings = require('../settings');

module.exports = map => {
  Promise.resolve($.getJSON('/data/parks.geojson'))
    .then(parks => {
      const parksLayer = new google.maps.Data();
      parksLayer.addGeoJson(parks);
      parksLayer.setStyle({
        fillColor: 'green'
      });

      parksLayer.show = show => {
        if (show === false) {
          parksLayer.setMap(null);
        } else {
          parksLayer.setMap(map);
        }
      };

      map.parksLayer = parksLayer;
      map.parksLayer.show(Settings.get('showParks'));
    });
};
