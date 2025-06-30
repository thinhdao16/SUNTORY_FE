export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontWeight: {
        normal: 400,
        medium: 500,
      },
      fontFamily: {
        sans: ["Noto Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
