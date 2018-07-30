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

    if (this.options.placeholder) {
      this.setPlaceholder(this.options.placeholder);
    }

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

  setPlaceholder(text) {
    this.searchBox.attr('placeholder', text);
  }

  clear() {
    this.dropdown.empty();
  }

  add(result) {
    const resultWrapper = document.createElement('div');
    resultWrapper.setAttribute('class', 'pac-item');

    if (result.icon) {
      const icon = document.createElement('span');
      icon.setAttribute('class', `pac-icon pac-icon-${result.icon}`);
      resultWrapper.appendChild(icon);
    }

    const match = document.createElement('span');
    match.setAttribute('class', 'pac-item-query');
    match.innerHTML = result.name;
    resultWrapper.appendChild(match);

    if (result.description) {
      const description = document.createElement('span');
      // <span class="pac-matched"></span>
      description.innerHTML = result.description;
      resultWrapper.appendChild(description);
    }

    this.dropdown[0].appendChild(resultWrapper);

    $(resultWrapper).click(() => {
      this.map.panTo(result.location);

      if (result.label && result.label.open) {
        result.label.open(this.map);
      }
    });
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
