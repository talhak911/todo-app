"use client";
import { DeleteTodoAction, updateTodoStatus } from "../../lib/crud";
import { TodoType } from "../../types/commontypes";
export default function TodoCrud({ todo }: { todo: TodoType }) {
  return (
    <>
      {todo.is_completed ? (
        <div className="flex items-center gap -3">
          <p>Mark as not completed</p>
          <button
            onClick={() => {
              updateTodoStatus(false, todo);
            }}
            className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full h-10 w-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap -3">
          <p>Mark as completed</p>
          <button
            onClick={() => {
              updateTodoStatus(true, todo);
            }}
            className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full h-10 w-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>
      )}
      <button
        onClick={() => {
          DeleteTodoAction(todo.id);
        }}
        className="bg-red-500 text-white px-3 py-1 rounded-md mt-1"
      >
        Remove
      </button>
    </>
  );
}
