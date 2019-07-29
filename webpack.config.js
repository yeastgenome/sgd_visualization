const path = require("path");

module.exports = {
  entry: "./src/index.js",
  mode: 'development',
  output: {
    filename: "./index.js",
    path: path.join(__dirname, "lib")
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react", "@babel/preset-env"]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  stats: {
    colors: true,
    modules: true,
    reasons: true,
    errorDetails: false
  }
}