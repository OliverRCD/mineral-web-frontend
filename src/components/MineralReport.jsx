import React, { useRef } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function MineralReport({ report, image_url, onClose }) {
  const reportRef = useRef(null);

  const handleExportPDF = async () => {
    try {
      // 动态导入 html2canvas 和 jsPDF
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = reportRef.current;
      
      console.log('开始导出 PDF，元素高度:', element?.scrollHeight);
      console.log('元素宽度:', element?.scrollWidth);
      
      // 使用 html2canvas 将整个报告区域渲染为高清图片
      const canvas = await html2canvas(element, {
        scale: 2, // 2 倍分辨率
        useCORS: true,
        logging: false,
        windowWidth: 800,
        windowHeight: element.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        removeContainer: true,
        letterRendering: true,
        allowTaint: false
      });
      
      console.log('Canvas 生成成功，尺寸:', canvas.width, 'x', canvas.height);
      
      // 将 canvas 转为图片
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // 创建 PDF - 自定义尺寸为图片的实际尺寸（不分页）
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height], // 使用图片实际尺寸
        compress: true,
        hotfixes: ['px_scaling']
      });
      
      // 直接添加完整图片到 PDF（不裁剪、不分页）
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
      
      // 保存 PDF
      const filename = `矿物鉴定报告 - 完整版-${report.title || new Date().toLocaleDateString('zh-CN')}.pdf`;
      pdf.save(filename);
      
      console.log('✅ PDF 导出成功（完整版，不分页）:', filename);
      console.log('📄 PDF 尺寸:', canvas.width, 'x', canvas.height, 'px');
      
    } catch (err) {
      console.error("❌ 导出 PDF 失败:", err);
      alert("导出 PDF 失败，请重试");
    }
  };

  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto backdrop-blur-sm">
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 relative">
          {/* 顶部操作栏 */}
          <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-white border-b border-gray-200 rounded-t-2xl">
            <h2 className="text-xl font-bold text-gray-800">矿物鉴定报告</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>导出 PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 报告内容区域 */}
          <div ref={reportRef} className="p-8" style={{ maxHeight: 'none', overflow: 'visible' }}>
            <div className="report-content" style={{ breakInside: 'avoid' }}>
              {/* 报告头部 */}
              <div className="report-header text-center mb-8 pb-6 border-b-2 border-gray-800">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span className="text-2xl font-bold text-gray-800">STONE MASTER AI</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-1">{report.title || "岩石鉴定报告"}</h1>
                <p className="text-sm text-gray-500 uppercase tracking-widest">Geological Identification Certificate</p>
              </div>

              {/* 样品图片 */}
              {image_url && (
                <div className="report-image mb-6">
                  <img
                    src={image_url}
                    alt="矿物样品"
                    className="w-full h-80 object-cover rounded-lg shadow-lg"
                  />
                  <div className="text-center mt-2">
                    <span className="inline-block bg-gray-800 text-white text-xs px-3 py-1 rounded">
                      ORIGINAL SAMPLE
                    </span>
                  </div>
                </div>
              )}

              {/* 鉴定结果 */}
              <div className="report-section mb-6">
                <h3 className="text-sm text-gray-500 mb-2">鉴定结果</h3>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {report.title || report.mineral_name || "未知矿物"}
                </h2>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">分类</h4>
                  <p className="text-gray-800">{report.classification || report.category || "未分类"}</p>
                </div>

                {report.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">成因</h4>
                    <p className="text-gray-800 leading-relaxed">{report.description}</p>
                  </div>
                )}
              </div>

              {/* 地质背景 */}
              {report.geological_background && (
                <div className="report-section mb-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-yellow-600 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">地质背景</h4>
                      <p className="text-yellow-900 italic leading-relaxed">{report.geological_background}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 替代方案 */}
              {report.alternatives && (
                <div className="report-section mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-gray-600 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">替代方案</h4>
                      {report.alternatives.map((alt, idx) => (
                        <div key={idx} className="mb-3">
                          <h5 className="font-bold text-gray-900">{alt.name}</h5>
                          <p className="text-gray-700 text-sm">{alt.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 技术参数 */}
              {report.technical_parameters && (
                <div className="report-section mb-6">
                  <h4 className="text-sm text-gray-500 text-center mb-4">技术参数</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {report.technical_parameters.map((param, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        {param.icon === "🔬" && (
                          <svg className="w-6 h-6 text-gray-600 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        )}
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-1">{param.name}</h5>
                          <p className="text-gray-700 text-sm">{param.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 矿物成分 */}
              {report.mineral_composition && (
                <div className="report-section mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">矿物成分</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {report.mineral_composition.map((mineral, idx) => (
                      <div key={idx} className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700">
                        {mineral}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 经济地质与找矿潜力 */}
              {report.economic_geology && (
                <div className="report-section mb-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    经济地质与找矿潜力
                  </h4>
                  <div className="space-y-3">
                    {report.economic_geology.map((item, idx) => (
                      <div key={idx}>
                        <h5 className="font-semibold text-green-900 text-sm mb-1">{item.title}</h5>
                        <p className="text-green-900 text-sm leading-relaxed">{item.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 专家评估 */}
              {report.expert_assessment && (
                <div className="report-section mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">专家评估</h4>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">{report.expert_assessment}</p>
                </div>
              )}

              {/* 报告尾部 */}
              <div className="report-footer mt-8 pt-6 border-t border-gray-300">
                <div className="text-center text-xs text-gray-500">
                  <p>AI GEOLOGICAL ANALYSIS • RESEARCH ONLY</p>
                  <p>报告生成日期：{new Date().toLocaleDateString('zh-CN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
