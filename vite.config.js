import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/_redirects', // source file
          dest: '.'                 // copy to root of /dist
        }
      ]
    })
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      // Required for Google OAuth to work properly
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },
  build: {
    // Production build optimizations
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Node modules
          if (id.includes('node_modules')) {
            // Heavy libraries - separate chunks (check these first)
            if (id.includes('@tiptap')) {
              return 'tiptap-vendor';
            }
            if (id.includes('html2canvas')) {
              return 'html2canvas-vendor';
            }
            if (id.includes('recharts')) {
              return 'recharts-vendor';
            }
            // Split PDF libraries separately
            if (id.includes('jspdf')) {
              return 'jspdf-vendor';
            }
            if (id.includes('xlsx')) {
              return 'xlsx-vendor';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'map-vendor';
            }
            if (id.includes('@react-google-maps')) {
              return 'google-maps-vendor';
            }
            if (id.includes('socket.io-client')) {
              return 'socket-vendor';
            }
            if (id.includes('gsap')) {
              return 'gsap-vendor';
            }
            // React core - keep together for better caching
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/') || id === 'react') {
              return 'react-vendor';
            }
            // Redux - keep together
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'redux-vendor';
            }
            // UI libraries - group together
            if (id.includes('react-icons') || id.includes('react-hot-toast') || id.includes('styled-components')) {
              return 'ui-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // OAuth
            if (id.includes('@react-oauth')) {
              return 'oauth-vendor';
            }
            // Utility libraries - group small ones together
            if (id.includes('axios') || id.includes('query-string') || id.includes('js-cookie') || id.includes('react-is')) {
              return 'utils-vendor';
            }
            // Split remaining vendor into smaller chunks by package name
            // This prevents one huge vendor chunk
            const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
            if (match) {
              const packageName = match[1];
              // Use first letter to create multiple smaller chunks
              const firstChar = packageName.charAt(0).toLowerCase();
              // Group packages by first letter (a-f, g-m, n-s, t-z)
              if (firstChar >= 'a' && firstChar <= 'f') {
                return 'vendor-a-f';
              } else if (firstChar >= 'g' && firstChar <= 'm') {
                return 'vendor-g-m';
              } else if (firstChar >= 'n' && firstChar <= 's') {
                return 'vendor-n-s';
              } else {
                return 'vendor-t-z';
              }
            }
            return 'vendor-other';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800, // Warn if chunk exceeds 800KB (reasonable limit)
    sourcemap: false, // Disable source maps in production for smaller builds
  },
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-image',
      '@tiptap/extension-link',
      '@tiptap/extension-text-align',
      '@tiptap/extension-underline'
    ],
    exclude: [
      '@sentry/react' // Exclude Sentry - it's optional and loaded dynamically
    ]
  },
  resolve: {
    alias: {
      // Make Sentry import optional - only resolve if package exists
    }
  }
});
