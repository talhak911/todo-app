"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, LoginData, SignupData } from "@/types/commontypes";
import { authAPI } from "@/services/api";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);

          // Verify token is still valid
          await authAPI.getCurrentUser();
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(data);

      localStorage.setItem("access_token", response.access_token);

      const userData: User = {
        id: response.user_id,
        username: response.username,
        email: "", // Will be fetched from /me endpoint
      };

      // Get complete user data
      const completeUser = await authAPI.getCurrentUser();
      setUser(completeUser);
      localStorage.setItem("user", JSON.stringify(completeUser));

      toast.success("Successfully logged in!");
    } catch (error: any) {
      const message = error.response?.data?.detail || "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<void> => {
    try {
      setIsLoading(true);
      await authAPI.signup(data);
      toast.success("Account created successfully! Please log in.");
    } catch (error: any) {
      const message = error.response?.data?.detail || "Signup failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Successfully logged out!");
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
