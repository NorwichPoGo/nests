const Settings = require('./settings');
const DataLoader = require('./data_loader');

module.exports = (apiURL, onFetch, dataToObject, storageKeys, options) => {
  const oldData = Settings.get(storageKeys.data);
  const oldObjects = oldData.map(data => {
    const object = dataToObject(data);
    object.data = data;
    return object;
  });

  if (oldData.length === 0) {
    Settings.delete(storageKeys.lastUpdate);
  }

  const onLoad = response => {
    response.data.forEach(data => {
      data.object = dataToObject(data);
      data.object.data = data;
    });
  };

  const dataURL = `${apiURL}?action=get`;
  const lastUpdate = Settings.get(storageKeys.lastUpdate);
  const dataLoader = new DataLoader(dataURL, onFetch, onLoad, {
    batchSize: (lastUpdate > 0) ? 1 : options.batchSize,
    chunkSize: options.chunkSize
  });

  const params = {
    lastUpdate: lastUpdate
  };

  return dataLoader.loadInBatches(params)
    .then(newData => {
      const newObjects = newData.map(data => {
        const object = data.object;
        delete object.data.object;
        return object;
      });

      const newDataIds = newData.map(data => data.id);

      let objects = [];
      oldObjects.forEach(object => {
        if (newDataIds.includes(object.id)) {
          if (object.hide) {
            object.hide();
          }
        } else {
          objects.push(object);
        }
      });

      objects = objects.concat(newObjects);

      const data = objects.map(object => object.data);
      const now = Date.now();
      Settings.set(storageKeys.data, data);
      Settings.set(storageKeys.lastUpdate, now);

      if (oldData.length === 0) {
        Settings.set(storageKeys.previousUpdate, now);
      } else if (newData.length > 0) {
        Settings.set(storageKeys.previousUpdate, lastUpdate);
      }

      return objects;
    });
};
