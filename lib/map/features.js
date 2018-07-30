const Portal = require('./features/portal');
const Pokestop = require('./features/pokestop');
const Gym = require('./features/gym');

module.exports = map => {
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
};

const loadAndDrawFeatureDataIncrementally = map => {
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
};

const fetchFeatureCount = () => {
  const request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/pois?action=count',
    dataType: 'json'
  });
  return Promise.resolve(request);
};

const fetchFeatureData = (chunkSize, start) => {
  const request = $.ajax({
    type: 'GET',
    url: 'https://api.pokemongonorwich.uk/pois?action=get' +
         `&count=${chunkSize}` +
         `&start=${start}`,
    dataType: 'json'
  });
  return Promise.resolve(request);
};

const loadFeatures = featureData => {
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
};

const createFeature = featureData => {
  switch (featureData.type.toLowerCase()) {
  case 'gym':
    return new Gym(featureData);
  case 'pokestop':
    return new Pokestop(featureData);
  case 'portal':
    return new Portal(featureData);
  }
};

const updateFeature = (map, feature, type) => {
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
};
