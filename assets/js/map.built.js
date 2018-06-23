(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

window.initMap = function () {
  var map = new google.maps.Map(document.getElementById('map'), {
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
      mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID]
    }
  });

  initSearchBox(map);
  initS2Cells(map);
  initFeatures(map);
  initParks(map);
  initSettings(map);
};

function initSearchBox(map) {
  var searchBoxInput = document.createElement('input');
  searchBoxInput.setAttribute('id', 'pac-input');
  searchBoxInput.setAttribute('class', 'controls');
  searchBoxInput.setAttribute('type', 'text');
  searchBoxInput.setAttribute('placeholder', 'Search Gyms and Pokestops');

  var searchBoxDropdown = document.createElement('div');
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
    var resultWrapper = document.createElement('div');
    resultWrapper.setAttribute('class', 'pac-item');

    var resultIcon = document.createElement('span');
    resultIcon.setAttribute('class', 'pac-icon pac-icon-' + feature.type);

    var resultMatch = document.createElement('span');
    resultMatch.setAttribute('class', 'pac-item-query');
    resultMatch.innerHTML = '<span class="pac-item-query">' + feature.name + '</span>';

    var resultDescription = document.createElement('span');
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

    var matches = map.features.nameLookup.search(e.currentTarget.value);
    var visibleMatches = matches.filter(function (match) {
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
    var oldS2Cells = (map.s2Cells || []).slice(0, -200);
    $.each(oldS2Cells, function (index, s2Cell) {
      s2Cell.hide();
    });

    var s2Cells = (map.s2Cells || []).slice(-200);
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
      var newS2Cells = loadS2Cells(map);
      map.drawS2Cells(newS2Cells);
    }, 800);
  };

  map.cancelS2CellUpdate = function () {
    if (map.pendingS2CellUpdate) {
      clearTimeout(map.pendingS2CellUpdate);
    }
  };

  map.shouldDisplayCellLevel = function (level) {
    var cellLevelLimit = void 0;
    if (level == 1 || level == 2) {
      cellLevelLimit = 0;
    } else {
      cellLevelLimit = level;
    }

    if (isMobile() && cellLevelLimit > 0) cellLevelLimit -= 1;
    return map.getZoom() >= cellLevelLimit;
  };

  google.maps.event.addListener(map, 'idle', map.updateS2Cells);
  google.maps.event.addListener(map, 'bounds_changed', map.cancelS2CellUpdate);
}

function initFeatures(map) {
  map.showFeatures = function (shouldRedraw) {
    $.each(map.features, function (index, feature) {
      feature.show(map, shouldRedraw);
    });
  };

  return loadAndDrawFeatureDataIncrementally(map).then(function (features) {
    map.features = features;

    map.features.nameLookup = new Fuse(map.features, {
      shouldSort: true,
      threshold: 0.5,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['name']
    });

    $('#pac-input').prop('disabled', false);
  });
}

function initParks(map) {
  loadParkData().then(function (parks) {
    var parksLayer = new google.maps.Data();
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
    };

    map.parksLayer = parksLayer;
    map.parksLayer.show(Settings.get('showParks'));
  });
}

function initSettings(map) {
  google.maps.event.addListener(map, 'click', function () {
    $('.settings').collapse('hide');
  });

  $('[name="toggle-gyms"]').bootstrapSwitch();
  $('[name="toggle-gyms"]').bootstrapSwitch('state', Settings.get('showGyms'));
  $('[name="toggle-gyms"]').on('switchChange.bootstrapSwitch', function (event, state) {
    Settings.set('showGyms', state);
    map.showFeatures();
  });

  $("[name='toggle-pokestops']").bootstrapSwitch();
  $("[name='toggle-pokestops']").bootstrapSwitch('state', Settings.get('showPokestops'));
  $('[name="toggle-pokestops"]').on('switchChange.bootstrapSwitch', function (event, state) {
    Settings.set('showPokestops', state);
    map.showFeatures();
  });

  $("[name='toggle-portals']").bootstrapSwitch();
  $("[name='toggle-portals']").bootstrapSwitch('state', Settings.get('showPortals'));
  $('[name="toggle-portals"]').on('switchChange.bootstrapSwitch', function (event, state) {
    Settings.set('showPortals', state);
    map.showFeatures();
  });

  $("[name='toggle-parks']").bootstrapSwitch();
  $("[name='toggle-parks']").bootstrapSwitch('state', Settings.get('showParks'));
  $('[name="toggle-parks"]').on('switchChange.bootstrapSwitch', function (event, state) {
    Settings.set('showParks', state);
    map.parksLayer.show(state);
  });

  $("[name='toggle-highlight-new-features']").bootstrapSwitch();
  $("[name='toggle-highlight-new-features']").bootstrapSwitch('state', Settings.get('highlightNewFeatures'));
  $('[name="toggle-highlight-new-features"]').on('switchChange.bootstrapSwitch', function (event, state) {
    Settings.set('highlightNewFeatures', state);
    map.showFeatures(function (feature) {
      return feature.isNew;
    });
  });

  google.maps.event.addListener(map, 'idle', function () {
    Settings.set('mapCenter', {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    });
    Settings.set('zoomLevel', map.getZoom());
  });

  function setS2CellLevelOptions() {
    var s2CellLevelOptions = '';
    for (var level = 1; level <= 20; ++level) {
      var optionTag = '';
      if (map.shouldDisplayCellLevel(level)) {
        optionTag += '<option value="' + level + '">';
        optionTag += level;
      } else {
        optionTag += '<option value="' + level + '"' + 'disabled' + '>';
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
  var chunkSize = 400;

  return fetchFeatureCount().then(function (featureCount) {
    var chunks = Math.ceil(featureCount / chunkSize);

    var featureDataPromises = [];
    for (var i = 0; i < chunks; ++i) {
      var promise = fetchFeatureData(chunkSize, i * chunkSize).then(function (featureData) {
        return loadFeatures(featureData);
      }).then(function (featureData) {
        $.each(featureData, function (index, feature) {
          feature.show(map);
        });
        return featureData;
      });
      featureDataPromises.push(promise);
    }

    return Promise.all(featureDataPromises);
  }).then(function (featureDataChunks) {
    return featureDataChunks.reduce(function (featureData, chunk) {
      return featureData.concat(chunk);
    }, []);
  });
}

function fetchFeatureCount() {
  var request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/pois?action=count',
    dataType: 'json'
  });
  return Promise.resolve(request);
}

function fetchFeatureData(chunkSize, start) {
  var request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/pois?action=get' + ('&count=' + chunkSize) + ('&start=' + start),
    dataType: 'json'
  });
  return Promise.resolve(request);
}

