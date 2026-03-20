import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Permissions-Policy': 'camera=*, microphone=*, geolocation=*, storage-access=*, local-fonts=*, serial=*, hid=*, bluetooth=*, usb=*, display-capture=*, clipboard-read=*, clipboard-write=*, fullscreen=*, autoplay=*, payment=*, picture-in-picture=*, accelerometer=*, gyroscope=*, magnetometer=*, midi=*',
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
