const Settings = require('../settings');
const DataLoader = require('../data_loader');
const Portal = require('./features/portal');
const Pokestop = require('./features/pokestop');
const Gym = require('./features/gym');

const DATA_API_URL =
  'https://script.google.com/macros/s' +
  '/AKfycbxl9JjGfAM9tgfCN_s9kmgarbzDPDSMuukoYZaXU9kDW7Gj4mk/exec';

module.exports = map => {
  map.features =
    $.map(Settings.get('features'), featureData => createFeature(featureData));

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

  let batchSize = 10;
  if (previousUpdate > 0) {
    batchSize = 1;
  }

  const onFetch = response => {
    response.data = response.features;
    delete response.features;
    return response;
  };

  const onLoad = response => {
    $.each(response.data, (index, featureData) => {
      const feature = createFeature(featureData);
      if (feature.shouldShow()) {
        feature.show(map);
      }
      featureData.object = feature;
    });

    return response;
  };

  const dataURL = `${DATA_API_URL}?action=get`;
  const dataLoader = new DataLoader(dataURL, onFetch, onLoad, {
    batchSize: batchSize,
    chunkSize: 200
  });

  const params = {
    lastUpdate: Settings.get('lastMapUpdate')
  };

  return dataLoader.loadInBatches(params)
    .then(features => {
      loader.remove();

      features = $.map(features, feature => feature.object);

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
      $.each(featureData, (index, data) => {
        delete data.object;
      });

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
    url: `${DATA_API_URL}?action=update` +
         `&id=${feature.id}` +
         `&type=${type}`,
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
