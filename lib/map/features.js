const Settings = require('../settings');
const { FeaturesAPI } = require('../data_apis').APIS;
const Portal = require('./features/portal');
const Pokestop = require('./features/pokestop');
const Gym = require('./features/gym');

const DATA_API_URL =
  'https://script.google.com/macros/s' +
  '/AKfycbxl9JjGfAM9tgfCN_s9kmgarbzDPDSMuukoYZaXU9kDW7Gj4mk/exec';

module.exports = map => {
  map.showFeatures = shouldRedraw => {
    map.features.forEach(feature => {
      if (feature.shouldShow()) {
        feature.show(map, shouldRedraw);
      } else {
        feature.hide();
      }
    });
  };

  map.getFeatureById = id => {
    if (!map.features || !(map.features.length > 0)) return;
    return map.features.find(feature => feature.id == id);
  };

  map.createFeature = featureData => {
    let feature;

    switch (featureData.type.toLowerCase()) {
    case 'gym':
      feature = new Gym(featureData);
      break;
    case 'pokestop':
      feature = new Pokestop(featureData);
      break;
    case 'portal':
      feature = new Portal(featureData);
      break;
    }

    if (feature && feature.shouldShow()) {
      feature.show(map);
    }

    return feature;
  };

  const loader = $(document.createElement('div'));
  loader.attr('class', 'loader loader-center');
  loader.appendTo('body');

  return FeaturesAPI.load(map.createFeature)
    .then(features => {
      loader.remove();

      map.features = features;

      const previousUpdate = Settings.get('previousFeatureUpdate');
      features.forEach(feature => {
        const dateUpdated = new Date(feature.dateUpdated || 0);
        if ((dateUpdated.getTime() >= previousUpdate)) {
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

      map.searchBox.enable();

      map.addListener('click', () => {
        map.features.forEach(feature => {
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
    });
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

      const newFeature = map.createFeature(feature.options);
      map.features.push(newFeature);
      newFeature.show(map);
      newFeature.label.open(map);
    });
};
