const featuresFile = '/data/features.json';

const featureMarkerIcons = {
  gym: '/assets/images/gym.png',
  pokestop: '/assets/images/pokestop.png',
  portal: '/assets/images/portal.png'
};

/**
 * Modified from https://stackoverflow.com/questions/19491336 .
 */
function urlParameter(parameterName) {
  const parameterString = decodeURIComponent(window.location.search.substring(1));
  const parameters = parameterString.split('&');

  let parameterValue;
  $.each(parameters, function (index, param) {
    const paramParts = param.split('=');
    const paramName = paramParts[0];
    const paramValue = paramParts[1];

    if ((paramName == parameterName)
        && (paramValue !== undefined)) {
      parameterValue = paramValue;
      return false;
    }
  });

  return parameterValue;
};

const Settings = {
  settings: {
    showGyms: {
      type: 'boolean',
      defaultValue: true
    },
    showPokestops: {
      type: 'boolean',
      defaultValue: false
    },
    showPortals: {
      type: 'boolean',
      defaultValue: false
    },
    s2Cells: {
      type: 'json',
      defaultValue: []
    },
    s2CellColors: {
      type: 'json',
      defaultValue: {
        '1': '#FF6F00',
        '2': '#F57F17',
        '3': '#827717',
        '4': '#33691E',
        '5': '#1B5E20',
        '6': '#004D40',
        '7': '#006064',
        '8': '#01579B',
        '9': '#0D47A1',
        '10': '#1A237E',
        '11': '#6A1B9A',
        '12': '#AD1457',
        '13': '#b71c1c',
        '14': '#BF360C',
        '15': '#FF7043',
        '16': '#FFCA28',
        '17': '#FDD835',
        '18': '#00796B',
        '19': '#0288D1',
        '20': '#64B5F6'
      }
    },
    s2CellLimits: {
      type: 'json',
      defaultValue: {
        '1': 0,
        '2': 0,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '7': 7,
        '8': 8,
        '9': 9,
        '10': 10,
        '11': 11,
        '12': 12,
        '13': 13,
        '14': 14,
        '15': 15,
        '16': 16,
        '17': 17,
        '18': 18,
        '19': 19,
        '20': 20
      }
    },
    mapCenter: {
      type: 'json',
      defaultValue: {
        lat: 52.63282,
        lng: 1.29732
      }
    },
    zoomLevel: {
      type: 'float',
      defaultValue: 13
    }
  },
  get: function(settingName) {
    const setting = Settings.settings[settingName];
    const rawSettingValue = localStorage.getItem(settingName);

    if (rawSettingValue === undefined || rawSettingValue === null) {
      return setting.defaultValue;
    }

    if (setting.type == 'boolean') {
      return rawSettingValue == 'true';
    } else if (setting.type == 'float') {
      return parseFloat(rawSettingValue);
    } else if (setting.type == 'json') {
      return JSON.parse(rawSettingValue);
    }

    return rawSettingValue;
  },
  set: function (settingName, value) {
    const setting = Settings.settings[settingName];

    if (setting.type == 'json') {
      localStorage.setItem(settingName, JSON.stringify(value));
    } else {
      localStorage.setItem(settingName, value);
    }
  }
};

function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: Settings.get('mapCenter'),
    zoom: Settings.get('zoomLevel'),
    gestureHandling: 'greedy',
    fullscreenControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    clickableIcons: false,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      position: google.maps.ControlPosition.RIGHT_TOP,
      mapTypeIds: [
        google.maps.MapTypeId.ROADMAP,
        google.maps.MapTypeId.SATELLITE,
        google.maps.MapTypeId.HYBRID
      ]
    }
  });

  initS2Cells(map);
  initFeatures(map);
  initSettings(map);
}

