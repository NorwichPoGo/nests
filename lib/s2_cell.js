'use strict';

const Utils = require('./utils');
const Settings = require('./settings');

class S2Cell {
  constructor(s2CellId) {
    this.cell = new S2.S2Cell(s2CellId);
  }

  draw(map, redraw) {
    if (redraw) {
      this.hide();
    }

    if (!this.polygon || redraw) {
      this.polygon = this._createPolygon();
    }
  }

  show(map, shouldRedraw) {
    if (Utils.isFunction(shouldRedraw) || shouldRedraw) {
      this.draw(map, true);
    }

    if (!this.isShown()) {
      this.draw(map);
      this.polygon.setMap(map);
    }
  }

  hide() {
    if (this.polygon) {
      this.polygon.setMap(null);
    }
  }

  shouldShow() {
    const levelStr = '' + this.cell.level;
    const selectedLevels = Settings.get('s2Cells');
    const isLevelSelected = ($.inArray(levelStr, selectedLevels) > -1);
    return isLevelSelected;
  }

  isShown() {
    return this.polygon && this.polygon.map;
  }

  _createPolygon() {
    const verticies = [
      this._s2PointToGMapsLatLng(this.cell.getVertex(0)),
      this._s2PointToGMapsLatLng(this.cell.getVertex(1)),
      this._s2PointToGMapsLatLng(this.cell.getVertex(2)),
      this._s2PointToGMapsLatLng(this.cell.getVertex(3))
    ];

    const color = Settings.get('s2CellColors')[this.cell.level];

    return new google.maps.Polygon({
      paths: verticies,
      strokeColor: color,
      strokeOpacity: 0.75,
      strokeWeight: 2 + ((20 - this.cell.level) / 4),
      fillColor: color,
      fillOpacity: 0,
      clickable: false,
      zIndex: 120 - this.cell.level
    });
  }

  _s2PointToGMapsLatLng(s2Point) {
    const s2LatLng = S2.S2LatLng.fromPoint(s2Point);
    return Utils.coordinateToLatLng([
      s2LatLng.latDegrees.toNumber(),
      s2LatLng.lngDegrees.toNumber()
    ]);
  }
}

module.exports = S2Cell;
