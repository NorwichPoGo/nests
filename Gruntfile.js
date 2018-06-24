'use strict';

const webpackConfig = require('./webpack.config');

module.exports = grunt => {
  grunt.initConfig({
    eslint: {
      options: {
        configFile: '.eslintrc.json'
      },
      src: [
        'Gruntfile.js',
        'lib/**/*.js',
        '!lib/vendor/**/*.js',
        'bin/**/*.js'
      ]
    },
    webpack: {
      build: webpackConfig,
      watch: Object.assign({ watch: true }, webpackConfig)
    },
    copy: {
      build: {
        files: [{
          expand: true,
          cwd: 'lib/vendor',
          src: '**/*.js',
          dest: 'assets/js/vendor',
          rename: (dst, src) => {
            return dst + '/' + src.replace(/.js$/, '.min.js');
          }
        }]
      }
    },
    clean: {
      build: 'assets/js'
    }
  });

  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', 'build');
  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('build', ['clean', 'webpack:build', 'copy']);
  grunt.registerTask('watch', 'webpack:watch');
};
