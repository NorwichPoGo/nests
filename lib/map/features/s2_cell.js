'use strict';

const Settings = require('../../settings');
const Polygon = require('../../objects/polygon');

class S2Cell extends Polygon {
  constructor(s2CellId) {
    const cell = new S2.S2Cell(s2CellId);
    super({
      id: s2CellId,
      coords: [
        S2Cell.s2PointToCoord(cell.getVertex(0)),
        S2Cell.s2PointToCoord(cell.getVertex(1)),
        S2Cell.s2PointToCoord(cell.getVertex(2)),
        S2Cell.s2PointToCoord(cell.getVertex(3))
      ]
    });
    this.cell = cell;
  }

  get showMarker() {
    return false;
  }

  get showLabel() {
    return false;
  }

  shouldShow() {
    const levelStr = `${this.cell.level}`;
    const selectedLevels = Settings.get('s2Cells');
    const isLevelSelected = ($.inArray(levelStr, selectedLevels) > -1);
    return isLevelSelected;
  }

  _createPolygon() {
    const color = Settings.get('s2CellColors')[this.cell.level];
    console.log(this.region);

    return new google.maps.Polygon({
      paths: this.region,
      strokeColor: color,
      strokeOpacity: 0.75,
      strokeWeight: 2 + ((20 - this.cell.level) / 4),
      fillColor: color,
      fillOpacity: 0,
      clickable: false,
      zIndex: 120 - this.cell.level
    });
  }
}

S2Cell.s2PointToCoord = s2Point => {
  const s2LatLng = S2.S2LatLng.fromPoint(s2Point);
  return [
    s2LatLng.latDegrees.toNumber(),
    s2LatLng.lngDegrees.toNumber()
  ];
};

module.exports = S2Cell;
