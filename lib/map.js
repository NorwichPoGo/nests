'use strict';

const Settings = require('./settings');
const Utils = require('./utils');
const SearchBox = require('./search_box');
const Gym = require('./features/gym');
const Pokestop = require('./features/pokestop');
const Portal = require('./features/portal');
const S2Cell = require('./features/s2_cell');

window.initMap = () => {
  const latLngStr = Utils.urlParameter('ll');
  const coords = Utils.coordsFromString(latLngStr);
  if (coords) {
    Settings.set('mapCenter', {
      lat: coords[0],
      lng: coords[1]
    });
  }

  const map = new google.maps.Map(document.getElementById('map'), {
    center: Settings.get('mapCenter'),
    zoom: Settings.get('zoomLevel'),
    gestureHandling: 'greedy',
    fullscreenControl: false,
    streetViewControl: true,
    mapTypeControl: true,
    clickableIcons: false,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.LEFT_BOTTOM,
      mapTypeIds: [
        google.maps.MapTypeId.ROADMAP,
        google.maps.MapTypeId.SATELLITE,
        google.maps.MapTypeId.HYBRID
      ]
    }
  });

  initSearchBox(map);
  initS2Cells(map);
  initFeatures(map);
  initParks(map);
  initSettings(map);
};

function initSearchBox(map) {
  map.searchBox = new SearchBox({
    map: map,
    matchFilter: match => match.isShown(),
    size: 4,
    startDisabled: true
  });

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(map.searchBox.input);

  $(document).click(() => {
    map.searchBox.dropdown.hide();
  });

  map.searchBox.searchBox.click(e => {
    e.stopPropagation();
  });

  map.searchBox.updateText = () => {
    const parts = [];
    if (Settings.get('showGyms')) parts.push('Gyms');
    if (Settings.get('showPokestops')) parts.push('Pokestops');
    if (Settings.get('showPortals')) parts.push('Portals');

    let text = 'Search';
    if (parts.length === 1) {
      text += ' ' + parts[0];
    } else if (parts.length > 1) {
      const firstParts = parts.slice(0, -1);
      const lastPart = parts.slice(-1);
      text += ' ' + firstParts.join(', ') + ' and ' + lastPart;
    }

    map.searchBox.setPlaceholder(text);
  };

  map.searchBox.updateText();
}

