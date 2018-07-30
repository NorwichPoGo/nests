'use strict';

const Utils = require('../utils');
const Polygon = require('../objects/polygon');
const MarkerLabel = require('../objects/marker_label');

class Nest extends Polygon {
  constructor(options) {
    super(options);
    this.cssId = this.id.toLowerCase().replace(/\//g, '-');
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
    let icon = {};
    if (this.pokemon && this.pokemon.sprite) {
      const sprite = this.pokemon.sprite;
      const scale = {
        x: 34 / sprite.width,
        y: 34 / sprite.height
      };

      icon = {
        url: 'https://cdn.rawgit.com/pogo-excalibur/images' +
             '/956c44dd/pokemon_sprites.png',
        origin: new google.maps.Point(
          sprite.x * scale.x,
          sprite.y * scale.y
        ),
        size: new google.maps.Size(
          sprite.width * scale.x,
          sprite.height * scale.y
        ),
        scaledSize: new google.maps.Size(
          sprite.sheetWidth * scale.x,
          sprite.sheetHeight * scale.y
        ),
        anchor: new google.maps.Point(
          (sprite.width / 2) * scale.x,
          (sprite.height / 2) * scale.y
        )
      };
    }

    return new google.maps.Marker({
      position: this.location,
      icon: icon,
      zIndex: 20
    });
  }

  pokemonNameStr() {
    return this.pokemon ? `${this.pokemon.name} (#${this.pokemon.id})` : '?';
  }

  _createLabel() {
    const permaLink = `${Utils.BASE_URL}?nest=${this.permalinkName}`;

    const content = `
      <div id="nest-label-${this.cssId}" class="nest-label">
        <div class="name">
          ${this.name.trim()}
          <a href="${permaLink}"><span class="fas fa-link"></span></a>
        </div>
        <div class="pokemon">
          Species: ${this.pokemonNameStr()}
        </div>
        <div class="options">
          <a href="#" class="report">Add a Report</a>
        </div>
      </div>`;

    const clickTargets = [this.polygon];
    if (this.marker) {
      clickTargets.push(this.marker);
    }

    return new MarkerLabel(this, clickTargets, {
      content: content
    });
  }
}

module.exports = Nest;
