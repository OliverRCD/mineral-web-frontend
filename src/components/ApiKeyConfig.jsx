import React, { useState, useEffect, useCallback } from "react";
import { verifyApiKey } from "../api/api";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

// LLM 提供商配置
const LLM_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI (GPT-4/GPT-3.5)',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    modelPlaceholder: 'gpt-4, gpt-3.5-turbo',
    verifyModel: 'gpt-3.5-turbo'
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    apiEndpoint: 'https://{resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version=2023-03-15-preview',
    modelPlaceholder: '部署名称',
    verifyModel: 'deployment-id'
  },
  {
    id: 'gemini',
    name: 'Google Gemini (Pro/Ultra)',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
    modelPlaceholder: 'gemini-pro, gemini-ultra',
    verifyModel: 'gemini-pro'
  },
  {
    id: 'deepseek',
    name: '深度求索 (DeepSeek)',
    apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    modelPlaceholder: 'deepseek-chat, deepseek-coder',
    verifyModel: 'deepseek-chat'
  },
  {
    id: 'alibaba',
    name: '阿里云通义千问 (Qwen)',
    apiEndpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    modelPlaceholder: 'qwen-max, qwen-plus, qwen-turbo',
    verifyModel: 'qwen-turbo'
  },
  {
    id: 'minimax',
    name: 'MiniMax (ABAB 系列)',
    apiEndpoint: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    modelPlaceholder: 'abab6.5, abab6.5s, abab5.5',
    verifyModel: 'abab6.5s'
  },
  {
    id: 'kimi',
    name: '月之暗面 Kimi',
    apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
    modelPlaceholder: 'moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k',
    verifyModel: 'moonshot-v1-8k'
  },
  {
    id: 'zhipu',
    name: '智谱 AI (GLM-4/GLM-3)',
    apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    modelPlaceholder: 'glm-4, glm-3-turbo',
    verifyModel: 'glm-3-turbo'
  },
  {
    id: 'xinghuo',
    name: '讯飞星火',
    apiEndpoint: 'https://spark-api-open.xf-yun.com/v1/chat/completions',
    modelPlaceholder: 'Spark4.0 Ultra, Spark Max 等',
    verifyModel: 'Spark Max'
  },
  {
    id: 'wenxin',
    name: '百度文心一言',
    apiEndpoint: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
    modelPlaceholder: 'ERNIE-Bot-4, ERNIE-Bot 等',
    verifyModel: 'ernie-bot-4'
  },
  {
    id: 'doubao',
    name: '字节豆包',
    apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    modelPlaceholder: 'Doubao-pro-4k, Doubao-pro-32k',
    verifyModel: 'Doubao-pro-4k'
  },
  {
    id: 'tiangong',
    name: '昆仑天工',
    apiEndpoint: 'https://api.tiangong.cn/api/v1/chat/completions',
    modelPlaceholder: 'Skywork-MoE, Skywork',
    verifyModel: 'Skywork'
  },
  {
    id: 'custom',
    name: '自定义 API',
    apiEndpoint: '请输入自定义端点',
    modelPlaceholder: '自定义模型名',
    verifyModel: ''
  }
];

