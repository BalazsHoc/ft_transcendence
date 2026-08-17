import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

export function AppLayout() {
  const { pathname } = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Keep the full-bleed layout decision in the router instead of relying on a
  // newer CSS parent-selector escape hatch. This is easier to reason about and
  // works in older supported Firefox/Edge/Safari versions as well.
  const isFullBleedPage =
    pathname === "/" ||
    pathname === "/discover" ||
    pathname === "/map" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/profile" ||
    pathname.startsWith("/users/") ||
    pathname.startsWith("/groups/");

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);

    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  return (
    <div className="app-shell">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
      />

      <main
        className={`page-container${isFullBleedPage ? " page-container--full" : ""}`}
      >
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
