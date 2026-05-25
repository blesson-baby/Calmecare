import axios from "axios";

const currentOrigin =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || `${currentOrigin}/api`;

const API = axios.create({
  baseURL: apiBaseUrl
});

// 🔐 Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
