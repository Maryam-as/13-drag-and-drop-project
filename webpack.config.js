const path = require('path'); // Node.js utility for working with file and directory paths

module.exports = {
  // Entry point of the application — where Webpack starts building the dependency graph
  entry: './src/app.ts',

  output: {
    // Name of the generated bundle
    filename: 'bundle.js',

    // Absolute path where the bundled files will be emitted
    path: path.resolve(__dirname, 'dist'),
  },

  // Enables source maps for easier debugging
  // 'inline-source-map' embeds the source map directly into the bundle
  // so that you can see the original TypeScript code in browser dev tools
  // instead of the compiled JavaScript
  devtool: 'inline-source-map',

  // Module configuration — defines how different types of modules (files) should be handled
  module: {
    rules: [
      {
        // Apply this rule to all TypeScript files
        test: /\.ts$/,
        // Use ts-loader to transpile TypeScript into JavaScript
        use: 'ts-loader',
        // Exclude node_modules folder to speed up compilation and avoid unnecessary processing
        exclude: /node_modules/,
      },
    ],
  },

  // Resolve configuration — tells Webpack how to find and bundle imported modules
  resolve: {
    // Automatically resolve these file extensions when importing modules
    // For example, import './app' will check './app.ts' and './app.js'
    extensions: ['.ts', '.js'],
  },
};
