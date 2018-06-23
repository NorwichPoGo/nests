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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvbWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxPQUFPLE9BQVAsR0FBaUIsWUFBTTtBQUNyQixNQUFNLE1BQU0sSUFBSSxPQUFPLElBQVAsQ0FBWSxHQUFoQixDQUFvQixTQUFTLGNBQVQsQ0FBd0IsS0FBeEIsQ0FBcEIsRUFBb0Q7QUFDOUQsWUFBUSxTQUFTLEdBQVQsQ0FBYSxXQUFiLENBRHNEO0FBRTlELFVBQU0sU0FBUyxHQUFULENBQWEsV0FBYixDQUZ3RDtBQUc5RCxxQkFBaUIsUUFINkM7QUFJOUQsdUJBQW1CLEtBSjJDO0FBSzlELHVCQUFtQixJQUwyQztBQU05RCxvQkFBZ0IsSUFOOEM7QUFPOUQsb0JBQWdCLEtBUDhDO0FBUTlELDJCQUF1QjtBQUNyQixhQUFPLE9BQU8sSUFBUCxDQUFZLG1CQUFaLENBQWdDLGNBRGxCO0FBRXJCLGdCQUFVLE9BQU8sSUFBUCxDQUFZLGVBQVosQ0FBNEIsV0FGakI7QUFHckIsa0JBQVksQ0FDVixPQUFPLElBQVAsQ0FBWSxTQUFaLENBQXNCLE9BRFosRUFFVixPQUFPLElBQVAsQ0FBWSxTQUFaLENBQXNCLFNBRlosRUFHVixPQUFPLElBQVAsQ0FBWSxTQUFaLENBQXNCLE1BSFo7QUFIUztBQVJ1QyxHQUFwRCxDQUFaOztBQW1CQSxnQkFBYyxHQUFkO0FBQ0EsY0FBWSxHQUFaO0FBQ0EsZUFBYSxHQUFiO0FBQ0EsWUFBVSxHQUFWO0FBQ0EsZUFBYSxHQUFiO0FBQ0QsQ0F6QkQ7O0FBMkJBLFNBQVMsYUFBVCxDQUF1QixHQUF2QixFQUE0QjtBQUMxQixNQUFNLGlCQUFpQixTQUFTLGFBQVQsQ0FBdUIsT0FBdkIsQ0FBdkI7QUFDQSxpQkFBZSxZQUFmLENBQTRCLElBQTVCLEVBQWtDLFdBQWxDO0FBQ0EsaUJBQWUsWUFBZixDQUE0QixPQUE1QixFQUFxQyxVQUFyQztBQUNBLGlCQUFlLFlBQWYsQ0FB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QUNEOztBQUVELFNBQVMsUUFBVCxHQUFvQjtBQUNsQixNQUFNLGNBQWMsZ0VBQXBCO0FBQ0EsU0FBTyxZQUFZLElBQVosQ0FBaUIsVUFBVSxTQUEzQixDQUFQO0FBQ0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ3aW5kb3cuaW5pdE1hcCA9ICgpID0+IHtcbiAgY29uc3QgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcbiAgICBjZW50ZXI6IFNldHRpbmdzLmdldCgnbWFwQ2VudGVyJyksXG4gICAgem9vbTogU2V0dGluZ3MuZ2V0KCd6b29tTGV2ZWwnKSxcbiAgICBnZXN0dXJlSGFuZGxpbmc6ICdncmVlZHknLFxuICAgIGZ1bGxzY3JlZW5Db250cm9sOiBmYWxzZSxcbiAgICBzdHJlZXRWaWV3Q29udHJvbDogdHJ1ZSxcbiAgICBtYXBUeXBlQ29udHJvbDogdHJ1ZSxcbiAgICBjbGlja2FibGVJY29uczogZmFsc2UsXG4gICAgbWFwVHlwZUNvbnRyb2xPcHRpb25zOiB7XG4gICAgICBzdHlsZTogZ29vZ2xlLm1hcHMuTWFwVHlwZUNvbnRyb2xTdHlsZS5IT1JJWk9OVEFMX0JBUixcbiAgICAgIHBvc2l0aW9uOiBnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb24uTEVGVF9CT1RUT00sXG4gICAgICBtYXBUeXBlSWRzOiBbXG4gICAgICAgIGdvb2dsZS5tYXBzLk1hcFR5cGVJZC5ST0FETUFQLFxuICAgICAgICBnb29nbGUubWFwcy5NYXBUeXBlSWQuU0FURUxMSVRFLFxuICAgICAgICBnb29nbGUubWFwcy5NYXBUeXBlSWQuSFlCUklEXG4gICAgICBdXG4gICAgfVxuICB9KTtcblxuICBpbml0U2VhcmNoQm94KG1hcCk7XG4gIGluaXRTMkNlbGxzKG1hcCk7XG4gIGluaXRGZWF0dXJlcyhtYXApO1xuICBpbml0UGFya3MobWFwKTtcbiAgaW5pdFNldHRpbmdzKG1hcCk7XG59XG5cbmZ1bmN0aW9uIGluaXRTZWFyY2hCb3gobWFwKSB7XG4gIGNvbnN0IHNlYXJjaEJveElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgc2VhcmNoQm94SW5wdXQuc2V0QXR0cmlidXRlKCdpZCcsICdwYWMtaW5wdXQnKTtcbiAgc2VhcmNoQm94SW5wdXQuc2V0QXR0cmlidXRlKCdjbGFzcycsICdjb250cm9scycpO1xuICBzZWFyY2hCb3hJbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dCcpO1xuICBzZWFyY2hCb3hJbnB1dC5zZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCBHeW1zIGFuZCBQb2tlc3RvcHMnKTtcblxuICBjb25zdCBzZWFyY2hCb3hEcm9wZG93biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBzZWFyY2hCb3hEcm9wZG93bi5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ3BhYy1jb250YWluZXIgIHBhYy1sb2dvJyk7XG5cbiAgbWFwLmNvbnRyb2xzW2dvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbi5UT1BfTEVGVF0ucHVzaChzZWFyY2hCb3hJbnB1dCk7XG4gIG1hcC5zZWFyY2hCb3ggPSAkKHNlYXJjaEJveElucHV0KTtcbiAgbWFwLnNlYXJjaEJveC5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xuXG4gIG1hcC5zZWFyY2hCb3guZHJvcGRvd24gPSAkKHNlYXJjaEJveERyb3Bkb3duKTtcbiAgbWFwLnNlYXJjaEJveC5kcm9wZG93bi5hcHBlbmRUbygnYm9keScpO1xuXG4gICQoZG9jdW1lbnQpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICBtYXAuc2VhcmNoQm94LmRyb3Bkb3duLmhpZGUoKTtcbiAgfSk7XG5cbiAgbWFwLnNlYXJjaEJveC5jbGljayhmdW5jdGlvbiAoZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuXG4gIG1hcC5zZWFyY2hCb3guZHJvcGRvd24uYWRkID0gZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICBjb25zdCByZXN1bHRXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgcmVzdWx0V3JhcHBlci5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ3BhYy1pdGVtJyk7XG5cbiAgICBjb25zdCByZXN1bHRJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHJlc3VsdEljb24uc2V0QXR0cmlidXRlKCdjbGFzcycsIGBwYWMtaWNvbiBwYWMtaWNvbi0ke2ZlYXR1cmUudHlwZX1gKTtcblxuICAgIGNvbnN0IHJlc3VsdE1hdGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHJlc3VsdE1hdGNoLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAncGFjLWl0ZW0tcXVlcnknKTtcbiAgICByZXN1bHRNYXRjaC5pbm5lckhUTUwgPVxuICAgICAgYDxzcGFuIGNsYXNzPVwicGFjLWl0ZW0tcXVlcnlcIj4ke2ZlYXR1cmUubmFtZX08L3NwYW4+YDtcblxuICAgIGNvbnN0IHJlc3VsdERlc2NyaXB0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHJlc3VsdERlc2NyaXB0aW9uLmlubmVySFRNTCA9IGZlYXR1cmUuZGVzY3JpcHRpb24gfHwgJyc7XG5cbiAgICByZXN1bHRXcmFwcGVyLmFwcGVuZENoaWxkKHJlc3VsdEljb24pO1xuICAgIHJlc3VsdFdyYXBwZXIuYXBwZW5kQ2hpbGQocmVzdWx0TWF0Y2gpO1xuICAgIHJlc3VsdFdyYXBwZXIuYXBwZW5kQ2hpbGQocmVzdWx0RGVzY3JpcHRpb24pO1xuICAgIG1hcC5zZWFyY2hCb3guZHJvcGRvd25bMF0uYXBwZW5kQ2hpbGQocmVzdWx0V3JhcHBlcik7XG5cbiAgICAkKHJlc3VsdFdyYXBwZXIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIG1hcC5wYW5UbyhmZWF0dXJlLmxvY2F0aW9uKTtcbiAgICAgIGZlYXR1cmUubGFiZWwub3BlbihtYXApO1xuICAgIH0pO1xuICB9O1xuXG4gIG1hcC5zZWFyY2hCb3gub24oJ2lucHV0JywgZnVuY3Rpb24gKGUpIHtcbiAgICBtYXAuc2VhcmNoQm94LmRyb3Bkb3duLmVtcHR5KCk7XG5cbiAgICBpZiAoIW1hcC5mZWF0dXJlcyB8fCAhbWFwLmZlYXR1cmVzLm5hbWVMb29rdXApIHJldHVybjtcblxuICAgIGNvbnN0IG1hdGNoZXMgPSBtYXAuZmVhdHVyZXMubmFtZUxvb2t1cC5zZWFyY2goZS5jdXJyZW50VGFyZ2V0LnZhbHVlKTtcbiAgICBjb25zdCB2aXNpYmxlTWF0Y2hlcyA9IG1hdGNoZXMuZmlsdGVyKGZ1bmN0aW9uIChtYXRjaCkge1xuICAgICAgcmV0dXJuIG1hdGNoLmlzU2hvd24oKTtcbiAgICB9KTtcblxuICAgICQuZWFjaCh2aXNpYmxlTWF0Y2hlcy5zbGljZSgwLCA0KSwgZnVuY3Rpb24gKGluZGV4LCBtYXRjaCkge1xuICAgICAgbWFwLnNlYXJjaEJveC5kcm9wZG93bi5hZGQobWF0Y2gpO1xuICAgIH0pO1xuXG4gICAgbWFwLnNlYXJjaEJveC5kcm9wZG93bi5zaG93KCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0UzJDZWxscyhtYXApIHtcbiAgbWFwLmRyYXdTMkNlbGxzID0gZnVuY3Rpb24gKG5ld1MyQ2VsbHMpIHtcbiAgICBjb25zdCBvbGRTMkNlbGxzID0gKG1hcC5zMkNlbGxzIHx8IFtdKS5zbGljZSgwLCAtMjAwKTtcbiAgICAkLmVhY2gob2xkUzJDZWxscywgZnVuY3Rpb24gKGluZGV4LCBzMkNlbGwpIHtcbiAgICAgIHMyQ2VsbC5oaWRlKCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzMkNlbGxzID0gKG1hcC5zMkNlbGxzIHx8IFtdKS5zbGljZSgtMjAwKTtcbiAgICAkLm1lcmdlKHMyQ2VsbHMsIG5ld1MyQ2VsbHMpO1xuXG4gICAgJC5lYWNoKHMyQ2VsbHMsIGZ1bmN0aW9uIChpbmRleCwgczJDZWxsKSB7XG4gICAgICBpZiAoczJDZWxsLnNob3VsZFNob3coKSkge1xuICAgICAgICBpZiAoIXMyQ2VsbC5pc1Nob3duKCkpIHtcbiAgICAgICAgICBzMkNlbGwuZHJhdyhtYXApO1xuICAgICAgICAgIHMyQ2VsbC5zaG93KG1hcCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHMyQ2VsbC5oaWRlKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBtYXAuczJDZWxscyA9IHMyQ2VsbHM7XG4gIH07XG5cbiAgbWFwLnVwZGF0ZVMyQ2VsbHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgbWFwLmNhbmNlbFMyQ2VsbFVwZGF0ZSgpO1xuXG4gICAgbWFwLnBlbmRpbmdTMkNlbGxVcGRhdGUgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IG5ld1MyQ2VsbHMgPSBsb2FkUzJDZWxscyhtYXApO1xuICAgICAgbWFwLmRyYXdTMkNlbGxzKG5ld1MyQ2VsbHMpO1xuICAgIH0sIDgwMCk7XG4gIH1cblxuICBtYXAuY2FuY2VsUzJDZWxsVXBkYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChtYXAucGVuZGluZ1MyQ2VsbFVwZGF0ZSkge1xuICAgICAgY2xlYXJUaW1lb3V0KG1hcC5wZW5kaW5nUzJDZWxsVXBkYXRlKTtcbiAgICB9XG4gIH1cblxuICBtYXAuc2hvdWxkRGlzcGxheUNlbGxMZXZlbCA9IGZ1bmN0aW9uIChsZXZlbCkge1xuICAgIGxldCBjZWxsTGV2ZWxMaW1pdDtcbiAgICBpZiAoKGxldmVsID09IDEpIHx8IChsZXZlbCA9PSAyKSkge1xuICAgICAgY2VsbExldmVsTGltaXQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBjZWxsTGV2ZWxMaW1pdCA9IGxldmVsO1xuICAgIH1cblxuICAgIGlmIChpc01vYmlsZSgpICYmIChjZWxsTGV2ZWxMaW1pdCA+IDApKSBjZWxsTGV2ZWxMaW1pdCAtPSAxO1xuICAgIHJldHVybiBtYXAuZ2V0Wm9vbSgpID49IGNlbGxMZXZlbExpbWl0O1xuICB9XG5cbiAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnaWRsZScsIG1hcC51cGRhdGVTMkNlbGxzKTtcbiAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnYm91bmRzX2NoYW5nZWQnLCBtYXAuY2FuY2VsUzJDZWxsVXBkYXRlKTtcbn1cblxuZnVuY3Rpb24gaW5pdEZlYXR1cmVzKG1hcCkge1xuICBtYXAuc2hvd0ZlYXR1cmVzID0gZnVuY3Rpb24gKHNob3VsZFJlZHJhdykge1xuICAgICQuZWFjaChtYXAuZmVhdHVyZXMsIGZ1bmN0aW9uIChpbmRleCwgZmVhdHVyZSkge1xuICAgICAgZmVhdHVyZS5zaG93KG1hcCwgc2hvdWxkUmVkcmF3KTtcbiAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gbG9hZEFuZERyYXdGZWF0dXJlRGF0YUluY3JlbWVudGFsbHkobWFwKVxuICAgIC50aGVuKGZ1bmN0aW9uIChmZWF0dXJlcykge1xuICAgICAgbWFwLmZlYXR1cmVzID0gZmVhdHVyZXM7XG5cbiAgICAgIG1hcC5mZWF0dXJlcy5uYW1lTG9va3VwID0gbmV3IEZ1c2UobWFwLmZlYXR1cmVzLCB7XG4gICAgICAgIHNob3VsZFNvcnQ6IHRydWUsXG4gICAgICAgIHRocmVzaG9sZDogMC41LFxuICAgICAgICBsb2NhdGlvbjogMCxcbiAgICAgICAgZGlzdGFuY2U6IDEwMCxcbiAgICAgICAgbWF4UGF0dGVybkxlbmd0aDogMzIsXG4gICAgICAgIG1pbk1hdGNoQ2hhckxlbmd0aDogMSxcbiAgICAgICAga2V5czogW1xuICAgICAgICAgICduYW1lJ1xuICAgICAgICBdXG4gICAgICB9KTtcblxuICAgICAgJCgnI3BhYy1pbnB1dCcpLnByb3AoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0UGFya3MobWFwKSB7XG4gIGxvYWRQYXJrRGF0YSgpXG4gICAgLnRoZW4oZnVuY3Rpb24gKHBhcmtzKSB7XG4gICAgICBjb25zdCBwYXJrc0xheWVyID0gbmV3IGdvb2dsZS5tYXBzLkRhdGEoKTtcbiAgICAgIHBhcmtzTGF5ZXIuYWRkR2VvSnNvbihwYXJrcyk7XG4gICAgICBwYXJrc0xheWVyLnNldFN0eWxlKHtcbiAgICAgICAgZmlsbENvbG9yOiAnZ3JlZW4nXG4gIFx0ICB9KTtcblxuICAgICAgcGFya3NMYXllci5zaG93ID0gZnVuY3Rpb24gKHNob3cpIHtcbiAgICAgICAgaWYgKHNob3cgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcGFya3NMYXllci5zZXRNYXAobnVsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFya3NMYXllci5zZXRNYXAobWFwKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBtYXAucGFya3NMYXllciA9IHBhcmtzTGF5ZXI7XG4gICAgICBtYXAucGFya3NMYXllci5zaG93KFNldHRpbmdzLmdldCgnc2hvd1BhcmtzJykpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0U2V0dGluZ3MobWFwKSB7XG4gIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICQoJy5zZXR0aW5ncycpLmNvbGxhcHNlKCdoaWRlJyk7XG4gIH0pO1xuXG4gICQoJ1tuYW1lPVwidG9nZ2xlLWd5bXNcIl0nKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgJCgnW25hbWU9XCJ0b2dnbGUtZ3ltc1wiXScpLmJvb3RzdHJhcFN3aXRjaCgnc3RhdGUnLFxuICAgIFNldHRpbmdzLmdldCgnc2hvd0d5bXMnKSk7XG4gICQoJ1tuYW1lPVwidG9nZ2xlLWd5bXNcIl0nKS5vbignc3dpdGNoQ2hhbmdlLmJvb3RzdHJhcFN3aXRjaCcsXG4gICAgZnVuY3Rpb24oZXZlbnQsIHN0YXRlKSB7XG4gICAgICBTZXR0aW5ncy5zZXQoJ3Nob3dHeW1zJywgc3RhdGUpO1xuICAgICAgbWFwLnNob3dGZWF0dXJlcygpO1xuICAgIH1cbiAgKTtcblxuICAkKFwiW25hbWU9J3RvZ2dsZS1wb2tlc3RvcHMnXVwiKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgJChcIltuYW1lPSd0b2dnbGUtcG9rZXN0b3BzJ11cIikuYm9vdHN0cmFwU3dpdGNoKCdzdGF0ZScsXG4gICAgU2V0dGluZ3MuZ2V0KCdzaG93UG9rZXN0b3BzJykpO1xuICAkKCdbbmFtZT1cInRvZ2dsZS1wb2tlc3RvcHNcIl0nKS5vbignc3dpdGNoQ2hhbmdlLmJvb3RzdHJhcFN3aXRjaCcsXG4gICAgZnVuY3Rpb24oZXZlbnQsIHN0YXRlKSB7XG4gICAgICBTZXR0aW5ncy5zZXQoJ3Nob3dQb2tlc3RvcHMnLCBzdGF0ZSk7XG4gICAgICBtYXAuc2hvd0ZlYXR1cmVzKCk7XG4gICAgfVxuICApO1xuXG4gICQoXCJbbmFtZT0ndG9nZ2xlLXBvcnRhbHMnXVwiKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgJChcIltuYW1lPSd0b2dnbGUtcG9ydGFscyddXCIpLmJvb3RzdHJhcFN3aXRjaCgnc3RhdGUnLFxuICAgIFNldHRpbmdzLmdldCgnc2hvd1BvcnRhbHMnKSk7XG4gICQoJ1tuYW1lPVwidG9nZ2xlLXBvcnRhbHNcIl0nKS5vbignc3dpdGNoQ2hhbmdlLmJvb3RzdHJhcFN3aXRjaCcsXG4gICAgZnVuY3Rpb24oZXZlbnQsIHN0YXRlKSB7XG4gICAgICBTZXR0aW5ncy5zZXQoJ3Nob3dQb3J0YWxzJywgc3RhdGUpO1xuICAgICAgbWFwLnNob3dGZWF0dXJlcygpO1xuICAgIH1cbiAgKTtcblxuICAkKFwiW25hbWU9J3RvZ2dsZS1wYXJrcyddXCIpLmJvb3RzdHJhcFN3aXRjaCgpO1xuICAkKFwiW25hbWU9J3RvZ2dsZS1wYXJrcyddXCIpLmJvb3RzdHJhcFN3aXRjaCgnc3RhdGUnLFxuICAgIFNldHRpbmdzLmdldCgnc2hvd1BhcmtzJykpO1xuICAkKCdbbmFtZT1cInRvZ2dsZS1wYXJrc1wiXScpLm9uKCdzd2l0Y2hDaGFuZ2UuYm9vdHN0cmFwU3dpdGNoJyxcbiAgICBmdW5jdGlvbihldmVudCwgc3RhdGUpIHtcbiAgICAgIFNldHRpbmdzLnNldCgnc2hvd1BhcmtzJywgc3RhdGUpO1xuICAgICAgbWFwLnBhcmtzTGF5ZXIuc2hvdyhzdGF0ZSk7XG4gICAgfVxuICApO1xuXG4gICQoXCJbbmFtZT0ndG9nZ2xlLWhpZ2hsaWdodC1uZXctZmVhdHVyZXMnXVwiKS5ib290c3RyYXBTd2l0Y2goKTtcbiAgJChcIltuYW1lPSd0b2dnbGUtaGlnaGxpZ2h0LW5ldy1mZWF0dXJlcyddXCIpLmJvb3RzdHJhcFN3aXRjaCgnc3RhdGUnLFxuICAgIFNldHRpbmdzLmdldCgnaGlnaGxpZ2h0TmV3RmVhdHVyZXMnKSk7XG4gICQoJ1tuYW1lPVwidG9nZ2xlLWhpZ2hsaWdodC1uZXctZmVhdHVyZXNcIl0nKS5vbignc3dpdGNoQ2hhbmdlLmJvb3RzdHJhcFN3aXRjaCcsXG4gICAgZnVuY3Rpb24oZXZlbnQsIHN0YXRlKSB7XG4gICAgICBTZXR0aW5ncy5zZXQoJ2hpZ2hsaWdodE5ld0ZlYXR1cmVzJywgc3RhdGUpO1xuICAgICAgbWFwLnNob3dGZWF0dXJlcyhmdW5jdGlvbiAoZmVhdHVyZSkge1xuICAgICAgICByZXR1cm4gZmVhdHVyZS5pc05ldztcbiAgICAgIH0pO1xuICAgIH1cbiAgKTtcblxuICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXAsICdpZGxlJywgZnVuY3Rpb24gKCkge1xuICAgIFNldHRpbmdzLnNldCgnbWFwQ2VudGVyJywge1xuICAgICAgbGF0OiBtYXAuZ2V0Q2VudGVyKCkubGF0KCksXG4gICAgICBsbmc6IG1hcC5nZXRDZW50ZXIoKS5sbmcoKVxuICAgIH0pO1xuICAgIFNldHRpbmdzLnNldCgnem9vbUxldmVsJywgbWFwLmdldFpvb20oKSk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHNldFMyQ2VsbExldmVsT3B0aW9ucygpIHtcbiAgICBsZXQgczJDZWxsTGV2ZWxPcHRpb25zID0gJyc7XG4gICAgZm9yIChsZXQgbGV2ZWwgPSAxOyBsZXZlbCA8PSAyMDsgKytsZXZlbCkge1xuICAgICAgbGV0IG9wdGlvblRhZyA9ICcnO1xuICAgICAgaWYgKG1hcC5zaG91bGREaXNwbGF5Q2VsbExldmVsKGxldmVsKSkge1xuICAgICAgICBvcHRpb25UYWcgKz0gJzxvcHRpb24gdmFsdWU9XCInICsgbGV2ZWwgKyAnXCI+JztcbiAgICAgICAgb3B0aW9uVGFnICs9IGxldmVsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9uVGFnICs9ICc8b3B0aW9uIHZhbHVlPVwiJyArIGxldmVsICsgJ1wiJysgJ2Rpc2FibGVkJyArICc+JztcbiAgICAgICAgb3B0aW9uVGFnICs9IGxldmVsICsgJyAtIHpvb20gaW4nO1xuICAgICAgfVxuICAgICAgb3B0aW9uVGFnICs9ICc8L29wdGlvbj4nO1xuXG4gICAgICBzMkNlbGxMZXZlbE9wdGlvbnMgKz0gb3B0aW9uVGFnO1xuICAgIH1cblxuICAgICQoXCJbbmFtZT0nc2VsZWN0LXMyLWNlbGxzJ11cIikuaHRtbChzMkNlbGxMZXZlbE9wdGlvbnMpO1xuICAgICQoXCJbbmFtZT0nc2VsZWN0LXMyLWNlbGxzJ11cIikuc2VsZWN0cGlja2VyKCd2YWwnLCBTZXR0aW5ncy5nZXQoJ3MyQ2VsbHMnKSk7XG4gICAgJChcIltuYW1lPSdzZWxlY3QtczItY2VsbHMnXVwiKS5zZWxlY3RwaWNrZXIoJ3JlZnJlc2gnKVxuICB9XG5cbiAgc2V0UzJDZWxsTGV2ZWxPcHRpb25zKCk7XG5cbiAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnaWRsZScsIHNldFMyQ2VsbExldmVsT3B0aW9ucyk7XG5cbiAgJChcIltuYW1lPSdzZWxlY3QtczItY2VsbHMnXVwiKS5zZWxlY3RwaWNrZXIoe1xuICAgIHNpemU6IDUsXG4gICAgZHJvcHVwQXV0bzogZmFsc2VcbiAgfSk7XG4gICQoXCJbbmFtZT0nc2VsZWN0LXMyLWNlbGxzJ11cIikub24oJ2NoYW5nZWQuYnMuc2VsZWN0JywgZnVuY3Rpb24gKCkge1xuICAgIFNldHRpbmdzLnNldCgnczJDZWxscycsICQodGhpcykudmFsKCkgfHwgW10pO1xuICAgIG1hcC51cGRhdGVTMkNlbGxzKCk7XG4gIH0pO1xuXG4gICQoJy5zZWxlY3QtczItY2VsbHMtd3JhcHBlciAuYnMtc2VsZWN0LWFsbCcpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRBbmREcmF3RmVhdHVyZURhdGFJbmNyZW1lbnRhbGx5KG1hcCkge1xuICBjb25zdCBjaHVua1NpemUgPSA0MDA7XG5cbiAgcmV0dXJuIGZldGNoRmVhdHVyZUNvdW50KClcbiAgICAudGhlbihmdW5jdGlvbiAoZmVhdHVyZUNvdW50KSB7XG4gICAgICBjb25zdCBjaHVua3MgPSBNYXRoLmNlaWwoZmVhdHVyZUNvdW50IC8gY2h1bmtTaXplKTtcblxuICAgICAgY29uc3QgZmVhdHVyZURhdGFQcm9taXNlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaHVua3M7ICsraSkge1xuICAgICAgICBjb25zdCBwcm9taXNlID0gZmV0Y2hGZWF0dXJlRGF0YShjaHVua1NpemUsIGkgKiBjaHVua1NpemUpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGZlYXR1cmVEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9hZEZlYXR1cmVzKGZlYXR1cmVEYXRhKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChmZWF0dXJlRGF0YSkge1xuICAgICAgICAgICAgJC5lYWNoKGZlYXR1cmVEYXRhLCBmdW5jdGlvbiAoaW5kZXgsIGZlYXR1cmUpIHtcbiAgICAgICAgICAgICAgZmVhdHVyZS5zaG93KG1hcCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBmZWF0dXJlRGF0YTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgZmVhdHVyZURhdGFQcm9taXNlcy5wdXNoKHByb21pc2UpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmVhdHVyZURhdGFQcm9taXNlcyk7XG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoZmVhdHVyZURhdGFDaHVua3MpIHtcbiAgICAgIHJldHVybiBmZWF0dXJlRGF0YUNodW5rcy5yZWR1Y2UoZnVuY3Rpb24gKGZlYXR1cmVEYXRhLCBjaHVuaykge1xuICAgICAgICByZXR1cm4gZmVhdHVyZURhdGEuY29uY2F0KGNodW5rKTtcbiAgICAgIH0sIFtdKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hGZWF0dXJlQ291bnQoKSB7XG4gIGNvbnN0IHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgIHR5cGU6ICdHRVQnLFxuICAgIHVybDogJ2h0dHBzOi8vYXBpLnBva2Vtb25nb25vcndpY2gudWsvcG9pcz9hY3Rpb249Y291bnQnLFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVxdWVzdCk7XG59XG5cbmZ1bmN0aW9uIGZldGNoRmVhdHVyZURhdGEoY2h1bmtTaXplLCBzdGFydCkge1xuICBjb25zdCByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICB0eXBlOiAnR0VUJyxcbiAgICB1cmw6ICdodHRwczovL2FwaS5wb2tlbW9uZ29ub3J3aWNoLnVrL3BvaXM/YWN0aW9uPWdldCcgK1xuICAgICAgICAgYCZjb3VudD0ke2NodW5rU2l6ZX1gICtcbiAgICAgICAgIGAmc3RhcnQ9JHtzdGFydH1gLFxuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgfSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVxdWVzdCk7XG59XG5cbmZ1bmN0aW9uIGxvYWRGZWF0dXJlcyhmZWF0dXJlRGF0YSkge1xuICBjb25zdCBiYXNlVVJMID0gbG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgbG9jYXRpb24uaG9zdCArIGxvY2F0aW9uLnBhdGhuYW1lO1xuXG4gIGxldCBkYXRlT2ZMYXN0VXBkYXRlID0gbmV3IERhdGUoMTk5MCwgMCwgMSk7XG4gICQuZWFjaChmZWF0dXJlRGF0YSwgZnVuY3Rpb24gKGluZGV4LCBmZWF0dXJlKSB7XG4gICAgaWYgKCFmZWF0dXJlLmRhdGVBZGRlZCkgcmV0dXJuO1xuXG4gICAgZmVhdHVyZS5kYXRlQWRkZWQgPSBuZXcgRGF0ZShmZWF0dXJlLmRhdGVBZGRlZCk7XG4gICAgaWYgKGZlYXR1cmUuZGF0ZUFkZGVkID4gZGF0ZU9mTGFzdFVwZGF0ZSkge1xuICAgICAgZGF0ZU9mTGFzdFVwZGF0ZSA9IGZlYXR1cmUuZGF0ZUFkZGVkO1xuICAgIH1cbiAgfSk7XG5cbiAgY29uc3QgdmFsaWRGZWF0dXJlcyA9IFtdO1xuXG4gICQuZWFjaChmZWF0dXJlRGF0YSwgZnVuY3Rpb24gKGluZGV4LCBmZWF0dXJlKSB7XG4gICAgaWYgKCFmZWF0dXJlLnR5cGUgfHxcbiAgICAgICAgIWZlYXR1cmUubGF0aXR1ZGUgfHxcbiAgICAgICAgIWZlYXR1cmUubG9uZ2l0dWRlKSB7XG4gICAgICByZXR1cm47XG4gICAgfTtcblxuICAgIGZlYXR1cmUudHlwZSA9IGZlYXR1cmUudHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgIGZlYXR1cmUubG9jYXRpb24gPSBjb29yZGluYXRlVG9MYXRMbmcoW2ZlYXR1cmUubGF0aXR1ZGUsIGZlYXR1cmUubG9uZ2l0dWRlXSk7XG4gICAgZmVhdHVyZS5wZXJtYWxpbmtOYW1lID0gZmVhdHVyZS5pZDtcbiAgICBmZWF0dXJlLnBlcm1hbGluayA9IGAke2Jhc2VVUkx9PyR7ZmVhdHVyZS50eXBlfT0ke2ZlYXR1cmUuaWR9YDtcblxuICAgIGlmIChmZWF0dXJlLmRhdGVBZGRlZCAmJlxuICAgICAgICAoZmVhdHVyZS5kYXRlQWRkZWQuZ2V0VGltZSgpID49IGRhdGVPZkxhc3RVcGRhdGUuZ2V0VGltZSgpKSkge1xuICAgICAgZmVhdHVyZS5pc05ldyA9IHRydWU7XG4gICAgfVxuXG4gICAgZmVhdHVyZS5oaWRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGZlYXR1cmUubWFya2VyKSB7XG4gICAgICAgIGZlYXR1cmUubWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZmVhdHVyZS5zaG93ID0gZnVuY3Rpb24gKG1hcCwgc2hvdWxkUmVkcmF3KSB7XG4gICAgICBpZiAodGhpcy5zaG91bGRTaG93KCkpIHtcbiAgICAgICAgaWYgKHNob3VsZFJlZHJhdyAmJiBzaG91bGRSZWRyYXcoZmVhdHVyZSkpIHtcbiAgICAgICAgICB0aGlzLmRyYXcobWFwLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5pc1Nob3duKCkpIHtcbiAgICAgICAgICB0aGlzLmRyYXcobWFwKTtcbiAgICAgICAgICB0aGlzLm1hcmtlci5zZXRNYXAobWFwKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGZlYXR1cmUuc2hvdWxkU2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICgoKGZlYXR1cmUudHlwZSA9PSAnZ3ltJykgJiYgU2V0dGluZ3MuZ2V0KCdzaG93R3ltcycpKSB8fFxuICAgICAgICAgICgoZmVhdHVyZS50eXBlID09ICdwb2tlc3RvcCcpICYmIFNldHRpbmdzLmdldCgnc2hvd1Bva2VzdG9wcycpKSB8fFxuICAgICAgICAgICgoZmVhdHVyZS50eXBlID09ICdwb3J0YWwnKSAmJiBTZXR0aW5ncy5nZXQoJ3Nob3dQb3J0YWxzJykpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBmZWF0dXJlLmlzU2hvd24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZmVhdHVyZS5tYXJrZXIgJiYgZmVhdHVyZS5tYXJrZXIubWFwO1xuICAgIH07XG5cbiAgICBmZWF0dXJlLmRyYXcgPSBmdW5jdGlvbiAobWFwLCByZWRyYXcpIHtcbiAgICAgIGlmIChyZWRyYXcpIHtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgIGRyYXdGZWF0dXJlKG1hcCwgZmVhdHVyZSk7XG4gICAgICB9IGVsc2UgaWYgKCFmZWF0dXJlLm1hcmtlcikge1xuICAgICAgICBkcmF3RmVhdHVyZShtYXAsIGZlYXR1cmUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YWxpZEZlYXR1cmVzLnB1c2goZmVhdHVyZSk7XG4gIH0pO1xuXG4gIHJldHVybiB2YWxpZEZlYXR1cmVzO1xufVxuXG5mdW5jdGlvbiBsb2FkUGFya0RhdGEoKSB7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoJC5nZXRKU09OKCcvZGF0YS9wYXJrcy5nZW9qc29uJykpO1xufVxuXG5mdW5jdGlvbiB6b29tVG9GZWF0dXJlKG1hcCwgZmVhdHVyZSwgem9vbSkge1xuICBtYXAucGFuVG8oZmVhdHVyZS5sb2NhdGlvbik7XG4gIG1hcC5zZXRab29tKHpvb20gfHwgMTcpO1xufVxuXG5mdW5jdGlvbiBkcmF3RmVhdHVyZShtYXAsIGZlYXR1cmUpIHtcbiAgY29uc3QgZmVhdHVyZU1hcmtlckljb25zID0ge1xuICAgIGd5bTogJy9hc3NldHMvaW1hZ2VzL2d5bS5wbmcnLFxuICAgIG5ld19neW06ICcvYXNzZXRzL2ltYWdlcy9neW0ucG5nJyxcbiAgICBwb2tlc3RvcDogJy9hc3NldHMvaW1hZ2VzL3Bva2VzdG9wLnBuZycsXG4gICAgbmV3X3Bva2VzdG9wOiAnL2Fzc2V0cy9pbWFnZXMvbmV3X3Bva2VzdG9wLnBuZycsXG4gICAgcG9ydGFsOiAnL2Fzc2V0cy9pbWFnZXMvcG9ydGFsLnBuZycsXG4gICAgbmV3X3BvcnRhbDogJy9hc3NldHMvaW1hZ2VzL25ld19wb3J0YWwucG5nJ1xuICB9O1xuXG4gIGxldCBtYXJrZXJJY29uO1xuICBpZiAoU2V0dGluZ3MuZ2V0KCdoaWdobGlnaHROZXdGZWF0dXJlcycpICYmIGZlYXR1cmUuaXNOZXcpIHtcbiAgICBtYXJrZXJJY29uID0gZmVhdHVyZU1hcmtlckljb25zWyduZXdfJyArIGZlYXR1cmUudHlwZV07XG4gIH0gZWxzZSB7XG4gICAgbWFya2VySWNvbiA9IGZlYXR1cmVNYXJrZXJJY29uc1tmZWF0dXJlLnR5cGVdO1xuICB9XG5cbiAgY29uc3QgYW5jaG9yWCA9IChmZWF0dXJlLnR5cGUgPT0gJ2d5bScpID8gMjIgOiAxNTtcblxuICBsZXQgZmVhdHVyZU1hcmtlcjtcbiAgaWYgKGZlYXR1cmVNYXJrZXJJY29uc1tmZWF0dXJlLnR5cGVdKSB7XG4gICAgZmVhdHVyZU1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgcG9zaXRpb246IGZlYXR1cmUubG9jYXRpb24sXG4gICAgICBpY29uOiB7XG4gICAgICAgIHVybDogbWFya2VySWNvbixcbiAgICAgICAgc2NhbGVkU2l6ZTogbmV3IGdvb2dsZS5tYXBzLlNpemUoMzAsIDMwKSxcbiAgICAgICAgYW5jaG9yOiBuZXcgZ29vZ2xlLm1hcHMuUG9pbnQoYW5jaG9yWCwgMzApXG4gICAgICB9LFxuICAgICAgekluZGV4OiAyMFxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGZlYXR1cmVNYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcbiAgICAgIHBvc2l0aW9uOiBmZWF0dXJlLmxvY2F0aW9uLFxuICAgICAgekluZGV4OiAyMFxuICAgIH0pO1xuICB9XG5cbiAgZmVhdHVyZS5tYXJrZXIgPSBmZWF0dXJlTWFya2VyO1xuXG4gIGxldCBmZWF0dXJlTGFiZWw7XG4gIGlmIChmZWF0dXJlLnR5cGUgPT0gJ2d5bScpIHtcbiAgICBmZWF0dXJlTGFiZWwgPSBneW1MYWJlbChmZWF0dXJlKTtcbiAgfSBlbHNlIGlmIChmZWF0dXJlLnR5cGUgPT0gJ3Bva2VzdG9wJykge1xuICAgIGZlYXR1cmVMYWJlbCA9IHBva2VzdG9wTGFiZWwoZmVhdHVyZSk7XG4gIH0gZWxzZSBpZiAoZmVhdHVyZS50eXBlID09ICdwb3J0YWwnKSB7XG4gICAgZmVhdHVyZUxhYmVsID0gcG9ydGFsTGFiZWwoZmVhdHVyZSk7XG4gIH1cblxuICBpZiAoZmVhdHVyZUxhYmVsKSB7XG4gICAgZmVhdHVyZS5sYWJlbCA9IGZlYXR1cmVMYWJlbDtcbiAgICBhZGRMYWJlbEFjdGlvbnMobWFwLCBmZWF0dXJlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBneW1MYWJlbChneW0pIHtcbiAgY29uc3QgbmFtZSA9IGd5bS5uYW1lIHx8ICdHeW0nO1xuICBjb25zdCBkZXNjcmlwdGlvbiA9ICcnICsgKGd5bS5kZXNjcmlwdGlvbiB8fCAnJyk7XG5cbiAgbGV0IGNvbnRlbnQgPSBgXG4gICAgPGRpdiBjbGFzcz1cImZlYXR1cmUtbGFiZWxcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlLWxhYmVsLW5hbWVcIj5cbiAgICAgICAgPGI+JHtuYW1lfTwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImZlYXR1cmUtbGFiZWwtZGVzY3JpcHRpb25cIj5cbiAgICAgICAgJHtkZXNjcmlwdGlvbi5yZXBsYWNlKC9cXFxcbi9naSwgJzxiciAvPicpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcblxuICByZXR1cm4gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coe1xuICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgcGl4ZWxPZmZzZXQ6IG5ldyBnb29nbGUubWFwcy5TaXplKC03LCAtMzApXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwb2tlc3RvcExhYmVsKHBva2VzdG9wKSB7XG4gIGNvbnN0IG5hbWUgPSBwb2tlc3RvcC5uYW1lIHx8ICdQb2tlc3RvcCc7XG4gIGNvbnN0IGRlc2NyaXB0aW9uID0gcG9rZXN0b3AuZGVzY3JpcHRpb24gfHwgJyc7XG5cbiAgbGV0IGNvbnRlbnQgPSBgXG4gICAgPGRpdiBjbGFzcz1cImZlYXR1cmUtbGFiZWxcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlLWxhYmVsLW5hbWVcIj5cbiAgICAgICAgPGI+JHtuYW1lfTwvYj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImZlYXR1cmUtbGFiZWwtZGVzY3JpcHRpb25cIj5cbiAgICAgICAgJHtkZXNjcmlwdGlvbi5yZXBsYWNlKC9cXFxcbi9naSwgJzxiciAvPicpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcblxuICByZXR1cm4gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3coe1xuICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgcGl4ZWxPZmZzZXQ6IG5ldyBnb29nbGUubWFwcy5TaXplKDAsIC0zMClcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBvcnRhbExhYmVsKHBvcnRhbCkge1xuICBjb25zdCBuYW1lID0gcG9ydGFsLm5hbWUgfHwgJ1BvcnRhbCc7XG4gIGNvbnN0IGRlc2NyaXB0aW9uID0gcG9ydGFsLmRlc2NyaXB0aW9uIHx8ICcnO1xuXG4gIGxldCBjb250ZW50ID0gYFxuICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlLWxhYmVsXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiZmVhdHVyZS1sYWJlbC1uYW1lXCI+XG4gICAgICAgIDxiPiR7bmFtZX08L2I+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJmZWF0dXJlLWxhYmVsLWRlc2NyaXB0aW9uXCI+XG4gICAgICAgICR7ZGVzY3JpcHRpb24ucmVwbGFjZSgvXFxcXG4vZ2ksICc8YnIgLz4nKX1cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PmA7XG5cbiAgcmV0dXJuIG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KHtcbiAgICBjb250ZW50OiBjb250ZW50LFxuICAgIHBpeGVsT2Zmc2V0OiBuZXcgZ29vZ2xlLm1hcHMuU2l6ZSgwLCAtMzApXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhZGRMYWJlbEFjdGlvbnMobWFwLCBmZWF0dXJlKSB7XG4gIGZlYXR1cmUubGFiZWwuaXNPcGVuID0gZmFsc2U7XG5cbiAgZmVhdHVyZS5sYWJlbC5fb3BlbiA9IGZlYXR1cmUubGFiZWwub3BlbjtcbiAgZmVhdHVyZS5sYWJlbC5fY2xvc2UgPSBmZWF0dXJlLmxhYmVsLmNsb3NlO1xuXG4gIGZlYXR1cmUubGFiZWwub3BlbiA9IGZ1bmN0aW9uIChtYXApIHtcbiAgICBmZWF0dXJlLmxhYmVsLnNldFBvc2l0aW9uKGZlYXR1cmUubG9jYXRpb24pO1xuICAgIGZlYXR1cmUubGFiZWwuX29wZW4obWFwKTtcbiAgICBmZWF0dXJlLmxhYmVsLmlzT3BlbiA9IHRydWU7XG4gIH07XG5cbiAgZmVhdHVyZS5sYWJlbC5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmZWF0dXJlLmxhYmVsLl9jbG9zZSgpO1xuICAgIGZlYXR1cmUubGFiZWwuaXNPcGVuID0gZmFsc2U7XG4gIH07XG5cbiAgZmVhdHVyZS5tYXJrZXIuYWRkTGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIGlmIChmZWF0dXJlLmxhYmVsLmlzT3Blbikge1xuICAgICAgZmVhdHVyZS5sYWJlbC5jbG9zZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmZWF0dXJlLmxhYmVsLm9wZW4obWFwKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1hcC5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgZmVhdHVyZS5sYWJlbC5jbG9zZSgpO1xuICB9KTtcblxuICBmZWF0dXJlLmxhYmVsLmFkZExpc3RlbmVyKCdjbG9zZWNsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIGZlYXR1cmUubGFiZWwuY2xvc2UoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRTMkNlbGxzKG1hcCkge1xuICBpZiAoIW1hcC5nZXRCb3VuZHMoKSkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IG1hcEJvdW5kcyA9IG1hcC5nZXRCb3VuZHMoKTtcbiAgY29uc3Qgc3dCb3VuZCA9IG1hcEJvdW5kcy5nZXRTb3V0aFdlc3QoKTtcbiAgY29uc3QgbmVCb3VuZCA9IG1hcEJvdW5kcy5nZXROb3J0aEVhc3QoKTtcblxuICBjb25zdCBzb3V0aFdlc3QgPSBTMi5TMkxhdExuZy5mcm9tRGVncmVlcyhzd0JvdW5kLmxhdCgpLCBzd0JvdW5kLmxuZygpKTtcbiAgY29uc3Qgbm9ydGhFYXN0ID0gUzIuUzJMYXRMbmcuZnJvbURlZ3JlZXMobmVCb3VuZC5sYXQoKSwgbmVCb3VuZC5sbmcoKSk7XG4gIGNvbnN0IHNjcmVlblJlZ2lvbiA9IFMyLlMyTGF0TG5nUmVjdC5mcm9tTGF0TG5nKHNvdXRoV2VzdCwgbm9ydGhFYXN0KTtcblxuICBjb25zdCBzMkNlbGxzID0gW11cbiAgJC5lYWNoKFNldHRpbmdzLmdldCgnczJDZWxscycpLCBmdW5jdGlvbiAoaW5kZXgsIGxldmVsKSB7XG4gICAgaWYgKCFtYXAuc2hvdWxkRGlzcGxheUNlbGxMZXZlbChsZXZlbCkpIHJldHVybjtcblxuICAgIGNvbnN0IHJlZ2lvbkNvdmVyZXIgPSBuZXcgUzIuUzJSZWdpb25Db3ZlcmVyKCk7XG4gICAgcmVnaW9uQ292ZXJlci5zZXRNaW5MZXZlbChsZXZlbCk7XG4gICAgcmVnaW9uQ292ZXJlci5zZXRNYXhMZXZlbChsZXZlbCk7XG4gICAgcmVnaW9uQ292ZXJlci5zZXRNYXhDZWxscyg1MCk7XG5cbiAgICBjb25zdCBzMkNlbGxJZHMgPSByZWdpb25Db3ZlcmVyLmdldENvdmVyaW5nQ2VsbHMoc2NyZWVuUmVnaW9uKTtcbiAgICAkLmVhY2goczJDZWxsSWRzLCBmdW5jdGlvbiAoaW5kZXgsIHMyQ2VsbElkKSB7XG4gICAgICBjb25zdCBzMkNlbGwgPSBuZXcgUzIuUzJDZWxsKHMyQ2VsbElkKTtcblxuICAgICAgczJDZWxsLmhpZGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzMkNlbGwucG9seWdvbikge1xuICAgICAgICAgIHMyQ2VsbC5wb2x5Z29uLnNldE1hcChudWxsKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgczJDZWxsLnNob3cgPSBmdW5jdGlvbiAobWFwKSB7XG4gICAgICAgIGlmIChzMkNlbGwucG9seWdvbikge1xuICAgICAgICAgIHMyQ2VsbC5wb2x5Z29uLnNldE1hcChtYXApO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBzMkNlbGwuc2hvdWxkU2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICgoJC5pbkFycmF5KCcnICsgczJDZWxsLmxldmVsLCBTZXR0aW5ncy5nZXQoJ3MyQ2VsbHMnKSkgPiAtMSkgJiZcbiAgICAgICAgICAgICAgICAobWFwLnNob3VsZERpc3BsYXlDZWxsTGV2ZWwoczJDZWxsLmxldmVsKSkpO1xuICAgICAgfTtcblxuICAgICAgczJDZWxsLmlzU2hvd24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzMkNlbGwucG9seWdvbiAmJiBzMkNlbGwucG9seWdvbi5tYXA7XG4gICAgICB9O1xuXG4gICAgICBzMkNlbGwuZHJhdyA9IGZ1bmN0aW9uIChtYXApIHtcbiAgICAgICAgaWYgKCFzMkNlbGwucG9seWdvbikge1xuICAgICAgICAgIGRyYXdTMkNlbGwobWFwLCBzMkNlbGwpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBzMkNlbGxzLnB1c2goczJDZWxsKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHMyQ2VsbHM7XG59XG5cbmZ1bmN0aW9uIGRyYXdTMkNlbGwobWFwLCBzMkNlbGwpIHtcbiAgZnVuY3Rpb24gczJQb2ludFRvR01hcHNMYXRMbmcoczJQb2ludCkge1xuICAgIGNvbnN0IHMyTGF0TG5nID0gUzIuUzJMYXRMbmcuZnJvbVBvaW50KHMyUG9pbnQpO1xuICAgIHJldHVybiB7XG4gICAgICBsYXQ6IHMyTGF0TG5nLmxhdERlZ3JlZXMudG9OdW1iZXIoKSxcbiAgICAgIGxuZzogczJMYXRMbmcubG5nRGVncmVlcy50b051bWJlcigpXG4gICAgfVxuICB9XG5cbiAgY29uc3QgdmVydGljaWVzID0gW1xuICAgIHMyUG9pbnRUb0dNYXBzTGF0TG5nKHMyQ2VsbC5nZXRWZXJ0ZXgoMCkpLFxuICAgIHMyUG9pbnRUb0dNYXBzTGF0TG5nKHMyQ2VsbC5nZXRWZXJ0ZXgoMSkpLFxuICAgIHMyUG9pbnRUb0dNYXBzTGF0TG5nKHMyQ2VsbC5nZXRWZXJ0ZXgoMikpLFxuICAgIHMyUG9pbnRUb0dNYXBzTGF0TG5nKHMyQ2VsbC5nZXRWZXJ0ZXgoMykpXG4gIF07XG5cbiAgY29uc3QgY29sb3IgPSBTZXR0aW5ncy5nZXQoJ3MyQ2VsbENvbG9ycycpW3MyQ2VsbC5sZXZlbF07XG5cbiAgczJDZWxsLnBvbHlnb24gPSBuZXcgZ29vZ2xlLm1hcHMuUG9seWdvbih7XG4gICAgcGF0aHM6IHZlcnRpY2llcyxcbiAgICBzdHJva2VDb2xvcjogY29sb3IsXG4gICAgc3Ryb2tlT3BhY2l0eTogMC43NSxcbiAgICBzdHJva2VXZWlnaHQ6IDIgKyAoKDIwIC0gczJDZWxsLmxldmVsKSAvIDQpLFxuICAgIGZpbGxDb2xvcjogY29sb3IsXG4gICAgZmlsbE9wYWNpdHk6IDAsXG4gICAgekluZGV4OiAxMjAgLSBzMkNlbGwubGV2ZWxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvb3JkaW5hdGVUb0xhdExuZyhjb29yZCkge1xuICByZXR1cm4gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhjb29yZFswXSwgY29vcmRbMV0pO1xufVxuXG5mdW5jdGlvbiBpc01vYmlsZSgpIHtcbiAgY29uc3QgbW9iaWxlUmVnZXggPSAvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pO1xuICByZXR1cm4gbW9iaWxlUmVnZXgudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn1cbiJdfQ==
