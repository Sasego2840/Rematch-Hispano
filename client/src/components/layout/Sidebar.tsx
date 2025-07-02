import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Calendar, Home, Medal, Settings, Trophy, Users, LogOut } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
  });

  const navigationItems = [
    { path: "/", icon: Home, label: "Dashboard", show: true },
    { path: "/mi-club", icon: Users, label: "Mi Club", show: !!user },
    { path: "/notificaciones", icon: Bell, label: "Notificaciones", show: !!user, badge: unreadCount?.count },
    { path: "/calendario", icon: Calendar, label: "Calendario", show: !!user },
    { path: "/torneos", icon: Trophy, label: "Torneos", show: true },
    { path: "/ligas", icon: Medal, label: "Ligas", show: true },
    { path: "/admin", icon: Settings, label: "Admin", show: isAdmin },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="w-64 bg-primary-800 border-r border-primary-700 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent-red rounded-lg flex items-center justify-center">
            <Trophy className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Rematch</h1>
            <p className="text-sm text-gray-400">Liga Española</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          if (!item.show) return null;

          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <a className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-primary-700">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary-700">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <FaDiscord className="text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.discordUsername}
            </p>
            <p className="text-xs text-gray-400 capitalize">{user.role}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-400 hover:text-white p-1"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
