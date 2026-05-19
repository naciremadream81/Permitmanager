module.exports = {
  root: true,
  extends: [
    "@permitpro/config/eslint.base",
    "next/core-web-vitals",
  ],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
};
