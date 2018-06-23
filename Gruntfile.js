module.exports = grunt => {
  grunt.initConfig({
    eslint: {
      options: {
        configFile: '.eslintrc.json'
      },
      src: [
        'Gruntfile.js',
        'src/js/**/*.js',
        '!src/js/vendor/**/*.js'
      ]
    },
    babel: {
      options: {
        sourceMap: true,
        presets: [
          [
            'env',
            {
              'targets': {
                'browsers': ['>0.5%']
              }
            }
          ]
        ]
      },
      build: {
        files: [{
          expand: true,
          cwd: 'src/js',
          src: '**/*.js',
          dest: 'assets/js',
          rename: (dst, src) => {
            return dst + '/' + src.replace(/.js$/, '.built.js');
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
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', 'build');
  grunt.registerTask('lint', 'eslint');
  grunt.registerTask('build', ['clean', 'babel', 'uglify']);
};
