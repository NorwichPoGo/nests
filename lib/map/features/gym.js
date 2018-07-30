'use strict';

const Settings = require('../../settings');
const Marker = require('../../objects/marker');
const MarkerLabel = require('../../objects/marker_label');

class Gym extends Marker {
  constructor(options) {
    super(options);
    this.exEligibility = options.exEligibility.toLowerCase();
  }

  shouldShow() {
    if (!Settings.get('showGyms')) {
      return false;
    }

    if (Settings.get('exGymsOnly')) {
      return this.isExEligible || this.maybeExEligible;
    }

    return true;
  }

  get isExEligible() {
    return this.exEligibility && (this.exEligibility == 'eligible');
  }

  get maybeExEligible() {
    return this.exEligibility && (this.exEligibility == 'may be eligible');
  }

  _getMarkerIcon() {
    const isNew = this.isNew && Settings.get('highlightNewFeatures');

    if (isNew && this.isExEligible) {
      return this.constructor.markerIcons.newEx;
    } else if (isNew && this.maybeExEligible) {
      return this.constructor.markerIcons.newMaybeEx;
    } else if (isNew) {
      return this.constructor.markerIcons.new;
    } else if (this.isExEligible) {
      return this.constructor.markerIcons.ex;
    } else if (this.maybeExEligible) {
      return this.constructor.markerIcons.maybeEx;
    } else {
      return this.constructor.markerIcons.normal;
    }
  }

  _createMarker() {
    let zIndex = 20;
    if (this.isNew) {
      zIndex = 26;
    } else if (this.isExEligible) {
      zIndex = 24;
    } else if (this.maybeExEligible) {
      zIndex = 22;
    }

    return new google.maps.Marker({
      position: this.location,
      icon: {
        url: this._getMarkerIcon(),
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(22, 30)
      },
      zIndex: zIndex
    });
  }

  _createLabel() {
    let exContent = '';
    if (this.isExEligible) {
      exContent = '<span class="ex">EX</span>';
    } else if (this.maybeExEligible) {
      exContent = '<span class="ex">EX?</span>';
    }

    const content = `
      <div id="feature-label-${this.cssId}" class="feature-label">
        <div class="name">
          <b>${this.name.trim()}</b>${exContent}
        </div>
        <div class="options">
          <div class="update">
            <div class="option-heading">Update to:</div>
            <div class="update-to portal"></div>
            <div class="update-to pokestop"></div>
          </div>
        </div>
      </div>`;

    return new MarkerLabel(this, this.marker, {
      content: content,
      pixelOffset: new google.maps.Size(-7, -30)
    });
  }
}

Gym.markerIcons = {
  normal: '/assets/images/gym.png',
  new: '/assets/images/new_gym.png',
  ex: '/assets/images/ex_gym.png',
  newEx: '/assets/images/new_ex_gym.png',
  maybeEx: '/assets/images/maybe_ex_gym.png',
  newMaybeEx: '/assets/images/new_maybe_ex_gym.png'
};

module.exports = Gym;
