import React from "react";

export default function StyleTest() {
  return (
    <div className="p-8 flex flex-col gap-4">
      <div className="card">
        这是一个 card 卡片，应该有白色背景、圆角、阴影
      </div>
      <button className="btn-primary">
        btn-primary 按钮
      </button>
      <button className="btn-primary-lg">
        btn-primary-lg 按钮
      </button>
      <div className="feedback-form">
        <h4>反馈表单标题</h4>
        <input placeholder="输入框" />
        <textarea placeholder="文本区域" rows={2}></textarea>
      </div>
      <div className="progress-bar"></div>
    </div>
  );
}
