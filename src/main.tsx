import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";

// 统计配置
const UMAMI_WEBSITE_ID = "6270ec71-6401-47c5-9309-8b70fb0e35c0";

// 仅在生产环境下初始化所有统计服务
if (import.meta.env.PROD) {
  // 初始化 Umami
  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://cloud.umami.is/script.js";
  script.setAttribute("data-website-id", UMAMI_WEBSITE_ID);
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </StrictMode>
);