function initFeatures(map) {
  map.drawFeatures = function () {
    $.each(map.features, function (index, feature) {
      /* Don't show duplicate features (e.g. both a pokestop and a portal)
         as they clutter the map. */
      let featureIsShadowed = false;
      if (feature.shadowFeatures) {
        $.each(feature.shadowFeatures, function (index, shadowFeature) {
          if (shadowFeature.shouldShow()) {
            featureIsShadowed = true;
          }
        });
      }

      if (feature.shouldShow() && !featureIsShadowed) {
        if (!feature.isShown()) {
          feature.draw(map);
          feature.show(map);
        }
      } else {
        feature.hide();
      }
    });
  };

  loadFeatureData()
    .then(function (features) {
      map.features = features;
      map.drawFeatures();
    });
}

function initS2Cells(map) {
  map.drawS2Cells = function (newS2Cells) {
    const oldS2Cells = map.s2Cells;
    const oldS2CellIds = $.map(oldS2Cells, function (s2Cell) {
      return s2Cell.id;
    });
    const newS2CellIds = $.map(newS2Cells, function (s2Cell) {
      return s2Cell.id;
    });

    const cellsToShow = [];
    const cellsToRemove = [];

    $.each(oldS2Cells, function (index, oldS2Cell) {
      let stillShown = false;
      $.each(newS2CellIds, function (index, newS2CellId) {
        if (newS2CellId.equals(oldS2Cell.id)) {
          stillShown = true;
          return false;
        }
      });

      if (stillShown) {
        cellsToShow.push(oldS2Cell);
      } else {
        cellsToRemove.push(oldS2Cell);
      }
    });

    $.each(newS2Cells, function (index, newS2Cell) {
      let alreadyExists = false;
      $.each(oldS2CellIds, function (index, oldS2CellId) {
        if (oldS2CellId.equals(newS2Cell.id)) {
          alreadyExists = true;
          return false;
        }
      });

      if (alreadyExists) {
        cellsToRemove.push(newS2Cell);
      } else {
        cellsToShow.push(newS2Cell);
      }
    });

    $.each(cellsToRemove, function (index, s2Cell) {
      s2Cell.hide();
    });

    $.each(cellsToShow, function (index, s2Cell) {
      if (s2Cell.shouldShow()) {
        if (!s2Cell.isShown()) {
          s2Cell.draw(map);
          s2Cell.show(map);
        }
      } else {
        s2Cell.hide();
      }
    });

    map.s2Cells = cellsToShow;
  };

  map.updateS2Cells = function () {
    const newS2Cells = loadS2Cells(map);
    map.drawS2Cells(newS2Cells);
  }

  google.maps.event.addListener(map, 'idle', map.updateS2Cells);
}

