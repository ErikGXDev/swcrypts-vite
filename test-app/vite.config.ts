import { defineConfig } from "vite";

import swcrypts from "../src";

export default defineConfig({
  plugins: [swcrypts({ password: "1234" })],
});
