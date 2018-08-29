const Settings = require('../settings');
const SearchBox = require('../objects/search_box');

module.exports = map => {
  map.searchBox = new SearchBox({
    map: map,
    matchFilter: match => match.isShown(),
    size: 4,
    startDisabled: true
  });

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(map.searchBox.input);

  $(document).click(() => {
    map.searchBox.dropdown.hide();
  });

  map.searchBox.searchBox.click(e => {
    e.stopPropagation();
  });

  map.searchBox.updateText = () => {
    const parts = [];
    if (Settings.get('showGyms')) parts.push('Gyms');
    if (Settings.get('showPokestops')) parts.push('Pokestops');
    if (Settings.get('showPortals')) parts.push('Portals');

    let text = 'Search';
    if (parts.length === 1) {
      text += ' ' + parts[0];
    } else if (parts.length > 1) {
      const firstParts = parts.slice(0, -1);
      const lastPart = parts.slice(-1);
      text += ' ' + firstParts.join(', ') + ' and ' + lastPart;
    }

    map.searchBox.setPlaceholder(text);
  };

  map.searchBox.updateText();
};