function initS2Cells(map) {
  map.drawS2Cells = function (newS2Cells) {
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

  map.updateS2Cells = function () {
    map.cancelS2CellUpdate();

    map.pendingS2CellUpdate = setTimeout(() => {
      const newS2Cells = loadS2Cells(map);
      map.drawS2Cells(newS2Cells);
    }, 800);
  };

  map.cancelS2CellUpdate = function () {
    if (map.pendingS2CellUpdate) {
      clearTimeout(map.pendingS2CellUpdate);
    }
  };

  map.shouldDisplayCellLevel = function (level) {
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
}

function initFeatures(map) {
  map.showFeatures = shouldRedraw => {
    $.each(map.features, (index, feature) => {
      if (feature.shouldShow()) {
        feature.show(map, shouldRedraw);
      } else {
        feature.hide();
      }
    });
  };

  map.getFeatureById = id => {
    if (!map.features || (!map.features.length > 0)) return;
    return map.features.find(feature => feature.id == id);
  };

  return loadAndDrawFeatureDataIncrementally(map)
    .then(features => {
      map.features = features;

      map.showFeatures(feature => feature.isNew);

      map.features.nameLookup = new Fuse(map.features, {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: [
          'name'
        ]
      });

      map.searchBox.lookup = function (value) {
        return map.features.nameLookup.search(value);
      };

      map.addListener('click', () => {
        $.each(map.features, (index, feature) => {
          if (feature.label) {
            feature.label.close();
          }
        });
      });

      const updateTypes = ['portal', 'pokestop', 'gym'];

      $.each(updateTypes, (index, updateType) => {
        const updateClass = `.feature-label .update-to.${updateType}`;

        $('body').on('click', updateClass, event => {
          const label = $(event.target).parents('.feature-label');
          if (!label) return;

          const featureId = label.attr('id')
            .replace(/^feature-label-/, '')
            .replace(/_/, '.');
          if (!featureId) return;

          const feature = map.getFeatureById(featureId);
          if (!feature) return;

          setTimeout(() => {
            updateFeature(map, feature, updateType);
          });
        });
      });

      map.searchBox.enable();
    });
}

function initParks(map) {
  loadParkData()
    .then(parks => {
      const parksLayer = new google.maps.Data();
      parksLayer.addGeoJson(parks);
      parksLayer.setStyle({
        fillColor: 'green'
      });

      parksLayer.show = show => {
        if (show === false) {
          parksLayer.setMap(null);
        } else {
          parksLayer.setMap(map);
        }
      };

      map.parksLayer = parksLayer;
      map.parksLayer.show(Settings.get('showParks'));
    });
}

/* eslint-disable quotes */
function initSettings(map) {
  google.maps.event.addListener(map, 'click', () => {
    $('.settings').collapse('hide');
  });

  $('[name="toggle-gyms"]').bootstrapSwitch();
  $('[name="toggle-gyms"]').bootstrapSwitch('state',
    Settings.get('showGyms'));
  $('[name="toggle-gyms"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('showGyms', state);
      map.showFeatures();
      map.searchBox.updateText();
    }
  );

  $("[name='toggle-pokestops']").bootstrapSwitch();
  $("[name='toggle-pokestops']").bootstrapSwitch('state',
    Settings.get('showPokestops'));
  $('[name="toggle-pokestops"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('showPokestops', state);
      map.showFeatures();
      map.searchBox.updateText();
    }
  );

  $("[name='toggle-portals']").bootstrapSwitch();
  $("[name='toggle-portals']").bootstrapSwitch('state',
    Settings.get('showPortals'));
  $('[name="toggle-portals"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('showPortals', state);
      map.showFeatures();
      map.searchBox.updateText();
    }
  );

  $("[name='toggle-parks']").bootstrapSwitch();
  $("[name='toggle-parks']").bootstrapSwitch('state',
    Settings.get('showParks'));
  $('[name="toggle-parks"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('showParks', state);
      map.parksLayer.show(state);
    }
  );

  $("[name='toggle-highlight-new-features']").bootstrapSwitch();
  $("[name='toggle-highlight-new-features']").bootstrapSwitch('state',
    Settings.get('highlightNewFeatures'));
  $('[name="toggle-highlight-new-features"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('highlightNewFeatures', state);
      map.showFeatures(feature => feature.isNew);
    }
  );

  $("[name='toggle-ex-gyms-only']").bootstrapSwitch();
  $("[name='toggle-ex-gyms-only']").bootstrapSwitch('state',
    Settings.get('exGymsOnly'));
  $('[name="toggle-ex-gyms-only"]').on('switchChange.bootstrapSwitch',
    (event, state) => {
      Settings.set('exGymsOnly', state);
      map.showFeatures(feature => feature.type.toLowerCase() == 'gym');
    }
  );

  google.maps.event.addListener(map, 'idle', () => {
    Settings.set('mapCenter', {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    });
    Settings.set('zoomLevel', map.getZoom());
  });

  function setS2CellLevelOptions() {
    let s2CellLevelOptions = '';
    for (let level = 1; level <= 20; ++level) {
      let optionTag = '';
      if (map.shouldDisplayCellLevel(level)) {
        optionTag += '<option value="' + level + '">';
        optionTag += level;
      } else {
        optionTag += '<option value="' + level + '"'+ 'disabled' + '>';
        optionTag += level + ' - zoom in';
      }
      optionTag += '</option>';

      s2CellLevelOptions += optionTag;
    }

    $("[name='select-s2-cells']").html(s2CellLevelOptions);
    $("[name='select-s2-cells']").selectpicker('val', Settings.get('s2Cells'));
    $("[name='select-s2-cells']").selectpicker('refresh');
  }

  setS2CellLevelOptions();

  google.maps.event.addListener(map, 'idle', setS2CellLevelOptions);

  $("[name='select-s2-cells']").selectpicker({
    size: 5
  });
  $("[name='select-s2-cells']").on('changed.bs.select', function () {
    Settings.set('s2Cells', $(this).val() || []);
    map.updateS2Cells();
  });

  $('.select-s2-cells-wrapper .bs-select-all').prop('disabled', true);
}
/* eslint-enable quotes */

