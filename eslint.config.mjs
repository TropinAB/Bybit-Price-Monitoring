import js from "@eslint/js";
import globals from "globals";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import jest from "eslint-plugin-jest";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  {
    ignores: ["docs/**", "**/.DS_Store", "node_modules/**", "coverage/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        PREFIX: "readonly",
      },
    },
    rules: {
      semi: ["error", "always"], // отсутствие ';'
      "no-var": "error", // Запрещает использование var, требует использования const или let
      //indent: ['error', 2], // Контролирует отступы. По умолчанию использует 2 пробела.
      "no-multi-spaces": "error", // Запрещает множественные пробелы, кроме случаев выравнивания
      "space-in-parens": ["error", "never"], // Контролирует пробелы внутри скобок.
      "no-multiple-empty-lines": ["error", { max: 2 }], // Ограничивает количество пустых строк подряд.
      "prefer-const": "error", // Требует использования const для переменных, которые не переопределяются.
      "no-use-before-define": "error", // Запрещает использование переменных до их объявления.
    },
  },
  {
    files: ["src/**/*.test.js"],
    ...jest.configs["flat/recommended"],
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
  eslintConfigPrettier,
]);
