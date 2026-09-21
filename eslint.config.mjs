import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Artwork URLs are admin-configurable and thumbnails are generated on upload,
  // so raw img elements intentionally avoid a hard-coded remote image allowlist.
  { rules: { "@next/next/no-img-element": "off" } },
  globalIgnores([".next/**", "data/**", ".codex_tmp_read_xlsx/**"]),
]);
