import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

export default defineConfig({
  base: "/",

  plugins: [
    // 🔥 FORCE CLASSIC JSX RUNTIME (CRITICAL FIX)
    react({
      jsxRuntime: "classic",
    }),

    viteStaticCopy({
      targets: [
        {
          src: "public/_redirects",
          dest: ".",
        },
      ],
    }),
  ],

  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@redux": path.resolve(__dirname, "./src/redux"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
    },
  },

  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },

  build: {
    target: "es2015",
    minify: "terser",
    sourcemap: false,

    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // ✅ KEEP ALL REACT-DEPENDENT CODE TOGETHER
          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("react-leaflet") ||
            id.includes("leaflet") ||
            id.includes("@react-google-maps")
          ) {
            return "react-ecosystem";
          }

          if (id.includes("@reduxjs") || id.includes("react-redux")) {
            return "redux";
          }

          if (id.includes("@tiptap")) {
            return "tiptap";
          }

          if (id.includes("jspdf")) return "pdf";
          if (id.includes("xlsx")) return "excel";

          if (id.includes("recharts")) return "charts";
          if (id.includes("gsap")) return "animations";

          return "vendor";
        },
      },
    },

    chunkSizeWarningLimit: 800,
  },

  optimizeDeps: {
    include: [
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-image",
      "@tiptap/extension-link",
      "@tiptap/extension-text-align",
      "@tiptap/extension-underline",
    ],
  },
});
