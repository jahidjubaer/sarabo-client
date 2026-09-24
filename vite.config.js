import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { validateProductionApiBaseUrl } from './src/config/validateApiBaseUrl.js'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // `vite build`'s default mode is 'production'; this only runs for an
  // actual production build, never for `vite`/`vite preview`. Validating
  // here (not just in src/config/api.js) is what makes a misconfigured
  // build actually fail at build time - application source is bundled by
  // `vite build`, never executed by it, so a check living only inside
  // application code would never stop the build itself, only crash the
  // deployed bundle later when a browser loads it.
  if (command === 'build' && mode === 'production') {
    const env = loadEnv(mode, process.cwd(), '');
    validateProductionApiBaseUrl(env.VITE_API_BASE_URL);
  }

  return {
    plugins: [tailwindcss(), react()],
    build: {
      rollupOptions: {
        output: {
          // Long-lived libraries in their own chunks, so a deploy that only
          // changes app code leaves them cached in returning visitors'
          // browsers. Everything else is split per route (routes/Router.jsx).
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            // Vite normalises module ids to forward slashes on every OS.
            if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'vendor-react';
            if (/node_modules\/(@firebase|firebase)\//.test(id)) return 'vendor-firebase';
            if (/node_modules\/(motion|motion-dom|motion-utils|framer-motion)\//.test(id)) return 'vendor-motion';
            return undefined;
          },
        },
      },
    },
  };
})
