import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

export default [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      "react/jsx-key": "warn",
    },
  },
];
