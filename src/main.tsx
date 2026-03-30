import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/auth-context";
import { ErrorBoundary } from "./components/error-boundary";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider attribute="class" defaultTheme="system" storageKey="ims-theme" enableSystem>
          <AuthProvider>
            <App />
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "font-sans text-sm",
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
