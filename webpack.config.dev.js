const withFxhashCli = require("@fxhash/cli/webpack").default
module.exports = withFxhashCli(
  { mode: "dev" },
  {
    module: {
      rules: [
        {
          test: /\.(jsx)$/, // support both .js and .jsx
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
      ],
    },
  }
)
