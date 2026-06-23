import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import apiClient from '../api/client';

interface ActivityItem {
  id: number;
  time: string;
  text: string;
  icon: string;
}

interface SearchResult {
  label: string;
  to: string;
}

const allSearchItems: SearchResult[] = [
  { label: '📊 Dashboard', to: '/dashboard' },
  { label: '🏭 Warehouses', to: '/warehouses' },
  { label: '🗺️ Zones', to: '/zones' },
  { label: '🗄️ Racks', to: '/racks' },
  { label: '📚 Shelves', to: '/shelves' },
  { label: '📦 Inventory', to: '/inventory' },
  { label: '🛒 Products', to: '/products' },
  { label: '🗂️ Categories', to: '/categories' },
  { label: '🔄 Stock Movements', to: '/stock-movements' },
  { label: '📈 Analytics', to: '/analytics' },
  { label: '✅ Approvals', to: '/approvals' },
  { label: '📋 Reports',   to: '/reports' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const perms = usePermissions();

  const navItems = [
    { to: '/dashboard',      label: '📊 Dashboard',       show: true },
    { to: '/warehouses',     label: '🏭 Warehouses',      show: true },
    { to: '/zones',          label: '🗺️ Zones',           show: true },
    { to: '/racks',          label: '🗄️ Racks',           show: true },
    { to: '/shelves',        label: '📚 Shelves',         show: true },
    { to: '/inventory',      label: '📦 Inventory',       show: true },
    { to: '/products',       label: '🛒 Products',        show: true },
    { to: '/categories',     label: '🗂️ Categories',      show: true },
    { to: '/stock-movements',label: '🔄 Stock Movements', show: true },
    { to: '/analytics',      label: '📈 Analytics',       show: perms.canViewAnalytics },
    { to: '/reports',        label: '📋 Reports',         show: perms.canViewReports },
    { to: '/approvals',      label: '✅ Approvals',       show: perms.canViewApprovals },
    { to: '/notifications',  label: '🔔 Notifications',   show: true },
    { to: '/users',          label: '👥 User Management', show: perms.canViewUsers },
  ].filter(item => item.show);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<ActivityItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [notifCount, setNotifCount] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (activityRef.current && !activityRef.current.contains(e.target as Node)) setShowActivity(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch recent activity from stock movements + approvals
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [movRes, appRes] = await Promise.all([
          apiClient.get('/stock-movements/?page_size=5'),
          apiClient.get('/approvals/?page_size=5'),
        ]);
        const moves: ActivityItem[] = (movRes.data.results || []).map((m: any) => ({
          id: m.id,
          time: new Date(m.created_at || m.timestamp || Date.now()).toLocaleTimeString(),
          text: `Stock ${m.movement_type || 'movement'}: ${m.product_name || m.product || 'item'} × ${m.quantity}`,
          icon: '🔄',
        }));
        const approvals: ActivityItem[] = (appRes.data.results || []).map((a: any) => ({
          id: a.id,
          time: new Date(a.created_at || Date.now()).toLocaleTimeString(),
          text: `Approval ${a.status || 'pending'}: ${a.request_type || 'request'} #${a.id}`,
          icon: '✅',
        }));
        const combined = [...moves, ...approvals].slice(0, 8);
        setActivity(combined);

        // Notifications = pending approvals + low stock alerts
        const pending = (appRes.data.results || []).filter((a: any) => a.status === 'PENDING');
        const notifs: ActivityItem[] = pending.map((a: any) => ({
          id: a.id,
          time: new Date(a.created_at || Date.now()).toLocaleTimeString(),
          text: `Pending approval: ${a.request_type || 'request'} #${a.id}`,
          icon: '🔔',
        }));
        setNotifications(notifs);
        setNotifCount(notifs.length);
      } catch {
        // silently fail
      }
    };
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setSearchResults(allSearchItems.filter(i => i.label.toLowerCase().includes(q)));
  }, [searchQuery]);

  const bg = darkMode ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-900';
  const sidebarBg = darkMode ? 'bg-slate-800' : 'bg-white border-r border-gray-200';
  const topbarBg = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const dropdownBg = darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200';
  const hoverBg = darkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-100';
  const textMuted = darkMode ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bg} flex`}>
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static z-30 h-full w-64 ${sidebarBg} flex flex-col transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className={`px-6 py-5 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between`}>
          <h2 className="text-lg font-bold text-emerald-400">Warehouse System</h2>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm font-medium transition ${
                  isActive ? 'bg-emerald-500 text-white' : darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={`px-4 py-4 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            {user?.username} <span className="text-emerald-400">({user?.role})</span>
          </p>
          <button
            onClick={logout}
            className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 rounded transition"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navbar */}
        <header className={`${topbarBg} border-b px-4 py-2 flex items-center gap-3 sticky top-0 z-10`}>
          {/* Mobile hamburger */}
          <button onClick={() => setSidebarOpen(true)} className={`md:hidden ${textMuted} hover:text-white text-xl mr-1`}>☰</button>
          <span className="md:hidden text-emerald-400 font-bold text-sm">Warehouse System</span>

          {/* Search */}
          <div className="relative flex-1 max-w-sm" ref={searchRef}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <span className={textMuted}>🔍</span>
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                className={`bg-transparent outline-none text-sm w-full ${darkMode ? 'text-white placeholder-slate-400' : 'text-gray-800 placeholder-gray-400'}`}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className={textMuted}>✕</button>
              )}
            </div>
            {showSearch && searchResults.length > 0 && (
              <div className={`absolute top-10 left-0 w-full rounded-lg border ${dropdownBg} shadow-lg overflow-hidden z-50`}>
                {searchResults.map(r => (
                  <button
                    key={r.to}
                    onClick={() => { navigate(r.to); setShowSearch(false); setSearchQuery(''); }}
                    className={`w-full text-left px-4 py-2 text-sm ${hoverBg} transition`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">

            {/* Dark/Light toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'} transition text-lg`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Recent Activity */}
            <div className="relative" ref={activityRef}>
              <button
                onClick={() => { setShowActivity(!showActivity); setShowNotifications(false); setShowProfile(false); }}
                title="Recent Activity"
                className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'} transition text-lg`}
              >
                🕐
              </button>
              {showActivity && (
                <div className={`absolute right-0 top-11 w-80 rounded-lg border ${dropdownBg} shadow-xl z-50`}>
                  <div className={`px-4 py-2 border-b ${darkMode ? 'border-slate-600' : 'border-gray-200'} font-semibold text-sm`}>
                    Recent Activity
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {activity.length === 0 ? (
                      <p className={`px-4 py-3 text-sm ${textMuted}`}>No recent activity.</p>
                    ) : activity.map(a => (
                      <div key={a.id} className={`px-4 py-2.5 border-b ${darkMode ? 'border-slate-600' : 'border-gray-100'} ${hoverBg} transition`}>
                        <p className="text-sm">{a.icon} {a.text}</p>
                        <p className={`text-xs ${textMuted} mt-0.5`}>{a.time}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { navigate('/stock-movements'); setShowActivity(false); }}
                    className="w-full text-center text-xs text-emerald-400 hover:text-emerald-300 py-2 transition"
                  >
                    View all stock movements →
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowActivity(false); setShowProfile(false); }}
                title="Notifications"
                className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'} transition text-lg relative`}
              >
                🔔
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {notifCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className={`absolute right-0 top-11 w-80 rounded-lg border ${dropdownBg} shadow-xl z-50`}>
                  <div className={`px-4 py-2 border-b ${darkMode ? 'border-slate-600' : 'border-gray-200'} font-semibold text-sm`}>
                    Notifications
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className={`px-4 py-3 text-sm ${textMuted}`}>No new notifications.</p>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`px-4 py-2.5 border-b ${darkMode ? 'border-slate-600' : 'border-gray-100'} ${hoverBg} transition`}>
                        <p className="text-sm">{n.icon} {n.text}</p>
                        <p className={`text-xs ${textMuted} mt-0.5`}>{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { navigate('/notifications'); setShowNotifications(false); setNotifCount(0); }}
                    className="w-full text-center text-xs text-emerald-400 hover:text-emerald-300 py-2 transition"
                  >
                    View all notifications →
                  </button>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowActivity(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'} transition`}
              >
                <span className="text-lg">👤</span>
                <span className="text-sm font-medium hidden sm:block">{user?.username}</span>
              </button>
              {showProfile && (
                <div className={`absolute right-0 top-11 w-64 rounded-lg border ${dropdownBg} shadow-xl z-50`}>
                  <div className={`px-4 py-3 border-b ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                    <p className="font-semibold text-sm">{user?.username}</p>
                    <p className={`text-xs ${textMuted}`}>{user?.email}</p>
                    <span className="inline-block mt-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{user?.role}</span>
                  </div>
                  <div className="px-2 py-2 space-y-1">
                    <div className={`px-3 py-2 rounded text-sm ${textMuted}`}>
                      📧 {user?.email || 'No email'}
                    </div>
                    <div className={`px-3 py-2 rounded text-sm ${textMuted}`}>
                      🏢 {user?.department || 'No department'}
                    </div>
                    <div className={`px-3 py-2 rounded text-sm ${textMuted}`}>
                      📱 {user?.phone || 'No phone'}
                    </div>
                  </div>
                  <div className={`px-2 py-2 border-t ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                    <button
                      onClick={() => { logout(); setShowProfile(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition"
                    >
                      🚪 Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
