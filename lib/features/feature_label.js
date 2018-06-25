'use strict';

class FeatureLabel {
  constructor(feature, options) {
    this.feature = feature;
    this.label = new google.maps.InfoWindow(options);
    this.isOpen = false;

    this.feature.marker.addListener('click', () => {
      this.toggle(this.feature.marker.map);
    });

    this.label.addListener('closeclick', () => {
      this.close();
    });
  }

  open(map) {
    this.label.setPosition(this.feature.location);
    this.label.open(map);
    this.isOpen = true;
  }

  close() {
    this.label.close();
    this.isOpen = false;
  }

  toggle(map) {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(map);
    }
  }
}

module.exports = FeatureLabel;
