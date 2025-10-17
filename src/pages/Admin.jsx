import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Overview from "../components/Overview";
import Review from "../components/Review";
import UserRequestsHistory from "../components/UserRequestsHistory";
import { getAdminStats, getAllFeedbacks, getAllRequests } from "../api/api";

export default function Admin() {
  const [view, setView] = useState("overview");
  const [stats, setStats] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await getAdminStats();
      setStats(res);
    } catch (err) {
      console.error("fetchStats error:", err);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const res = await getAllFeedbacks();
      setFeedbacks(res);
    } catch (err) {
      console.error("fetchFeedbacks error:", err);
      setFeedbacks([]);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await getAllRequests();
      setRequests(res);
    } catch (err) {
      console.error("fetchRequests error:", err);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFeedbacks();
    fetchRequests();
  }, []);

  const handleAfterReview = async () => {
    await fetchStats();
    await fetchFeedbacks();
    await fetchRequests();
  };

  const handleRefresh = () => {
    fetchStats();
    fetchFeedbacks();
    fetchRequests();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar
        setView={setView}
        stats={stats}
        currentView={view}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏：缩窄高度 */}
        <div className="flex-none h-16 bg-white shadow flex items-center px-6">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">管理员控制台</h1>
            <p className="text-sm text-gray-500">
              {view === "overview" && "系统数据概览与统计"}
              {view === "review" && "用户反馈审核与管理"}
              {view === "requests" && "用户请求历史记录"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-gray-700 transition-colors"
            >
              刷新数据
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors"
            >
              返回主页
            </button>
          </div>
        </div>

        {/* 内容区域：撑满剩余高度 */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="w-full h-full max-w-7xl mx-auto flex flex-col">
            {view === "overview" && (
              <Overview statsFromParent={stats} loading={loadingStats} />
            )}
            {view === "review" && (
              <Review
                feedbacksFromParent={feedbacks}
                loading={loadingFeedbacks}
                onAfterReview={handleAfterReview}
              />
            )}
            {view === "requests" && (
              <UserRequestsHistory
                initialFeedbacks={requests}
                loading={loadingRequests}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}