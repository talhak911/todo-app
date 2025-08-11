export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string;
  is_completed: boolean;
  user_id: number;
  added_by: string;
  image_url?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface CreateTodoData {
  title: string;
  description: string;
  image?: File;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  is_completed?: boolean;
  image?: File;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
}
