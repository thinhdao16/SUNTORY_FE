export default {
  locales: ["en", "vi", "zh"],
  output: "public/locales/$LOCALE/$NAMESPACE.json",
  defaultNamespace: "home",
  createOldCatalogs: false,
  lexers: {
    js: ["JavascriptLexer"],
    ts: ["JavascriptLexer"],
    jsx: ["JsxLexer"],
    tsx: ["JsxLexer"],
  },
  keySeparator: false,
  namespaceSeparator: false,
};
