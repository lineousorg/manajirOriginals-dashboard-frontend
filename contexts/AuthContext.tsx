import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Lazy initial state to avoid useEffect setState warning
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("admin_user");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, password); // Use Axios setup
      const { user, token } = data;

      // Save in localStorage
      localStorage.setItem("admin_user", JSON.stringify(user));
      localStorage.setItem("admin_token", token);

      setUser(user);
      router.push("/admin");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
