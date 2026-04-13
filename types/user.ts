// User interface (matches API response)
export interface User {
  id: number;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GuestUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  createdAt: string;
}

// API Response wrapper type
export type ApiResponse<T> = {
  message: string;
  status: "success" | "error";
  data: T;
};

export type UsersApiResponse = ApiResponse<User[]>;
export type UserApiResponse = ApiResponse<User>;
