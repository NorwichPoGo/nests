const migrationDates = [
  new Date(2018, 4, 19),
  new Date(2018, 4, 5),
  new Date(2018, 3, 22),
  new Date(2018, 3, 8),
  new Date(2018, 2, 22),
  new Date(2018, 2, 8),
  new Date(2018, 1, 25)
];

const pokemonImagesUrl = 'https://raw.githubusercontent.com/pogo-excalibur' +
                         '/images/master/pogo';

const nestsFile = '/data/nests.json';

const manualNestsFile = '/data/manual_nests.json';

const nestMigrationsDir = '/data/nest_migrations';

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

function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 52.63282,
      lng: 1.29732
    },
    zoom: 13,
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

  initNests(map);
}

function initNests(map) {
  loadNestData()
    /* If a nest is given as a URL parameter then zoom to it. */
    .then(function (nestData) {
      const centerNestName = urlParameter('nest');
      if (centerNestName) {
        let centerNest;
        $.each(nestData, function (nestId, nest) {
          if (nest.permalinkName == centerNestName) {
            centerNest = nest;
            return false;
          }
        });

        if (centerNest) {
          zoomToNest(map, centerNest);
        }
      }

      return nestData;
    })
    .then(function (nestData) {
      return loadMigrationData()
        .then(function (allMigrationData) {
          $.each(allMigrationData, function (index, migrationData) {
            const date = migrationDates[index];

            $.each(nestData, function (nestId, nest) {
              if (migrationData[nestId]) {
                if (!nest.migrations) {
                  nest.migrations = [];
                }

                nest.migrations[date] = migrationData[nestId];
              }
            });
          });

          return nestData;
        });
    })
    .then(function (nestData) {
      $.each(nestData, function (nestId, nest) {
        drawNest(map, nest);
      });
    });
}

function loadNestData() {
  return Promise.resolve($.getJSON(nestsFile))
    .then(function (nestData) {
      return Promise.resolve($.getJSON(manualNestsFile))
        .then(function (manualNestData) {
          return Object.assign(nestData, manualNestData);;
        });
    })
    .then(function (nestData) {
      $.each(nestData, function (nestId, nest) {
        nest.center = coordinateToLatLng(nest.center);

        nest.region = $.map(nest.region, function (coord) {
          return coordinateToLatLng(coord);
        });

        nest.permalinkName = nest.name
            .replace(/[^\w]/g, '')
            .toLowerCase();
      });

      return nestData;
    });
}

function loadMigrationData(nestData) {
  return Promise.all($.map(migrationDates, function (date) {
    const migrationFile = `${nestMigrationsDir}/${dateToString(date)}.json`;
    return Promise.resolve($.getJSON(migrationFile));
  }))
}

function zoomToNest(map, nest) {
  map.panTo(nest.center);
  map.setZoom(17);
}

function drawNest(map, nest) {
  nest.polygon = nestRegion(nest);
  nest.polygon.setMap(map);

  nest.marker = nestMarker(nest);
  nest.marker.setMap(map);

  nest.label = nestLabel(nest);

  function labelClick() {
    if (nest.label.isOpen) {
      nest.label.close();
      nest.label.isOpen = false;
    } else {
      nest.label.setPosition(nest.center);
      nest.label.open(map);
      nest.label.isOpen = true;
    }
  }

  nest.label.isOpen = false;

  nest.polygon.addListener('click', function () {
    labelClick();
  });

  nest.marker.addListener('click', function () {
    labelClick();
  });

  map.addListener('click', function () {
    nest.label.close();
    nest.label.isOpen = false;
  });

  nest.label.addListener('closeclick', function () {
    nest.label.isOpen = false;
  });
}

function nestRegion(nest) {
  return new google.maps.Polygon({
    paths: nest.region,
    fillColor: 'green',
    fillOpacity: 0.5,
    strokeColor: 'green',
    strokeOpacity: 1,
    strokeWeight: 0
  });
}

function nestMarker(nest) {
  const icon = nestIcon(nest);

  if (icon) {
    return new google.maps.Marker({
      position: nest.center,
      icon: nestIcon(nest)
    });
  } else {
    return new google.maps.Marker();
  }
}

function nestIcon(nest) {
  const nestPokemon = nestMigrationData(nest, migrationDates[0]);

  if (nestPokemon) {
    return {
      url: `${pokemonImagesUrl}/${nestPokemon.id}.png`,
      scaledSize: new google.maps.Size(34, 34),
      anchor: new google.maps.Point(17, 17)
    };
  }
}

function nestLabel(nest) {
  function pokemonNameStr(pokemon) {
    return pokemon ? `${pokemon.name} (#${pokemon.id})` : '?';
  }

  const allNestingPokemon = $.map(migrationDates, function (date, index) {
    const dateStr = (index == 0) ? 'Current' : dateToString(date);
    const pokemon = nestMigrationData(nest, date);

    return `
      <div class="nest-label-pokemon">
        ${dateStr}: ${pokemonNameStr(pokemon)}
      </div>`;
  }).join('\n');

  const baseURL = location.protocol + '//' + location.host + location.pathname;
  const permaLink = `${baseURL}?nest=${nest.permalinkName}`;

  let spawnpointCount
  if (nest.spawnpoints) {
    if (nest.spawnpoints.length > 1) {
      spawnpointCount = `${nest.spawnpoints.length} spawnpoints`;
    } else {
      spawnpointCount = `${nest.spawnpoints.length} spawnpoint`;
    }
  } else {
    spawnpointCount = 'Number of spawnpoints unknown';
  }

  let content = `
    <div class="nest-label">
      <div class="nest-label-name">
        <b>${nest.name}</b>
        <a href="${permaLink}"><span class="fas fa-link"></span></a>
      </div>
      <div class="nest-label-spawnpoints">
        (${spawnpointCount})
      </div>
      <br/>
      ${allNestingPokemon}
    </div>`;

  return new google.maps.InfoWindow({
    content: content
  });
}

function nestMigrationData(nest, migration) {
  if (nest.migrations &&
      nest.migrations[migration] &&
      (nest.migrations[migration]['id'] > 0)) {
    return nest.migrations[migration];
  }
}

function coordinateToLatLng(ooord) {
  return new google.maps.LatLng(ooord[0], ooord[1]);
}

function dateToString(date) {
    function pad(n) {
      return (n < 10) ? '0' + n : n;
    }

    return pad(date.getFullYear()) + '-' +
           pad(date.getMonth()) + '-' +
           pad(date.getDate());
}
