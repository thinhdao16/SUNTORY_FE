import globals from "globals";
import tseslint from "typescript-eslint";
import noJsxLiteralText from "./eslint-rules/no-jsx-literal-text.js";

export default [
  { ignores: ["node_modules/**", "dist/**", "build/**", "public/**"] },
  {
    files: ["src/**/*.{tsx,jsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    plugins: { local: { rules: { "no-jsx-literal-text": noJsxLiteralText } } },
    rules: {
      "i18next/no-literal-string": "off",     // tắt rule gây nhiễu
      "local/no-jsx-literal-text": "error",   // dùng rule custom
    },
  },
];
