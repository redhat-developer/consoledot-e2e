
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:playwright/playwright-test'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    "playwright/no-skipped-test": "off",
    "playwright/no-conditional-in-test": "off"
  },
  root: true,
};
