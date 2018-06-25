'use strict';

const Settings = require('./settings');

class SearchBox {
  constructor(options) {
    this.options = options || {};
    this.map = options.map;
    this.lookup = options.lookup;
    this.matchFilter = options.matchFilter;
    this.size = options.size || 4;

    this.searchBox = this._createInput();
    this.dropdown = this._createDropdown();

    this._attachInputListener();
    this.updateText();

    if (this.options.startDisabled) {
      this.disable();
    }
  }

  get input() {
    return this.searchBox[0];
  }

  enable() {
    this.searchBox.prop('disabled', false);
  }

  disable() {
    this.searchBox.prop('disabled', true);
  }

  clear() {
    this.dropdown.empty();
  }

  add(result) {
    const resultWrapper = document.createElement('div');
    resultWrapper.setAttribute('class', 'pac-item');

    const resultIcon = document.createElement('span');
    resultIcon.setAttribute('class', `pac-icon pac-icon-${result.type}`);

    const resultMatch = document.createElement('span');
    resultMatch.setAttribute('class', 'pac-item-query');
    resultMatch.innerHTML =
      `<span class="pac-item-query">${result.name}</span>`;

    const resultDescription = document.createElement('span');
    resultDescription.innerHTML = result.description || '';

    resultWrapper.appendChild(resultIcon);
    resultWrapper.appendChild(resultMatch);
    resultWrapper.appendChild(resultDescription);
    this.dropdown[0].appendChild(resultWrapper);

    $(resultWrapper).click(() => {
      this.map.panTo(result.location);

      if (result.label) {
        result.label.open(this.map);
      }
    });
  }

  updateText() {
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

    this.searchBox.attr('placeholder', text);
  }

  _createInput() {
    const input = $(document.createElement('input'));
    input.attr('id', 'pac-input');
    input.attr('class', 'controls');
    input.attr('type', 'text');
    return input;
  }

  _createDropdown() {
    const dropdown = $(document.createElement('div'));
    dropdown.attr('class', 'pac-container  pac-logo');
    dropdown.appendTo('body');
    return dropdown;
  }

  _attachInputListener() {
    this.searchBox.on('input', e => {
      this.clear();

      if (!this.lookup) return;

      let matches = this.lookup(e.currentTarget.value);
      if (this.matchFilter) {
        matches = matches.filter(this.matchFilter);
      }

      $.each(matches.slice(0, this.size), (index, match) => {
        this.add(match);
      });

      this.dropdown.show();
    });
  }
}

module.exports = SearchBox;
