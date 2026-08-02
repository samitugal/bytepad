import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // @rollup/plugin-commonjs (used internally by Vite to interop CJS
          // deps) injects a single shared virtual runtime helper module that
          // both vendor-react and vendor modules import (react's CJS builds
          // and most of the vendor packages are CJS). It isn't under
          // node_modules, so it otherwise falls through this function
          // unassigned and gets inlined into whichever manual chunk builds
          // it first — in practice `vendor`, since it's the larger chunk.
          // That makes vendor-react import from vendor for this helper, on
          // top of vendor importing vendor-react for React itself, which is
          // a circular-chunk edge on its own. Giving the helper its own
          // dependency-free chunk breaks that edge without duplicating it.
          if (id.includes('commonjsHelpers')) return 'vendor-commonjs-helpers'

          if (!id.includes('node_modules')) return

          // Match on a package-boundary path segment, not a bare substring —
          // `id.includes('react')` also matches react-markdown, react-refresh,
          // react-syntax-highlighter, eslint-plugin-react-hooks,
          // eslint-plugin-react-refresh, etc. Normalize separators first so
          // this also works with Windows `\` paths.
          const normalized = id.replace(/\\/g, '/')
          const isPackage = (name: string) => normalized.includes(`/node_modules/${name}/`)

          if (isPackage('react') || isPackage('react-dom') || isPackage('scheduler')) {
            return 'vendor-react'
          }
          if (isPackage('zustand')) {
            return 'vendor-zustand'
          }
          // firebase ships its implementation under scoped @firebase/* packages
          // in addition to the `firebase` umbrella package.
          if (isPackage('firebase') || normalized.includes('/node_modules/@firebase/')) {
            return 'vendor-firebase'
          }
          // react-markdown / react-syntax-highlighter (and their own transitive
          // deps: unified, remark, refractor, ...) fall through to here. They
          // must NOT go in vendor-react: that would put their own module code
          // in the same chunk as React while their dependencies stay in
          // `vendor`, recreating a vendor-react -> vendor edge (this was the
          // original bug: a bare `id.includes('react')` swept react-markdown
          // and react-syntax-highlighter's own files into vendor-react while
          // their deps fell through to vendor). Keeping them in `vendor`
          // alongside their dependencies keeps the chunk graph a DAG
          // (vendor -> vendor-react, never the reverse).
          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
