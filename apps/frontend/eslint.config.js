export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { document: 'readonly', window: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
];
