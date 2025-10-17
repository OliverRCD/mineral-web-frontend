import React, { useState } from "react";
import { submitFeedback } from "../api/api";

export default function FeedbackForm({ image_path = "", predicted_label = "" }) {
  const [trueLabel, setTrueLabel] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const payload = {
        image_path,
        predicted_label,
        true_label: trueLabel,
        comment,
      };
      await submitFeedback(payload);
      setStatus("success");
      setTrueLabel("");
      setComment("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="feedback-form">
      <h4>提交反馈（若预测错误，请填写真实标签）</h4>

      <input
        type="text"
        placeholder="正确矿物名称"
        value={trueLabel}
        onChange={(e) => setTrueLabel(e.target.value)}
        required
      />

      <textarea
        placeholder="备注（可选）"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
      />

      <div className="flex items-center gap-4 mt-2">
        <button type="submit" className="btn-primary-lg">
          提交反馈
        </button>

        {status === "loading" && <span className="text-sm text-gray-500">提交中...</span>}
        {status === "success" && <span className="submitted-msg">提交成功，感谢！</span>}
        {status === "error" && <span className="text-red-500">提交失败</span>}
      </div>
    </form>
  );
}
