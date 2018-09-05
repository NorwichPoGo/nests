class DataLoader {
  constructor(apiURL, onFetch, onLoad, options) {
    this.apiURL = apiURL;
    this.onFetch = onFetch;
    this.onLoad = onLoad;
    this.startParam = options.startParam || 'start';
    this.countParam = options.countParam || 'count';
    this.batchSize = options.batchSize || 10;
    this.chunkSize = options.chunkSize || 100;
  }

  loadInBatches(params, start = 0, data = []) {
    return this.loadBatch(start, params)
      .then(batch => {
        data = data.concat(batch.data);
        if (!batch.endOfData) {
          const nextStart = start + (this.batchSize * this.chunkSize);
          return this.loadInBatches(params, nextStart, data);
        }
        return data;
      });
  }

  loadBatch(start, params) {
    const chunks = [];
    
    for (let chunkIndex = 0; chunkIndex < this.batchSize; ++chunkIndex) {
      const chunkStart = start + (chunkIndex * this.chunkSize);
      const promise = this.loadChunk(chunkStart, params);
      chunks.push(promise);
    }

    return Promise.all(chunks)
      .then(chunks => {
        const result = {
          errors: []
        };

        result.data = chunks.reduce(
          (data, chunk) => {
            if (chunk.error) {
              result.errors.push(chunk.error);
            }

            if (chunk.endOfData) {
              result.endOfData = chunk.endOfData;
            }

            if (chunk.data && chunk.data.length) {
              data = data.concat(chunk.data);
            }

            return data;
          }, []
        );

        return result;
      });
  }

  loadChunk(start, params) {
    return this.fetchChunk(start, params)
      .then(response => Promise.resolve(this.onLoad(response)));
  }

  fetchChunk(start, params) {
    const defaultParams = {};
    defaultParams[this.startParam] = start;
    defaultParams[this.countParam] = this.chunkSize;

    const request = $.ajax({
      type: 'GET',
      url: this.buildURL(Object.assign(defaultParams, params)),
      dataType: 'json'
    });

    return Promise.resolve(request)
      .then(response => Promise.resolve(this.onFetch(response)))
      .then(response => {
        if (!response) {
          response = {};
          response.error = 'API request failed';
        }

        if (!response.data) {
          response.error = 'No data wes returned';
        }

        return response;
      });
  }

  buildURL(params) {
    const paramsStr = Object.keys(params)
      .map(name => `${name}=${params[name]}`)
      .join('&');
    const connector = this.apiURL.includes('?') ? '&' : '?';
    return `${this.apiURL}${connector}${paramsStr}`;
  }
}

module.exports = DataLoader;
