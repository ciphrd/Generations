import withFxhashCli from "@fxhash/cli/webpack"
export default withFxhashCli(
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
        {
          test: /\.glsl$/,
          exclude: /node_modules/,
          use: {
            loader: "raw-loader",
          },
        },
      ],
    },

    devServer: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "require-corp",
      },
    },
  }
)
