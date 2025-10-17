import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";       // 基础样式
import "./styles/components.css";  // 组件样式

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
