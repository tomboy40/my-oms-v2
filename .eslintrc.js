/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    '@remix-run/eslint-config',
    '@remix-run/eslint-config/node',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        tabWidth: 2,
        semi: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': ['warn'],
    'no-console': 'warn',
    'react/prop-types': 'off',
  },
  ignorePatterns: ['node_modules', 'build', 'public/build'],
}; 