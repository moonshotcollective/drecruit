module.exports = {
  env: {
    mocha: true,
    browser: false,
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: ['standard'],
  plugins: ['babel'],
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never'
      }
    ],
    'import/prefer-default-export': 'off',
    'prefer-destructuring': 'off',
    'prefer-template': 'off',
    'no-console': 'off',
    'func-names': 'off'
  }
}
