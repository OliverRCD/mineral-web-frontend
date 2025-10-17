import React, { useState, useEffect } from "react";
import { getAllRequests ,backurl} from "../api/api";

export default function UserRequestsHistory({ initialFeedbacks = [], loading }) {
  const [requests, setRequests] = useState(initialFeedbacks);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState(null);
  // const backurl="http://localhost:5050/uploads/"
  // const backurl="http://172.27.32.129:5050/uploads/"
  const back=`${backurl}/uploads/`

  useEffect(() => {
    console.log("🧭 initialFeedbacks 更新：", initialFeedbacks);
  }, [initialFeedbacks]);

  useEffect(() => {
    console.log("📦 requests 状态变化：", requests);
  }, [requests]);

 useEffect(() => {
  // 仅在数组内容真正不同的时候才更新
  const idsCurrent = requests.map(r => r.id).join(',');
  const idsInitial = initialFeedbacks.map(r => r.id).join(',');
  if (idsCurrent !== idsInitial) {
    setRequests(initialFeedbacks);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [initialFeedbacks]);


  // 筛选逻辑
  useEffect(() => {
    let result = requests;

    if (searchTerm) {
      result = result.filter(req =>
        (req.predicted_label || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.actual_mineral || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.comments || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.model_used || "").toLowerCase().includes(searchTerm.toLowerCase()) // 添加模型名称搜索
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(req => {
        if (statusFilter === "predicted") return req.review_status === "predicted";
        if (statusFilter === "pending") return req.review_status === "pending";
        if (statusFilter === "verified") return req.review_status === "verified";
        if (statusFilter === "rejected") return req.review_status === "rejected";
        return true;
      });
    }

    setFilteredRequests(result);
    setCurrentPage(1);
  }, [requests, searchTerm, statusFilter]);

  // 分页计算
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // 获取状态的中文显示
  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "待审核";
      case "verified": return "已验证";
      case "rejected": return "已拒绝";
      case "predicted": return "已预测";
      default: return status;
    }
  };

  // 获取状态的颜色类
  const getStatusClass = (status) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "predicted": return "bg-blue-100 text-blue-700";
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
      {/* 图片放大模态框 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeImageModal}
        >
          <div className="max-w-4xl max-h-full p-4">
            <img 
              src={selectedImage} 
              alt="放大查看" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
              onClick={closeImageModal}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 顶部标题与筛选栏 */}
      <div className="flex-none mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold text-gray-800">
            用户请求历史
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredRequests.length} 条记录)
            </span>
          </h2>
          <button
            onClick={resetFilters}
            className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-gray-700 transition-colors"
          >
            重置筛选
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
          <input
            type="text"
            placeholder="搜索矿物名称、备注、模型..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">全部状态</option>
            <option value="predicted">已预测</option>
            <option value="pending">待审核</option>
            <option value="verified">已验证</option>
            <option value="rejected">已拒绝</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value={5}>5条/页</option>
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
          </select>
        </div>
      </div>

      {/* 中间表格区域，可滚动 */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full min-w-[900px]"> {/* 增加最小宽度以适应新增列 */}
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">图片</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">预测矿物</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">模型版本</th> {/* 新增列 */}
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">用户反馈</th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">状态</th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-600">提交时间</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((request) => {
                  const imageFileName = request.image_path?.split('/').pop() || request.image_path;
                  const imageUrl = back+imageFileName;
                  return (
                    <tr key={request.id} className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="py-3 px-4">
                        <img
                          src={imageUrl}
                          alt="矿物图像"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handleImageClick(imageUrl)}
                          onError={(e) => {
                            if (!e.target.dataset.errorHandled) {
                              e.target.src = "http://localhost:5050/uploads/placeholder.png";
                              e.target.dataset.errorHandled = true;
                            }
                          }}
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {request.predicted_label || "未知"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {request.model_used || 'unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <div>实际矿物：{request.actual_mineral || "未提供"}</div>
                        <div>备注：{request.comments || "无"}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-3 py-1 text-sm rounded-full ${getStatusClass(request.review_status)}`}
                        >
                          {getStatusText(request.review_status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-500">
                        {request.timestamp ? new Date(request.timestamp).toLocaleString('zh-CN') : '未知'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500"> {/* 更新colSpan为6 */}
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 底部分页栏固定 */}
        <div className="border-t border-gray-200 bg-white p-3 flex-none">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              显示第 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRequests.length)} 条，
              共 {filteredRequests.length} 条记录
            </div>
            
            {totalPages > 1 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === i + 1
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition-colors`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}