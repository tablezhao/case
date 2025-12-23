import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { Analytics } from "@vercel/analytics/react";
import Clarity from "@microsoft/clarity";

// Microsoft Clarity 初始化
const CLARITY_PROJECT_ID = "upzsct9g1b";
if (import.meta.env.PROD) {
  Clarity.init(CLARITY_PROJECT_ID);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <App />
      <Analytics />
    </AppWrapper>
  </StrictMode>
);
