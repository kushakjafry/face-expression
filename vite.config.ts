import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "public",
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "./node_modules/@0xalter/alter-core/avatar",
          dest: ".",
        },
        {
          src: "./node_modules/@0xalter/alter-core/facemoji",
          dest: ".",
        },
        {
          src: "./node_modules/@0xalter/alter-core/models",
          dest: ".",
        },
        {
          src: "./node_modules/@0xalter/alter-core/*.json",
          dest: ".",
        },
        {
          src: "./src/*.json",
          dest: ".",
        },
      ],
    }),
  ],
});
