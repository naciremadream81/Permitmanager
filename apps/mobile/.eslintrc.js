module.exports = {
  root: true,
  extends: ["@permitpro/config/eslint.base"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    "react-native/no-inline-styles": "warn",
  },
};
