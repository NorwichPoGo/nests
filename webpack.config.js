module.exports = {
  entry: {
    sign_in: './lib/sign_in.js',
    sign_in_token: './lib/sign_in_token.js',
    map: './lib/map.js',
    nests: './lib/nests.js'
  },
  output: {
    path: `${__dirname}/assets/js`,
    filename: '[name].min.js'
  },
  resolve: {
    extensions: ['.js']
  },
  mode: 'production',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      options: {
        presets: ['babel-preset-env']
      }
    }]
  },
  devtool: 'source-map',
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: false,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    publicPath: false,
    entrypoints: false
  }
};
