import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "../src"),
        },
      },
      define: {
        __APP_VERSION__: JSON.stringify("0.1.0"),
        __APP_BUILD_SHA__: JSON.stringify("storybook"),
        __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      },
    });
  },
};

export default config;