function loadFeatures(featureData) {
  var baseURL = location.protocol + '//' + location.host + location.pathname;

  var dateOfLastUpdate = new Date(1990, 0, 1);
  $.each(featureData, function (index, feature) {
    if (!feature.dateAdded) return;

    feature.dateAdded = new Date(feature.dateAdded);
    if (feature.dateAdded > dateOfLastUpdate) {
      dateOfLastUpdate = feature.dateAdded;
    }
  });

  var validFeatures = [];

  $.each(featureData, function (index, feature) {
    if (!feature.type || !feature.latitude || !feature.longitude) {
      return;
    };

    feature.type = feature.type.toLowerCase();
    feature.location = coordinateToLatLng([feature.latitude, feature.longitude]);
    feature.permalinkName = feature.id;
    feature.permalink = baseURL + '?' + feature.type + '=' + feature.id;

    if (feature.dateAdded && feature.dateAdded.getTime() >= dateOfLastUpdate.getTime()) {
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
      if (feature.type == 'gym' && Settings.get('showGyms') || feature.type == 'pokestop' && Settings.get('showPokestops') || feature.type == 'portal' && Settings.get('showPortals')) {
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
  var featureMarkerIcons = {
    gym: '/assets/images/gym.png',
    new_gym: '/assets/images/gym.png',
    pokestop: '/assets/images/pokestop.png',
    new_pokestop: '/assets/images/new_pokestop.png',
    portal: '/assets/images/portal.png',
    new_portal: '/assets/images/new_portal.png'
  };

  var markerIcon = void 0;
  if (Settings.get('highlightNewFeatures') && feature.isNew) {
    markerIcon = featureMarkerIcons['new_' + feature.type];
  } else {
    markerIcon = featureMarkerIcons[feature.type];
  }

  var anchorX = feature.type == 'gym' ? 22 : 15;

  var featureMarker = void 0;
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

  var featureLabel = void 0;
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
  var name = gym.name || 'Gym';
  var description = '' + (gym.description || '');

  var content = '\n    <div class="feature-label">\n      <div class="feature-label-name">\n        <b>' + name + '</b>\n      </div>\n      <div class="feature-label-description">\n        ' + description.replace(/\\n/gi, '<br />') + '\n      </div>\n    </div>';

  return new google.maps.InfoWindow({
    content: content,
    pixelOffset: new google.maps.Size(-7, -30)
  });
}

function pokestopLabel(pokestop) {
  var name = pokestop.name || 'Pokestop';
  var description = pokestop.description || '';

  var content = '\n    <div class="feature-label">\n      <div class="feature-label-name">\n        <b>' + name + '</b>\n      </div>\n      <div class="feature-label-description">\n        ' + description.replace(/\\n/gi, '<br />') + '\n      </div>\n    </div>';

  return new google.maps.InfoWindow({
    content: content,
    pixelOffset: new google.maps.Size(0, -30)
  });
}

function portalLabel(portal) {
  var name = portal.name || 'Portal';
  var description = portal.description || '';

  var content = '\n    <div class="feature-label">\n      <div class="feature-label-name">\n        <b>' + name + '</b>\n      </div>\n      <div class="feature-label-description">\n        ' + description.replace(/\\n/gi, '<br />') + '\n      </div>\n    </div>';

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

  var mapBounds = map.getBounds();
  var swBound = mapBounds.getSouthWest();
  var neBound = mapBounds.getNorthEast();

  var southWest = S2.S2LatLng.fromDegrees(swBound.lat(), swBound.lng());
  var northEast = S2.S2LatLng.fromDegrees(neBound.lat(), neBound.lng());
  var screenRegion = S2.S2LatLngRect.fromLatLng(southWest, northEast);

  var s2Cells = [];
  $.each(Settings.get('s2Cells'), function (index, level) {
    if (!map.shouldDisplayCellLevel(level)) return;

    var regionCoverer = new S2.S2RegionCoverer();
    regionCoverer.setMinLevel(level);
    regionCoverer.setMaxLevel(level);
    regionCoverer.setMaxCells(50);

    var s2CellIds = regionCoverer.getCoveringCells(screenRegion);
    $.each(s2CellIds, function (index, s2CellId) {
      var s2Cell = new S2.S2Cell(s2CellId);

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
        return $.inArray('' + s2Cell.level, Settings.get('s2Cells')) > -1 && map.shouldDisplayCellLevel(s2Cell.level);
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
    var s2LatLng = S2.S2LatLng.fromPoint(s2Point);
    return {
      lat: s2LatLng.latDegrees.toNumber(),
      lng: s2LatLng.lngDegrees.toNumber()
    };
  }

  var verticies = [s2PointToGMapsLatLng(s2Cell.getVertex(0)), s2PointToGMapsLatLng(s2Cell.getVertex(1)), s2PointToGMapsLatLng(s2Cell.getVertex(2)), s2PointToGMapsLatLng(s2Cell.getVertex(3))];

  var color = Settings.get('s2CellColors')[s2Cell.level];

  s2Cell.polygon = new google.maps.Polygon({
    paths: verticies,
    strokeColor: color,
    strokeOpacity: 0.75,
    strokeWeight: 2 + (20 - s2Cell.level) / 4,
    fillColor: color,
    fillOpacity: 0,
    zIndex: 120 - s2Cell.level
  });
}

function coordinateToLatLng(coord) {
  return new google.maps.LatLng(coord[0], coord[1]);
}

function isMobile() {
  var mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(navigator.userAgent);
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLFlBQU07QUFDckIsTUFBTSxNQUFNLElBQUksT0FBTyxJQUFQLENBQVksR0FBaEIsQ0FBb0IsU0FBUyxjQUFULENBQXdCLEtBQXhCLENBQXBCLEVBQW9EO0FBQzlELFlBQVEsU0FBUyxHQUFULENBQWEsV0FBYixDQURzRDtBQUU5RCxVQUFNLFNBQVMsR0FBVCxDQUFhLFdBQWIsQ0FGd0Q7QUFHOUQscUJBQWlCLFFBSDZDO0FBSTlELHVCQUFtQixLQUoyQztBQUs5RCx1QkFBbUIsSUFMMkM7QUFNOUQsb0JBQWdCLElBTjhDO0FBTzlELG9CQUFnQixLQVA4QztBQVE5RCwyQkFBdUI7QUFDckIsYUFBTyxPQUFPLElBQVAsQ0FBWSxtQkFBWixDQUFnQyxjQURsQjtBQUVyQixnQkFBVSxPQUFPLElBQVAsQ0FBWSxlQUFaLENBQTRCLFdBRmpCO0FBR3JCLGtCQUFZLENBQ1YsT0FBTyxJQUFQLENBQVksU0FBWixDQUFzQixPQURaLEVBRVYsT0FBTyxJQUFQLENBQVksU0FBWixDQUFzQixTQUZaLEVBR1YsT0FBTyxJQUFQLENBQVksU0FBWixDQUFzQixNQUhaO0FBSFM7QUFSdUMsR0FBcEQsQ0FBWjs7QUFtQkEsZ0JBQWMsR0FBZDtBQUNBLGNBQVksR0FBWjtBQUNBLGVBQWEsR0FBYjtBQUNBLFlBQVUsR0FBVjtBQUNBLGVBQWEsR0FBYjtBQUNELENBekJEOztBQTJCQSxTQUFTLGFBQVQsQ0FBdUIsR0FBdkIsRUFBNEI7QUFDMUIsTUFBTSxpQkFBaUIsU0FBUyxhQUFULENBQXVCLE9BQXZCLENBQXZCO0FBQ0EsaUJBQWUsWUFBZixDQUE0QixJQUE1QixFQUFrQyxXQUFsQztBQUNBLGlCQUFlLFlBQWYsQ0FBNEIsT0FBNUIsRUFBcUMsVUFBckM7QUFDQSxpQkFBZSxZQUFm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QVA7QUFDRDs7QUFFRCxTQUFTLFFBQVQsR0FBb0I7QUFDbEIsTUFBTSxjQUFjLGdFQUFwQjtBQUNBLFNBQU8sWUFBWSxJQUFaLENBQWlCLFVBQVUsU0FBM0IsQ0FBUDtBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuaW5pdE1hcCA9ICgpID0+IHtcbiAgY29uc3QgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcbiAgICBjZW50ZXI6IFNldHRpbmdzLmdldCgnbWFwQ2VudGVyJyksXG4gICAgem9vbTogU2V0dGluZ3MuZ2V0KCd6b29tTGV2ZWwnKSxcbiAgICBnZXN0dXJlSGFuZGxpbmc6ICdncmVlZHknLFxuICAgIGZ1bGxzY3JlZW5Db250cm9sOiBmYWxzZSxcbiAgICBzdHJlZXRWaWV3Q29udHJvbDogdHJ1ZSxcbiAgICBtYXBUeXBlQ29udHJvbDogdHJ1ZSxcbiAgICBjbGlja2FibGVJY29uczogZmFsc2UsXG4gICAgbWFwVHlwZUNvbnRyb2xPcHRpb25zOiB7XG4gICAgICBzdHlsZTogZ29vZ2xlLm1hcHMuTWFwVHlwZUNvbnRyb2xTdHlsZS5IT1JJWk9OVEFMX0JBUixcbiAgICAgIHBvc2l0aW9uOiBnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb24uTEVGVF9CT1RUT00sXG4gICAgICBtYXBUeXBlSWRzOiBbXG4gICAgICAgIGdvb2dsZS5tYXBzLk1hcFR5cGVJZC5ST0FETUFQLFxuICAgICAgICBnb29nbGUubWFwcy5NYXBUeXBlSWQuU0FURUxMSVRFLFxuICAgICAgICBnb29nbGUubWFwcy5NYXBUeXBlSWQuSFlCUklEXG4gICAgICBdXG4gICAgfVxuICB9KTtcblxuICBpbml0U2VhcmNoQm94KG1hcCk7XG4gIGluaXRTMkNlbGxzKG1hcCk7XG4gIGluaXRGZWF0dXJlcyhtYXApO1xuICBpbml0UGFya3MobWFwKTtcbiAgaW5pdFNldHRpbmdzKG1hcCk7XG59XG5cbmZ1bmN0aW9uIGluaXRTZWFyY2hCb3gobWFwKSB7XG4gIGNvbnN0IHNlYXJjaEJveElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgc2VhcmNoQm94SW5wdXQuc2V0QXR0cmlidXRlKCdpZCcsICdwYWMtaW5wdXQnKTtcbiAgc2VhcmNoQm94SW5wdXQuc2V0QXR0cmlidXRlKCdjbGFzcycsICdjb250cm9scycpO1xuICBzZWFyY2hCb3hJbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuICBzZWFyY2hCb3hJbnB1dC5zZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCBHeW1zIGFuZCBQb2tlc3RvcHMnKTtcblxuICBjb25zdCBzZWFyY2hCb3hEcm9wZG93biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBzZWFyY2hCb3hEcm9wZG93bi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ3BhYy1jb250YWluZXIgIHBhYy1sb2dvJyk7XG5cbiAgbWFwLmNvbnRyb2xzW2dvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbi5UT1BfTEVGVF0ucHVzaChzZWFyY2hCb3hJbnB1dCk7XG4gIG1hcC5zZWFyY2hCb3ggPSAkKHNlYXJjaEJveElucHV0KTtcbiAgbWFwLnNlYXJjaEJveC5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXG4gIG1hcC5zZWFyY2hCb3guZHJvcGRvd24gPSAkKHNlYXJjaEJveERyb3Bkb3duKTtcbiAgbWFwLnNlYXJjaEJveC5kcm9wZG93bi5hcHBlbmRUbygnYm9keScpO1xuXG4gICQoZG9jdW1lbnQpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICBtYXAuc2VhcmNoQm94LmRyb3Bkb3duLmhpZGUoKTtcbiAgfSk7XG5cbiAgbWFwLnNlYXJjaEJveC5jbGljayhmdW5jdGlvbiAoZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuXG4gIG1hcC5zZWFyY2hCb3guZHJvcGRvd24uYWRkID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICBjb25zdCByZXN1bHRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcmVzdWx0V3JhcHBlci5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ3BhYy1pdGVtJyk7XG5cbiAgICBjb25zdCByZXN1bHRJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHJlc3VsdEljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsIGBwYWMtaWNvbiBwYWMtaWNvbi0ke2ZlYXR1cmUudHlwZX1gKTtcblxuICAgIGNvbnN0IHJlc3VsdE1hdGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHJlc3VsdE1hdGNoLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAncGFjLWl0ZW0tcXVlcnknKTtcbiAgICByZXN1bHRNYXRjaC5pbm5lckhUTUwgPVxuICAgICAgYDxzcGFuIGNsYXNzPVwicGFjLWl0ZW0tcXVlcnlcIj4ke2ZlYXR1cmUubmFtZX08L3NwYW4+YDtcblxuICAgIGNvbnN0IHJlc3VsdERlc2NyaXB0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHJlc3VsdERlc2NyaXB0aW9uLmlubmVySFRNTCA9IGZlYXR1cmUuZGVzY3JpcHRpb24gfHwgJyc7XG5cbiAgICByZXN1bHRXcmFwcGVyLmFwcGVuZENoaWxkKHJlc3VsdEljb24pO1xuICAgIHJlc3VsdFdyYXBwZXIuYXBwZW5kQ2hpbGQocmVzdWx0TWF0Y2gpO1xuICAgIHJlc3VsdFdyYXBwZXIuYXBwZW5kQ2hpbGQocmVzdWx0RGVzY3JpcHRpb24pO1xuICAgIG1hcC5zZWFyY2hCb3guZHJvcGRvd25bMF0uYXBwZW5kQ2hpbGQocmVzdWx0V3JhcHBlcik7XG5cbiAgICAkKHJlc3VsdFdyYXBwZXIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIG1hcC5wYW5UbyhmZWF0dXJlLmxvY2F0aW9uKTtcbiAgICAgIGZlYXR1cmUubGFiZWwub3BlbihtYXApO1xuICAgIH0pO1xuICB9O1xuXG4gIG1hcC5zZWFyY2hCb3gub24oJ2lucHV0JywgZnVuY3Rpb24gKGUpIHtcbiAgICBtYXAuc2VhcmNoQm94LmRyb3Bkb3duLmVtcHR5KCk7XG5cbiAgICBpZiAoIW1hcC5mZWF0dXJlcyB8fCAhbWFwLmZlYXR1cmVzLm5hbWVMb29rdXApIHJldHVybjtcblxuICAgIGNvbnN0IG1hdGNoZXMgPSBtYXAuZmVhdHVyZXMubmFtZUxvb2t1cC5zZWFyY2goZS5jdXJyZW50VGFyZ2V0LnZhbHVlKTtcbiAgICBjb25zdCB2aXNpYmxlTWF0Y2hlcyA9IG1hdGNoZXMuZmlsdGVyKGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgcmV0dXJuIG1hdGNoLmlzU2hvd24oKTtcbiAgICB9KTtcblxuICAgICQuZWFjaCh2aXNpYmxlTWF0Y2hlcy5zbGljZSgwLCA0KSwgZnVuY3Rpb24gKGluZGV4LCBtYXRjaCkge1xuICAgICAgbWFwLnNlYXJjaEJveC5kcm9wZG93bi5hZGQobWF0Y2gpO1xuICAgIH0pO1xuXG4gICAgbWFwLnNlYXJjaEJveC5kcm9wZG93bi5zaG93KCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0UzJDZWxscyhtYXApIHtcbiAgbWFwLmRyYXdTMkNlbGxzID0gZnVuY3Rpb24gKG5ld1MyQ2VsbHMpIHtcbiAgICBjb25zdCBvbGRTMkNlbGxzID0gKG1hcC5zMkNlbGxzIHx8IFtdKS5zbGljZSgwLCAtMjAwKTtcbiAgICAkLmVhY2gob2xkUzJDZWxscywgZnVuY3Rpb24gKGluZGV4LCBzMkNlbGwpIHtcbiAgICAgIHMyQ2VsbC5oaWRlKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzMkNlbGxzID0gKG1hcC5zMkNlbGxzIHx8IFtdKS5zbGljZSgtMjAwKTtcbiAgICAkLm1lcmdlKHMyQ2VsbHMsIG5ld1MyQ2VsbHMpO1xuXG4gICAgJC5lYWNoKHMyQ2VsbHMsIGZ1bmN0aW9uIChpbmRleCwgczJDZWxsKSB7XG4gICAgICBpZiAoczJDZWxsLnNob3VsZFNob3coKSkge1xuICAgICAgICBpZiAoIXMyQ2VsbC5pc1Nob3duKCkpIHtcbiAgICAgICAgICBzMkNlbGwuZHJhdyhtYXApO1xuICAgICAgICAgIHMyQ2VsbC5zaG93KG1hcCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyQ2VsbC5oaWRlKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBtYXAuczJDZWxscyA9IHMyQ2VsbHM7XG4gIH07XG5cbiAgbWFwLnVwZGF0ZVMyQ2VsbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgbWFwLmNhbmNlbFMyQ2VsbFVwZGF0ZSgpO1xuXG4gICAgbWFwLnBlbmRpbmdTMkNlbGxVcGRhdGUgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IG5ld1MyQ2VsbHMgPSBsb2FkUzJDZWxscyhtYXApO1xuICAgICAgbWFwLmRyYXdTMkNlbGxzKG5ld1MyQ2VsbHMpO1xuICAgIH0sIDgwMCk7XG4gIH1cblxuICBtYXAuY2FuY2VsUzJDZWxsVXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChtYXAucGVuZGluZ1MyQ2VsbFVwZGF0ZSkge1xuICAgICAgY2xlYXJUaW1lb3V0KG1hcC5wZW5kaW5nUzJDZWxsVXBkYXRlKTtcbiAgICB9XG4gIH1cblxuICBtYXAuc2hvdWxkRGlzcGxheUNlbGxMZXZlbCA9IGZ1bmN0aW9uIChsZXZlbCkge1xuICAgIGxldCBjZWxsTGV2ZWxMaW1pdDtcbiAgICBpZiAoKGxldmVsID09IDEpIHx8IChsZXZlbCA9PSAyKSkge1xuICAgICAgY2VsbExldmVsTGltaXQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBjZWxsTGV2ZWxMaW1pdCA9IGxldmVsO1xuICAgIH1cblxuICAgIGlmIChpc01vYmlsZSgpICYmIChjZWxsTGV2ZWxMaW1pdCA+IDApKSBjZWxsTGV2ZWxMaW1pdCAtPSAxO1xuICAgIHJldHVybiBtYXAuZ2V0Wm9vbSgpID49IGNlbGxMZXZlbExpbWl0O1xuICB9XG5cbiAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnaWRsZScsIG1hcC51cGRhdGVTMkNlbGxzKTtcbiAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnYm91bmRzX2NoYW5nZWQnLCBtYXAuY2FuY2VsUzJDZWxsVXBkYXRlKTtcbn1cblxuZnVuY3Rpb24gaW5pdEZlYXR1cmVzKG1hcCkge1xuICBtYXAuc2hvd0ZlYXR1cmVzID0gZnVuY3Rpb24gKHNob3VsZFJlZHJhdykge1xuICAgICQuZWFjaChtYXAuZmVhdHVyZXMsIGZ1bmN0aW9uIChpbmRleCwgZmVhdHVyZSkge1xuICAgICAgZmVhdHVyZS5zaG93KG1hcCwgc2hvdWxkUmVkcmF3KTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gbG9hZEFuZERyYXdGZWF0dXJlRGF0YUluY3JlbWVudGFsbHkobWFwKVxuICAgIC50aGVuKGZ1bmN0aW9uIChmZWF0dXJlcykge1xuICAgICAgbWFwLmZlYXR1cmVzID0gZmVhdHVyZXM7XG5cbiAgICAgIG1hcC5mZWF0dXJlcy5uYW1lTG9va3VwID0gbmV3IEZ1c2UobWFwLmZlYXR1cmVzLCB7XG4gICAgICAgIHNob3VsZFNvcnQ6IHRydWUsXG4gICAgICAgIHRocmVzaG9sZDogMC41LFxuICAgICAgICBsb2NhdGlvbjogMCxcbiAgICAgICAgZGlzdGFuY2U6IDEwMCxcbiAgICAgICAgbWF4UGF0dGVybkxlbmd0aDogMzIsXG4gICAgICAgIG1pbk1hdGNoQ2hhckxlbmd0aDogMSxcbiAgICAgICAga2V5czogW1xuICAgICAgICAgICduYW1lJ1xuICAgICAgICBdXG4gICAgICB9KTtcblxuICAgICAgJCgnI3BhYy1pbnB1dCcpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0UGFya3MobWFwKSB7XG4gIGxvYWRQYXJrRGF0YSgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHBhcmtzKSB7XG4gICAgICBjb25zdCBwYXJrc0xheWVyID0gbmV3IGdvb2dsZS5tYXBzLkRhdGEoKTtcbiAgICAgIHBhcmtzTGF5ZXIuYWRkR2VvSnNvbihwYXJrcyk7XG4gICAgICBwYXJrc0xheWVyLnNldFN0eWxlKHtcbiAgICAgICAgZmlsbENvbG9yOiAnZ3JlZW4nXG4gIFx0ICB9KTtcblxuICAgICAgcGFya3NMYXllci5zaG93ID0gZnVuY3Rpb24gKHNob3cpIHtcbiAgICAgICAgaWYgKHNob3cgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcGFya3NMYXllci5zZXRNYXAobnVsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFya3NMYXllci5zZXRNYXAobWFwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBtYXAucGFya3NMYXllciA9IHBhcmtzTGF5ZXI7XG4gICAgICBtYXAucGFya3NMYXllci5zaG93KFNldHRpbmdzLmdldCgnc2hvd1BhcmtzJykpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0U2V0dGluZ3MobWFwKSB7XG4gIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICQoJy5zZXR0aW5ncycpLmNvbGxhcHNlKCdoaWRlJyk7XG4gIH0pO1xuXG4gICQoJ1tuYW1lPVwidG9nZ2xlLWd5bXNcIl0nKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgJCgnW25hbWU9XCJ0b2dnbGUtZ3ltc1wiXScpLmJvb3RzdHJhcFN3aXRjaCgnc3RhdGUnLFxuICAgIFNldHRpbmdzLmdldCgnc2hvd0d5bXMnKSk7XG4gICQoJ1tuYW1lPVwidG9nZ2xlLWd5bXNcIl0nKS5vbignc3dpdGNoQ2hhbmdlLmJvb3RzdHJhcFN3aXRjaCcsXG4gICAgZnVuY3Rpb24oZXZlbnQsIHN0YXRlKSB7XG4gICAgICBTZXR0aW5ncy5zZXQoJ3Nob3dHeW1zJywgc3RhdGUpO1xuICAgICAgbWFwLnNob3dGZWF0dXJlcygpO1xuICAgIH1cbiAgKTtcblxuICAkKFwiW25hbWU9J3RvZ2dsZS1wb2tlc3RvcHMnXVwiKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgJChcIltuYW1lPSd0b2dnbGUtcG9rZXN0b3BzJ11cIikuYm9vdHN0cmFwU3dpdGNoKCdzdGF0ZScsXG4gICAgU2V0dGluZ3MuZ2V0KCdzaG93UG9rZXN0b3BzJykpO1xuICAkKCdbbmFtZT1cInRvZ2dsZS1wb2tlc3RvcHNcIl0nKS5vbignc3dpdGNoQ2hhbmdlLmJvb3RzdHJhcFN3aXRjaCcsXG4gICAgZnVuY3Rpb24oZXZlbnQsIHN0YXRlKSB7XG4gICAgICBTZXR0aW5ncy5zZXQoJ3Nob3dQb2tlc3RvcHMnLCBzdGF0ZSk7XG4gICAgICBtYXAuc2hvd0ZlYXR1cmVzKCk7XG4gICAgfVxuICApO1xuXG4gICQoXCJbbmFtZT0ndG9nZ2xlLXBvcnRhbHMnXVwiKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgJChcIltuYW1lPSd0b2dnbGUtcG9ydGFscyddXCIpLmJvb3RzdHJhcFN3aXRjaCgnc3RhdGUnLFxuICAgIFNldHRpbmdzLmdldCgnc2hvd1BvcnRhbHMnKSk7XG4gICQoJ1tuYW1lPVwidG9nZ2xlLXBvcnRhbHNcIl0nKS5vbignc3dpdGNoQ2hhbmdlLmJvb3RzdHJhcFN3aXRjaCcsXG4gICAgZnVuY3Rpb24oZXZlbnQsIHN0YXRlKSB7XG4gICAgICBTZXR0aW5ncy5zZXQoJ3Nob3dQb3J0YWxzJywgc3RhdGUpO1xuICAgICAgbWFwLnNob3dGZWF0dXJlcygpO1xuICAgIH1cbiAgKTtcblxuICAkKFwiW25hbWU9J3RvZ2dsZS1wYXJrcyddXCIpLmJvb3RzdHJhcFN3aXRjaCgpO1xuICAkKFwiW25hbWU9J3RvZ2dsZS1wYXJrcyddXCIpLmJvb3RzdHJhcFN3aXRjaCgnc3RhdGUnLFxuICAgIFNldHRpbmdzLmdldCgnc2hvd1BhcmtzJykpO1xuICAkKCdbbmFtZT1cInRvZ2dsZS1wYXJrc1wiXScpLm9uKCdzd2l0Y2hDaGFuZ2UuYm9vdHN0cmFwU3dpdGNoJyxcbiAgICBmdW5jdGlvbihldmVudCwgc3RhdGUpIHtcbiAgICAgIFNldHRpbmdzLnNldCgnc2hvd1BhcmtzJywgc3RhdGUpO1xuICAgICAgbWFwLnBhcmtzTGF5ZXIuc2hvdyhzdGF0ZSk7XG4gICAgfVxuICApO1xuXG4gICQoXCJbbmFtZT0ndG9nZ2xlLWhpZ2hsaWdodC1uZXctZmVhdHVyZXMnXVwiKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgJChcIltuYW1lPSd0b2dnbGUtaGlnaGxpZ2h0LW5ldy1mZWF0dXJlcyddXCIpLmJvb3RzdHJhcFN3aXRjaCgnc3RhdGUnLFxuICAgIFNldHRpbmdzLmdldCgnaGlnaGxpZ2h0TmV3RmVhdHVyZXMnKSk7XG4gICQoJ1tuYW1lPVwidG9nZ2xlLWhpZ2hsaWdodC1uZXctZmVhdHVyZXNcIl0nKS5vbignc3dpdGNoQ2hhbmdlLmJvb3RzdHJhcFN3aXRjaCcsXG4gICAgZnVuY3Rpb24oZXZlbnQsIHN0YXRlKSB7XG4gICAgICBTZXR0aW5ncy5zZXQoJ2hpZ2hsaWdodE5ld0ZlYXR1cmVzJywgc3RhdGUpO1xuICAgICAgbWFwLnNob3dGZWF0dXJlcyhmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICByZXR1cm4gZmVhdHVyZS5pc05ldztcbiAgICAgIH0pO1xuICAgIH1cbiAgKTtcblxuICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXAsICdpZGxlJywgZnVuY3Rpb24gKCkge1xuICAgIFNldHRpbmdzLnNldCgnbWFwQ2VudGVyJywge1xuICAgICAgbGF0OiBtYXAuZ2V0Q2VudGVyKCkubGF0KCksXG4gICAgICBsbmc6IG1hcC5nZXRDZW50ZXIoKS5sbmcoKVxuICAgIH0pO1xuICAgIFNldHRpbmdzLnNldCgnem9vbUxldmVsJywgbWFwLmdldFpvb20oKSk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHNldFMyQ2VsbExldmVsT3B0aW9ucygpIHtcbiAgICBsZXQgczJDZWxsTGV2ZWxPcHRpb25zID0gJyc7XG4gICAgZm9yIChsZXQgbGV2ZWwgPSAxOyBsZXZlbCA8PSAyMDsgKytsZXZlbCkge1xuICAgICAgbGV0IG9wdGlvblRhZyA9ICcnO1xuICAgICAgaWYgKG1hcC5zaG91bGREaXNwbGF5Q2VsbExldmVsKGxldmVsKSkge1xuICAgICAgICBvcHRpb25UYWcgKz0gJzxvcHRpb24gdmFsdWU9XCInICsgbGV2ZWwgKyAnXCI+JztcbiAgICAgICAgb3B0aW9uVGFnICs9IGxldmVsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9uVGFnICs9ICc8b3B0aW9uIHZhbHVlPVwiJyArIGxldmVsICsgJ1wiJysgJ2Rpc2FibGVkJyArICc+JztcbiAgICAgICAgb3B0aW9uVGFnICs9IGxldmVsICsgJyAtIHpvb20gaW4nO1xuICAgICAgfVxuICAgICAgb3B0aW9uVGFnICs9ICc8L29wdGlvbj4nO1xuXG4gICAgICBzMkNlbGxMZXZlbE9wdGlvbnMgKz0gb3B0aW9uVGFnO1xuICAgIH1cblxuICAgICQoXCJbbmFtZT0nc2VsZWN0LXMyLWNlbGxzJ11cIikuaHRtbChzMkNlbGxMZXZlbE9wdGlvbnMpO1xuICAgICQoXCJbbmFtZT0nc2VsZWN0LXMyLWNlbGxzJ11cIikuc2VsZWN0cGlja2VyKCd2YWwnLCBTZXR0aW5ncy5nZXQoJ3MyQ2VsbHMnKSk7XG4gICAgJChcIltuYW1lPSdzZWxlY3QtczItY2VsbHMnXVwiKS5zZWxlY3RwaWNrZXIoJ3JlZnJlc2gnKVxuICB9XG5cbiAgc2V0UzJDZWxsTGV2ZWxPcHRpb25zKCk7XG5cbiAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnaWRsZScsIHNldFMyQ2VsbExldmVsT3B0aW9ucyk7XG5cbiAgJChcIltuYW1lPSdzZWxlY3QtczItY2VsbHMnXVwiKS5zZWxlY3RwaWNrZXIoe1xuICAgIHNpemU6IDUsXG4gICAgZHJvcHVwQXV0bzogZmFsc2VcbiAgfSk7XG4gICQoXCJbbmFtZT0nc2VsZWN0LXMyLWNlbGxzJ11cIikub24oJ2NoYW5nZWQuYnMuc2VsZWN0JywgZnVuY3Rpb24gKCkge1xuICAgIFNldHRpbmdzLnNldCgnczJDZWxscycsICQodGhpcykudmFsKCkgfHwgW10pO1xuICAgIG1hcC51cGRhdGVTMkNlbGxzKCk7XG4gIH0pO1xuXG4gICQoJy5zZWxlY3QtczItY2VsbHMtd3JhcHBlciAuYnMtc2VsZWN0LWFsbCcpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRBbmREcmF3RmVhdHVyZURhdGFJbmNyZW1lbnRhbGx5KG1hcCkge1xuICBjb25zdCBjaHVua1NpemUgPSA0MDA7XG5cbiAgcmV0dXJuIGZldGNoRmVhdHVyZUNvdW50KClcbiAgICAudGhlbihmdW5jdGlvbiAoZmVhdHVyZUNvdW50KSB7XG4gICAgICBjb25zdCBjaHVua3MgPSBNYXRoLmNlaWwoZmVhdHVyZUNvdW50IC8gY2h1bmtTaXplKTtcblxuICAgICAgY29uc3QgZmVhdHVyZURhdGFQcm9taXNlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaHVua3M7ICsraSkge1xuICAgICAgICBjb25zdCBwcm9taXNlID0gZmV0Y2hGZWF0dXJlRGF0YShjaHVua1NpemUsIGkgKiBjaHVua1NpemUpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGZlYXR1cmVEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9hZEZlYXR1cmVzKGZlYXR1cmVEYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChmZWF0dXJlRGF0YSkge1xuICAgICAgICAgICAgJC5lYWNoKGZlYXR1cmVEYXRhLCBmdW5jdGlvbiAoaW5kZXgsIGZlYXR1cmUpIHtcbiAgICAgICAgICAgICAgZmVhdHVyZS5zaG93KG1hcCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmZWF0dXJlRGF0YTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgZmVhdHVyZURhdGFQcm9taXNlcy5wdXNoKHByb21pc2UpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmVhdHVyZURhdGFQcm9taXNlcyk7XG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoZmVhdHVyZURhdGFDaHVua3MpIHtcbiAgICAgIHJldHVybiBmZWF0dXJlRGF0YUNodW5rcy5yZWR1Y2UoZnVuY3Rpb24gKGZlYXR1cmVEYXRhLCBjaHVuaykge1xuICAgICAgICByZXR1cm4gZmVhdHVyZURhdGEuY29uY2F0KGNodW5rKTtcbiAgICAgIH0sIFtdKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hGZWF0dXJlQ291bnQoKSB7XG4gIGNvbnN0IHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgIHR5cGU6ICdHRVQnLFxuICAgIHVybDogJ2h0dHBzOi8vYXBpLnBva2Vtb25nb25vcndpY2gudWsvcG9pcz9hY3Rpb249Y291bnQnLFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVxdWVzdCk7XG59XG5cbmZ1bmN0aW9uIGZldGNoRmVhdHVyZURhdGEoY2h1bmtTaXplLCBzdGFydCkge1xuICBjb25zdCByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICB0eXBlOiAnR0VUJyxcbiAgICB1cmw6ICdodHRwczovL2FwaS5wb2tlbW9uZ29ub3J3aWNoLnVrL3BvaXM/YWN0aW9uPWdldCcgK1xuICAgICAgICAgYCZjb3VudD0ke2NodW5rU2l6ZX1gICtcbiAgICAgICAgIGAmc3RhcnQ9JHtzdGFydH1gLFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVxdWVzdCk7XG59XG5cbmZ1bmN0aW9uIGxvYWRGZWF0dXJlcyhmZWF0dXJlRGF0YSkge1xuICBjb25zdCBiYXNlVVJMID0gbG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgbG9jYXRpb24uaG9zdCArIGxvY2F0aW9uLnBhdGhuYW1lO1xuXG4gIGxldCBkYXRlT2ZMYXN0VXBkYXRlID0gbmV3IERhdGUoMTk5MCwgMCwgMSk7XG4gICQuZWFjaChmZWF0dXJlRGF0YSwgZnVuY3Rpb24gKGluZGV4LCBmZWF0dXJlKSB7XG4gICAgaWYgKCFmZWF0dXJlLmRhdGVBZGRlZCkgcmV0dXJuO1xuXG4gICAgZmVhdHVyZS5kYXRlQWRkZWQgPSBuZXcgRGF0ZShmZWF0dXJlLmRhdGVBZGRlZCk7XG4gICAgaWYgKGZlYXR1cmUuZGF0ZUFkZGVkID4gZGF0ZU9mTGFzdFVwZGF0ZSkge1xuICAgICAgZGF0ZU9mTGFzdFVwZGF0ZSA9IGZlYXR1cmUuZGF0ZUFkZGVkO1xuICAgIH1cbiAgfSk7XG5cbiAgY29uc3QgdmFsaWRGZWF0dXJlcyA9IFtdO1xuXG4gICQuZWFjaChmZWF0dXJlRGF0YSwgZnVuY3Rpb24gKGluZGV4LCBmZWF0dXJlKSB7XG4gICAgaWYgKCFmZWF0dXJlLnR5cGUgfHxcbiAgICAgICAgIWZlYXR1cmUubGF0aXR1ZGUgfHxcbiAgICAgICAgIWZlYXR1cmUubG9uZ2l0dWRlKSB7XG4gICAgICByZXR1cm47XG4gICAgfTtcblxuICAgIGZlYXR1cmUudHlwZSA9IGZlYXR1cmUudHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgIGZlYXR1cmUubG9jYXRpb24gPSBjb29yZGluYXRlVG9MYXRMbmcoW2ZlYXR1cmUubGF0aXR1ZGUsIGZlYXR1cmUubG9uZ2l0dWRlXSk7XG4gICAgZmVhdHVyZS5wZXJtYWxpbmtOYW1lID0gZmVhdHVyZS5pZDtcbiAgICBmZWF0dXJlLnBlcm1hbGluayA9IGAke2Jhc2VVUkx9PyR7ZmVhdHVyZS50eXBlfT0ke2ZlYXR1cmUuaWR9YDtcblxuICAgIGlmIChmZWF0dXJlLmRhdGVBZGRlZCAmJlxuICAgICAgICAoZmVhdHVyZS5kYXRlQWRkZWQuZ2V0VGltZSgpID49IGRhdGVPZkxhc3RVcGRhdGUuZ2V0VGltZSgpKSkge1xuICAgICAgZmVhdHVyZS5pc05ldyA9IHRydWU7XG4gICAgfVxuXG4gICAgZmVhdHVyZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGZlYXR1cmUubWFya2VyKSB7XG4gICAgICAgIGZlYXR1cmUubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZmVhdHVyZS5zaG93ID0gZnVuY3Rpb24gKG1hcCwgc2hvdWxkUmVkcmF3KSB7XG4gICAgICBpZiAodGhpcy5zaG91bGRTaG93KCkpIHtcbiAgICAgICAgaWYgKHNob3VsZFJlZHJhdyAmJiBzaG91bGRSZWRyYXcoZmVhdHVyZSkpIHtcbiAgICAgICAgICB0aGlzLmRyYXcobWFwLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5pc1Nob3duKCkpIHtcbiAgICAgICAgICB0aGlzLmRyYXcobWFwKTtcbiAgICAgICAgICB0aGlzLm1hcmtlci5zZXRNYXAobWFwKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZlYXR1cmUuc2hvdWxkU2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgoKGZlYXR1cmUudHlwZSA9PSAnZ3ltJykgJiYgU2V0dGluZ3MuZ2V0KCdzaG93R3ltcycpKSB8fFxuICAgICAgICAgICgoZmVhdHVyZS50eXBlID09ICdwb2tlc3RvcCcpICYmIFNldHRpbmdzLmdldCgnc2hvd1Bva2VzdG9wcycpKSB8fFxuICAgICAgICAgICgoZmVhdHVyZS50eXBlID09ICdwb3J0YWwnKSAmJiBTZXR0aW5ncy5nZXQoJ3Nob3dQb3J0YWxzJykpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmZWF0dXJlLmlzU2hvd24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZmVhdHVyZS5tYXJrZXIgJiYgZmVhdHVyZS5tYXJrZXIubWFwO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLmRyYXcgPSBmdW5jdGlvbiAobWFwLCByZWRyYXcpIHtcbiAgICAgIGlmIChyZWRyYXcpIHtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgIGRyYXdGZWF0dXJlKG1hcCwgZmVhdHVyZSk7XG4gICAgICB9IGVsc2UgaWYgKCFmZWF0dXJlLm1hcmtlcikge1xuICAgICAgICBkcmF3RmVhdHVyZShtYXAsIGZlYXR1cmUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YWxpZEZlYXR1cmVzLnB1c2goZmVhdHVyZSk7XG4gIH0pO1xuXG4gIHJldHVybiB2YWxpZEZlYXR1cmVzO1xufVxuXG5mdW5jdGlvbiBsb2FkUGFya0RhdGEoKSB7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoJC5nZXRKU09OKCcvZGF0YS9wYXJrcy5nZW9qc29uJykpO1xufVxuXG5mdW5jdGlvbiB6b29tVG9GZWF0dXJlKG1hcCwgZmVhdHVyZSwgem9vbSkge1xuICBtYXAucGFuVG8oZmVhdHVyZS5sb2NhdGlvbik7XG4gIG1hcC5zZXRab29tKHpvb20gfHwgMTcpO1xufVxuXG5mdW5jdGlvbiBkcmF3RmVhdHVyZShtYXAsIGZlYXR1cmUpIHtcbiAgY29uc3QgZmVhdHVyZU1hcmtlckljb25zID0ge1xuICAgIGd5bTogJy9hc3NldHMvaW1hZ2VzL2d5bS5wbmcnLFxuICAgIG5ld19neW06ICcvYXNzZXRzL2ltYWdlcy9neW0ucG5nJyxcbiAgICBwb2tlc3RvcDogJy9hc3NldHMvaW1hZ2VzL3Bva2VzdG9wLnBuZycsXG4gICAgbmV3X3Bva2VzdG9wOiAnL2Fzc2V0cy9pbWFnZXMvbmV3X3Bva2VzdG9wLnBuZycsXG4gICAgcG9ydGFsOiAnL2Fzc2V0cy9pbWFnZXMvcG9ydGFsLnBuZycsXG4gICAgbmV3X3BvcnRhbDogJy9hc3NldHMvaW1hZ2VzL25ld19wb3J0YWwucG5nJ1xuICB9O1xuXG4gIGxldCBtYXJrZXJJY29uO1xuICBpZiAoU2V0dGluZ3MuZ2V0KCdoaWdobGlnaHROZXdGZWF0dXJlcycpICYmIGZlYXR1cmUuaXNOZXcpIHtcbiAgICBtYXJrZXJJY29uID0gZmVhdHVyZU1hcmtlckljb25zWyduZXdfJyArIGZlYXR1cmUudHlwZV07XG4gIH0gZWxzZSB7XG4gICAgbWFya2VySWNvbiA9IGZlYXR1cmVNYXJrZXJJY29uc1tmZWF0dXJlLnR5cGVdO1xuICB9XG5cbiAgY29uc3QgYW5jaG9yWCA9IChmZWF0dXJlLnR5cGUgPT0gJ2d5bScpID8gMjIgOiAxNTtcblxuICBsZXQgZmVhdHVyZU1hcmtlcjtcbiAgaWYgKGZlYXR1cmVNYXJrZXJJY29uc1tmZWF0dXJlLnR5cGVdKSB7XG4gICAgZmVhdHVyZU1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgcG9zaXRpb246IGZlYXR1cmUubG9jYXRpb24sXG4gICAgICBpY29uOiB7XG4gICAgICAgIHVybDogbWFya2VySWNvbixcbiAgICAgICAgc2NhbGVkU2l6ZTogbmV3IGdvb2dsZS5tYXBzLlNpemUoMzAsIDMwKSxcbiAgICAgICAgYW5jaG9yOiBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoYW5jaG9yWCwgMzApXG4gICAgICB9LFxuICAgICAgekluZGV4OiAyMFxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGZlYXR1cmVNYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgIHBvc2l0aW9uOiBmZWF0dXJlLmxvY2F0aW9uLFxuICAgICAgekluZGV4OiAyMFxuICAgIH0pO1xuICB9XG5cbiAgZmVhdHVyZS5tYXJrZXIgPSBmZWF0dXJlTWFya2VyO1xuXG4gIGxldCBmZWF0dXJlTGFiZWw7XG4gIGlmIChmZWF0dXJlLnR5cGUgPT0gJ2d5bScpIHtcbiAgICBmZWF0dXJlTGFiZWwgPSBneW1MYWJlbChmZWF0dXJlKTtcbiAgfSBlbHNlIGlmIChmZWF0dXJlLnR5cGUgPT0gJ3Bva2VzdG9wJykge1xuICAgIGZlYXR1cmVMYWJlbCA9IHBva2VzdG9wTGFiZWwoZmVhdHVyZSk7XG4gIH0gZWxzZSBpZiAoZmVhdHVyZS50eXBlID09ICdwb3J0YWwnKSB7XG4gICAgZmVhdHVyZUxhYmVsID0gcG9ydGFsTGFiZWwoZmVhdHVyZSk7XG4gIH1cblxuICBpZiAoZmVhdHVyZUxhYmVsKSB7XG4gICAgZmVhdHVyZS5sYWJlbCA9IGZlYXR1cmVMYWJlbDtcbiAgICBhZGRMYWJlbEFjdGlvbnMobWFwLCBmZWF0dXJlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBneW1MYWJlbChneW0pIHtcbiAgY29uc3QgbmFtZSA9IGd5bS5uYW1lIHx8ICdHeW0nO1xuICBjb25zdCBkZXNjcmlwdGlvbiA9ICcnICsgKGd5bS5kZXNjcmlwdGlvbiB8fCAnJyk7XG5cbiAgbGV0IGNvbnRlbnQgPSBgXG4gICAgPGRpdiBjbGFzcz1cImZlYXR1cmUtbGFiZWxcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlLWxhYmVsLW5hbWVcIj5cbiAgICAgICAgPGI+JHtuYW1lfTwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImZlYXR1cmUtbGFiZWwtZGVzY3JpcHRpb25cIj5cbiAgICAgICAgJHtkZXNjcmlwdGlvbi5yZXBsYWNlKC9cXFxcbi9naSwgJzxiciAvPicpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcblxuICByZXR1cm4gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coe1xuICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgcGl4ZWxPZmZzZXQ6IG5ldyBnb29nbGUubWFwcy5TaXplKC03LCAtMzApXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwb2tlc3RvcExhYmVsKHBva2VzdG9wKSB7XG4gIGNvbnN0IG5hbWUgPSBwb2tlc3RvcC5uYW1lIHx8ICdQb2tlc3RvcCc7XG4gIGNvbnN0IGRlc2NyaXB0aW9uID0gcG9rZXN0b3AuZGVzY3JpcHRpb24gfHwgJyc7XG5cbiAgbGV0IGNvbnRlbnQgPSBgXG4gICAgPGRpdiBjbGFzcz1cImZlYXR1cmUtbGFiZWxcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlLWxhYmVsLW5hbWVcIj5cbiAgICAgICAgPGI+JHtuYW1lfTwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImZlYXR1cmUtbGFiZWwtZGVzY3JpcHRpb25cIj5cbiAgICAgICAgJHtkZXNjcmlwdGlvbi5yZXBsYWNlKC9cXFxcbi9naSwgJzxiciAvPicpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcblxuICByZXR1cm4gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coe1xuICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgcGl4ZWxPZmZzZXQ6IG5ldyBnb29nbGUubWFwcy5TaXplKDAsIC0zMClcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvcnRhbExhYmVsKHBvcnRhbCkge1xuICBjb25zdCBuYW1lID0gcG9ydGFsLm5hbWUgfHwgJ1BvcnRhbCc7XG4gIGNvbnN0IGRlc2NyaXB0aW9uID0gcG9ydGFsLmRlc2NyaXB0aW9uIHx8ICcnO1xuXG4gIGxldCBjb250ZW50ID0gYFxuICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlLWxhYmVsXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZmVhdHVyZS1sYWJlbC1uYW1lXCI+XG4gICAgICAgIDxiPiR7bmFtZX08L2I+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlLWxhYmVsLWRlc2NyaXB0aW9uXCI+XG4gICAgICAgICR7ZGVzY3JpcHRpb24ucmVwbGFjZSgvXFxcXG4vZ2ksICc8YnIgLz4nKX1cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG5cbiAgcmV0dXJuIG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHtcbiAgICBjb250ZW50OiBjb250ZW50LFxuICAgIHBpeGVsT2Zmc2V0OiBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgwLCAtMzApXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhZGRMYWJlbEFjdGlvbnMobWFwLCBmZWF0dXJlKSB7XG4gIGZlYXR1cmUubGFiZWwuaXNPcGVuID0gZmFsc2U7XG5cbiAgZmVhdHVyZS5sYWJlbC5fb3BlbiA9IGZlYXR1cmUubGFiZWwub3BlbjtcbiAgZmVhdHVyZS5sYWJlbC5fY2xvc2UgPSBmZWF0dXJlLmxhYmVsLmNsb3NlO1xuXG4gIGZlYXR1cmUubGFiZWwub3BlbiA9IGZ1bmN0aW9uIChtYXApIHtcbiAgICBmZWF0dXJlLmxhYmVsLnNldFBvc2l0aW9uKGZlYXR1cmUubG9jYXRpb24pO1xuICAgIGZlYXR1cmUubGFiZWwuX29wZW4obWFwKTtcbiAgICBmZWF0dXJlLmxhYmVsLmlzT3BlbiA9IHRydWU7XG4gIH07XG5cbiAgZmVhdHVyZS5sYWJlbC5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmZWF0dXJlLmxhYmVsLl9jbG9zZSgpO1xuICAgIGZlYXR1cmUubGFiZWwuaXNPcGVuID0gZmFsc2U7XG4gIH07XG5cbiAgZmVhdHVyZS5tYXJrZXIuYWRkTGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIGlmIChmZWF0dXJlLmxhYmVsLmlzT3Blbikge1xuICAgICAgZmVhdHVyZS5sYWJlbC5jbG9zZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmZWF0dXJlLmxhYmVsLm9wZW4obWFwKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1hcC5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgZmVhdHVyZS5sYWJlbC5jbG9zZSgpO1xuICB9KTtcblxuICBmZWF0dXJlLmxhYmVsLmFkZExpc3RlbmVyKCdjbG9zZWNsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIGZlYXR1cmUubGFiZWwuY2xvc2UoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRTMkNlbGxzKG1hcCkge1xuICBpZiAoIW1hcC5nZXRCb3VuZHMoKSkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IG1hcEJvdW5kcyA9IG1hcC5nZXRCb3VuZHMoKTtcbiAgY29uc3Qgc3dCb3VuZCA9IG1hcEJvdW5kcy5nZXRTb3V0aFdlc3QoKTtcbiAgY29uc3QgbmVCb3VuZCA9IG1hcEJvdW5kcy5nZXROb3J0aEVhc3QoKTtcblxuICBjb25zdCBzb3V0aFdlc3QgPSBTMi5TMkxhdExuZy5mcm9tRGVncmVlcyhzd0JvdW5kLmxhdCgpLCBzd0JvdW5kLmxuZygpKTtcbiAgY29uc3Qgbm9ydGhFYXN0ID0gUzIuUzJMYXRMbmcuZnJvbURlZ3JlZXMobmVCb3VuZC5sYXQoKSwgbmVCb3VuZC5sbmcoKSk7XG4gIGNvbnN0IHNjcmVlblJlZ2lvbiA9IFMyLlMyTGF0TG5nUmVjdC5mcm9tTGF0TG5nKHNvdXRoV2VzdCwgbm9ydGhFYXN0KTtcblxuICBjb25zdCBzMkNlbGxzID0gW11cbiAgJC5lYWNoKFNldHRpbmdzLmdldCgnczJDZWxscycpLCBmdW5jdGlvbiAoaW5kZXgsIGxldmVsKSB7XG4gICAgaWYgKCFtYXAuc2hvdWxkRGlzcGxheUNlbGxMZXZlbChsZXZlbCkpIHJldHVybjtcblxuICAgIGNvbnN0IHJlZ2lvbkNvdmVyZXIgPSBuZXcgUzIuUzJSZWdpb25Db3ZlcmVyKCk7XG4gICAgcmVnaW9uQ292ZXJlci5zZXRNaW5MZXZlbChsZXZlbCk7XG4gICAgcmVnaW9uQ292ZXJlci5zZXRNYXhMZXZlbChsZXZlbCk7XG4gICAgcmVnaW9uQ292ZXJlci5zZXRNYXhDZWxscyg1MCk7XG5cbiAgICBjb25zdCBzMkNlbGxJZHMgPSByZWdpb25Db3ZlcmVyLmdldENvdmVyaW5nQ2VsbHMoc2NyZWVuUmVnaW9uKTtcbiAgICAkLmVhY2goczJDZWxsSWRzLCBmdW5jdGlvbiAoaW5kZXgsIHMyQ2VsbElkKSB7XG4gICAgICBjb25zdCBzMkNlbGwgPSBuZXcgUzIuUzJDZWxsKHMyQ2VsbElkKTtcblxuICAgICAgczJDZWxsLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzMkNlbGwucG9seWdvbikge1xuICAgICAgICAgIHMyQ2VsbC5wb2x5Z29uLnNldE1hcChudWxsKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgczJDZWxsLnNob3cgPSBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgIGlmIChzMkNlbGwucG9seWdvbikge1xuICAgICAgICAgIHMyQ2VsbC5wb2x5Z29uLnNldE1hcChtYXApO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBzMkNlbGwuc2hvdWxkU2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICgoJC5pbkFycmF5KCcnICsgczJDZWxsLmxldmVsLCBTZXR0aW5ncy5nZXQoJ3MyQ2VsbHMnKSkgPiAtMSkgJiZcbiAgICAgICAgICAgICAgICAobWFwLnNob3VsZERpc3BsYXlDZWxsTGV2ZWwoczJDZWxsLmxldmVsKSkpO1xuICAgICAgfTtcblxuICAgICAgczJDZWxsLmlzU2hvd24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzMkNlbGwucG9seWdvbiAmJiBzMkNlbGwucG9seWdvbi5tYXA7XG4gICAgICB9O1xuXG4gICAgICBzMkNlbGwuZHJhdyA9IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgaWYgKCFzMkNlbGwucG9seWdvbikge1xuICAgICAgICAgIGRyYXdTMkNlbGwobWFwLCBzMkNlbGwpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBzMkNlbGxzLnB1c2goczJDZWxsKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHMyQ2VsbHM7XG59XG5cbmZ1bmN0aW9uIGRyYXdTMkNlbGwobWFwLCBzMkNlbGwpIHtcbiAgZnVuY3Rpb24gczJQb2ludFRvR01hcHNMYXRMbmcoczJQb2ludCkge1xuICAgIGNvbnN0IHMyTGF0TG5nID0gUzIuUzJMYXRMbmcuZnJvbVBvaW50KHMyUG9pbnQpO1xuICAgIHJldHVybiB7XG4gICAgICBsYXQ6IHMyTGF0TG5nLmxhdERlZ3JlZXMudG9OdW1iZXIoKSxcbiAgICAgIGxuZzogczJMYXRMbmcubG5nRGVncmVlcy50b051bWJlcigpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgdmVydGljaWVzID0gW1xuICAgIHMyUG9pbnRUb0dNYXBzTGF0TG5nKHMyQ2VsbC5nZXRWZXJ0ZXgoMCkpLFxuICAgIHMyUG9pbnRUb0dNYXBzTGF0TG5nKHMyQ2VsbC5nZXRWZXJ0ZXgoMSkpLFxuICAgIHMyUG9pbnRUb0dNYXBzTGF0TG5nKHMyQ2VsbC5nZXRWZXJ0ZXgoMikpLFxuICAgIHMyUG9pbnRUb0dNYXBzTGF0TG5nKHMyQ2VsbC5nZXRWZXJ0ZXgoMykpXG4gIF07XG5cbiAgY29uc3QgY29sb3IgPSBTZXR0aW5ncy5nZXQoJ3MyQ2VsbENvbG9ycycpW3MyQ2VsbC5sZXZlbF07XG5cbiAgczJDZWxsLnBvbHlnb24gPSBuZXcgZ29vZ2xlLm1hcHMuUG9seWdvbih7XG4gICAgcGF0aHM6IHZlcnRpY2llcyxcbiAgICBzdHJva2VDb2xvcjogY29sb3IsXG4gICAgc3Ryb2tlT3BhY2l0eTogMC43NSxcbiAgICBzdHJva2VXZWlnaHQ6IDIgKyAoKDIwIC0gczJDZWxsLmxldmVsKSAvIDQpLFxuICAgIGZpbGxDb2xvcjogY29sb3IsXG4gICAgZmlsbE9wYWNpdHk6IDAsXG4gICAgekluZGV4OiAxMjAgLSBzMkNlbGwubGV2ZWxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvb3JkaW5hdGVUb0xhdExuZyhjb29yZCkge1xuICByZXR1cm4gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhjb29yZFswXSwgY29vcmRbMV0pO1xufVxuXG5mdW5jdGlvbiBpc01vYmlsZSgpIHtcbiAgY29uc3QgbW9iaWxlUmVnZXggPSAvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pO1xuICByZXR1cm4gbW9iaWxlUmVnZXgudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn1cbiJdfQ==
