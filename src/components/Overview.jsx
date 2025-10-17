// src/components/Overview.jsx
import React, { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { getAdminStats } from "../api/api";

// 预定义一组颜色
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', 
  '#00c49f', '#ffbb28', '#ff6b6b', '#4ecdc4', '#45b7d1',
  '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
];

export default function Overview({ statsFromParent = null, loading = false, onRefresh = null }) {
  const [stats, setStats] = useState({
    class_distribution: [],
    model_distribution: [],
    accuracy: 0,
    total_requests: 0,
    current_model: 'best_fixed.pth',
    current_model_usage: 0,
    current_model_requests: 0
  });
  const [chartView, setChartView] = useState("bar"); // "bar" 或 "pie"
  const [localLoading, setLocalLoading] = useState(false);
  const isParentProvided = !!statsFromParent;

  useEffect(() => {
    if (isParentProvided) {
      const sd = Array.isArray(statsFromParent.class_distribution) ? statsFromParent.class_distribution : [];
      const md = Array.isArray(statsFromParent.model_distribution) ? statsFromParent.model_distribution : [];
      const raw = statsFromParent.accuracy;
      let acc = 0;
      if (raw === undefined || raw === null) acc = 0;
      else if (typeof raw === "string") { 
        const p = parseFloat(raw); 
        acc = Number.isNaN(p) ? 0 : p * 100; 
      }
      else if (typeof raw === "number") acc = raw <= 1 ? raw * 100 : raw;
      
      setStats({ 
        class_distribution: sd, 
        model_distribution: md,
        accuracy: acc, 
        total_requests: statsFromParent.total_requests || 0,
        current_model: statsFromParent.current_model || 'best_fixed.pth',
        current_model_usage: statsFromParent.current_model_usage || 0,
        current_model_requests: statsFromParent.current_model_requests || 0
      });
      return;
    }

    // 否则自己获取数据
    setLocalLoading(true);
    getAdminStats()
      .then((res) => {
        const sd = Array.isArray(res.class_distribution) ? res.class_distribution : [];
        const md = Array.isArray(res.model_distribution) ? res.model_distribution : [];
        const raw = res.accuracy;
        let acc = 0;
        if (raw === undefined || raw === null) acc = 0;
        else if (typeof raw === "string") { 
          const p = parseFloat(raw); 
          acc = Number.isNaN(p) ? 0 : p * 100; 
        }
        else if (typeof raw === "number") acc = raw <= 1 ? raw * 100 : raw;
        
        setStats({ 
          class_distribution: sd, 
          model_distribution: md,
          accuracy: acc, 
          total_requests: res.total_requests || 0,
          current_model: res.current_model || 'best_fixed.pth',
          current_model_usage: res.current_model_usage || 0,
          current_model_requests: res.current_model_requests || 0
        });
      })
      .catch((e) => {
        console.error("Overview getAdminStats error:", e);
        setStats({ 
          class_distribution: [], 
          model_distribution: [],
          accuracy: 0, 
          total_requests: 0,
          current_model: 'best_fixed.pth',
          current_model_usage: 0,
          current_model_requests: 0
        });
      })
      .finally(() => setLocalLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsFromParent]);

  const busy = loading || localLoading;

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{`${label}`}</p>
          <p className="text-blue-600">{`数量: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // 模型使用数据格式化
  const getModelUsageData = () => {
    if (!stats.model_distribution || stats.model_distribution.length === 0) {
      return [{ name: stats.current_model, value: 100 }];
    }
    
    const total = stats.model_distribution.reduce((sum, item) => sum + item.count, 0);
    return stats.model_distribution.map(item => ({
      name: item.model,
      value: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));
  };

  const modelUsageData = getModelUsageData();

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 rounded-xl shadow-inner p-4">
      {/* 固定头部 */}
      <div className="flex-none mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-800">数据概览</h2>
          {onRefresh && (
            <button 
              onClick={onRefresh} 
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              刷新数据
            </button>
          )}
        </div>
      </div>

      {/* 可滚动的内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {busy ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">预测准确率</h3>
                <div className="flex items-end space-x-4">
                  <div className="text-3xl font-bold text-blue-600">{stats.accuracy.toFixed(2)}%</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-3 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500" 
                        style={{ width: `${Math.max(0, Math.min(100, stats.accuracy))}%` }} 
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">基于当前模型: {stats.current_model_requests} 次预测</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">总请求数</h3>
                <div className="text-3xl font-bold text-green-600">{stats.total_requests}</div>
                <p className="text-sm text-gray-500 mt-2">累计处理的预测请求</p>
              </div>

              {/* 当前模型卡片 */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">当前模型</h3>
                <div className="text-2xl font-bold text-purple-600 truncate" title={stats.current_model}>
                  {stats.current_model}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>模型使用率</span>
                    <span>{stats.current_model_usage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500" 
                      style={{ width: `${stats.current_model_usage}%` }} 
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">配置文件选用</p>
              </div>
            </div>

        {/* 纵向图表布局 */}
        <div className="space-y-6 mb-8">
          {/* 矿物类别分布 */}
          <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">矿物类别分布</h3>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartView("bar")}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    chartView === "bar" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  柱状图
                </button>
                <button
                  onClick={() => setChartView("pie")}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    chartView === "pie" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  饼状图
                </button>
              </div>
            </div>
            
            {stats.class_distribution.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === "bar" ? (
                    <BarChart
                      data={stats.class_distribution}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="label" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="count" 
                        name="数量"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      >
                        {stats.class_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={stats.class_distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ index, name, percent }) => 
                          index < 3 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="label"
                      >
                        {stats.class_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} 条`, name]}
                        labelFormatter={(label) => `类别: ${label}`}
                      />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">暂无类别分布数据</p>
                <p className="text-sm mt-2">用户提交反馈后，数据将显示在这里</p>
              </div>
            )}
          </section>

          {/* 模型选用分布 */}
          <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">模型选用分布</h3>
            </div>
            
            {modelUsageData.length > 0 ? (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ index, name, percent }) => 
                        index < 3 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {modelUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, name]}
                      labelFormatter={(label) => `模型: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modelUsageData.map((model, index) => (
                    <div key={model.name} className={`flex items-center justify-between p-3 rounded-lg ${
                      model.name === stats.current_model ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className={`text-sm font-medium ${
                          model.name === stats.current_model ? 'text-purple-700' : 'text-gray-700'
                        }`}>
                          {model.name}
                          {model.name === stats.current_model && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              当前使用
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{model.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <p className="text-lg">暂无模型数据</p>
                <p className="text-sm mt-2">模型使用数据将显示在这里</p>
              </div>
            )}
          </section>
        </div>
          </>
        )}
      </div>
    </div>
  );
}