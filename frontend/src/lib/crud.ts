// "use server";
// import { revalidatePath } from "next/cache";
// export const GetUsersAction = async () => {
//   try {
//     const response = await fetch("http://127.0.0.1:8080/get_users", {
//       cache: "no-store",
//     });
//     if (!response.ok) {
//       throw new Error();
//     }
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     return [{ username: "failed to get users" }];
//   }
// };

// export const AddUserAction = async (user: string) => {
//   try {
//     const response = await fetch("http://127.0.0.1:8080/add_user", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ username: user }),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to add user");
//     }
//     revalidatePath("/"); // Fetch users again to update the list

//     return response.json();
//   } catch (error) {
//     console.error("Error adding user:", error);
//     return { message: `failed to add user ${error}` };
//   }
// };
// export const GetTodosAction = async () => {
//   try {
//     const response = await fetch("http://127.0.0.1:8080/get_todos");

//     if (!response.ok) {
//       throw new Error("Failed to get todos");
//     }
//     return response.json();
//   } catch (error) {
//     console.error("Error getting todos:", error);
//     return [];
//   }
// };

// export const AddTodoAction = async (todo: TodoType) => {
//   try {
//     const response = await fetch("http://127.0.0.1:8080/add_todo", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(todo),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to add user");
//     }
//     revalidatePath("/"); // Fetch users again to update the list

//     return response.json();
//   } catch (error) {
//     console.error("Error adding user:", error);
//     return { message: `failed to add user ${error}` };
//   }
// };

// export const DeleteTodoAction = async (id: number) => {
//   try {
//     const response = await fetch(`http://127.0.0.1:8080/remove_todo/${id}`, {
//       method: "Delete",
//     });

//     if (!response.ok) {
//       throw new Error("Failed to add user");
//     }
//     revalidatePath("/"); // Fetch users again to update the list

//     return response.json();
//   } catch (error) {
//     console.error("Error deleting todo:", error);
//     return { message: `failed to delete todo ${error}` };
//   }
// };

// export const updateTodoStatus = async (status: boolean, todo: TodoType) => {
//   try {
//     const updated_todo = { status: status, todo: todo };
//     const response = await fetch("http://127.0.0.1:8080/update_status", {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(updated_todo),
//     });

//     if (!response.ok) {
//       throw new Error("Failed to update todo");
//     }
//     revalidatePath("/");
//     return response.json();
//   } catch (error) {
//     console.error("Error updating todo:", error);
//     return { message: `Failed to update todo ${error}` };
//   }
// };
