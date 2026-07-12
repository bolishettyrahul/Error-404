import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  // Mesh SDK (Cardano wallet/tx tooling) relies on Node builtins (crypto, buffer, stream)
  // that don't exist in the browser — polyfill them for the bundle.
  plugins: [react(), nodePolyfills()],
  server: {
    port: 5173
  }
})
