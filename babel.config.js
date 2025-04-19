module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        ["babel-preset-expo", { jsxImportSource: "nativewind" }],
        "nativewind/babel",
      ],
      plugins: [
        ["@babel/plugin-proposal-decorators", { "legacy": true }],
        ['react-native-reanimated/plugin']
      ]
    };
  };