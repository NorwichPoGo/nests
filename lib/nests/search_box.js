const SearchBox = require('../search_box');

module.exports = map => {
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
};
