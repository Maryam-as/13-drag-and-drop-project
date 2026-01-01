const path = require('path'); // Node.js utility for working with file and directory paths
const CleanPlugin = require('clean-webpack-plugin'); // Plugin to clean output directory before each build

module.exports = {
  // Set Webpack mode to 'production' to enable optimizations like minification, tree-shaking, etc.
  mode: 'production',

  // Entry point of the application — where Webpack starts building the dependency graph
  entry: './src/app.ts',

  // Configuration for Webpack Dev Server
  devServer: {
    // Serve static files from the root directory (for index.html, assets, etc.)
    static: [
      {
        directory: path.join(__dirname),
      },
    ],
  },

  output: {
    // Name of the generated bundle
    filename: 'bundle.js',

    // Absolute path where the bundled files will be emitted
    path: path.resolve(__dirname, 'dist'),
  },

  // Disable source maps for production to reduce bundle size
  // devtool: 'none',

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

  // Plugins extend Webpack functionality
  plugins: [
    // CleanWebpackPlugin removes all files from the output directory before each build
    new CleanPlugin.CleanWebpackPlugin(),
  ],
};
