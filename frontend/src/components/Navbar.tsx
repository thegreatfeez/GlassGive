import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDisconnect } from 'wagmi';
import { authService, User } from '../services/authService';

import charityIcon from '../assets/icon/charity-icon.svg';
import notificationIcon from '../assets/icon/notification-icon.svg';
import profileIcon from '../assets/icon/profile-icon.svg';

export default function Navbar() {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateAuth = () => {
      setUser(authService.getUser());
      setIsAuthenticated(authService.isAuthenticated());
    };
    
    updateAuth();
    window.addEventListener('gg-auth-changed', updateAuth);
    return () => window.removeEventListener('gg-auth-changed', updateAuth);
  }, []);

  const handleLogout = () => {
    authService.logout();
    disconnect();
    router.push('/');
  };

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Explore', href: '/explore' },
  ];

  if (isAuthenticated) {
    navItems.push({ label: 'Dashboard', href: '/dashboard' });
    if (user?.role === 'ADMIN') {
      navItems.push({ label: 'Admin Panel', href: '/dashboard/admin' });
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
            <Image src={charityIcon} alt="GlassGive" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">GlassGive</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`group inline-flex items-center gap-2 pb-2 -mb-2 transition hover:text-slate-900 ${
                router.pathname === item.href
                  ? 'text-blue-600 underline underline-offset-8 decoration-2 decoration-blue-600'
                  : 'text-slate-600'
              }`}
              aria-current={router.pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={isAuthenticated ? "/requests/charity" : "/login"}
            className="btn-accent hidden rounded-full px-4 py-2 text-sm font-semibold shadow-sm md:inline-flex"
          >
            Submit Request
          </Link>
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 uppercase">
                {user?.role || 'USER'}
              </span>
              <button
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300"
                onClick={handleLogout}
                type="button"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-accent hidden rounded-full px-4 py-2 text-sm font-semibold shadow-sm md:inline-flex"
            >
              Login
            </Link>
          )}
          {/* <button
            className="hidden items-center justify-center rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:border-slate-300 md:inline-flex"
            aria-label="Notifications"
          >
            <Image src={notificationIcon} alt="" className="h-5 w-5" />
          </button>
          <button
            className="hidden items-center justify-center rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:border-slate-300 md:inline-flex"
            aria-label="Profile"
          >
            <Image src={profileIcon} alt="" className="h-5 w-5" />
          </button> */}
        </div>
      </div>
    </header>
  );
}
