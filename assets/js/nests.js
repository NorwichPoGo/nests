const migrationDates = [
  new Date(2018, 3, 8),
  new Date(2018, 2, 22),
  new Date(2018, 2, 8),
  new Date(2018, 1, 25)
];

const pokemonImagesUrl = 'https://raw.githubusercontent.com/pogo-excalibur' +
                         '/images/master/pogo';

const nestsFile = '/data/nests.json';

const nestMigrationsDir = '/data/nest-migrations';

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

  loadNestData()
    .then(function (nestData) {
      $.each(nestData, function (nestId, nest) {
        drawNest(map, nest);
      });
    });
}

function loadNestData() {
  return Promise.resolve($.getJSON(nestsFile))
    .then(function (nestData) {
      $.each(nestData, function (nestId, nest) {
        nest.center = coordinateToLatLng(nest.center);

        nest.region = $.map(nest.region, function (coord) {
          return coordinateToLatLng(coord);
        });
      });

      return loadMigrations()
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
    });
}

function loadMigrations() {
  return Promise.all($.map(migrationDates, function (date) {
    return loadMigrationData(date);
  }));
}

function loadMigrationData(date) {
  const migrationFile = `${nestMigrationsDir}/${dateToString(date)}.json`;
  return Promise.resolve($.getJSON(migrationFile));
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
  } else {
    return;
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

  let content = `
    <div class="nest-label">
      <div class="nest-label-name">
        <b>${nest.name}</b>
      </div>
      <div class="nest-label-spawnpoints">
        (${nest.spawnpoints.length} spawnpoint${(nest.spawnpoints.length > 1) ? 's' : ''})
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
  } else {
    return;
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
