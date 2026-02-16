import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FileText, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { getRoleHomePath } from '../../lib/roleHome';

type NavItem = {
    to: string;
    label: string;
    show: boolean;
};

function linkClassName({ isActive }: { isActive: boolean }) {
    return [
        'px-3 py-2 rounded-md text-sm font-medium transition',
        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    ].join(' ');
}

export const AuthenticatedLayout: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [mobileOpen, setMobileOpen] = useState(false);

    const role = user?.role ?? null;
    const homePath = getRoleHomePath(role);

    const navItems: NavItem[] = useMemo(() => {
        const isAdmin = role === 'ADMIN';
        const isRecruiter = role === 'RECRUITER' || isAdmin;
        const isPremium = user?.isPremium === true;

        return [
            { to: '/dashboard', label: 'My Resumes', show: true },
            { to: '/editor', label: 'Create', show: true },
            { to: '/payment', label: 'Upgrade', show: !isPremium },
            { to: '/recruiter', label: 'Talent Search', show: isRecruiter },
            { to: '/admin', label: 'Admin', show: isAdmin },
            { to: '/jobs', label: 'Job Tracker', show: true },
            { to: '/settings', label: 'Settings', show: true },
        ];
    }, [role, user?.isPremium]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <NavLink to={homePath} className="flex items-center gap-2 text-gray-900 hover:text-gray-900">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="font-bold">HandisCV</span>
                        </NavLink>

                        <nav className="hidden lg:flex items-center gap-1 ml-2">
                            {navItems
                                .filter((i) => i.show)
                                .map((i) => (
                                    <NavLink key={i.to} to={i.to} className={linkClassName}>
                                        {i.label}
                                    </NavLink>
                                ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
                            {user?.email && (
                                <span className="max-w-[240px] truncate" title={user.email}>
                                    {user.email}
                                </span>
                            )}
                            {role && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                                    {role}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                            title="Log out"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>

                        <button
                            onClick={() => setMobileOpen((v) => !v)}
                            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100"
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="lg:hidden border-t border-gray-200 bg-white">
                        <div className="px-4 py-3 space-y-1">
                            {navItems
                                .filter((i) => i.show)
                                .map((i) => (
                                    <NavLink
                                        key={i.to}
                                        to={i.to}
                                        onClick={() => setMobileOpen(false)}
                                        className={({ isActive }) =>
                                            [
                                                'block px-3 py-2 rounded-md text-sm font-medium',
                                                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100',
                                            ].join(' ')
                                        }
                                    >
                                        {i.label}
                                    </NavLink>
                                ))}

                            <div className="pt-2 mt-2 border-t border-gray-100">
                                {user?.email && <div className="px-3 py-2 text-sm text-gray-600 truncate">{user.email}</div>}
                                <button
                                    onClick={() => {
                                        setMobileOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1 min-h-0 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
