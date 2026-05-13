import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 md:ml-60 pb-20 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
