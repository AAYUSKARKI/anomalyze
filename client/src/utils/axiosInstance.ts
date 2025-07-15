import axios from "axios";

const api_base_url = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: api_base_url,
  withCredentials: true
});

export default api;