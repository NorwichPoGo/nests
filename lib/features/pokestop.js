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
        <div class="feature-label-name">
          <b>${this.name}</b>
        </div>
        <div class="feature-options">
          <div class="feature-update-section">
            Update to:
            <span class="feature-update portal"></span>
            <span class="feature-update gym"></span>
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
