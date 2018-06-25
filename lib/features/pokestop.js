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
      <div class="feature-label">
        <div class="feature-label-name">
          <b>${this.name}</b>
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
