import { NavLink } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  List,
  ClipboardList,
  Map,
  X
} from 'lucide-react';
import { ROLES } from '../utils/roleRoutes';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const getNavItems = () => {
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.CITIZEN, ROLES.ENGINEER, ROLES.SUPERVISOR] },
    ];

    if (user?.role === ROLES.CITIZEN) {
      items.push(
        { path: '/report', label: 'Report Issue', icon: FileText, roles: [ROLES.CITIZEN] },
        { path: '/my-issues', label: 'My Issues', icon: List, roles: [ROLES.CITIZEN] }
      );
    }

    if (user?.role === ROLES.ENGINEER) {
      items.push(
        { path: '/assigned', label: 'Assigned Issues', icon: ClipboardList, roles: [ROLES.ENGINEER] }
      );
    }

    if (user?.role === ROLES.SUPERVISOR) {
      items.push(
        { path: '/map', label: 'Map View', icon: Map, roles: [ROLES.SUPERVISOR] }
      );
    }

    return items.filter(item => item.roles.includes(user?.role));
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-semibold">Menu</span>
            <button
              onClick={onClose}
              className="p-2 rounded-md transition-colors hover:bg-sidebar-accent/30"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {getNavItems().map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};
