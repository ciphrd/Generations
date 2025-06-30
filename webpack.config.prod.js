import withFxhashCli from "@fxhash/cli/webpack"
export default withFxhashCli(
  { mode: "prd" },
  {
    module: {
      rules: [
        {
          test: /\.glsl$/,
          exclude: /node_modules/,
          use: {
            loader: "raw-loader",
          },
        },
      ],
    },
  }
)
