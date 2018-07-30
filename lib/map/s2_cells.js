const Settings = require('../settings');
const Utils = require('../utils');
const S2Cell = require('./features/s2_cell');

module.exports = map => {
  map.drawS2Cells = newS2Cells => {
    const oldS2Cells = (map.s2Cells || []).slice(0, -200);
    $.each(oldS2Cells, (index, s2Cell) => {
      s2Cell.hide();
    });

    const s2Cells = (map.s2Cells || []).slice(-200);
    $.merge(s2Cells, newS2Cells);

    $.each(s2Cells, (index, s2Cell) => {
      if (s2Cell.shouldShow() &&
           map.shouldDisplayCellLevel(s2Cell.cell.level)) {
        if (!s2Cell.isShown()) {
          s2Cell.draw(map);
          s2Cell.show(map);
        }
      } else {
        s2Cell.hide();
      }
    });

    map.s2Cells = s2Cells;
  };

  map.updateS2Cells = () => {
    map.cancelS2CellUpdate();

    map.pendingS2CellUpdate = setTimeout(() => {
      const newS2Cells = loadS2Cells(map);
      map.drawS2Cells(newS2Cells);
    }, 800);
  };

  map.cancelS2CellUpdate = () => {
    if (map.pendingS2CellUpdate) {
      clearTimeout(map.pendingS2CellUpdate);
    }
  };

  map.shouldDisplayCellLevel = level => {
    let cellLevelLimit;
    if ((level == 1) || (level == 2)) {
      cellLevelLimit = 0;
    } else {
      cellLevelLimit = level;
    }

    if (Utils.isMobile() && (cellLevelLimit > 0)) {
      cellLevelLimit -= 1;
    }

    return map.getZoom() >= cellLevelLimit;
  };

  google.maps.event.addListener(map, 'idle', map.updateS2Cells);
  google.maps.event.addListener(map, 'bounds_changed', map.cancelS2CellUpdate);
};

const loadS2Cells = map => {
  if (!map.getBounds()) return [];

  const mapBounds = map.getBounds();
  const swBound = mapBounds.getSouthWest();
  const neBound = mapBounds.getNorthEast();

  const southWest = S2.S2LatLng.fromDegrees(swBound.lat(), swBound.lng());
  const northEast = S2.S2LatLng.fromDegrees(neBound.lat(), neBound.lng());
  const screenRegion = S2.S2LatLngRect.fromLatLng(southWest, northEast);

  const s2Cells = [];
  $.each(Settings.get('s2Cells'), (index, level) => {
    if (!map.shouldDisplayCellLevel(level)) return;

    const regionCoverer = new S2.S2RegionCoverer();
    regionCoverer.setMinLevel(level);
    regionCoverer.setMaxLevel(level);
    regionCoverer.setMaxCells(50);

    const s2CellIds = regionCoverer.getCoveringCells(screenRegion);
    $.each(s2CellIds, (index, s2CellId) => {
      const s2Cell = new S2Cell(s2CellId);
      s2Cells.push(s2Cell);
    });
  });

  return s2Cells;
};
