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
import {
  Attribute,
  CreateAttributeInput,
  UpdateAttributeInput,
  AttributeValue,
  CreateAttributeValueInput,
  UpdateAttributeValueInput,
} from "@/types/attribute";

const API_BASE_URL = "http://localhost:5000/api"; // your backend
// const API_BASE_URL = "https://manajiroriginals.com/api";

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
  // Toggle product active status
  toggleActive: async (id: number): Promise<Product> => {
    const response = await api.patch(`/products/${id}/toggle-active`);
    return response.data.data;
  },
  // Toggle variant active status
  toggleVariantActive: async (
    productId: number,
    variantId: number,
  ): Promise<Product> => {
    const response = await api.patch(
      `/products/${productId}/variants/${variantId}/toggle-active`,
    );
    return response.data.data;
  },
  // Soft delete variant
  deleteVariant: async (
    productId: number,
    variantId: number,
  ): Promise<void> => {
    await api.delete(`/products/${productId}/variants/${variantId}`);
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

// Attributes API
export const attributesApi = {
  getAll: async (): Promise<Attribute[]> => {
    const response = await api.get("/attributes");
    return response.data.data;
  },

  getById: async (id: number): Promise<Attribute> => {
    const response = await api.get(`/attributes/${id}`);
    return response.data.data;
  },

  create: async (data: CreateAttributeInput): Promise<Attribute> => {
    const response = await api.post("/attributes", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateAttributeInput): Promise<Attribute> => {
    const response = await api.patch(`/attributes/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/attributes/${id}`);
  },
};

// Attribute Values API
export const attributeValuesApi = {
  getAll: async (): Promise<AttributeValue[]> => {
    const response = await api.get("/attribute-values");
    return response.data.data;
  },

  getById: async (id: number): Promise<AttributeValue> => {
    const response = await api.get(`/attribute-values/${id}`);
    return response.data.data;
  },

  getByAttributeId: async (attributeId: number): Promise<AttributeValue[]> => {
    const response = await api.get(`/attribute-values/attribute/${attributeId}`);
    return response.data.data;
  },

  create: async (data: CreateAttributeValueInput): Promise<AttributeValue> => {
    const response = await api.post("/attribute-values", data);
    return response.data.data;
  },

  update: async (id: number, data: UpdateAttributeValueInput): Promise<AttributeValue> => {
    const response = await api.patch(`/attribute-values/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/attribute-values/${id}`);
  },
};

export default api;
