import React, { useState, useEffect, useMemo } from "react";
import { reviewFeedback } from "../api/api";
import { backurl } from "../api/api";

export default function Review({ feedbacksFromParent = [], loading, onAfterReview }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedImage, setSelectedImage] = useState(null);

  const back = backurl;

  // 只在组件挂载或 feedbacksFromParent 改变时更新 feedbacks
 // 原来的 useEffect 改成：
  useEffect(() => {
    // 避免重复更新导致无限循环
    if (JSON.stringify(feedbacks.map(fb => fb.id)) !== JSON.stringify(feedbacksFromParent.map(fb => fb.id))) {
      setFeedbacks(feedbacksFromParent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbacksFromParent]);


  // 过滤与分页使用 useMemo，避免无效渲染
  const filteredFeedbacks = useMemo(() => {
    let result = feedbacks;

    if (searchTerm) {
      result = result.filter(fb =>
        (fb.predicted_label_text || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fb.true_label_text || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fb.user_comment || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(fb => fb.status === statusFilter);
    }

    return result;
  }, [feedbacks, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredFeedbacks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFeedbacks.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

 const handleApprove = async (id) => {
  try {
    await reviewFeedback(id, "approve", "审核通过");

    // 本地状态立即更新
    setFeedbacks(prev =>
      prev.map(fb => fb.id === id ? { ...fb, status: "verified" } : fb)
    );

    // 如果父组件需要刷新也可以调用
    if (onAfterReview) onAfterReview();
  } catch {
    alert("审核操作失败，请重试");
  }
};

const handleReject = async (id) => {
  try {
    await reviewFeedback(id, "reject", "审核不通过");

    // 本地状态立即更新
    setFeedbacks(prev =>
      prev.map(fb => fb.id === id ? { ...fb, status: "rejected" } : fb)
    );

    if (onAfterReview) onAfterReview();
  } catch {
    alert("审核操作失败，请重试");
  }
};


  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("pending");
    setCurrentPage(1);
  };

  const handleImageClick = (imageUrl) => setSelectedImage(imageUrl);
  const closeImageModal = () => setSelectedImage(null);

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "待审核";
      case "verified": return "已验证";
      case "rejected": return "已拒绝";
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 rounded-xl shadow-inner p-4">
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="max-w-4xl max-h-full p-4">
            <img src={selectedImage} alt="放大查看" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
            <button className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center" onClick={closeImageModal}>×</button>
          </div>
        </div>
      )}

      {/* 筛选栏 */}
      <div className="flex-none mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold text-gray-800">
            反馈审核
            <span className="ml-2 text-sm font-normal text-gray-500">({filteredFeedbacks.length} 条记录)</span>
          </h2>
          <button onClick={resetFilters} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-gray-700 transition-colors">重置筛选</button>
        </div>

        <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <input type="text" placeholder="搜索矿物名称、备注..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                 className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-[200px]" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="pending">待审核</option>
            <option value="verified">已验证</option>
            <option value="rejected">已拒绝</option>
            <option value="all">全部</option>
          </select>
          <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value={5}>5条/页</option>
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
          </select>
        </div>
      </div>

      {/* 表格 */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">图片</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">预测矿物</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">用户反馈</th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">状态</th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map(fb => {
                const imageUrl = `${back}${fb.image_path?.replace(/\\/g, "/") || "/uploads/placeholder.png"}`;
                return (
                  <tr key={fb.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="py-3 px-4">
                      <img src={imageUrl} alt="矿物图像" className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                           onClick={() => handleImageClick(imageUrl)}
                           onError={(e) => { if (!e.target.dataset.errorHandled) { e.target.src = "http://localhost:5050/uploads/placeholder.png"; e.target.dataset.errorHandled = true; } }} />
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{fb.predicted_label_text || "未知"}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div>实际矿物：{fb.true_label_text || "未提供"}</div>
                      <div>备注：{fb.user_comment || "无"}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusClass(fb.status)}`}>{getStatusText(fb.status)}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {fb.status === "pending" ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleApprove(fb.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors">通过</button>
                          <button onClick={() => handleReject(fb.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors">拒绝</button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">已处理</span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5" className="py-8 text-center text-gray-500">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="border-t border-gray-200 bg-white p-3 flex-none">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              显示第 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredFeedbacks.length)} 条，共 {filteredFeedbacks.length} 条记录
            </div>
            {totalPages > 1 && (
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">上一页</button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => handlePageChange(i + 1)}
                          className={`px-3 py-1 rounded-lg ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"} transition-colors`}>{i + 1}</button>
                ))}
                <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">下一页</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
