// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/ADMIN/Documents/Hong_Thai/translate/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ADMIN/Documents/Hong_Thai/translate/node_modules/@vitejs/plugin-react/dist/index.mjs";
import legacy from "file:///C:/Users/ADMIN/Documents/Hong_Thai/translate/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
import tailwindcss from "file:///C:/Users/ADMIN/Documents/Hong_Thai/translate/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), legacy(), tailwindcss()],
    define: {
      "process.env": env
      // Load các biến môi trường
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBRE1JTlxcXFxEb2N1bWVudHNcXFxcSG9uZ19UaGFpXFxcXHRyYW5zbGF0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQURNSU5cXFxcRG9jdW1lbnRzXFxcXEhvbmdfVGhhaVxcXFx0cmFuc2xhdGVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0FETUlOL0RvY3VtZW50cy9Ib25nX1RoYWkvdHJhbnNsYXRlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgbGVnYWN5IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1sZWdhY3lcIjtcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwbHVnaW5zOiBbcmVhY3QoKSwgbGVnYWN5KCksIHRhaWx3aW5kY3NzKCldLFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgIFwicHJvY2Vzcy5lbnZcIjogZW52LCAvLyBMb2FkIGNcdTAwRTFjIGJpXHUxRUJGbiBtXHUwMEY0aSB0clx1MDFCMFx1MUVERG5nXHJcbiAgICB9LFxyXG4gICAgdGVzdDoge1xyXG4gICAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxyXG4gICAgICBzZXR1cEZpbGVzOiBcIi4vc3JjL3NldHVwVGVzdHMudHNcIixcclxuICAgIH0sXHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1UsU0FBUyxjQUFjLGVBQWU7QUFDeFcsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sWUFBWTtBQUNuQixPQUFPLGlCQUFpQjtBQUV4QixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFFM0MsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLE1BQU0sR0FBRyxPQUFPLEdBQUcsWUFBWSxDQUFDO0FBQUEsSUFDMUMsUUFBUTtBQUFBLE1BQ04sZUFBZTtBQUFBO0FBQUEsSUFDakI7QUFBQSxJQUNBLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxNQUNULGFBQWE7QUFBQSxNQUNiLFlBQVk7QUFBQSxJQUNkO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
