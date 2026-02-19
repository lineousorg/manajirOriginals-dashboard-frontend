import axios from "axios";
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "@/types/product";
import {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/types/category";
import { Order, OrderStatus, UpdateOrderStatusInput } from "@/types/order";
import { User } from "@/types/user";

// const API_BASE_URL = "http://localhost:5000/api"; // your backend
const API_BASE_URL = "https://manajiroriginals.com/api";

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
    return response.data.data;
  },
  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },
  create: async (data: CreateProductInput): Promise<Product> => {
    const response = await api.post("/products", data);
    return response.data.data;
  },
  update: async (id: number, data: UpdateProductInput): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data.data;
  },
  patch: async (
    id: number,
    data: Partial<UpdateProductInput>,
  ): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Categories API
export const categoriesApi = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    const response = await api.get("/categories");
    return response.data.data;
  },

  // Get category by ID
  getById: async (id: number): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },

  // Create new category
  create: async (data: CreateCategoryInput): Promise<Category> => {
    const response = await api.post("/categories", data);
    return response.data.data;
  },

  // Update category
  update: async (id: number, data: UpdateCategoryInput): Promise<Category> => {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data.data;
  },

  // Delete category
  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

// Orders API
export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    const response = await api.get("/orders");
    return response.data.data;
  },

  getById: async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  updateStatus: async (
    id: number,
    data: UpdateOrderStatusInput,
  ): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, data);
    return response.data.data;
  },

  // Download receipt as PDF
  getReceipt: async (id: number): Promise<Blob> => {
    const response = await api.get(`/orders/${id}/receipt`, {
      responseType: "blob",
    });
    return response.data;
  },
};

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get("/users");
    return response.data.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },
};

export default api;
