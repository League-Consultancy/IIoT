
import React, { useState, useEffect } from 'react';
import { User, UserRole, Page } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  title: string;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  title, 
  currentPage, 
  onNavigate 
}) => {
  const [isDark, setIsDark] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const getIcon = (page: Page) => {
    switch(page) {
        case 'dashboard': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />;
        case 'factories': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />;
        case 'devices': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />;
        case 'ota': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />;
        case 'admin': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />;
        case 'notifications': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />;
        default: return null;
    }
  }
  
  const NavItem = ({ page, label, restrictedTo, mobile }: { page: Page; label: string, restrictedTo?: UserRole[], mobile?: boolean }) => {
    if (restrictedTo && !restrictedTo.includes(user.role)) return null;

    const isActive = currentPage === page;
    const baseClass = "flex items-center px-4 py-3 rounded-lg font-medium transition-all cursor-pointer w-full mb-1 mx-auto";
    const activeClass = "bg-brand-50 text-brand-600 dark:bg-brand-600 dark:text-white shadow-sm ring-1 ring-brand-200 dark:ring-0";
    const inactiveClass = "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white";
    
    // For mobile menu, we always want expanded view. For desktop, we check state.
    const isCollapsed = mobile ? false : isSidebarCollapsed;
    const justifyContent = isCollapsed ? 'justify-center' : 'justify-start';

    return (
      <button 
        onClick={() => {
            onNavigate(page);
            if (mobile) setIsMobileMenuOpen(false);
        }}
        className={`${baseClass} ${isActive ? activeClass : inactiveClass} ${justifyContent}`}
        title={isCollapsed ? label : ''}
      >
        <svg className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
           {getIcon(page)}
        </svg>
        {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-sm">{label}</span>}
      </button>
    );
  };

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="relative z-50 md:hidden" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity opacity-100" onClick={() => setIsMobileMenuOpen(false)}></div>

            <div className="fixed inset-0 flex">
                <div className="relative mr-16 flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-slate-800 transition-transform transform translate-x-0">
                    
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button type="button" className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setIsMobileMenuOpen(false)}>
                            <span className="sr-only">Close sidebar</span>
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex h-16 shrink-0 items-center px-4 border-b border-gray-100 dark:border-slate-700">
                         <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30">
                                I
                            </div>
                            <div className="ml-3">
                                <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-none">IIoT Cloud</h1>
                                <p className="text-[10px] uppercase font-semibold text-brand-500 tracking-wider mt-0.5">Enterprise</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                        <NavItem page="dashboard" label="Dashboard" mobile />
                        <NavItem page="factories" label="Factories" mobile />
                        <NavItem page="devices" label="Devices" mobile />
                        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-700">
                            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Administration</p>
                            <NavItem page="ota" label="OTA Manager" restrictedTo={[UserRole.PROGRAMMER, UserRole.ADMIN]} mobile />
                            <NavItem page="admin" label="Settings" restrictedTo={[UserRole.ADMIN]} mobile />
                        </div>
                    </nav>

                    <div className="border-t border-gray-100 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-800/50">
                        <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-md">
                            {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-white truncate">{user.email.split('@')[0]}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">View Profile</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 text-slate-900 dark:text-white flex-shrink-0 hidden md:flex flex-col transition-all duration-300 ease-in-out relative z-30 shadow-sm`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors duration-300">
           {/* Logo Icon */}
            <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30">
                    I
                </div>
                {!isSidebarCollapsed && (
                    <div className="ml-3 overflow-hidden">
                        <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-white leading-none">IIoT Cloud</h1>
                        <p className="text-[10px] uppercase font-semibold text-brand-500 tracking-wider mt-0.5">Enterprise</p>
                    </div>
                )}
            </div>
        </div>
        
        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
          <NavItem page="dashboard" label="Dashboard" />
          <NavItem page="factories" label="Factories" />
          <NavItem page="devices" label="Devices" />
          
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-700">
            <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
                Administration
            </p>
            <NavItem 
              page="ota" 
              label="OTA Manager" 
              restrictedTo={[UserRole.PROGRAMMER, UserRole.ADMIN]} 
            />
            <NavItem 
              page="admin" 
              label="Settings" 
              restrictedTo={[UserRole.ADMIN]} 
            />
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 transition-colors duration-300">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white shadow-md">
              {user.email.charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-semibold truncate text-slate-800 dark:text-white">{user.email.split('@')[0]}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.role}</p>
                </div>
            )}
          </div>
          <button 
            onClick={onLogout}
            className={`mt-3 w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-start pl-1'} text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors group`}
          >
            <svg className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isSidebarCollapsed && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white/80 dark:bg-slate-800/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 items-center justify-between px-6 h-16 flex-shrink-0 z-20 sticky top-0 transition-colors duration-300">
          
          {/* Title & Toggle */}
          <div className="flex items-center">
             <button 
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className="mr-4 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-700 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
             >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
             </button>
             <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h2>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl px-8">
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <svg className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                </div>
                <input 
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg leading-5 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all sm:text-sm"
                  placeholder="Search devices, factories, or logs..."
                />
             </div>
          </div>

          {/* Actions Area */}
          <div className="flex items-center space-x-3">
             {/* System Status */}
             <div className="hidden lg:flex items-center px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/30 mr-2">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">System Normal</span>
             </div>

             {/* Notifications */}
             <button 
                onClick={() => onNavigate('notifications')}
                className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
             >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>
             </button>

             <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>

             {/* Theme Toggle */}
             <button 
                onClick={toggleTheme} 
                className="p-2 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between p-4 md:hidden flex-shrink-0 z-20 transition-colors duration-300">
          <div className="flex items-center space-x-3">
             <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
             >
                <span className="sr-only">Open menu</span>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
             </button>
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">I</div>
                <span className="font-bold text-gray-800 dark:text-white">IIoT</span>
            </div>
          </div>
           <div className="flex items-center space-x-3">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button onClick={onLogout} className="text-sm font-medium text-gray-600 dark:text-gray-300">Sign Out</button>
           </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 scroll-smooth relative z-0">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
};
