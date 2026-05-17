# swcrypts-vite

Encrypt static sites with a vite plugin.

Based on the [swcrypts cli](https://github.com/lafkpages/swcrypts)

## How it works

swcrypts-vite will encrypt your vite builds and add a password prompt.

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
