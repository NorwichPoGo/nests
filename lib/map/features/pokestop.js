'use strict';

const Settings = require('../../settings');
const Marker = require('../../objects/marker');
const MarkerLabel = require('../../objects/marker_label');

class Pokestop extends Marker {
  shouldShow() {
    return Settings.get('showPokestops');
  }

  _createLabel() {
    const content = `
      <div id="feature-label-${this.cssId}" class="feature-label">
        <div class="name">${this.name.trim()}</div>
        <div class="options">
          <div class="update">
            <div class="option-heading">Update to:</div>
            <div class="update-to portal"></div>
            <div class="update-to gym"></div>
          </div>
        </div>
      </div>`;

    return new MarkerLabel(this, this.marker, {
      content: content,
      pixelOffset: new google.maps.Size(0, -30)
    });
  }
}

Pokestop.markerIcons = {
  normal: '/assets/images/pokestop.png',
  new: '/assets/images/new_pokestop.png'
};

module.exports = Pokestop;
