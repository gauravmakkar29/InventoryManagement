import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ProviderRegistry } from "./lib/providers/registry";
import { createPlatformConfig } from "./lib/providers/platform.config";
import { ErrorBoundary } from "./components/error-boundary";
import App from "./App";
import "./lib/i18n";
import "./lib/logger"; // Story 22.5: Initialize structured logger + globalThis.structuredLog
import "./index.css";

const platform = createPlatformConfig();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="system" storageKey="ims-theme" enableSystem>
          <ProviderRegistry
            api={platform.api}
            storage={platform.storage}
            AuthProvider={platform.AuthProvider}
          >
            <App />
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "font-sans text-sm",
                closeButtonAriaLabel: "Dismiss notification",
              }}
              richColors
              closeButton
              containerAriaLabel="Notifications"
            />
          </ProviderRegistry>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
