import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Vendored / generated trees that are not application source.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "forensic-audit/**",
    "public/wasm/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
