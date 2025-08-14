import React from "react";
import { useWixLocation } from "./useWixLocation";

const NAV_OPTIONS = [
  { name: "Users", path: "/users" },
  { name: "Chavrutas", path: "/chavrutas" },
  { name: "Matches", path: "/matches" },
  { name: "Archive", path: "/archive" },
];

const Navbar: React.FC = () => {
  const { pathname } = useWixLocation();

  const handleNav = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
      // Optionally trigger a custom event or reload logic if needed
    }
  };

  return (
    <nav style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "60px",
      background: "#f5f5f5",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    }}>
      {NAV_OPTIONS.map(option => {
        const isActive = pathname === option.path;
        return (
          <a
            key={option.path}
            href={option.path}
            onClick={e => {
              e.preventDefault();
              handleNav(option.path);
            }}
            style={{
              margin: "0 20px",
              padding: "8px 16px",
              textDecoration: "none",
              color: isActive ? "#1976d2" : "#333",
              fontWeight: isActive ? "bold" : "normal",
              borderBottom: isActive ? "2px solid #1976d2" : "none",
              transition: "color 0.2s, border-bottom 0.2s",
              cursor: "pointer",
            }}
          >
            {option.name}
          </a>
        );
      })}
    </nav>
  );
};

export default Navbar;
