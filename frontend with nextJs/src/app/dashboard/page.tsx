"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Circle, Plus, Calendar, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE; // Mock API base

interface Todo {
  id: number;
  title: string;
  description: string;
  is_completed: boolean;
  user_id: number;
  added_by: string;
  image_url?: string;
}

interface CreateTodoData {
  title: string;
  description: string;
  image?: File;
}

export default function TodoPage() {
  const { isAuthenticated, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [formData, setFormData] = useState<CreateTodoData>({
    title: "",
    description: "",
    image: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchTodos = async () => {
    // Mock implementation - replace with actual API call
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/todos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch todos");
      const data = await res.json();
      setTodos(data);
      console.log("Fetching todos...");
    } catch (err) {
      console.error(err);
      // toast.error("Could not load todos");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        image: e.target.files![0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("You must be logged in to add todos");
      setLoading(false);
      return;
    }

    const body = new FormData();
    body.append("title", formData.title);
    body.append("description", formData.description);
    if (formData.image) {
      body.append("image", formData.image);
    }

    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (!res.ok) throw new Error("Failed to create todo");
      const newTodo = await res.json();
      setTodos((prev) => [newTodo, ...prev]);
      setFormData({ title: "", description: "", image: undefined });
      toast.success("Todo added successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error adding todo");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (todoId: number, currentStatus: boolean) => {
    try {
      // This is the corrected API call for your backend
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/todos/${todoId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_completed: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      // Update local state immediately for better UX
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId ? { ...todo, is_completed: !currentStatus } : todo
        )
      );

      // toast.success("Todo status updated!");
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const res = await fetch(`${API_BASE}/todos/${todoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete todo");
      setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
      toast.success("Todo deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting todo");
    }
  };
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-gray-600 text-lg">
            Please log in to see your todos.
          </p>

          <Link
            className="py-1 px-2 bg-green-500 text-white rounded-md mt-2 mx-auto block text-center"
            href={"/login"}
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = todos.filter((todo) => todo.is_completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div>
        <button
          className="absolute right-4 top-3 bg-red-600 px-2 py-1 rounded-md text-white"
          onClick={logout}
        >
          Logout
        </button>
      </div>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Todos</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{completedCount} completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>{totalCount - completedCount} pending</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm text-gray-600">
              {totalCount > 0
                ? Math.round((completedCount / totalCount) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  totalCount > 0 ? (completedCount / totalCount) * 100 : 0
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Add Todo Button/Form */}
        <div className="mb-8">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Plus className="w-5 h-5" />
              Add New Todo
            </button>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Add New Todo
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    name="title"
                    placeholder="What needs to be done?"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Add more details..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📷 Attach Image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </div>
                    ) : (
                      "Add Todo"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Todos List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                No todos yet
              </h3>
              <p className="text-gray-500">
                Add your first todo to get started!
              </p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md ${
                  todo.is_completed ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status Toggle */}
                  <button
                    onClick={() =>
                      handleToggleStatus(todo.id, todo.is_completed)
                    }
                    className={`mt-1 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                      todo.is_completed
                        ? "text-green-500 hover:text-green-600"
                        : "text-gray-400 hover:text-blue-500"
                    }`}
                  >
                    {todo.is_completed ? (
                      <CheckCircle className="w-6 h-6 fill-current" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-lg font-semibold mb-2 transition-all duration-200 ${
                        todo.is_completed
                          ? "text-gray-500 line-through"
                          : "text-gray-800"
                      }`}
                    >
                      {todo.title}
                    </h3>

                    <p
                      className={`text-sm mb-3 leading-relaxed ${
                        todo.is_completed ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {todo.description}
                    </p>

                    {/* Image */}
                    {todo.image_url && (
                      <div className="mb-3">
                        <img
                          src={`${API_BASE}/${todo.image_url}`}
                          alt={todo.title}
                          className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                        />
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Added by {todo.added_by}</span>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          todo.is_completed
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {todo.is_completed ? "Completed" : "Pending"}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() =>
                      handleToggleStatus(todo.id, todo.is_completed)
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                      todo.is_completed
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    Mark as {todo.is_completed ? "Pending" : "Complete"}
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 
                bg-orange-100 text-orange-700 hover:bg-orange-200
                    
                    `}
                    onClick={() => handleDelete(todo.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
