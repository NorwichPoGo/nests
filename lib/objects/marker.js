'use strict';

const Utils = require('../utils');
const Settings = require('../settings');
const MarkerLabel = require('./marker_label');

class Marker {
  constructor(options) {
    this.options = options;
    this.id = options.id;
    this.cssId = this.id.toLowerCase().replace(/\./g, '_');
    this.name = options.name;
    this.coords = [options.latitude, options.longitude];
    this.imageURL = options.image;
    this.type = options.type.toLowerCase();
    this.dateAdded = options.dateAdded;
    this.location = Utils.coordinateToLatLng(this.coords);
  }

  get icon() {
    return this.type;
  }

  draw(map, redraw) {
    if (redraw) {
      this.hide();
    }

    if (!this.marker || redraw) {
      this.marker = this._createMarker();

      if (this._createLabel) {
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
      this.marker.setMap(map);
    }
  }

  hide() {
    if (this.marker) {
      this.marker.setMap(null);
    }
  }

  isShown() {
    return this.marker && this.marker.map;
  }

  _getMarkerIcon() {
    if (this.isNew && Settings.get('highlightNewFeatures')) {
      return this.constructor.markerIcons.new;
    } else {
      return this.constructor.markerIcons.normal;
    }
  }

  _createMarker() {
    return new google.maps.Marker({
      position: this.location,
      icon: {
        url: this._getMarkerIcon(),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 30)
      },
      zIndex: (this.isNew ? 30 : 20)
    });
  }

  _createLabel() {
    const content = `
      <div class="marker-label">
        <div class="marker-label-name">
          <b>${this.name}</b>
        </div>
      </div>`;

    return new FeatureLabel(this, this.marker, {
      content: content,
      pixelOffset: new google.maps.Size(0, -30)
    });
  }
}

module.exports = Marker;
