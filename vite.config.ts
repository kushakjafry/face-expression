import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import * as fs from "fs";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: "public",
  build: {
    rollupOptions: {
      plugins: [mediapipe_workaround()],
    },
  },
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
        {
          src: "./node_modules/three/examples/js/libs/basis",
          dest: "js/libs",
        },
      ],
    }),
  ],
  optimizeDeps: {
    include: [
      "./node_modules/@mediapipe/holistic/holistic",
      "./node_modules/@mediapipe/camera_utils/camera_utils",
      "./node_modules/@mediapipe/drawing_utils/drawing_utils",
    ],
  },
});

function mediapipe_workaround() {
  return {
    name: "mediapipe_workaround",
    load(id) {
      if (path.basename(id) === "holistic.js") {
        let code = fs.readFileSync(id, "utf-8");
        code += "exports.Holistic = Holistic;";
        return { code };
      } else if (path.basename(id) === "camera_utils.js") {
        let code = fs.readFileSync(id, "utf-8");
        code += "exports.Camera = Camera;";
        return { code };
      } else {
        return null;
      }
    },
  };
}
