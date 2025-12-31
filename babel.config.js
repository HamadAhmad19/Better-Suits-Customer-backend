module.exports = function (api) {
  api.cache(false); // Disable cache to ensure .env changes are picked up immediately
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
        },
      ],
    ],
  };
};
