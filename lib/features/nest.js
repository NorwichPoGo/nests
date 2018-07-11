'use strict';

const Polygon = require('./polygon');
const FeatureLabel = require('./feature_label');

const POKEMON_IMAGES_URL =
  'https://raw.githubusercontent.com/pogo-excalibur/images/master/pogo';
const BASE_URL = location.protocol + '//' + location.host + location.pathname;

class Nest extends Polygon {
  constructor(options) {
    super(options);
    this.pokemon = options.pokemon;
    this.permalinkName = this.name.replace(/[^\w]/g, '').toLowerCase();
    this.dateAdded = options.dateAdded;
  }

  shouldShow() {
    return true;
  }

  get showMarker() {
    return this.pokemon && this.pokemon.id;
  }

  _createPolygon() {
    return new google.maps.Polygon({
      paths: this.region,
      fillColor: 'green',
      fillOpacity: 0.5,
      strokeColor: 'green',
      strokeOpacity: 1,
      strokeWeight: 0
    });
  }

  _createMarker() {
    return new google.maps.Marker({
      position: this.location,
      icon: {
        url: `${POKEMON_IMAGES_URL}/${this.pokemon.id}.png`,
        scaledSize: new google.maps.Size(34, 34),
        anchor: new google.maps.Point(17, 17)
      },
      zIndex: 20
    });
  }

  pokemonNameStr() {
    return this.pokemon ? `${this.pokemon.name} (#${this.pokemon.id})` : '?';
  }

  _createLabel() {
    const permaLink = `${BASE_URL}?nest=${this.permalinkName}`;

    const content = `
      <div id="nest-label-${this.cssId}" class="nest-label">
        <div class="name">
          ${this.name.trim()}
          <a href="${permaLink}"><span class="fas fa-link"></span></a>
        </div>
        <div class="pokemon">
          Species: ${this.pokemonNameStr()}
        </div>
        <div class="options"></div>
      </div>`;

    const clickTargets = [this.polygon]
    if (this.marker) {
      clickTargets.push(this.marker);
    }

    return new FeatureLabel(this, clickTargets, {
      content: content
    });
  }
}

module.exports = Nest;
