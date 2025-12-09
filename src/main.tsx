import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { SiteTitleProvider } from "./components/common/SiteTitleProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <SiteTitleProvider>
        <App />
      </SiteTitleProvider>
    </AppWrapper>
  </StrictMode>
);
