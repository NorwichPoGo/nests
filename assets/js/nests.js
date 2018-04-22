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
  initSettings(map);
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
      return Promise.all([
        nestData,
        loadMigrationData(nestData),
        loadPokemonData()
      ]);
    })
    .then(function (results) {
      const nestData = results[0];
      const allMigrationData = results[1];
      const pokemonData = results[2];

      $.each(allMigrationData, function (index, migrationData) {
        const date = migrationDates[index];

        $.each(nestData, function (nestId, nest) {
          if (migrationData[nestId]) {
            if (migrationData[nestId].id === undefined) {
              const pokeData = pokemonData[migrationData[nestId]];
              migrationData[nestId] = {
                id: migrationData[nestId],
                name: pokeData.name
              };
            }

            if (!nest.migrations) {
              nest.migrations = [];
            }

            nest.migrations[date] = migrationData[nestId];
          }
        });
      });

      return nestData;
    })
    .then(function (nestData) {
      $.each(nestData, function (nestId, nest) {
        drawNest(map, nest);
      });
    });
}

function initSettings(map) {
  google.maps.event.addListener(map, 'idle', function () {
    Settings.set('mapCenter', {
      lat: map.getCenter().lat(),
      lng: map.getCenter().lng()
    });
    Settings.set('zoomLevel', map.getZoom());
  });
}

function loadNestData() {
  return Promise.resolve($.getJSON('/data/nests.json'))
    .then(function (nestData) {
      return Promise.resolve($.getJSON('/data/manual_nests.json'))
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
    const migrationFile = `/data/nest_migrations/${dateToString(date)}.json`;
    return Promise.resolve($.getJSON(migrationFile));
  }))
}

function loadPokemonData() {
  return Promise.resolve($.getJSON('/data/pokemon.json'));
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
