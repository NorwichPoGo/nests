'use strict';

const Utils = require('../utils');
const FeatureLabel = require('./feature_label');

class Polygon {
  constructor(options) {
    this.options = options;
    this.id = options.id;
    this.name = options.name;
    this.region =
      $.map(options.coords, coord => Utils.coordinateToLatLng(coord));
    this.center = Utils.coordinateToLatLng([
      options.latitude,
      options.longitude
    ]);
    this.location = this.center;
  }

  get showMarker() {
    return false;
  }

  get showLabel() {
    return true;
  }

  draw(map, redraw) {
    if (redraw) {
      this.hide();
    }

    if (!this.polygon || redraw) {
      this.polygon = this._createPolygon();

      if (this.showMarker) {
        this.marker = this._createMarker();
      }

      if (this.showLabel) {
        this.label = this._createLabel();
      }
    }
  }

  show(map, shouldRedraw) {
    if (Utils.isFunction(shouldRedraw) || shouldRedraw) {
      this.draw(map, true);
    }

    if (!this.isShown()) {
      this.draw(map);
      this.polygon.setMap(map);

      if (this.marker) {
        this.marker.setMap(map);
      }
    }
  }

  hide() {
    if (this.polygon) {
      this.polygon.setMap(null);
    }

    if (this.marker) {
      this.marker.setMap(null);
    }
  }

  isShown() {
    return this.polygon && this.polygon.map;
  }

  _createPolygon() {
    return new google.maps.Polygon({
      paths: this.region,
      fillColor: 'blue',
      fillOpacity: 0.5,
      strokeColor: 'blue',
      strokeOpacity: 1,
      strokeWeight: 0
    });
  }

  _createMarker() {
    return new google.maps.Marker({
      position: this.location,
      zIndex: (this.isNew ? 30 : 20)
    });
  }

  _createLabel() {
    const content = `
      <div class="polygon-label">
        <div class="polygon-label-name">
          <b>${this.name}</b>
        </div>
      </div>`;

    return new FeatureLabel(this, this.polygon, {
      content: content
    });
  }
}

module.exports = Polygon;
