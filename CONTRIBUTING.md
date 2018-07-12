## Basics
This site is built on [GitHub Pages](https://pages.github.com/), which uses [Jekyll](https://jekyllrb.com/) for building templates and SCSS assets.

The site's [JavaScript](https://www.javascript.com/) is built using [webpack](https://webpack.js.org/).

[npm](https://www.npmjs.com/) and [Grunt](https://gruntjs.com/) are used to manage the build process.


## Getting Started
All development should take place on local clones of this repository. Please submit a pull request once you're happy that your feature is complete.

### Step-by-Step Setup

1. Install:
   - [Git](https://git-scm.com/downloads/)
   - [Ruby](https://www.ruby-lang.org/en/downloads/)
   - [Node.js](https://nodejs.org/en/download/) *
2. Clone the repository (`git clone https://github.com/norwichpogo/norwichpogo.github.io.git`)
3. Enter the directory that you cloned the repository into
4. Run `bundle install`
5. Run `npm install` *

\* You only need to install Node.js and run the JavaScript build process if you're changing the site's JavaScript files (in the `/lib` directory). If you're not editing the site's JavaScript then these steps are not required. 

### Serving the Site
The site's content is built into the `_site` directory.

To serve this content (so that you can view the site and see the changes that you're making) you can use Jekyll:
```
bundle exec jekyll serve --watch
```

This will default to serving the site on `localhost:4000`. You can set the host and port using `--host` and `--port` respectively:
```
bundle exec jekyll serve --watch --host YOUR_HOST --PORT YOUR_PORT
```

### Building the Site
Once you start making changes to the site you'll need to build those changes to see them take effect.

If you've made an edit to a template/include file (they usually end in `.html`) or to a CSS file (usually `.css` or `.scss`) you'll need to build using Jekyll:
```
bundle exec jekyll build
```

If you've edited a JavaScript source file (in the `/lib` directory) you'll need to build using webpack:
```
npm run build
```

### Watching for Changes
Both build commands have a 'watch' option which can be used to cause the build process to run in the background and automatically build the site whenever you change a file.

For Jekyll:
```
bundle exec jekyll build --watch
```

And for webpack:
```
npm run watch
```


## Style Guide

### HTML
HTML content should use two spaces for indentation. Try to avoid long lines, and keep styles to CSS/SASS files.

### CSS
CSS/SASS should also use two spaces for indentation.

### JavaScript
This site uses a combination of webpack and [Babel](https://babeljs.io/) to allow the use of [ES6](https://hacks.mozilla.org/category/es6-in-depth/) in the browser.

You can check that you're JavaScript is formatted correctly by running:
```
npm run lint
```


## Additional Tasks

### Favicons
To change the site's favicon you can edit or replace the favicon source files (`/assets/images/icons/favicon_source.png` and `/assets/images/icons/favicon_n_source.png`), and then run the favicon generation task using `npm run favicons`.

This will automatically build and format the various favicon types.
