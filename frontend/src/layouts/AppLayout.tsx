import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
export function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-container">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
