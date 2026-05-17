import React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { useTheme } from "../themeContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: "●" },
    { to: "/transactions", label: "Transactions", icon: "₹" },
    { to: "/budgets", label: "Budgets", icon: "◎" },
    { to: "/investments", label: "Investments", icon: "⇅" },
    { to: "/payments", label: "Payments", icon: "⚡" },
    { to: "/analytics", label: "Analytics", icon: "∑" },
    { to: "/chat", label: "Chatbot", icon: "💬" },
    { to: "/tax", label: "Tax Calc", icon: "📝" },
    { to: "/bank", label: "Bank Linking", icon: "🏦" },
    { to: "/admin", label: "Admin", icon: "★", adminOnly: true },
    { to: "/settings", label: "Settings", icon: "⚙︎" }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!user) return false;
    if (item.adminOnly && user.role !== "admin") return false;
    return true;
  });

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors ${
      isActive
        ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white"
        : "text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white focus-visible:bg-slate-200 dark:focus-visible:bg-slate-800"
    }`;

  const currentPath = location.pathname;

  const showAuthActions = !user && (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary-500 text-white px-3 py-2 rounded"
      >
        Skip to main content
      </a>
      {user && (
        <>
          <aside
            className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm ${
              sidebarCollapsed ? "w-20" : "w-64"
            } transition-[width] duration-200`}
            aria-label="Main navigation"
          >
            <div className="flex items-center gap-2 px-4 h-14 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-left"
                aria-label="FinTrack Pro home"
              >
                <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                  F
                </span>
                {!sidebarCollapsed && (
                  <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">FinTrack Pro</span>
                )}
              </button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
              {filteredNavItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navLinkClass}
                  aria-current={currentPath === item.to ? "page" : undefined}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-900 text-xs">
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-slate-200 dark:border-slate-800 px-2 py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(v => !v)}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-xs text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span>{sidebarCollapsed ? "Expand" : "Collapse"}</span>
              </button>
            </div>
          </aside>
          <div
            className={`md:hidden fixed inset-0 z-40 ${sidebarOpen ? "pointer-events-auto" : "pointer-events-none"}`}
            aria-hidden={!sidebarOpen}
          >
            <div
              className={`absolute inset-0 bg-black/60 transition-opacity ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
              onClick={() => setSidebarOpen(false)}
            />
            <aside
              className={`absolute inset-y-0 left-0 w-64 border-r border-slate-800 bg-white dark:bg-slate-950 backdrop-blur-sm transform transition-transform ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
              aria-label="Main navigation"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 text-left"
                  aria-label="FinTrack Pro home"
                >
                  <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                    F
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">FinTrack Pro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-md p-1 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close navigation"
                >
                  ✕
                </button>
              </div>
              <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
                {filteredNavItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={navLinkClass}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={currentPath === item.to ? "page" : undefined}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-900 text-xs">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </aside>
          </div>
        </>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="h-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user && (
                <button
                  type="button"
                  className="md:hidden rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-slate-900 dark:text-slate-100"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation"
                >
                  ☰
                </button>
              )}
              <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2" aria-label="FinTrack Pro home">
                <span className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                  F
                </span>
                <span className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  FinTrack Pro
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-600 dark:text-yellow-500 text-xs font-medium">
                <span className="mr-1.5 h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                Paper Trading Mode
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen(v => !v)}
                    className="inline-flex items-center gap-2 rounded-md bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-[11px] text-white">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </span>
                    <span className="hidden sm:inline">{user.name || user.email}</span>
                  </button>
                  {profileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-40 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1 text-xs shadow-lg z-50"
                      role="menu"
                    >
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                        role="menuitem"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/settings");
                        }}
                      >
                        Settings
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-red-600 dark:text-red-100 hover:bg-red-50 dark:hover:bg-red-900/40"
                        role="menuitem"
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                showAuthActions && (
                  <div className="flex items-center gap-2">
                    {location.pathname !== "/login" && (
                      <Link
                        to="/login"
                        className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 rounded px-2 py-1"
                      >
                        Login
                      </Link>
                    )}
                    {location.pathname !== "/register" && (
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center rounded-md bg-primary-500 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
                      >
                        Get started
                      </Link>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            {children}
          </div>
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p>FinTrack Pro personal finance, expense tracking, and investments in INR.</p>
            <p>Built with accessibility, security, and AI-driven insights.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
