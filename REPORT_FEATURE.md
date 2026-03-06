# 矿物鉴定报告功能说明

## 功能概述
本项目新增了基于 LLM 的矿物鉴定报告生成功能，用户可以对预测结果生成专业的矿物鉴定报告，并支持导出为 PDF 格式。

## 新增内容

### 1. 前端组件

#### 1.1 报告展示组件（MineralReport.jsx）
- **位置**: `/src/components/MineralReport.jsx`
- **功能**:
  - 展示专业的矿物鉴定报告（样式参考上传的示例图）
  - 支持一键导出 PDF 格式报告
  - 包含：鉴定结果、分类、成因、地质背景、替代方案、技术参数、矿物成分、经济地质与找矿潜力、专家评估等模块
  -  modal 弹窗展示，支持关闭操作

#### 1.2 API Key 配置组件（ApiKeyConfig.jsx）
- **位置**: `/src/components/ApiKeyConfig.jsx`
- **功能**:
  - 管理员专用界面配置 LLM API Key
  - API Key 可用性验证功能
  - 状态可视化：
    - 🟢 绿色：API Key 有效
    - 🔴 红色：API Key 无效
    - ⚪ 灰色：未验证
  - 使用说明提示

#### 1.3 修改的组件
- **Home.jsx**: 
  - 新增"生成矿物鉴定报告"按钮
  - 调用后端报告生成 API
  - 展示报告弹窗
  
- **Admin.jsx**:
  - 新增"🔑 API Key 配置"导航项
  - 集成 API Key 配置页面
  
- **Sidebar.jsx**:
  - 支持自定义导航项
  - 保持原有功能不变

- **api.js**:
  - 新增 API Key 管理接口：
    - `getApiKey()`: 获取已保存的 API Key
    - `setApiKey(apiKey)`: 保存新的 API Key
    - `verifyApiKey()`: 验证 API Key 可用性
  - 新增报告生成接口：
    - `generateReport(data)`: 调用后端生成报告

### 2. 依赖安装
已安装必要依赖：
```bash
npm install html2pdf.js
```

## 使用流程

### 管理员配置流程
1. 点击首页右上角"管理员入口"
2. 输入管理员密码（miner2025）
3. 进入管理员控制台后，点击侧边栏"🔑 API Key 配置"
4. 输入 LLM API Key
5. 点击"验证可用性"测试 API Key 是否有效
6. 点击"保存配置"保存设置

### 用户使用流程
1. 在首页上传矿物图片
2. 查看预测结果（Top3）
3. 点击"生成矿物鉴定报告"按钮
4. 等待报告生成（显示加载动画）
5. 查看完整的矿物鉴定报告
6. 点击"导出 PDF"按钮下载报告

## 后端接口需求

后端需要实现以下 API 接口：

### 1. API Key 管理接口
```
GET /api/admin/apikey
- 返回：{ api_key: "已保存的 API Key" }

POST /api/admin/apikey
- 请求体：{ api_key: "新的 API Key" }
- 返回：{ success: true, message: "保存成功" }

POST /api/admin/apikey/verify
- 功能：验证当前保存的 API Key 是否可用
- 返回：{ valid: true/false, message: "验证结果" }
```

### 2. 报告生成接口
```
POST /api/generate_report
- 请求体：
  {
    "image_url": "/path/to/image.jpg",
    "predicted_label": "预测的矿物名称",
    "confidence": 0.95,
    "all_results": [...]
  }
- 返回：
  {
    "report": {
      "title": "岩石鉴定报告标题",
      "mineral_name": "矿物名称",
      "classification": "分类信息",
      "description": "成因描述",
      "geological_background": "地质背景",
      "alternatives": [
        {
          "name": "替代方案名称",
          "description": "替代方案描述"
        }
      ],
      "technical_parameters": [
        {
          "name": "参数名称",
          "value": "参数值",
          "icon": "🔬"
        }
      ],
      "mineral_composition": ["矿物 1", "矿物 2"],
      "economic_geology": [
        {
          "title": "小标题",
          "content": "详细内容"
        }
      ],
      "expert_assessment": "专家评估文本"
    }
  }
```

## 报告样式特点

报告设计参考了专业的地质鉴定证书样式，包含：

1. **报告头部**
   - STONE MASTER AI 品牌标识
   - 岩石鉴定报告标题（中英文）

2. **样品图片**
   - 高清展示上传的矿物图片
   - ORIGINAL SAMPLE 标签

3. **鉴定结果**
   - 大标题显示矿物名称
   - 分类信息
   - 成因描述

4. **地质背景**（黄色背景框）
   - 地质环境说明
   - 找矿指示意义

5. **替代方案**（灰色背景框）
   - 其他可能的矿物类型
   - 区别说明

6. **技术参数**（网格布局）
   - 颗粒、构造、硬度、风化、变质、成色、蚀变等

7. **矿物成分**
   - 网格展示主要矿物组成

8. **经济地质与找矿潜力**（绿色背景框）
   - 围岩蚀变
   - 指示矿物
   - 构造控矿
   - 找矿潜力评价

9. **专家评估**
   - 详细的专家级评估意见

10. **报告尾部**
    - AI GEOLOGICAL ANALYSIS 声明
    - 生成日期
    - "石头大人官方验证"印章

## 注意事项

1. **API Key 安全性**
   - API Key 存储在后端，前端只负责传递
   - 管理员配置后所有用户均可使用报告生成功能

2. **PDF 导出**
   - 使用 html2pdf.js 库实现
   - 支持 A4 纸张格式
   - 高质量图片输出（JPEG 格式，质量 0.98）

3. **错误处理**
   - API Key 验证失败时显示红色提示
   - 报告生成失败时弹出 alert 提示
   - 所有操作都有 loading 状态提示

4. **响应式设计**
   - 报告弹窗适配不同屏幕尺寸
   - 移动端也可正常查看和导出

## 后续优化建议

1. 支持自定义报告模板
2. 支持多语言报告
3. 添加报告历史记录
4. 支持批量生成报告
5. 增加更多导出格式（Word、Excel 等）
