import axios from "axios";

// Resolved at bundle time by Vite; fall back to the deployed API path when
// the env is absent (e.g. ad-hoc tooling that imports the module directly).
const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const apiUrl = "/choreo-apis/awbo/backend/rest-api-be2/v1.0";

const api = axios.create({
  baseURL: env.VITE_API_URL ? env.VITE_API_URL : apiUrl,
  withCredentials: true,
});

// access token lives in memory
let accessToken = null;

export function setApiAccessToken(token) {
  accessToken = token;
}

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;