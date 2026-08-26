import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-native": path.resolve(__dirname, "./tests/mocks/react-native.ts"),
      "expo-notifications": path.resolve(__dirname, "./tests/mocks/expo-notifications.ts"),
      "expo-secure-store": path.resolve(__dirname, "./tests/mocks/expo-secure-store.ts"),
    },
  },
});
