function initMap() {
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
}

function initSearchBox(map) {
  const searchBoxInput = document.createElement('input');
  searchBoxInput.setAttribute('id', 'pac-input');
  searchBoxInput.setAttribute('class', 'controls');
  searchBoxInput.setAttribute('type', 'text');
  searchBoxInput.setAttribute('placeholder', 'Search Gyms and Pokestops');

  const searchBoxDropdown = document.createElement('div');
  searchBoxDropdown.setAttribute('class', 'pac-container  pac-logo');

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchBoxInput);
  map.searchBox = $(searchBoxInput);
  map.searchBox.prop('disabled', true);

  map.searchBox.dropdown = $(searchBoxDropdown);
  map.searchBox.dropdown.appendTo('body');

  $(document).click(function () {
    map.searchBox.dropdown.hide();
  });

  map.searchBox.click(function (e) {
    e.stopPropagation();
  });

  map.searchBox.dropdown.add = function (feature) {
    const resultWrapper = document.createElement('div');
    resultWrapper.setAttribute('class', 'pac-item');

    const resultIcon = document.createElement('span');
    resultIcon.setAttribute('class', `pac-icon pac-icon-${feature.type}`);

    const resultMatch = document.createElement('span');
    resultMatch.setAttribute('class', 'pac-item-query');
    resultMatch.innerHTML =
      `<span class="pac-item-query">${feature.name}</span>`;

    const resultDescription = document.createElement('span');
    resultDescription.innerHTML = feature.description || '';

    resultWrapper.appendChild(resultIcon);
    resultWrapper.appendChild(resultMatch);
    resultWrapper.appendChild(resultDescription);
    map.searchBox.dropdown[0].appendChild(resultWrapper);

    $(resultWrapper).click(function () {
      map.panTo(feature.location);
      feature.label.open(map);
    });
  };

  map.searchBox.on('input', function (e) {
    map.searchBox.dropdown.empty();

    if (!map.features || !map.features.nameLookup) return;

    const matches = map.features.nameLookup.search(e.currentTarget.value);
    const visibleMatches = matches.filter(function (match) {
      return match.isShown();
    });

    $.each(visibleMatches.slice(0, 4), function (index, match) {
      map.searchBox.dropdown.add(match);
    });

    map.searchBox.dropdown.show();
  });
}