export default function ApiKeyConfig() {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKeyState] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [modelName, setModelName] = useState("");
  const [status, setStatus] = useState("unknown"); // unknown, valid, invalid
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [balanceInfo, setBalanceInfo] = useState(null); // 余额信息
  const [checkingBalance, setCheckingBalance] = useState(false); // 正在检查余额

  // 从 localStorage 加载配置
  const fetchConfig = useCallback(() => {
    const savedProvider = localStorage.getItem('llm_provider') || 'openai';
    const savedKey = localStorage.getItem('llm_api_key');
    const savedEndpoint = localStorage.getItem('llm_api_endpoint');
    const savedModel = localStorage.getItem('llm_model_name');
    
    setProvider(savedProvider);
    
    if (savedKey) {
      setApiKeyState(savedKey);
      setInputKey(savedKey);
    }
    
    if (savedEndpoint) {
      setApiEndpoint(savedEndpoint);
    } else {
      const providerConfig = LLM_PROVIDERS.find(p => p.id === savedProvider);
      setApiEndpoint(providerConfig?.apiEndpoint || '');
    }
    
    if (savedModel) {
      setModelName(savedModel);
    }
    
    setStatus("unknown");
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // 切换提供商时自动更新端点
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    const providerConfig = LLM_PROVIDERS.find(p => p.id === newProvider);
    setApiEndpoint(providerConfig?.apiEndpoint || '');
    setModelName('');
  };

  // 验证 API Key（直接调用 LLM 提供商 API）
  const verifyKey = async (key, showMessage = true) => {
    setLoading(true);
    try {
      const providerConfig = LLM_PROVIDERS.find(p => p.id === provider);
      const testModel = modelName || providerConfig?.verifyModel || 'gpt-3.5-turbo';
      
      // 构建验证请求
      let url = apiEndpoint;
      let headers = {};
      let body = {};

      // 根据不同提供商构建请求
      switch (provider) {
        case 'openai':
        case 'deepseek':
        case 'kimi':
        case 'doubao':
        case 'tiangong':
          // OpenAI 兼容格式
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: 'Hello, this is a test message. Please respond with "OK".' }
            ],
            max_tokens: 10
          };
          break;

        case 'gemini':
          // Gemini 格式
          url = url.replace('{model}', testModel);
          headers = {
            'Content-Type': 'application/json'
          };
          body = {
            contents: [{
              parts: [{ text: 'Hello, this is a test message. Please respond with "OK".' }]
            }],
            generationConfig: {
              maxOutputTokens: 10
            }
          };
          break;

        case 'alibaba':
          // 阿里云格式
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'X-DashScope-WorkSpace': 'api'
          };
          body = {
            model: testModel,
            input: {
              messages: [
                { role: 'user', content: 'Hello, this is a test message. Please respond with "OK".' }
              ]
            },
            parameters: {
              max_tokens: 10
            }
          };
          break;

        case 'minimax':
          // MiniMax 格式
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: 'Hello, this is a test message. Please respond with "OK".' }
            ],
            max_tokens: 10
          };
          break;

        case 'zhipu':
          // 智谱 AI 格式
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: '你好，这是一条测试消息，请回复"OK"。' }
            ],
            max_tokens: 10
          };
          break;

        case 'xinghuo':
          // 讯飞星火格式
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: '你好，这是一条测试消息，请回复"OK"。' }
            ],
            max_tokens: 10
          };
          break;

        case 'wenxin':
          // 百度文心一言格式（需要获取 access_token，这里简化处理）
          setMessage('百度文心一言需要先获取 access_token，请在后端实现');
          setStatus('unknown');
          setLoading(false);
          return;

        case 'azure':
          // Azure OpenAI 格式
          headers = {
            'Content-Type': 'application/json',
            'api-key': key
          };
          body = {
            messages: [
              { role: 'user', content: 'Hello, this is a test message. Please respond with "OK".' }
            ],
            max_tokens: 10
          };
          break;

        case 'custom':
          // 自定义格式（使用 OpenAI 兼容格式）
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          };
          body = {
            model: testModel,
            messages: [
              { role: 'user', content: 'Hello, this is a test message. Please respond with "OK".' }
            ],
            max_tokens: 10
          };
          break;

        default:
          throw new Error('不支持的 LLM 提供商');
      }

      // 发送验证请求
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        setStatus("valid");
        if (showMessage) {
          setMessage("API Key 验证成功！");
          setTimeout(() => setMessage(""), 3000);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('验证失败:', errorData);
        setStatus("invalid");
        if (showMessage) {
          const errorMsg = errorData.error?.message || errorData.message || '验证失败';
          setMessage(`API Key 验证失败：${errorMsg}`);
          setTimeout(() => setMessage(""), 5000);
        }
      }
    } catch (err) {
      console.error('验证异常:', err);
      setStatus("invalid");
      if (showMessage) {
        setMessage(`验证失败：${err.message}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  // 检查账户余额（通过测试请求）
  const checkBalance = async (key, showMessage = true) => {
    setCheckingBalance(true);
    try {
      const providerConfig = LLM_PROVIDERS.find(p => p.id === provider);
      const testModel = modelName || providerConfig?.verifyModel || 'gpt-3.5-turbo';
      
      // 构建测试请求（使用最小 token 消耗）
      let url = apiEndpoint;
      let headers = {};
      let body = {};

      // 根据不同提供商构建请求
      switch (provider) {
        case 'openai':
        case 'deepseek':
        case 'kimi':
        case 'doubao':
        case 'tiangong':
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
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
            'Authorization': `Bearer ${key}`,
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
            'Authorization': `Bearer ${key}`
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
            'Authorization': `Bearer ${key}`
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
            'Authorization': `Bearer ${key}`
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
            'api-key': key
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
            'Authorization': `Bearer ${key}`
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

      // 发送测试请求
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        
        // 尝试提取余额信息（如果 API 返回）
        let balanceDisplay = '充足';
        let isLowBalance = false;
        
        // 某些 API 会返回 usage 或 balance 信息
        if (data.usage) {
          balanceDisplay = `本次消耗：${data.usage.total_tokens || 0} tokens`;
        }
        
        setBalanceInfo({
          status: 'sufficient',
          display: balanceDisplay,
          isLow: isLowBalance,
          lastCheck: new Date().toLocaleString('zh-CN')
        });
        
        if (showMessage) {
          setMessage(`账户状态正常！${balanceDisplay}`);
          setTimeout(() => setMessage(""), 3000);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('余额检查失败:', errorData);
        
        let errorMsg = errorData.error?.message || errorData.message || '检查失败';
        let isLowBalance = false;
        
        // 检测是否是余额不足的错误
        if (errorMsg.toLowerCase().includes('balance') || 
            errorMsg.toLowerCase().includes('insufficient') ||
            errorMsg.toLowerCase().includes('quota') ||
            errorData.error?.code === 'insufficient_quota') {
          isLowBalance = true;
          errorMsg = '账户余额不足或配额已用尽';
        }
        
        setBalanceInfo({
          status: 'error',
          display: errorMsg,
          isLow: isLowBalance,
          lastCheck: new Date().toLocaleString('zh-CN'),
          errorCode: errorData.error?.code
        });
        
        if (showMessage) {
          setMessage(`⚠️ ${errorMsg}`);
          setTimeout(() => setMessage(""), 5000);
        }
      }
    } catch (err) {
      console.error('余额检查异常:', err);
      setBalanceInfo({
        status: 'error',
        display: err.message,
        isLow: false,
        lastCheck: new Date().toLocaleString('zh-CN')
      });
      
      if (showMessage) {
        setMessage(`检查失败：${err.message}`);
        setTimeout(() => setMessage(""), 5000);
      }
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleSave = async () => {
    if (!inputKey.trim()) {
      setMessage("请输入 API Key");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    if (!apiEndpoint.trim()) {
      setMessage("请输入 API 端点");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading(true);
    try {
      // 保存到 localStorage
      localStorage.setItem('llm_provider', provider);
      localStorage.setItem('llm_api_key', inputKey);
      localStorage.setItem('llm_api_endpoint', apiEndpoint);
      localStorage.setItem('llm_model_name', modelName);
      
      setApiKeyState(inputKey);
      setMessage("配置保存成功！");
      setStatus("unknown");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("保存配置失败");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => {
    if (!inputKey.trim()) {
      setMessage("请先输入 API Key");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    verifyKey(inputKey);
    // 验证成功后也检查余额
    if (status === "valid" || status === "unknown") {
      checkBalance(inputKey, false);
    }
  };

  const handleCheckBalance = () => {
    if (!inputKey.trim()) {
      setMessage("请先输入 API Key");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    checkBalance(inputKey);
  };

  const currentProvider = LLM_PROVIDERS.find(p => p.id === provider);

  return (
    <div className="flex-1 overflow-auto">
      <div className="card max-w-4xl mx-auto mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🔑 LLM API 配置</h2>
          <p className="text-gray-600">
            配置 LLM 服务提供商、API Key 和模型信息以启用矿物鉴定报告生成功能
          </p>
        </div>

        <div className="space-y-6">
          {/* 服务提供商选择 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              LLM 服务提供商
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
            >
              {LLM_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key 输入框 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="请输入您的 API Key"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* API 端点 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API 端点 URL
            </label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder={currentProvider?.apiEndpoint}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              当前提供商默认端点：{currentProvider?.apiEndpoint}
            </p>
          </div>

          {/* 模型名称 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              模型名称 <span className="text-gray-400">(可选)</span>
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={currentProvider?.modelPlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              例如：{currentProvider?.modelPlaceholder}
            </p>
          </div>

          {/* 状态显示 */}
          {apiKey && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
              <span className="text-sm font-medium text-gray-700">当前配置：</span>
              <div className="flex-1">
                <p className="text-sm text-gray-800 font-semibold">
                  {LLM_PROVIDERS.find(p => p.id === provider)?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {modelName && `模型：${modelName} • `}
                  {status === "valid" && (
                    <span className="text-green-700">已验证</span>
                  )}
                  {status === "invalid" && (
                    <span className="text-red-700">验证失败</span>
                  )}
                  {status === "unknown" && (
                    <span className="text-gray-500">未验证</span>
                  )}
                </p>
              </div>
              {status === "valid" && (
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
              )}
              {status === "invalid" && (
                <XCircleIcon className="w-6 h-6 text-red-500" />
              )}
            </div>
          )}

          {/* 余额信息显示 */}
          {balanceInfo && (
            <div className={`p-4 rounded-lg border-2 ${
              balanceInfo.isLow 
                ? 'bg-red-50 border-red-200' 
                : balanceInfo.status === 'error'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start gap-3">
                {balanceInfo.isLow ? (
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                ) : balanceInfo.status === 'error' ? (
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    balanceInfo.isLow ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {balanceInfo.isLow ? '⚠️ 余额不足预警' : '✓ 账户状态正常'}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {balanceInfo.display}
                  </p>
                  {balanceInfo.lastCheck && (
                    <p className="text-xs text-gray-500 mt-2">
                      最后检查：{balanceInfo.lastCheck}
                    </p>
                  )}
                  {balanceInfo.isLow && (
                    <div className="mt-3 p-3 bg-red-100 rounded-lg">
                      <p className="text-xs text-red-700">
                        <strong>建议操作：</strong>
                        <br/>
                        1. 及时充值或等待账单周期重置
                        <br/>
                        2. 考虑切换至其他 LLM 提供商
                        <br/>
                        3. 减少报告生成频率以节省用量
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 消息提示 */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes("成功") ? "bg-green-50 text-green-800" :
              message.includes("失败") ? "bg-red-50 text-red-800" :
              "bg-yellow-50 text-yellow-800"
            }`}>
              {message}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              )}
              <span>保存配置</span>
            </button>
            
            <button
              onClick={handleVerify}
              disabled={loading || !inputKey.trim()}
              className="action-btn flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              )}
              <span>验证可用性</span>
            </button>

            <button
              onClick={handleCheckBalance}
              disabled={checkingBalance || !inputKey.trim()}
              className="action-btn flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingBalance && (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              )}
              <span>检查余额</span>
            </button>
          </div>

          {/* 使用说明 */}
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">📝 使用说明</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>选择您的 LLM 服务提供商（支持 12+ 家主流服务商）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>输入对应的 API Key（从服务商控制台获取）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>API 端点会自动填充，也支持自定义修改</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>可选填写模型名称，不填则使用后端默认模型</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>点击"验证可用性"按钮测试 API Key 是否有效</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>点击"检查余额"查看账户余额状态</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>配置完成后，用户可在首页生成矿物鉴定报告</span>
              </li>
            </ul>
          </div>

          {/* 支持的提供商列表 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">支持的 LLM 提供商</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LLM_PROVIDERS.map((p) => (
                <div key={p.id} className={`p-3 rounded-lg border-2 ${
                  provider === p.id 
                    ? 'border-indigo-500 bg-white' 
                    : 'border-gray-200 bg-white'
                }`}>
                  <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{p.apiEndpoint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