function loadAndDrawFeatureDataIncrementally(map) {
  const chunkSize = 250;

  const loader = $(document.createElement('div'));
  loader.attr('class', 'loader loader-center');
  loader.appendTo('body');

  return fetchFeatureCount()
    .then(featureCount => {
      const chunks = Math.ceil(featureCount / chunkSize);

      const featureDataPromises = [];
      for (let i = 0; i < chunks; ++i) {
        const promise = fetchFeatureData(chunkSize, i * chunkSize)
          .then(featureData => loadFeatures(featureData))
          .then(featureData => {
            $.each(featureData, (index, feature) => {
              if (feature.shouldShow()) {
                feature.show(map);
              }
            });

            return featureData;
          });
        featureDataPromises.push(promise);
      }

      return Promise.all(featureDataPromises);
    })
    .then(featureDataChunks => {
      loader.remove();

      return featureDataChunks.reduce(
        (featureData, chunk) => featureData.concat(chunk)
        , []
      );
    })
    .then(featureData => {
      let dateOfLastUpdate = new Date(1990, 0, 1);
      $.each(featureData, (index, feature) => {
        if (!feature.dateAdded) return;
      
        feature.dateAdded = new Date(feature.dateAdded);
        if (feature.dateAdded > dateOfLastUpdate) {
          dateOfLastUpdate = feature.dateAdded;
        }
      });

      $.each(featureData, (index, feature) => {
        if (feature.dateAdded &&
            (feature.dateAdded.getTime() >= dateOfLastUpdate.getTime())) {
          feature.isNew = true;
        }
      });

      return featureData;
    });
}

function fetchFeatureCount() {
  const request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/pois?action=count',
    dataType: 'json'
  });
  return Promise.resolve(request);
}

function fetchFeatureData(chunkSize, start) {
  const request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/pois?action=get' +
         `&count=${chunkSize}` +
         `&start=${start}`,
    dataType: 'json'
  });
  return Promise.resolve(request);
}

function loadFeatures(featureData) {
  const validFeatures = [];

  $.each(featureData, (index, featureData) => {
    if (!featureData.name ||
        !featureData.type ||
        !featureData.latitude ||
        !featureData.longitude) {
      return;
    }

    const feature = createFeature(featureData);
    validFeatures.push(feature);
  });

  return validFeatures;
}

function createFeature(featureData) {
  switch (featureData.type.toLowerCase()) {
  case 'gym':
    return new Gym(featureData);
  case 'pokestop':
    return new Pokestop(featureData);
  case 'portal':
    return new Portal(featureData);
  }
}

function updateFeature(map, feature, type) {
  feature.label.close();
  feature.hide();

  const request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/pois?action=update&' +
         `id=${feature.id}&` +
         `type=${type}`,
    dataType: 'json'
  });

  return Promise.resolve(request)
    .then(result => {
      if (!result) {
        feature.show();
        throw new Error('Could not update this portal');
      } else if (result.error) {
        feature.show();
        throw new Error(`Could not update this portal: ${result.error}`);
      }

      map.features = map.features.filter(f => f.id != feature.id);

      feature.options.type = type;

      const newFeature = createFeature(feature.options);
      map.features.push(newFeature);
      newFeature.show(map);
      newFeature.label.open(map);
    });
}

function loadParkData() {
  return Promise.resolve($.getJSON('/data/parks.geojson'));
}

function loadS2Cells(map) {
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
}
