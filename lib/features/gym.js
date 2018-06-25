'use strict';

const Feature = require('./feature');
const Settings = require('../settings');
const FeatureLabel = require('./feature_label');

class Gym extends Feature {
  shouldShow() {
    return Settings.get('showGyms');
  }

  _createMarker() {
    return new google.maps.Marker({
      position: this.location,
      icon: {
        url: this._getMarkerIcon(),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(22, 30)
      },
      zIndex: 20
    });
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
      pixelOffset: new google.maps.Size(-7, -30)
    });
  }
}

Gym.markerIcons = {
  normal: '/assets/images/gym.png',
  new: '/assets/images/gym.png'
};

module.exports = Gym;
