class MarkerLabel {
  constructor(marker, clickTarget, options) {
    this.marker = marker;

    if (Array.isArray(clickTarget)) {
      this.clickTargets = clickTarget;
    } else {
      this.clickTargets = [clickTarget];
    }

    this.label = new google.maps.InfoWindow(options);
    this.isOpen = false;

    $.each(this.clickTargets, (index, clickTarget) => {
      clickTarget.addListener('click', () => {
        this.toggle(clickTarget.map);
      });
    });

    this.label.addListener('closeclick', () => {
      this.close();
    });
  }

  open(map) {
    this.label.setPosition(this.marker.location);
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

module.exports = MarkerLabel;
