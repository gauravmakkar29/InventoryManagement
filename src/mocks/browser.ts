/**
 * MSW browser worker for Storybook and local development.
 *
 * To use in Storybook, import and start in .storybook/preview.ts:
 *   import { worker } from "../src/mocks/browser";
 *   worker.start({ onUnhandledRequest: "bypass" });
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
