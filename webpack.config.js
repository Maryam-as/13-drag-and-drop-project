const path = require('path'); // Node.js utility for working with file and directory paths

module.exports = {
  // Entry point of the application — where Webpack starts building the dependency graph
  entry: './src/app.ts',

  output: {
    // Name of the generated bundle
    // [contenthash] ensures a unique filename when the content changes (cache busting)
    filename: 'bundle.[contenthash].js',

    // Absolute path where the bundled files will be emitted
    path: path.resolve(__dirname, 'dist'),
  },
};
