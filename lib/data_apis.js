const dataCacher = require('./data_cacher');

const apiDataCacher = (api, dataToObject) =>
  dataCacher(api.url, api.onFetch, dataToObject, api.storageKeys, api.options);

module.exports.APIS = {};

module.exports.APIS.FeaturesAPI = {
  url: 'https://script.google.com/macros/s' +
       '/AKfycbxl9JjGfAM9tgfCN_s9kmgarbzDPDSMuukoYZaXU9kDW7Gj4mk/exec',
  onFetch: response => {
    response.data = response.features;
    delete response.features;
  },
  storageKeys: {
    data: 'features',
    lastUpdate: 'lastFeatureUpdate',
    previousUpdate: 'previousFeatureUpdate'
  },
  options: {
    batchSize: 10,
    chunkSize: 200
  }
};

module.exports.APIS.NestsAPI = {
  url: 'https://script.google.com/macros/s' +
       '/AKfycbwvyO2lBu2l2KaS9lWg5gg8zXu2EYaAL3zZHrNSnRZqKmU8bT93/exec',
  onFetch: response => {
    response.data = response.nests;
    delete response.nests;
  },
  storageKeys: {
    data: 'nests',
    lastUpdate: 'lastNestUpdate',
    previousUpdate: 'previousNestUpdate'
  },
  options: {
    batchSize: 2,
    chunkSize: 100
  }
};

Object.keys(module.exports.APIS).forEach(apiName => {
  const api = module.exports.APIS[apiName];
  api.load = dataToObject => apiDataCacher(api, dataToObject);
});
