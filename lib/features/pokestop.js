'use strict';

const Feature = require('./feature');
const Settings = require('../settings');
const FeatureLabel = require('./feature_label');

class Pokestop extends Feature {
  shouldShow() {
    return Settings.get('showPokestops');
  }

  _createLabel() {
    const content = `
      <div id="feature-label-${this.cssId}" class="feature-label">
        <div class="name">
          <b>${this.name}</b>
        </div>
        <div class="options">
          <div class="update">
            <div class="option-heading">Update to:</div>
            <div class="update-to portal"></div>
            <div class="update-to gym"></div>
          </div>
        </div>
      </div>`;

    return new FeatureLabel(this, {
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
