import React, { useRef, useState, useCallback } from "react";
import { predict } from "../api/api";

/**
 * UploadZone - 整个区域可点击 + 支持拖拽上传
 * props:
 *   onResult(data) - 上传并返回后端数据（data）
 */
export default function UploadZone({ onResult }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [hint, setHint] = useState("点击任意区域或拖拽图片上传（JPG/PNG）");

  const handleFile = useCallback(async (file) => {
  if (!file) return;
  setLoading(true);
  setHint("识别中，请稍候...");
  try {
    const data = await predict(file); // 假设 predict 返回 response.data
    console.log('predict res:', data);

    // 规范化 image_url
    let imageUrl = data?.image_url || '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const u = new URL(imageUrl);
        // 如果后端返回绝对 URL，我们优先使用相对路径（让 CRA proxy 接管）
        // 例如 http://localhost:5000/uploads/xxx.jpg -> /uploads/xxx.jpg
        imageUrl = u.pathname + u.search + u.hash;
      } catch (e) {
        // 如果解析失败，保留原值
      }
    }

    // 如果你确定要直接指向后端（不走 proxy），可以转换成 127.0.0.1:5050：
    // const absToBackend = `http://127.0.0.1:5050${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;

    // 构造新的 data 给上层
    const normalized = { ...data, image_url: imageUrl };

    onResult(normalized);
    setHint("上传成功！下方显示识别结果。");
  } catch (err) {
    console.error(err);
    setHint("上传或识别失败，请检查后端并重试。");
    alert("上传或识别失败，请检查后端是否运行并允许 CORS。");
  } finally {
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
    setDragOver(false);
  }
}, [onResult]);


  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    handleFile(f);
  };

  const handleClick = () => {
    if (loading) return;
    if (inputRef.current) inputRef.current.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div
      className={`upload-zone upload-shimmer ${dragOver ? "drag-over" : ""}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { handleClick(); } }}
      aria-label="上传矿物图片，点击或拖拽上传"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex-1 text-left">
          <div className="text-lg font-medium text-sky-700">上传矿物图片</div>
          <div className="text-sm text-gray-600 mt-1">{hint}</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (inputRef.current) inputRef.current.click(); }}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "识别中..." : "选择文件"}
          </button>
        </div>
      </div>
    </div>
  );
}
