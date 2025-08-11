import axios from "axios";
import {
  AuthResponse,
  LoginData,
  SignupData,
  Todo,
  CreateTodoData,
  UpdateTodoData,
  User,
} from "@/types/commontypes";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post("/login", data);
    return response.data;
  },

  signup: async (
    data: SignupData
  ): Promise<{ message: string; user_id: number }> => {
    const response = await api.post("/signup", data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/me");
    return response.data;
  },
};

export const todoAPI = {
  getTodos: async (): Promise<Todo[]> => {
    const response = await api.get("/todos");
    return response.data;
  },

  createTodo: async (
    data: CreateTodoData
  ): Promise<{ message: string; todo_id: number }> => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    if (data.image) {
      formData.append("image", data.image);
    }

    const response = await api.post("/todos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateTodo: async (
    id: number,
    data: UpdateTodoData
  ): Promise<{ message: string }> => {
    const formData = new FormData();
    if (data.title !== undefined) formData.append("title", data.title);
    if (data.description !== undefined)
      formData.append("description", data.description);
    if (data.is_completed !== undefined)
      formData.append("is_completed", data.is_completed.toString());
    if (data.image) formData.append("image", data.image);

    const response = await api.put(`/todos/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateTodoStatus: async (
    id: number,
    is_completed: boolean
  ): Promise<{ message: string }> => {
    const response = await api.put(
      `/todos/${id}/status?is_completed=${is_completed}`
    );
    return response.data;
  },

  deleteTodo: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/todos/${id}`);
    return response.data;
  },
};

export const getImageUrl = (filename: string): string => {
  if (!filename) return "";
  // Extract filename from path
  const imageName = filename.split("/").pop() || filename;
  return `${API_BASE_URL}/images/${imageName}`;
};
