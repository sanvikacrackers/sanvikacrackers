import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Plus, Package, ClipboardList,
  LogOut, Menu, X, User,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import '../../Staff.css';
import LOGO from '../../assets/sanvikacrackerlogo.png';

export default function StaffLayout() {
  const navigate = useNavigate();
  const { profile, isStaff, isAdmin, signOut, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard — redirect to staff login if not authenticated or not staff
  if (!loading && !isStaff && !isAdmin) {
    navigate('/staff/login', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div className="staff-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: '#64748b' }}>Loading…</div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem('sanvikacrackers_admin_logged_in');
    toast.success('Signed out successfully');
    navigate('/staff/login', { replace: true });
  };

  const navItems = [
    { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/staff/new-bill', label: 'New Bill', icon: Plus },
    { to: '/staff/products', label: 'Products', icon: Package },
    { to: '/staff/orders', label: 'My Orders', icon: ClipboardList },
    { to: '/staff/profile', label: 'Profile', icon: User },
  ];

  const initials = (profile?.name || 'S').slice(0, 1).toUpperCase();

  return (
    <div className="staff-root">
      <div className="sf-layout">
        {sidebarOpen && (
          <div className="sf-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`sf-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sf-sidebar-logo">
            <img src={LOGO} alt="" style={{ height: 36, width: 'auto', borderRadius: 6, flexShrink: 0 }} />
            <div>
              <div className="sf-sidebar-brand">Sanvika Crackers</div>
              <div className="sf-sidebar-sub">Staff Portal</div>
            </div>
          </div>

          <div className="sf-sidebar-section">Menu</div>

          <nav className="sf-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sf-nav-item${isActive ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sf-sidebar-user">
            <div className="sf-sidebar-user-name">{profile?.name || 'Staff'}</div>
            <div className="sf-sidebar-user-role">{profile?.email || ''}</div>
          </div>

          <div className="sf-sidebar-footer">
            <button className="sf-logout-btn" onClick={handleLogout}>
              <LogOut style={{ width: 15, height: 15 }} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="sf-main">
          <header className="sf-header">
            <div className="sf-header-left">
              <button className="sf-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
              </button>
            </div>
            <div className="sf-header-right">
              <span style={{ fontSize: 13, color: '#64748b' }}>{profile?.name || 'Staff'}</span>
              <div className="sf-header-avatar">{initials}</div>
            </div>
          </header>

          <div className="sf-content">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="sf-bottom-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sf-bottom-nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
