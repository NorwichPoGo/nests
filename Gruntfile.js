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
          rename: (dst, src) => dst + '/' + src.replace(/.js$/, '.min.js')
        }]
      }
    },
    clean: {
      build: 'assets/js'
    },
    realFavicon: {
      favicons: {
        src: 'assets/images/icons/favicon_n_source.png',
        dest: 'assets/images/icons',
        options: {
          iconsPath: '/assets/images/icons',
          html: '_includes/favicon.html',
          design: {
            ios: {
              masterPicture: {
                type: 'inline',
                content: 'assets/images/icons/favicon_source.png'
              },
              pictureAspect: 'noChange',
              assets: {
                ios6AndPriorIcons: false,
                ios7AndLaterIcons: false,
                precomposedIcons: false,
                declareOnlyDefaultIcon: true
              },
              appName: 'Pokémon Go Norwich'
            },
            desktopBrowser: {
              masterPicture: {
                type: 'inline',
                content: 'assets/images/icons/favicon_source.png'
              }
            },
            windows: {
              pictureAspect: 'noChange',
              backgroundColor: '#603cba',
              onConflict: 'override',
              assets: {
                windows80Ie10Tile: false,
                windows10Ie11EdgeTiles: {
                  small: false,
                  medium: true,
                  big: false,
                  rectangle: false
                }
              },
              appName: 'Pokémon Go Norwich'
            },
            androidChrome: {
              pictureAspect: 'noChange',
              themeColor: '#603cba',
              manifest: {
                name: 'Pokémon Go Norwich',
                display: 'standalone',
                orientation: 'notSet',
                onConflict: 'override',
                declared: true
              },
              assets: {
                legacyIcon: true,
                lowResolutionIcons: false
              }
            },
            safariPinnedTab: {
              pictureAspect: 'blackAndWhite',
              threshold: 64.6875,
              themeColor: '#603cba'
            }
          },
          settings: {
            compression: 2,
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false,
            readmeFile: false,
            htmlCodeFile: false,
            usePathAsIs: false
          },
          versioning: {
            paramName: 'v',
            paramValue: '3'
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-real-favicon');

  grunt.registerTask('default', 'build');
  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('build', ['clean', 'webpack:build', 'copy']);
  grunt.registerTask('watch', 'webpack:watch');
  grunt.registerTask('favicons', 'realFavicon');
};
