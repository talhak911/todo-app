// import TodoList from "./components/TodoList";
// import AddUser from "./components/AddUser";
// import AddTodoWithUsers from "./components/addTodosWithUsers";

import { redirect } from "next/navigation";

export default function Home() {
  return redirect("/dashboard");
}
