import type { Plugin, ResolvedConfig } from "vite";
import { encrypt, hashPassword, serviceWorkerFileName } from "@swcrypts/core";
import { generateRandomSalt, isValidSalt } from "@swcrypts/core/salt";
import { getServiceWorkerJs, getWrapperHtml } from "@swcrypts/core/wrapper";
import { filterIgnoredFiles, fileIsEntryPoint } from "@swcrypts/core/files";
import { readdirSync, statSync, readFileSync } from "fs";
import path from "path";

interface SWPluginOptions {
  password: string;
  salt?: string;
}

export async function swcrypts(config: SWPluginOptions): Promise<Plugin> {
  // Polyfill toBase64 for Bun/older Node
  if (typeof (Uint8Array.prototype as any).toBase64 !== "function") {
    (Uint8Array.prototype as any).toBase64 = function () {
      return Buffer.from(this).toString("base64");
    };
  }

  if (!config.password) {
    throw new Error("A password is required for encryption.");
  }

  if (!config.salt) {
    config.salt = generateRandomSalt();
  }

  if (!isValidSalt(config.salt)) {
    throw new Error(
      "Salt must be 32 hex characters (16 bytes in hex). Leave empty to generate a random salt.",
    );
  }

  const passwordHash = await hashPassword(config.password, config.salt);

  let resolvedViteConfig: ResolvedConfig;

  return {
    name: "swcrypts",

    enforce: "post",

    config() {
      return {
        build: {
          copyPublicDir: false,
        },
      };
    },

    configResolved(viteConfig) {
      resolvedViteConfig = viteConfig;
    },

    async generateBundle(_options, bundle) {
      const assets: string[] = [];

      const filteredBundle = filterIgnoredFiles(Object.keys(bundle));

      // Encrypt each file in the bundle
      for (const fileName of filteredBundle) {
        if (fileName === serviceWorkerFileName) {
          continue;
        }

        const chunk = bundle[fileName];

        if (!chunk) continue;

        let source: Uint8Array;

        if (chunk.type === "asset") {
          source =
            typeof chunk.source === "string"
              ? new TextEncoder().encode(chunk.source)
              : new Uint8Array(chunk.source);
        } else {
          source = new TextEncoder().encode(chunk.code);
        }

        const encryptedData = await encrypt(
          source as Uint8Array<ArrayBuffer>,
          passwordHash,
        );

        const isEntryPoint = fileIsEntryPoint(fileName);

        if (isEntryPoint) {
          const encryptedHtml = getWrapperHtml(encryptedData, config.salt!);
          if (chunk.type === "asset") {
            chunk.source = encryptedHtml;
          } else {
            chunk.code = encryptedHtml;
          }
        } else {
          assets.push("/" + fileName);
          this.emitFile({
            type: "asset",
            fileName: fileName + ".enc",
            source: encryptedData,
          });
          delete bundle[fileName];
        }
      }

      // Copy public assets that weren't included in the bundle
      const publicDir = resolvedViteConfig.publicDir;
      if (publicDir) {
        const files = readdirSync(publicDir, {
          recursive: true,
          encoding: "utf-8",
        }) as string[];

        const filteredFiles = filterIgnoredFiles(files);

        for (const file of filteredFiles) {
          const absolutePath = path.join(publicDir, file);
          const stat = statSync(absolutePath);

          if (stat.isDirectory()) {
            continue;
          }

          const relativePath = file.replace(/\\/g, "/");
          const source = readFileSync(absolutePath);

          const encryptedData = await encrypt(
            new Uint8Array(source) as Uint8Array<ArrayBuffer>,
            passwordHash,
          );

          assets.push("/" + relativePath);
          this.emitFile({
            type: "asset",
            fileName: relativePath + ".enc",
            source: encryptedData,
          });
        }
      }

      // Add service worker with list of encrypted assets
      const serviceWorkerCode = getServiceWorkerJs(assets);
      this.emitFile({
        type: "asset",
        fileName: serviceWorkerFileName,
        source: serviceWorkerCode,
      });
    },
  };
}
