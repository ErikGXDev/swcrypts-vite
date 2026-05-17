# swcrypts-vite

A Vite plugin to encrypt static sites, based on [swcrypts](https://github.com/lafkpages/swcrypts)

## How it works

`@swcrypts/vite` hooks into Vite's build process to encrypt your bundled assets (HTML, JS, CSS, images, etc.) before they are saved to your output folder.

A password prompt will be added to your html files as well, to decrypt the assets when the correct password is entered.

HTTPS is required, so encryption and decryption works safely.

## Installation

The plugin is available on npm.

Install it with `npm install @swcrypts/vite`, or any other package manager of your choice.

## Usage

Add the plugin to your vite config:

```js
import { defineConfig } from "vite";

import swcrypts from "@swcrypts/vite";

export default defineConfig({
  plugins: [
    swcrypts({ password: process.env.PASSWORD, salt: process.env.SALT }),
  ],
});
```

**You should add the plugin so it's last, to prevent other plugins from interfering with the encryption process.**

## Configuration

`password: string` - Password that must be entered into the password prompt.

`salt?: string` - OPTIONAL, salt used in the encryption process, leave empty to use a random salt.

**You should use environment variables like in the example above, so your password is not visible in your source code.**

## Security

Check the Security section of [swcrypts](https://github.com/lafkpages/swcrypts).
