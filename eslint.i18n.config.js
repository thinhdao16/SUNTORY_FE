import i18next from "eslint-plugin-i18next";

// Focused ESLint config: only checks i18next/no-literal-string for JSX/TSX
// Usage:
//   npx eslint -c eslint.i18n.config.js "src/**/*.{ts,tsx,jsx,js}" --max-warnings=0

export default [
  { ignores: ["dist", "cypress.config.ts"] },
  {
    files: ["**/*.{tsx,jsx}"],
    plugins: {
      i18next,
    },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          markupOnly: true,
          ignoreAttribute: [
            "className",
            "data-testid",
            "id",
            "to",
            "href",
            "src",
            "alt",
          ],
          validateTemplate: true,
          mode: "jsx-only",
        },
      ],
    },
  },
];
