import axios from "axios";
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "@/types/product";

const API_BASE_URL = "http://localhost:5000"; // your backend

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't force a redirect when the failing request is the login request
      const requestUrl: string | undefined = error.config?.url;
      const isLoginRequest = requestUrl?.includes("/auth/admin/login");

      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");

      // If this was the login request or the user is already on the login page,
      // don't programmatically redirect — let the calling code handle the error
      // (e.g. show a toast). Only redirect for 401s originating from other pages.
      if (!isLoginRequest && window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/admin/login", { email, password });
    return response.data;
  },
  logout: async () => {
    await api.post("/auth/admin/logout");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
  },
};

// Products API
export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get("/products");
    return response.data;
  },
  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  create: async (data: CreateProductInput): Promise<Product> => {
    const response = await api.post("/products", data);
    return response.data;
  },
  update: async (id: string, data: UpdateProductInput): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },
  patch: async (
    id: string,
    data: Partial<UpdateProductInput>,
  ): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

export default api;
