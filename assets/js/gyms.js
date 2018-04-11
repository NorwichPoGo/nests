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

  initFeatures(map);
  initSettings(map);
}

function initFeatures(map) {
  loadFeatureData()
    .then(function (features) {
      map.features = features;
      map.drawFeatures();
    });
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

  google.maps.event.addListener(map, 'idle', function() {
    Settings.set('mapCenter', {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    });
    Settings.set('zoomLevel', map.getZoom());
  });
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
      }
    });
  } else {
    featureMarker = new google.maps.Marker({
      position: feature.location
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

function coordinateToLatLng(coord) {
  return new google.maps.LatLng(coord[0], coord[1]);
}
