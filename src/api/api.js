// src/api/api.js
import axios from "axios";

const API_PREFIX = "http://127.0.0.1:5050/api";
// const API_PREFIX = "http://172.27.32.129:5050/api";
// const API_PREFIX = "http://192.168.2.8:5050/api";
// const API_PREFIX = "https://hitachi-foundations-boats-sixth.trycloudflare.com/api";
// export const backurl="https://hitachi-foundations-boats-sixth.trycloudflare.com"
export const backurl="http://127.0.0.1:5050"
// ---------- 用户端 ----------
export const predict = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${API_PREFIX}/predict`, formData);
  return res.data;
};

export const submitFeedback = async (data) => {
  const res = await axios.post(`${API_PREFIX}/feedback`, data);
  return res.data;
};

// ---------- 管理员端 ----------
export const getAllFeedbacks = async () => {
  const res = await axios.get(`${API_PREFIX}/admin/feedbacks`);
  return res.data.feedbacks;
};
export const getAllRequests = async () => {
  const res = await axios.get(`${API_PREFIX}/admin/requests`);
  return res.data.requests;
};
export const reviewFeedback = async (fid, action, admin_comment = "") => {
  const res = await axios.post(
    `${API_PREFIX}/admin/feedbacks/${fid}/review`,
    { action, admin_comment }
  );
  return res.data;
};

export const getAdminStats = async () => {
  try {
    const res = await axios.get(`${API_PREFIX}/admin/stats`, {
      headers: { Accept: 'application/json' }
    });
    return res.data;
  } catch (err) {
    console.error("获取管理员统计失败:", err.response?.data || err);
    throw err;
  }
};

// API Key 验证接口（如果后端有的话）
export const verifyApiKey = async () => {
  try {
    const res = await axios.post(`${API_PREFIX}/admin/apikey/verify`);
    return res.data;
  } catch (err) {
    // 如果后端没有实现，抛出错误让前端处理
    console.error("验证 API Key 失败:", err.response?.data || err);
    throw err;
  }
};

// ---------- API Key 管理 ----------
export const getApiKey = async () => {
  try {
    const res = await axios.get(`${API_PREFIX}/admin/apikey`);
    return res.data;
  } catch (err) {
    console.error("获取 API Key 失败:", err.response?.data || err);
    throw err;
  }
};

export const setApiKey = async (apiKey) => {
  try {
    const res = await axios.post(`${API_PREFIX}/admin/apikey`, { api_key: apiKey });
    return res.data;
  } catch (err) {
    console.error("设置 API Key 失败:", err.response?.data || err);
    throw err;
  }
};

// ---------- 报告生成 ----------
export const generateReport = async (data) => {
  try {
    const res = await axios.post(`${API_PREFIX}/generate_report`, data);
    return res.data;
  } catch (err) {
    console.error("生成报告失败:", err.response?.data || err);
    throw err;
  }
};
