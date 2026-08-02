import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // 'dist' is the renderer's `vite build` output; 'out' and 'dist-electron'
  // are electron-vite's build output and electron-builder's packaged app
  // output respectively. All three are generated/minified bundles - linting
  // them produces bogus "Definition for rule 'x' was not found" noise (the
  // bundlers strip the disable-comment context ESLint needs) rather than
  // real findings, and only ever appear locally after running a build.
  { ignores: ['dist', 'out', 'dist-electron'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // electron/** is Electron's main/preload process plus the embedded MCP
    // server - it runs under Node, not a browser, so it gets Node's globals
    // (process, __dirname, Buffer, require, ...) instead of window/document/
    // fetch's WebSocket etc. This also fixes the @types/ws vs DOM WebSocket
    // ambient-global mismatch: with browser globals in scope, a bare
    // `WebSocket` type reference resolved to DOM's WebSocket instead of the
    // 'ws' package's, even though the runtime object always comes from 'ws'.
    files: ['electron/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
)
