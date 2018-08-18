const Portal = require('./features/portal');
const Pokestop = require('./features/pokestop');
const Gym = require('./features/gym');

const BATCH_SIZE = 10;
const CHUNK_SIZE = 200;

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

  const loader = $(document.createElement('div'));
  loader.attr('class', 'loader loader-center');
  loader.appendTo('body');

  return loadAndDrawFeatureDataIncrementally(map)
    .then(features => {
      loader.remove();

      map.features = features;

      let dateOfLastUpdate = new Date(1990, 0, 1);
      $.each(map.features, (index, feature) => {
        if (!feature.dateAdded) return;

        feature.dateAdded = new Date(feature.dateAdded);
        if (feature.dateAdded > dateOfLastUpdate) {
          dateOfLastUpdate = feature.dateAdded;
        }
      });

      $.each(map.features, (index, feature) => {
        if (feature.dateAdded &&
            (feature.dateAdded.getTime() >= dateOfLastUpdate.getTime())) {
          feature.isNew = true;
        }
      });

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

const loadAndDrawFeatureDataIncrementally = (map, start = 0, features = []) =>
  loadAndDrawFeatureDataBatch(map, BATCH_SIZE, start)
    .then(featureBatch => {
      features = features.concat(featureBatch.features);
      if (!featureBatch.endOfData) {
        return loadAndDrawFeatureDataIncrementally(
          map, start + (BATCH_SIZE * CHUNK_SIZE), features);
      }
      return features;
    });

const loadAndDrawFeatureDataBatch = (map, batchSize, batchStart = 0) => {
  const batchPromises = [];

  for (let chunkIndex = 0; chunkIndex < batchSize; ++chunkIndex) {
    const chunkStart = batchStart + (chunkIndex * CHUNK_SIZE);
    const promise = loadAndDrawFeatureDataChunk(map, CHUNK_SIZE, chunkStart);
    batchPromises.push(promise);
  }

  return Promise.all(batchPromises)
    .then(featureChunks => {
      const result = {
        errors: []
      };

      result.features = featureChunks.reduce(
        (features, chunk) => {
          if (chunk.error) {
            result.errors.push(chunk.error);
            return features;
          }

          if (chunk.endOfData) {
            result.endOfData = chunk.endOfData;
          }

          return features.concat(chunk.features);
        }, []
      );

      return result;
    });
};

const loadAndDrawFeatureDataChunk = (map, chunkSize, chunkStart = 0) =>
  fetchFeatureData(chunkSize, chunkStart)
    .then(featureDataChunk => {
      const result = {};

      if (!featureDataChunk) {
        result.error = 'API request failed';
        return result;
      }

      if (featureDataChunk.error) {
        result.error = featureDataChunk.error;
        return result;
      }

      if (!featureDataChunk.features) {
        result.error = 'No features were returned';
        return result;
      }

      result.features = loadFeatures(featureDataChunk.features);

      $.each(result.features, (index, feature) => {
        if (feature.shouldShow()) {
          feature.show(map);
        }
      });

      if (featureDataChunk.endOfData) {
        result.endOfData = featureDataChunk.endOfData;
      }

      return result;
    });

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
