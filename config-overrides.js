// config-overrides.js
// 这个文件用于配置 react-app-rewired 来覆盖 CRA 的 webpack 配置
// 用于忽略 html2pdf.js 的 source map 警告

module.exports = function override(config, env) {
  // 忽略 source map 警告
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    {
      message: /Failed to parse source map from.*html2pdf/,
    },
  ];
  
  return config;
};
