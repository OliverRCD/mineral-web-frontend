import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import ResultCard from "../components/ResultCard";
import FeedbackForm from "../components/FeedbackForm";
import MineralReport from "../components/MineralReport";
import {backurl} from "../api/api";

export default function Home() {
  const [result, setResult] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [cachedReports, setCachedReports] = useState({}); // 缓存报告
  const navigate = useNavigate();
  // const backurl="http://localhost:5050"
  // const backurl="http://172.27.32.129:5050"
  console.log("✅ backurl =", backurl);
  const back=backurl
  console.log("✅ back =", back);
  
  const handleLogin = () => {
    if (password === "miner2025") {
      setError("");
      setShowAdminLogin(false);
      navigate("/admin");
    } else {
      setError("口令错误，请重试。");
    }
  };

  const handleGenerateReport = async () => {
    if (!result?.results?.length) return;
    
    const mineralName = result.results[0]?.label_zh;
    const confidence = (result.results[0]?.confidence * 100).toFixed(2);
    const top3Predictions = result.results.map((r, i) => `${i + 1}. ${r.label_zh}: ${(r.confidence * 100).toFixed(2)}%`).join('\n');
    const cacheKey = mineralName;
    
    // 检查是否已有缓存报告
    if (cachedReports[cacheKey]) {
      console.log("✅ 使用缓存报告:", cacheKey);
      setReportData(cachedReports[cacheKey]);
      setShowReport(true);
      return;
    }
    
    // 检查是否配置了 API Key
    const apiKey = localStorage.getItem('llm_api_key');
    const provider = localStorage.getItem('llm_provider');
    const apiEndpoint = localStorage.getItem('llm_api_endpoint');
    const modelName = localStorage.getItem('llm_model_name');
    
    if (!apiKey) {
      alert("请先在管理员配置中设置 API Key");
      navigate('/admin');
      return;
    }
    
    if (!provider) {
      alert("请先选择 LLM 服务提供商");
      navigate('/admin');
      return;
    }
    
    // 在生成报告前，先检查账户余额状态
    setGeneratingReport(true);
    try {
      // 构建测试请求检查账户状态
      const testModel = modelName || 'gpt-3.5-turbo';
      let url = apiEndpoint;
      let headers = {};
      let body = {};

      switch (provider) {
        case 'openai':
        case 'deepseek':
        case 'kimi':
        case 'doubao':
        case 'tiangong':
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: 'Hi' }
            ],
            max_tokens: 5
          };
          break;

        case 'gemini':
          url = url.replace('{model}', testModel);
          headers = {
            'Content-Type': 'application/json'
          };
          body = {
            contents: [{
              parts: [{ text: 'Hi' }]
            }],
            generationConfig: {
              maxOutputTokens: 5
            }
          };
          break;

        case 'alibaba':
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-DashScope-WorkSpace': 'api'
          };
          body = {
            model: testModel,
            input: {
              messages: [
                { role: 'user', content: 'Hi' }
              ]
            },
            parameters: {
              max_tokens: 5
            }
          };
          break;

        case 'minimax':
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: 'Hi' }
            ],
            max_tokens: 5
          };
          break;

        case 'zhipu':
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: '你好' }
            ],
            max_tokens: 5
          };
          break;

        case 'xinghuo':
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: '你好' }
            ],
            max_tokens: 5
          };
          break;

        case 'azure':
          headers = {
            'Content-Type': 'application/json',
            'api-key': apiKey
          };
          body = {
            messages: [
              { role: 'user', content: 'Hi' }
            ],
            max_tokens: 5
          };
          break;

        case 'custom':
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: 'Hi' }
            ],
            max_tokens: 5
          };
          break;

        default:
          throw new Error('不支持的 LLM 提供商');
      }

      // 发送测试请求检查账户状态
      console.log('🔍 正在检查账户状态...');
      const testResponse = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!testResponse.ok) {
        const errorData = await testResponse.json().catch(() => ({}));
        let errorMsg = errorData.error?.message || errorData.message || `HTTP ${testResponse.status}: ${testResponse.statusText}`;
        
        // 检测是否是余额不足的错误
        if (errorMsg.toLowerCase().includes('balance') || 
            errorMsg.toLowerCase().includes('insufficient') ||
            errorMsg.toLowerCase().includes('quota') ||
            errorData.error?.code === 'insufficient_quota') {
          setGeneratingReport(false);
          alert(`⚠️ 账户余额不足，无法生成报告！\n\n错误信息：${errorMsg}\n\n请及时充值或切换至其他 LLM 提供商。`);
          return;
        }
        
        // 其他错误也提示
        setGeneratingReport(false);
        alert(`⚠️ API 验证失败，无法生成报告！\n\n错误信息：${errorMsg}\n\n请前往管理员页面检查 API Key 配置。`);
        return;
      }

      console.log('✅ 账户状态正常，开始生成报告...');
      
      // 账户状态正常，继续生成报告
      // 构建提示词
      const prompt = `你是一位专业的矿物学家和地质学家。请根据以下矿物识别结果，生成一份专业的矿物鉴定报告。

【预测结果】
矿物名称：${mineralName}
置信度：${confidence}%

【Top3 预测】
${top3Predictions}

请生成一份详细的矿物鉴定报告，包含以下内容（**必须返回纯 JSON 格式，不要任何其他文字、代码标记或代码块**）：

{
  "title": "岩石鉴定报告标题",
  "mineral_name": "矿物名称",
  "classification": "分类信息（如：火成岩/沉积岩/变质岩，具体类别）",
  "description": "成因描述（200-300 字）",
  "geological_background": "地质背景说明",
  "alternatives": [
    {"name": "替代方案 1", "description": "区别说明"},
    {"name": "替代方案 2", "description": "区别说明"}
  ],
  "technical_parameters": [
    {"name": "颗粒", "value": "描述", "icon": "🔬"},
    {"name": "构造", "value": "描述", "icon": "⬡"},
    {"name": "硬度", "value": "描述", "icon": "🔨"},
    {"name": "风化", "value": "描述", "icon": "🌀"},
    {"name": "变质", "value": "描述", "icon": "🔥"},
    {"name": "成色", "value": "描述", "icon": "⭐"},
    {"name": "蚀变", "value": "描述", "icon": "↗️"}
  ],
  "mineral_composition": ["矿物成分 1", "矿物成分 2", "矿物成分 3"],
  "economic_geology": [
    {"title": "围岩蚀变", "content": "内容"},
    {"title": "指示矿物", "content": "内容"},
    {"title": "构造控矿", "content": "内容"},
    {"title": "找矿潜力评价", "content": "内容"}
  ],
  "expert_assessment": "专家评估意见（300-500 字详细描述）"
}

**重要要求：**
1. **只返回纯 JSON，不要任何其他文字和代码标记**
2. 所有内容必须专业、准确
3. 使用中文回答
4. 如果某些信息不确定，可以合理推断`;

      // 根据不同提供商构建请求
      let reportUrl = apiEndpoint;
      let reportHeaders = {};
      let reportBody = {};
      const testModelForReport = modelName || 'gpt-3.5-turbo';

      switch (provider) {
        case 'openai':
        case 'deepseek':
        case 'kimi':
        case 'doubao':
        case 'tiangong':
          reportHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          reportBody = {
            model: testModelForReport,
            messages: [
              { role: 'user', content: prompt }
            ],
            max_tokens: 4000,
            temperature: provider === 'kimi' ? 1 : 0.7
          };
          break;

        case 'gemini':
          reportUrl = reportUrl.replace('{model}', testModelForReport);
          reportHeaders = {
            'Content-Type': 'application/json'
          };
          reportBody = {
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              maxOutputTokens: 2000,
              temperature: 1
            }
          };
          break;

        case 'alibaba':
          reportHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-DashScope-WorkSpace': 'api'
          };
          reportBody = {
            model: testModelForReport,
            input: {
              messages: [
                { role: 'user', content: prompt }
              ]
            },
            parameters: {
              max_tokens: 2000,
              temperature: 1
            }
          };
          break;

        case 'minimax':
          reportHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          reportBody = {
            model: testModelForReport,
            messages: [
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 1
          };
          break;

        case 'zhipu':
          reportHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          reportBody = {
            model: testModelForReport,
            messages: [
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 1
          };
          break;

        case 'xinghuo':
          reportHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          reportBody = {
            model: testModelForReport,
            messages: [
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 1
          };
          break;

        case 'azure':
          reportHeaders = {
            'Content-Type': 'application/json',
            'api-key': apiKey
          };
          reportBody = {
            messages: [
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 1
          };
          break;

        case 'custom':
          reportHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          };
          reportBody = {
            model: testModelForReport,
            messages: [
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 1
          };
          break;

        default:
          throw new Error('不支持的 LLM 提供商');
      }

      // 发送请求到 LLM 提供商
      const response = await fetch(reportUrl, {
        method: 'POST',
        headers: reportHeaders,
        body: JSON.stringify(reportBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('🔍 LLM 原始响应数据:', data);
      
      // 解析响应内容
      let reportContent;
      
      // 根据不同提供商提取响应内容
      if (provider === 'gemini') {
        reportContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('📝 Gemini 响应内容:', reportContent);
      } else if (provider === 'alibaba') {
        reportContent = data.output?.text;
        console.log('📝 Alibaba 响应内容:', reportContent);
      } else {
        reportContent = data.choices?.[0]?.message?.content;
        console.log('📝 其他提供商响应内容:', reportContent);
      }

      if (!reportContent) {
        console.error('❌ 无法从响应中提取内容，完整数据结构:', JSON.stringify(data, null, 2));
        throw new Error(`未能解析 LLM 响应内容 - 提供商：${provider}, 响应结构：${JSON.stringify(Object.keys(data))}`);
      }

      console.log('🔍 Kimi 原始响应内容:', reportContent);
      console.log('🔍 响应内容类型:', typeof reportContent);
      
      // 尝试解析 JSON
      try {
        // 多层次清理内容
        let cleanedContent = reportContent
          .replace(/```json\s*/g, '')      // 移除 ```json 标记
          .replace(/```\s*/g, '')           // 移除 ``` 标记
          .replace(/^\s*[\r\n]/gm, '')      // 移除开头空行
          .replace(/\s*$/g, '')             // 移除末尾空白
          .trim();
        
        console.log('🧹 清理后的内容长度:', cleanedContent.length);
        console.log('🧹 清理后的内容前 200 字符:', cleanedContent.substring(0, 200));
        
        // 尝试提取 JSON 部分（如果有大括号包裹）
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        let jsonContent = jsonMatch ? jsonMatch[0] : cleanedContent;
        
        // 检查是否是完整的 JSON（以{开始，}结束）
        if (!jsonContent.endsWith('}')) {
          console.warn('⚠️ JSON 内容不完整，可能被截断');
          // 尝试找到最后一个完整的对象闭合
          const lastBraceIndex = jsonContent.lastIndexOf('}');
          if (lastBraceIndex !== -1) {
            jsonContent = jsonContent.substring(0, lastBraceIndex + 1);
            console.log('🔧 已截断到最后一个完整的闭合括号');
          }
        }
        
        console.log('📦 提取的 JSON 内容长度:', jsonContent.length);
        console.log('📦 JSON 内容最后 100 字符:', jsonContent.substring(jsonContent.length - 100));
        
        // 尝试解析 JSON
        let report;
        try {
          report = JSON.parse(jsonContent);
        } catch (firstParseErr) {
          console.warn('⚠️ 第一次解析失败，尝试清理转义字符:', firstParseErr.message);
          // 如果包含转义的引号，尝试清理
          const unescapedContent = jsonContent
            .replace(/\\"/g, '"')           // 处理转义的双引号
            .replace(/\\n/g, '\n')          // 处理转义的换行
            .replace(/\\t/g, '\t')          // 处理转义的制表符
            .replace(/\\\\/g, '\\');        // 处理转义的反斜杠
          
          console.log('🔧 清理转义字符后的内容:', unescapedContent.substring(0, 200));
          report = JSON.parse(unescapedContent);
        }
        
        // 验证必要字段
        if (!report.title && !report.mineral_name) {
          throw new Error('JSON 缺少必要字段');
        }
        
        console.log('✅ JSON 解析成功:', report.title);
        
        // 缓存报告
        setCachedReports(prev => ({
          ...prev,
          [cacheKey]: report
        }));
        
        setReportData(report);
        setShowReport(true);
      } catch (parseErr) {
        console.error('❌ JSON 解析失败详情:', parseErr);
        console.log('原始响应内容长度:', reportContent.length);
        console.log('原始响应内容前 500 字符:', reportContent.substring(0, 500));
        console.log('原始响应内容后 500 字符:', reportContent.substring(reportContent.length - 500));
        
        // 如果解析失败，尝试使用默认结构
        const report = {
          title: `${mineralName}鉴定报告`,
          mineral_name: mineralName,
          classification: '请根据专业知识补充',
          description: `AI 生成的内容（JSON 解析失败）：\n\n${reportContent}`,
          expert_assessment: reportContent,
          parse_error: parseErr.message
        };
        
        console.log('⚠️ 使用降级方案展示报告');
        
        // 缓存报告
        setCachedReports(prev => ({
          ...prev,
          [cacheKey]: report
        }));
        
        setReportData(report);
        setShowReport(true);
      }
    } catch (err) {
      console.error("生成报告失败:", err);
      alert(`报告生成失败：${err.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center gap-6 bg-gradient-to-b from-indigo-50 to-white">
      <header className="w-full max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-sky-700">基于机器学习的矿物识别</h1>
          <button
            onClick={() => setShowAdminLogin(true)}
            className="btn-primary"
          >
            管理员入口
          </button>
        </div>
        <p className="text-gray-600 mt-2">上传矿物图片以获得 Top3 预测。</p>
      </header>

      <div className="w-full max-w-6xl">
        <UploadZone onResult={setResult} />
      </div>

      {result?.results?.length > 0 && (
        <div className="w-full max-w-6xl mt-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            {/* 图片区域 - 固定高度 */}
            <div className="card flex-1 p-0 overflow-hidden result-image-container">
              <div className="image-fill">
                <img
                  src={`${back}${(result.image_url || "").replace(/\\/g, "/")}`}
                  alt="上传矿物"
                />
              </div>
            </div>
            
            {/* 结果区域 - 固定高度 */}
            <div className="card flex-1 overflow-hidden result-card-container">
              <ResultCard result={result.results} />
            </div>
          </div>

          <div className="w-full flex justify-center gap-4">
            <button
              onClick={handleGenerateReport}
              disabled={generatingReport}
              className="btn-primary-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingReport ? (
                <>
                  <span className="loading-spinner w-5 h-5 border-2 border-white border-t-transparent"></span>
                  <span>正在生成报告...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>生成矿物鉴定报告</span>
                </>
              )}
            </button>
          </div>

          <div className="w-full">
            <FeedbackForm
              image_path={result.image_url}
              predicted_label={result.results[0]?.label_zh}
            />
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="admin-login-modal">
          <div className="admin-login-box">
            <h2 className="text-lg font-semibold text-center">管理员登录</h2>
            <input
              type="password"
              placeholder="请输入口令"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="btn-group">
              <button
                onClick={() => setShowAdminLogin(false)}
                className="action-btn"
              >
                取消
              </button>
              <button
                onClick={handleLogin}
                className="btn-primary"
              >
                登录
              </button>
            </div>
          </div>
        </div>
      )}

      {showReport && reportData && (
        <MineralReport
          report={reportData}
          image_url={`${back}${(result.image_url || "").replace(/\\/g, "/")}`}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}