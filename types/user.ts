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

// API Response wrapper type
export type ApiResponse<T> = {
  message: string;
  status: "success" | "error";
  data: T;
};

export type UsersApiResponse = ApiResponse<User[]>;
export type UserApiResponse = ApiResponse<User>;
