module.exports = grunt => {
  grunt.initConfig({
    eslint: {
      options: {
        configFile: '.eslintrc.json'
      },
      src: [
        'Gruntfile.js',
        'src/js/**/*.js',
        '!src/js/vendor/**/*.js',
        'bin/**/*.js'
      ]
    },
    browserify: {
      options: {
        transform: [['babelify', { presets: 'es2015' }]],
        browserifyOptions: {
          debug: true
        }
      },
      build: {
        files: [{
          expand: true,
          cwd: 'src/js',
          src: [
            '**/*.js',
            '!vendor/**/*.js'
          ],
          dest: 'assets/js',
          rename: (dst, src) => {
            return dst + '/' + src.replace(/.js$/, '.built.js');
          }
        }]
      }
    },
    copy: {
      build: {
        files: [{
          expand: true,
          cwd: 'src/js/vendor',
          src: '**/*.js',
          dest: 'assets/js/vendor',
          rename: (dst, src) => {
            return dst + '/' + src.replace(/.js$/, '.min.js');
          }
        }]
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        compress: {
          unused: false
        }
      },
      build: {
        files: [{
          expand: true,
          cwd: 'assets/js',
          src: '**/*.built.js',
          dest: 'assets/js',
          rename: (dst, src) => {
            return dst + '/' + src.replace(/.built.js$/, '.min.js');
          }
        }]
      }
    },
    clean: {
      build: 'assets/js'
    },
  });

  grunt.loadNpmTasks('gruntify-eslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', 'build');
  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('build', ['clean', 'browserify', 'copy', 'uglify']);
};
