'use strict';

const Feature = require('./feature');
const Settings = require('../settings');
const FeatureLabel = require('./feature_label');

class Portal extends Feature {
  shouldShow() {
    return Settings.get('showPortals');
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
            <span class="feature-update pokestop"></span>
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

Portal.markerIcons = {
  normal: '/assets/images/portal.png',
  new: '/assets/images/new_portal.png'
};

module.exports = Portal;