function initS2Cells(map) {
  map.drawS2Cells = function (newS2Cells) {
    const oldS2Cells = (map.s2Cells || []).slice(0, -200);
    $.each(oldS2Cells, function (index, s2Cell) {
      s2Cell.hide();
    });

    const s2Cells = (map.s2Cells || []).slice(-200);
    $.merge(s2Cells, newS2Cells);

    $.each(s2Cells, function (index, s2Cell) {
      if (s2Cell.shouldShow()) {
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

    map.pendingS2CellUpdate = setTimeout(function () {
      const newS2Cells = loadS2Cells(map);
      map.drawS2Cells(newS2Cells);
    }, 800);
  }

  map.cancelS2CellUpdate = function () {
    if (map.pendingS2CellUpdate) {
      clearTimeout(map.pendingS2CellUpdate);
    }
  }

  map.shouldDisplayCellLevel = function (level) {
    let cellLevelLimit;
    if ((level == 1) || (level == 2)) {
      cellLevelLimit = 0;
    } else {
      cellLevelLimit = level;
    }

    if (isMobile() && (cellLevelLimit > 0)) cellLevelLimit -= 1;
    return map.getZoom() >= cellLevelLimit;
  }

  google.maps.event.addListener(map, 'idle', map.updateS2Cells);
  google.maps.event.addListener(map, 'bounds_changed', map.cancelS2CellUpdate);
}

function initFeatures(map) {
  map.showFeatures = function (shouldRedraw) {
    $.each(map.features, function (index, feature) {
      feature.show(map, shouldRedraw);
    });
  };

  return loadAndDrawFeatureDataIncrementally(map)
    .then(function (features) {
      map.features = features;

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

      $('#pac-input').prop('disabled', false);
    });
}

function initParks(map) {
  loadParkData()
    .then(function (parks) {
      const parksLayer = new google.maps.Data();
      parksLayer.addGeoJson(parks);
      parksLayer.setStyle({
        fillColor: 'green'
  	  });

      parksLayer.show = function (show) {
        if (show === false) {
          parksLayer.setMap(null);
        } else {
          parksLayer.setMap(map);
        }
      }

      map.parksLayer = parksLayer;
      map.parksLayer.show(Settings.get('showParks'));
    });
}

function initSettings(map) {
  google.maps.event.addListener(map, 'click', function () {
    $('.settings').collapse('hide');
  });

  $('[name="toggle-gyms"]').bootstrapSwitch();
  $('[name="toggle-gyms"]').bootstrapSwitch('state',
    Settings.get('showGyms'));
  $('[name="toggle-gyms"]').on('switchChange.bootstrapSwitch',
    function(event, state) {
      Settings.set('showGyms', state);
      map.showFeatures();
    }
  );

  $("[name='toggle-pokestops']").bootstrapSwitch();
  $("[name='toggle-pokestops']").bootstrapSwitch('state',
    Settings.get('showPokestops'));
  $('[name="toggle-pokestops"]').on('switchChange.bootstrapSwitch',
    function(event, state) {
      Settings.set('showPokestops', state);
      map.showFeatures();
    }
  );

  $("[name='toggle-portals']").bootstrapSwitch();
  $("[name='toggle-portals']").bootstrapSwitch('state',
    Settings.get('showPortals'));
  $('[name="toggle-portals"]').on('switchChange.bootstrapSwitch',
    function(event, state) {
      Settings.set('showPortals', state);
      map.showFeatures();
    }
  );

  $("[name='toggle-parks']").bootstrapSwitch();
  $("[name='toggle-parks']").bootstrapSwitch('state',
    Settings.get('showParks'));
  $('[name="toggle-parks"]').on('switchChange.bootstrapSwitch',
    function(event, state) {
      Settings.set('showParks', state);
      map.parksLayer.show(state);
    }
  );

  $("[name='toggle-highlight-new-features']").bootstrapSwitch();
  $("[name='toggle-highlight-new-features']").bootstrapSwitch('state',
    Settings.get('highlightNewFeatures'));
  $('[name="toggle-highlight-new-features"]').on('switchChange.bootstrapSwitch',
    function(event, state) {
      Settings.set('highlightNewFeatures', state);
      map.showFeatures(function (feature) {
        return feature.isNew;
      });
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

function loadAndDrawFeatureDataIncrementally(map) {
  const chunkSize = 400;

  return fetchFeatureCount()
    .then(function (featureCount) {
      const chunks = Math.ceil(featureCount / chunkSize);

      const featureDataPromises = [];
      for (let i = 0; i < chunks; ++i) {
        const promise = fetchFeatureData(chunkSize, i * chunkSize)
          .then(function (featureData) {
            return loadFeatures(featureData);
          })
          .then(function (featureData) {
            $.each(featureData, function (index, feature) {
              feature.show(map);
            });
            return featureData;
          });
        featureDataPromises.push(promise);
      }

      return Promise.all(featureDataPromises);
    })
    .then(function (featureDataChunks) {
      return featureDataChunks.reduce(function (featureData, chunk) {
        return featureData.concat(chunk);
      }, []);
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
  const baseURL = location.protocol + '//' + location.host + location.pathname;

  let dateOfLastUpdate = new Date(1990, 0, 1);
  $.each(featureData, function (index, feature) {
    if (!feature.dateAdded) return;

    feature.dateAdded = new Date(feature.dateAdded);
    if (feature.dateAdded > dateOfLastUpdate) {
      dateOfLastUpdate = feature.dateAdded;
    }
  });

  const validFeatures = [];

  $.each(featureData, function (index, feature) {
    if (!feature.type ||
        !feature.latitude ||
        !feature.longitude) {
      return;
    };

    feature.type = feature.type.toLowerCase();
    feature.location = coordinateToLatLng([feature.latitude, feature.longitude]);
    feature.permalinkName = feature.id;
    feature.permalink = `${baseURL}?${feature.type}=${feature.id}`;

    if (feature.dateAdded &&
        (feature.dateAdded.getTime() >= dateOfLastUpdate.getTime())) {
      feature.isNew = true;
    }

    feature.hide = function () {
      if (feature.marker) {
        feature.marker.setMap(null);
      }
    };

    feature.show = function (map, shouldRedraw) {
      if (this.shouldShow()) {
        if (shouldRedraw && shouldRedraw(feature)) {
          this.draw(map, true);
        }

        if (!this.isShown()) {
          this.draw(map);
          this.marker.setMap(map);
        }
      } else {
        this.hide();
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

    feature.draw = function (map, redraw) {
      if (redraw) {
        this.hide();
        drawFeature(map, feature);
      } else if (!feature.marker) {
        drawFeature(map, feature);
      }
    };

    validFeatures.push(feature);
  });

  return validFeatures;
}

function loadParkData() {
  return Promise.resolve($.getJSON('/data/parks.geojson'));
}

function zoomToFeature(map, feature, zoom) {
  map.panTo(feature.location);
  map.setZoom(zoom || 17);
}

function drawFeature(map, feature) {
  const featureMarkerIcons = {
    gym: '/assets/images/gym.png',
    new_gym: '/assets/images/gym.png',
    pokestop: '/assets/images/pokestop.png',
    new_pokestop: '/assets/images/new_pokestop.png',
    portal: '/assets/images/portal.png',
    new_portal: '/assets/images/new_portal.png'
  };

  let markerIcon;
  if (Settings.get('highlightNewFeatures') && feature.isNew) {
    markerIcon = featureMarkerIcons['new_' + feature.type];
  } else {
    markerIcon = featureMarkerIcons[feature.type];
  }

  const anchorX = (feature.type == 'gym') ? 22 : 15;

  let featureMarker;
  if (featureMarkerIcons[feature.type]) {
    featureMarker = new google.maps.Marker({
      position: feature.location,
      icon: {
        url: markerIcon,
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(anchorX, 30)
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
  const name = gym.name || 'Gym';
  const description = '' + (gym.description || '');

  let content = `
    <div class="feature-label">
      <div class="feature-label-name">
        <b>${name}</b>
      </div>
      <div class="feature-label-description">
        ${description.replace(/\\n/gi, '<br />')}
      </div>
    </div>`;

  return new google.maps.InfoWindow({
    content: content,
    pixelOffset: new google.maps.Size(-7, -30)
  });
}

function pokestopLabel(pokestop) {
  const name = pokestop.name || 'Pokestop';
  const description = pokestop.description || '';

  let content = `
    <div class="feature-label">
      <div class="feature-label-name">
        <b>${name}</b>
      </div>
      <div class="feature-label-description">
        ${description.replace(/\\n/gi, '<br />')}
      </div>
    </div>`;

  return new google.maps.InfoWindow({
    content: content,
    pixelOffset: new google.maps.Size(0, -30)
  });
}

function portalLabel(portal) {
  const name = portal.name || 'Portal';
  const description = portal.description || '';

  let content = `
    <div class="feature-label">
      <div class="feature-label-name">
        <b>${name}</b>
      </div>
      <div class="feature-label-description">
        ${description.replace(/\\n/gi, '<br />')}
      </div>
    </div>`;

  return new google.maps.InfoWindow({
    content: content,
    pixelOffset: new google.maps.Size(0, -30)
  });
}

function addLabelActions(map, feature) {
  feature.label.isOpen = false;

  feature.label._open = feature.label.open;
  feature.label._close = feature.label.close;

  feature.label.open = function (map) {
    feature.label.setPosition(feature.location);
    feature.label._open(map);
    feature.label.isOpen = true;
  };

  feature.label.close = function () {
    feature.label._close();
    feature.label.isOpen = false;
  };

  feature.marker.addListener('click', function () {
    if (feature.label.isOpen) {
      feature.label.close();
    } else {
      feature.label.open(map);
    }
  });

  map.addListener('click', function () {
    feature.label.close();
  });

  feature.label.addListener('closeclick', function () {
    feature.label.close();
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
    if (!map.shouldDisplayCellLevel(level)) return;

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
                (map.shouldDisplayCellLevel(s2Cell.level)));
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
    fillOpacity: 0,
    zIndex: 120 - s2Cell.level
  });
}

function coordinateToLatLng(coord) {
  return new google.maps.LatLng(coord[0], coord[1]);
}

function isMobile() {
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(navigator.userAgent);
}
