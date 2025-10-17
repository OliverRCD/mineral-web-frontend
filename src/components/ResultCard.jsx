import React from "react";

export default function ResultCard({ result = [] }) {
  const colorClasses = ["bar-1", "bar-2", "bar-3"];

  return (
    <div className="flex flex-col h-full">
      <h2 className="result-title">预测结果</h2>

      <div className="flex-1 flex flex-col justify-between result-items-container">
        {result.map((r, idx) => {
          const pct = Number(r.confidence) || 0;
          const cls = colorClasses[idx] || "bar-3";
          return (
            <div key={idx} className="progress-item">
              <div className="flex justify-between items-center mb-3">
                <div className="text-gray-800 font-semibold text-base">
                  {r.label_zh} <span className="text-sm text-gray-500">({r.label_en})</span>
                </div>
                <div className="text-gray-700 font-bold text-lg">{pct.toFixed(2)}%</div>
              </div>

              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`progress-bar ${cls}`}
                  style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}