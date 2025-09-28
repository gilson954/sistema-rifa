import React from "react";
import {
  LayoutDashboard,
  CreditCard,
  Trophy,
  Share2,
  BarChart2,
  Sliders,
  User,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <aside
      className="
        w-64 min-h-screen flex flex-col gap-6
        rounded-2xl p-4 shadow-sm border border-gray-200/20 
        dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 
        backdrop-blur-sm
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
          R
        </div>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          Rifaqui
        </span>
      </div>

      {/* User card */}
      <div className="flex items-center gap-3 px-2 py-3 rounded-xl border border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/40 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
          {user?.email?.[0]?.toUpperCase() || "G"}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {user?.email?.split("@")[0] || "Usuário"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user?.email || "email@exemplo.com"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition 
             ${
               isActive
                 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
             }`
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          Campanhas (Home)
        </NavLink>

        <NavLink
          to="/dashboard/payments"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition 
             ${
               isActive
                 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
             }`
          }
        >
          <CreditCard className="h-5 w-5" />
          Métodos de pagamento
        </NavLink>

        <NavLink
          to="/dashboard/ranking"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition 
             ${
               isActive
                 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
             }`
          }
        >
          <Trophy className="h-5 w-5" />
          Ranking
        </NavLink>

        <NavLink
          to="/dashboard/affiliations"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition 
             ${
               isActive
                 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
             }`
          }
        >
          <Share2 className="h-5 w-5" />
          Afiliações
        </NavLink>

        <NavLink
          to="/dashboard/socials"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition 
             ${
               isActive
                 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
             }`
          }
        >
          <BarChart2 className="h-5 w-5" />
          Redes sociais
        </NavLink>

        <NavLink
          to="/dashboard/pixels"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition 
             ${
               isActive
                 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
             }`
          }
        >
          <BarChart2 className="h-5 w-5" />
          Pixels e Analytics
        </NavLink>

        <NavLink
          to="/dashboard/customization"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition 
             ${
               isActive
                 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
             }`
          }
        >
          <Sliders className="h-5 w-5" />
          Personalização
        </NavLink>

        <NavLink
          to="/dashboard/account"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition 
             ${
               isActive
                 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
             }`
          }
        >
          <User className="h-5 w-5" />
          Minha conta
        </NavLink>

        <NavLink
          to="/dashboard/tutorials"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition 
             ${
               isActive
                 ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow"
                 : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/40 dark:hover:bg-gray-700/40"
             }`
          }
        >
          <HelpCircle className="h-5 w-5" />
          Tutoriais
        </NavLink>
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition text-white shadow
                   bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
      >
        <LogOut className="h-5 w-5" />
        Sair
      </button>
    </aside>
  );
};

export default Sidebar;
