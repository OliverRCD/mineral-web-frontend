import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import ResultCard from "../components/ResultCard";
import FeedbackForm from "../components/FeedbackForm";
import {backurl} from "../api/api";

export default function Home() {
  const [result, setResult] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // const backurl="http://localhost:5050"
  // const backurl="http://172.27.32.129:5050"
  console.log("✅ backurl =", backurl);
  const back=backurl
  console.log("✅ back =", back);
  const handleLogin = () => {
    if (password === "miner2025") {
      setError("");
      setShowAdminLogin(false);
      navigate("/admin");
    } else {
      setError("口令错误，请重试。");
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-6 bg-gradient-to-b from-indigo-50 to-white">
      <header className="w-full max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-sky-700">基于机器学习的矿物识别</h1>
          <button
            onClick={() => setShowAdminLogin(true)}
            className="btn-primary"
          >
            管理员入口
          </button>
        </div>
        <p className="text-gray-600 mt-2">上传矿物图片以获得 Top3 预测。</p>
      </header>

      <div className="w-full max-w-6xl">
        <UploadZone onResult={setResult} />
      </div>

      {result?.results?.length > 0 && (
        <div className="w-full max-w-6xl mt-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            {/* 图片区域 - 固定高度 */}
            <div className="card flex-1 p-0 overflow-hidden result-image-container">
              <div className="image-fill">
                <img
                  src={`${back}${(result.image_url || "").replace(/\\/g, "/")}`}
                  alt="上传矿物"
                />
              </div>
            </div>
            
            {/* 结果区域 - 固定高度 */}
            <div className="card flex-1 overflow-hidden result-card-container">
              <ResultCard result={result.results} />
            </div>
          </div>

          <div className="w-full">
            <FeedbackForm
              image_path={result.image_url}
              predicted_label={result.results[0]?.label_zh}
            />
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="admin-login-modal">
          <div className="admin-login-box">
            <h2 className="text-lg font-semibold text-center">管理员登录</h2>
            <input
              type="password"
              placeholder="请输入口令"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="btn-group">
              <button
                onClick={() => setShowAdminLogin(false)}
                className="action-btn"
              >
                取消
              </button>
              <button
                onClick={handleLogin}
                className="btn-primary"
              >
                登录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}