import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  LayoutDashboard, Users, GraduationCap, School, BookOpen, 
  UserSquare, FileSpreadsheet, KeyRound, LogOut, MessageSquareCode, 
  Menu, X, Sparkles, Activity, FileText, CalendarCheck
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define links based on user roles
  const getLinks = () => {
    switch (user.role) {
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/admin/students', label: 'Students', icon: GraduationCap },
          { path: '/admin/faculty', label: 'Faculty', icon: Users },
          { path: '/admin/academics', label: 'Academics', icon: School },
          { path: '/admin/assignments', label: 'Allocations', icon: BookOpen },
          { path: '/admin/imports', label: 'Ingest Sheets', icon: FileSpreadsheet },
          { path: '/admin/audit', label: 'Security Logs', icon: KeyRound }
        ];
      case 'faculty':
        return [
          { path: '/faculty', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/faculty/marks', label: 'Grades Manager', icon: FileText },
          { path: '/faculty/attendance', label: 'Attendance Logs', icon: CalendarCheck },
          { path: '/faculty/analytics', label: 'Course Analytics', icon: Activity }
        ];
      case 'student':
        return [
          { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/student/results', label: 'Report Card', icon: FileText },
          { path: '/student/chatbot', label: 'Academic Coach', icon: MessageSquareCode, highlight: true }
        ];
      default:
        return [];
    }
  };

  const menuLinks = getLinks();

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-slate-900 border border-cyber-border text-cyber-primary shadow-glow-cyan"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 glass-panel border-r border-cyber-border/40 bg-slate-950/80 rounded-none flex flex-col justify-between transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Logo Brand Panel */}
          <div className="p-6 border-b border-cyber-border/20 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-primary/10 border border-cyber-primary/40 animate-pulse-glow shadow-glow-cyan">
              <Sparkles className="text-cyber-primary animate-float" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-cyber font-bold bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-accent bg-clip-text text-transparent">
                NEXUS ANALYTICS
              </h2>
              <span className="text-[10px] text-cyber-muted tracking-widest uppercase font-mono">
                Result System v1.0
              </span>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="p-4 mx-4 my-6 rounded-xl bg-slate-900/50 border border-cyber-border/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyber-primary to-cyber-secondary flex items-center justify-center font-cyber font-bold text-cyber-bg shadow-glow-cyan">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-xs font-semibold truncate text-cyber-text capitalize">{user.username}</h3>
              <p className="text-[10px] text-cyber-primary uppercase tracking-wider font-mono font-bold mt-0.5">{user.role}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-1">
            {menuLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-cyber transition-all duration-300 border
                    ${isActive 
                      ? 'bg-cyber-primary/10 border-cyber-primary/40 text-cyber-primary shadow-glow-cyan' 
                      : link.highlight
                        ? 'bg-cyber-secondary/5 border-cyber-secondary/20 text-cyber-secondary hover:bg-cyber-secondary/15'
                        : 'border-transparent text-cyber-muted hover:text-cyber-text hover:bg-slate-900/40 hover:border-cyber-border/10'
                    }
                  `}
                >
                  <Icon size={16} className={link.highlight ? 'animate-bounce' : ''} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cyber-border/20">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-xs font-cyber text-cyber-danger hover:bg-cyber-danger/10 border border-transparent hover:border-cyber-danger/30 transition-all duration-300 cursor-pointer"
          >
            <LogOut size={16} />
            <span>TERMINATE SESSION</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
