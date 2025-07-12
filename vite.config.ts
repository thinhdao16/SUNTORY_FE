import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
// import legacy from "@vitejs/plugin-legacy";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import path from "path";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      svgr(),
      // legacy(),
      tailwindcss(),
      AutoImport({
        imports: [
          {
            "@/lib/globalT": ["t"],
            "react-router-dom": ["Route", "Redirect", "RouteProps"],
            "react": ["useState", "useEffect", "useContext", "useRef", "useMemo", "useCallback", "React"],
          },
          "react", // Tự động import toàn bộ React
        ],
        dts: "./auto-imports.d.ts", // Tạo file auto-imports.d.ts
        eslintrc: {
          enabled: true, // Tự động cấu hình ESLint
          filepath: "./.eslintrc-auto-import.json", // File ESLint config
          globalsPropValue: true,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env": env,
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
    },
    extends: ["./.eslintrc-auto-import.json"]
  };
});
