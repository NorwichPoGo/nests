const Settings = require('../settings');
const Portal = require('./features/portal');
const Pokestop = require('./features/pokestop');
const Gym = require('./features/gym');

const BATCH_SIZE = 10;
const CHUNK_SIZE = 200;

module.exports = map => {
  map.features = loadFeatures(Settings.get('features'));

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

  $.each(map.features, (index, feature) => {
    if (feature.shouldShow()) {
      feature.show(map);
    }
  });

  const loader = $(document.createElement('div'));
  loader.attr('class', 'loader loader-center');
  loader.appendTo('body');

  if (map.features.length === 0) {
    Settings.delete('lastMapUpdate');
  }

  const previousUpdate = Settings.get('lastMapUpdate');

  let batchSize = BATCH_SIZE;
  if (previousUpdate > 0) {
    batchSize = 1;
  }

  return loadAndDrawFeatureDataIncrementally(map, batchSize, CHUNK_SIZE)
    .then(features => {
      loader.remove();

      const newFeatureIds = $.map(features, feature => feature.id);

      const featuresToKeep = [];
      $.each(map.features, (index, feature) => {
        const updated = newFeatureIds.includes(feature.id);
        if (updated) {
          feature.hide();
        } else {
          featuresToKeep.push(feature);
        }
      });

      map.features = featuresToKeep.concat(features);

      const featureData = $.map(map.features, feature => feature.options);
      Settings.set('features', featureData);
      Settings.set('lastMapUpdate', Date.now());

      $.each(map.features, (index, feature) => {
        const dateUpdated = new Date(feature.dateUpdated || 0);
        if (dateUpdated.getTime() >= previousUpdate) {
          feature.isNew = true;
        }
      });

      map.showFeatures(feature => feature.isNew);

      map.featureLookup = new Fuse(map.features, {
        shouldSort: true,
        threshold: 0.5,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: ['name']
      });

      map.searchBox.lookup = function (value) {
        return map.featureLookup.search(value);
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

const loadAndDrawFeatureDataIncrementally =
  (map, batchSize, chunkSize, start = 0, features = []) =>
    loadAndDrawFeatureDataBatch(map, batchSize, chunkSize, start)
      .then(featureBatch => {
        features = features.concat(featureBatch.features);
        if (!featureBatch.endOfData) {
          return loadAndDrawFeatureDataIncrementally(
            map, batchSize, chunkSize, start + (batchSize * chunkSize), features);
        }
        return features;
      });

const loadAndDrawFeatureDataBatch = (map, batchSize, chunkSize, batchStart = 0) => {
  const batchPromises = [];

  for (let chunkIndex = 0; chunkIndex < batchSize; ++chunkIndex) {
    const chunkStart = batchStart + (chunkIndex * chunkSize);
    const promise = loadAndDrawFeatureDataChunk(map, chunkSize, chunkStart);
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

const fetchFeatureData = (chunkSize, start) =>
  Promise.resolve($.ajax({
    type: 'GET',
    url: 'https://script.google.com/macros/s/AKfycbxl9JjGfAM9tgfCN_s9kmgarbzDPDSMuukoYZaXU9kDW7Gj4mk/exec' +
         '?action=get' +
         `&lastUpdate=${Settings.get('lastMapUpdate')}` +
         `&count=${chunkSize}` +
         `&start=${start}`,
    dataType: 'json'
  }));

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
