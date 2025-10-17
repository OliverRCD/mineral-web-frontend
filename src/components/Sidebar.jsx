import React from "react";

export default function Sidebar({ setView, stats, currentView, collapsed, setCollapsed }) {
  const totalRequests = stats?.total_requests ?? "-";
  const rawAcc = stats?.accuracy ?? 0;
  let accuracyPct = 0;
  if (typeof rawAcc === "string") {
    const p = parseFloat(rawAcc);
    accuracyPct = Number.isNaN(p) ? 0 : p * 100;
  } else if (typeof rawAcc === "number") {
    accuracyPct = rawAcc <= 1 ? rawAcc * 100 : rawAcc;
  }

  const navItems = [
    { id: "overview", label: "数据概览", icon: "📊" },
    { id: "review", label: "反馈审核", icon: "✏️" },
    { id: "requests", label: "请求历史", icon: "📋" }
  ];

  return (
    <aside className={`admin-sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* 侧边栏头部 - 收起时只显示菜单按钮 */}
      <div className="sidebar-header">
        {!collapsed ? (
          <>
            <h2 className="sidebar-title">管理员面板</h2>
            <p className="sidebar-subtitle">审核与模型监控</p>
          </>
        ) : null}
        
        {/* 菜单切换按钮 - 始终显示 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle-btn"
          title={collapsed ? "展开菜单" : "收起菜单"}
        >
          {collapsed ? '☰' : '✕'}
        </button>
      </div>

      {/* 导航菜单 - 收起时隐藏 */}
      {!collapsed && (
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setView(item.id)}
              className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </div>
          ))}
        </nav>
      )}

      {/* 统计信息 - 收起时隐藏 */}
      {!collapsed && (
        <div className="sidebar-stats">
          <div className="stat-item">
            <div className="stat-label">总请求数</div>
            <div className="stat-value">{totalRequests}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">模型准确率</div>
            <div className="stat-value">{accuracyPct.toFixed(2)}%</div>
          </div>
        </div>
      )}
    </aside>
  );
}