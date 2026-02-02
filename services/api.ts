import axios from "axios";
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from "@/types/product";
import { Category, CreateCategoryInput, UpdateCategoryInput } from "@/types/category";

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
  }
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
    data: Partial<UpdateProductInput>
  ): Promise<Product> => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// Categories API with fake data
const fakeCategories: Category[] = [
  {
    id: 1,
    name: "Fashion",
    slug: "fashion",
    isActive: true,
    parentId: null,
    productCount: 45,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-20T14:30:00Z",
  },
  {
    id: 2,
    name: "Electronics",
    slug: "electronics",
    isActive: true,
    parentId: null,
    productCount: 128,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-18T09:15:00Z",
  },
  {
    id: 3,
    name: "Home & Living",
    slug: "home-living",
    isActive: true,
    parentId: null,
    productCount: 67,
    createdAt: "2024-02-01T08:00:00Z",
    updatedAt: "2024-03-15T11:45:00Z",
  },
  {
    id: 4,
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    isActive: false,
    parentId: null,
    productCount: 23,
    createdAt: "2024-02-10T12:00:00Z",
    updatedAt: "2024-03-10T16:20:00Z",
  },
  {
    id: 5,
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    isActive: true,
    parentId: null,
    productCount: 89,
    createdAt: "2024-02-15T09:30:00Z",
    updatedAt: "2024-03-22T10:00:00Z",
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const categoriesApi = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    await delay(500); // Simulate network delay
    return [...fakeCategories];
  },

  // Get category by ID
  getById: async (id: number): Promise<Category> => {
    await delay(300);
    const category = fakeCategories.find((c) => c.id === id);
    if (!category) {
      throw new Error("Category not found");
    }
    return { ...category };
  },

  // Create new category
  create: async (data: CreateCategoryInput): Promise<Category> => {
    await delay(500);
    const newCategory: Category = {
      id: Math.max(...fakeCategories.map((c) => c.id)) + 1,
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, "-"),
      isActive: data.isActive,
      parentId: null,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fakeCategories.push(newCategory);
    return newCategory;
  },

  // Update category
  update: async (id: number, data: UpdateCategoryInput): Promise<Category> => {
    await delay(400);
    const index = fakeCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Category not found");
    }
    fakeCategories[index] = {
      ...fakeCategories[index],
      name: data.name ?? fakeCategories[index].name,
      isActive: data.isActive ?? fakeCategories[index].isActive,
      updatedAt: new Date().toISOString(),
    };
    return fakeCategories[index];
  },

  // Delete category
  delete: async (id: number): Promise<void> => {
    await delay(300);
    const index = fakeCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Category not found");
    }
    fakeCategories.splice(index, 1);
  },

  // Toggle category active status
  toggleActive: async (id: number): Promise<Category> => {
    await delay(300);
    const index = fakeCategories.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Category not found");
    }
    fakeCategories[index] = {
      ...fakeCategories[index],
      isActive: !fakeCategories[index].isActive,
      updatedAt: new Date().toISOString(),
    };
    return fakeCategories[index];
  },
};

export default api;
