"use client";
import { useState, useEffect } from "react";
import { TodoType, UserType } from "../../types/commontypes";
import { AddTodoAction, GetUsersAction } from "../../lib/crud";

export default function AddTodo({ myusers }: { myusers: UserType[] }) {
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState("");
  const [todo, setTodo] = useState<TodoType>({
    title: "",
    description: "",
    is_completed: false,
    user_id: 0,
    added_by: "",
  });

  //   useEffect(() => {
  //     const fetchData = async () => {

  //       setUsers(myusers);
  //     };

  //     fetchData();

  // },[]);

  const addTodoFunction = async () => {
    try {
      setPending(true);
      const response = await AddTodoAction(todo);
      setResponse(response.message);

      if (response) {
        setTodo({
          ...todo,
          title: "",
          description: "",
          is_completed: false,
          added_by: "",
        }); // Clear input field
      }
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 mt-2">
      {/* Add todo section */}
      <div className="flex items-center justify-center space-x-4">
        <select
          id="users"
          className="max-w-[100px] bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          onChange={(e) => {
            setTodo({
              ...todo,
              user_id: parseFloat(e.target.value.split(":")[1]),
              added_by: e.target.value.split(":")[0],
            });
          }}
        >
          <option>Select user</option>
          {myusers?.map((user, index) => (
            <option key={index}>
              {user.username}:{user.id}
            </option>
          ))}
        </select>
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
          placeholder="Add Todo title"
          onChange={(e) => {
            setTodo({ ...todo, title: e.target.value });
          }}
          value={todo.title}
        />
      </div>

      <input
        className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
        placeholder="Add Todo description"
        onChange={(e) => {
          setTodo({ ...todo, description: e.target.value });
        }}
        value={todo.description}
      />
      {pending && (
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      )}
      <button
        onClick={() => {
          addTodoFunction();
        }}
        disabled={pending}
        className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded"
      >
        Add
      </button>
      <h1>{response}</h1>
      {todo.user_id}
    </div>
  );
}