function initSettings(map) {
  $('[name="toggle-gyms"]').bootstrapSwitch();
  $('[name="toggle-gyms"]').bootstrapSwitch('state', Settings.get('showGyms'));
  $('[name="toggle-gyms"]').on('switchChange.bootstrapSwitch',
    function(event, state) {
      localStorage.setItem('showGyms', state);
      map.drawFeatures();
    }
  );

  $("[name='toggle-pokestops']").bootstrapSwitch();
  $("[name='toggle-pokestops']").bootstrapSwitch('state', Settings.get('showPokestops'));
  $('[name="toggle-pokestops"]').on('switchChange.bootstrapSwitch',
    function(event, state) {
      localStorage.setItem('showPokestops', state);
      map.drawFeatures();
    }
  );

  $("[name='toggle-portals']").bootstrapSwitch();
  $("[name='toggle-portals']").bootstrapSwitch('state', Settings.get('showPortals'));
  $('[name="toggle-portals"]').on('switchChange.bootstrapSwitch',
    function(event, state) {
      localStorage.setItem('showPortals', state);
      map.drawFeatures();
    }
  );

  google.maps.event.addListener(map, 'idle', function () {
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
      if (map.getZoom() >= Settings.get('s2CellLimits')[level]) {
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
    $("[name='select-s2-cells']").selectpicker('refresh')
  }

  setS2CellLevelOptions();

  google.maps.event.addListener(map, 'idle', setS2CellLevelOptions);

  $("[name='select-s2-cells']").selectpicker({
    size: 5,
    dropupAuto: false
  });
  $("[name='select-s2-cells']").on('changed.bs.select', function () {
    Settings.set('s2Cells', $(this).val() || []);
    map.updateS2Cells();
  });

  $('.select-s2-cells-wrapper .bs-select-all').prop('disabled', true);
}

function loadFeatureData() {
  return Promise.resolve($.getJSON(featuresFile))
    .then(function (featureData) {
      featureData = featureData['features'];

      const baseURL = location.protocol + '//' + location.host + location.pathname;

      const portalMap = {};
      $.each(featureData, function (index, feature) {
        if (feature.type == 'portal') {
          portalMap[feature.id] = feature;
          feature.shadowFeatures = [];
        }
      });

      $.each(featureData, function (index, feature) {
        feature.location = coordinateToLatLng([feature.latitude, feature.longitude]);
        feature.permalinkName = feature.id;
        feature.permalink = `${baseURL}?${feature.type}=${feature.id}`;

        if (feature.type != 'portal') {
          const portal = portalMap[feature.id];
          if (portal) {
            portal.shadowFeatures.push(feature);
            if (!(feature.name)) {
              feature.name = portal.name;
            }
          }
        }

        feature.hide = function () {
          if (feature.marker) {
            feature.marker.setMap(null);
          }
        };

        feature.show = function (map) {
          if (feature.marker) {
            feature.marker.setMap(map);
          }
        };

        feature.shouldShow = function () {
          if (((feature.type == 'gym') && Settings.get('showGyms')) ||
              ((feature.type == 'pokestop') && Settings.get('showPokestops')) ||
              ((feature.type == 'portal') && Settings.get('showPortals'))) {
            return true;
          }
        };

        feature.isShown = function () {
          return feature.marker && feature.marker.map;
        };

        feature.draw = function (map) {
          if (!feature.marker) {
            drawFeature(map, feature);
          }
        };
      });

      return featureData;
    });
}

function zoomToFeature(map, feature, zoom) {
  map.panTo(feature.location);
  map.setZoom(zoom || 17);
}

function drawFeature(map, feature) {
  let featureMarker;
  if (featureMarkerIcons[feature.type]) {
    featureMarker = new google.maps.Marker({
      position: feature.location,
      icon: {
        url: featureMarkerIcons[feature.type],
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(15, 15)
      },
      zIndex: 20
    });
  } else {
    featureMarker = new google.maps.Marker({
      position: feature.location,
      zIndex: 20
    });
  }

  feature.marker = featureMarker;

  let featureLabel;
  if (feature.type == 'gym') {
    featureLabel = gymLabel(feature);
  } else if (feature.type == 'pokestop') {
    featureLabel = pokestopLabel(feature);
  } else if (feature.type == 'portal') {
    featureLabel = portalLabel(feature);
  }

  if (featureLabel) {
    feature.label = featureLabel;
    addLabelActions(map, feature);
  }
}

function gymLabel(gym) {
  const gymName = gym.name || 'Gym';
  let content = `
    <div class="feature-label">
      <div class="feature-label-name">
        <b>${gymName}</b>
      </div>
      <div class="feature-label-description">
        ${gym.description || ''}
      </div>
    </div>`;

  return new google.maps.InfoWindow({
    content: content
  });
}

function pokestopLabel(pokestop) {
  const pokestopName = pokestop.name || 'Pokestop';
  let content = `
    <div class="feature-label">
      <div class="feature-label-name">
        <b>${pokestopName}</b>
      </div>
      <div class="feature-label-description">
        ${pokestop.description || ''}
      </div>
    </div>`;

  return new google.maps.InfoWindow({
    content: content
  });
}

function portalLabel(portal) {
  const portalName = portal.name || 'Portal';
  let content = `
    <div class="feature-label">
      <div class="feature-label-name">
        <b>${portalName}</b>
      </div>
      <div class="feature-label-description">
        ${portal.description || ''}
      </div>
    </div>`;

  return new google.maps.InfoWindow({
    content: content
  });
}

function addLabelActions(map, feature) {
  feature.label.isOpen = false;

  feature.marker.addListener('click', function () {
    if (feature.label.isOpen) {
      feature.label.close();
      feature.label.isOpen = false;
    } else {
      feature.label.setPosition(feature.location);
      feature.label.open(map);
      feature.label.isOpen = true;
    }
  });

  map.addListener('click', function () {
    feature.label.close();
    feature.label.isOpen = false;
  });

  feature.label.addListener('closeclick', function () {
    feature.label.isOpen = false;
  });
}

function loadS2Cells(map) {
  if (!map.getBounds()) return [];

  const mapBounds = map.getBounds();
  const swBound = mapBounds.getSouthWest();
  const neBound = mapBounds.getNorthEast();

  const southWest = S2.S2LatLng.fromDegrees(swBound.lat(), swBound.lng());
  const northEast = S2.S2LatLng.fromDegrees(neBound.lat(), neBound.lng());
  const screenRegion = S2.S2LatLngRect.fromLatLng(southWest, northEast);

  const s2Cells = []
  $.each(Settings.get('s2Cells'), function (index, level) {
    if (map.getZoom() < Settings.get('s2CellLimits')[level]) {
      return;
    }

    const regionCoverer = new S2.S2RegionCoverer();
    regionCoverer.setMinLevel(level);
    regionCoverer.setMaxLevel(level);
    regionCoverer.setMaxCells(50);

    const s2CellIds = regionCoverer.getCoveringCells(screenRegion);
    $.each(s2CellIds, function (index, s2CellId) {
      const s2Cell = new S2.S2Cell(s2CellId);

      s2Cell.hide = function () {
        if (s2Cell.polygon) {
          s2Cell.polygon.setMap(null);
        }
      };

      s2Cell.show = function (map) {
        if (s2Cell.polygon) {
          s2Cell.polygon.setMap(map);
        }
      };

      s2Cell.shouldShow = function () {
        return (($.inArray('' + s2Cell.level, Settings.get('s2Cells')) > -1) &&
                (map.getZoom() >= Settings.get('s2CellLimits')[s2Cell.level]));
      };

      s2Cell.isShown = function () {
        return s2Cell.polygon && s2Cell.polygon.map;
      };

      s2Cell.draw = function (map) {
        if (!s2Cell.polygon) {
          drawS2Cell(map, s2Cell);
        }
      };

      s2Cells.push(s2Cell);
    });
  });

  return s2Cells;
}

function drawS2Cell(map, s2Cell) {
  function s2PointToGMapsLatLng(s2Point) {
    const s2LatLng = S2.S2LatLng.fromPoint(s2Point);
    return {
      lat: s2LatLng.latDegrees.toNumber(),
      lng: s2LatLng.lngDegrees.toNumber()
    }
  }

  const verticies = [
    s2PointToGMapsLatLng(s2Cell.getVertex(0)),
    s2PointToGMapsLatLng(s2Cell.getVertex(1)),
    s2PointToGMapsLatLng(s2Cell.getVertex(2)),
    s2PointToGMapsLatLng(s2Cell.getVertex(3))
  ];

  const color = Settings.get('s2CellColors')[s2Cell.level];

  s2Cell.polygon = new google.maps.Polygon({
    paths: verticies,
    strokeColor: color,
    strokeOpacity: 0.75,
    strokeWeight: 2 + ((20 - s2Cell.level) / 4),
    fillColor: color,
    fillOpacity: 0.25,
    zIndex: 120 - s2Cell.level
  });
}

function coordinateToLatLng(coord) {
  return new google.maps.LatLng(coord[0], coord[1]);
}
