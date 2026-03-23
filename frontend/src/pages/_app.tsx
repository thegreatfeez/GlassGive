import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { config } from '../wagmi';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { authService } from '../services/authService';
import { Toaster } from 'react-hot-toast';

const client = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdminLoginRoute = router.pathname === '/admin/login';
  const hideFooter = router.pathname === '/login' || isAdminLoginRoute;
  const hideNavbar = router.pathname === '/login' || isAdminLoginRoute;
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isAuthed = authService.isAuthenticated();
    const isPublicRoute =
      router.pathname === '/' ||
      router.pathname === '/login' ||
      isAdminLoginRoute;
    if (!isAuthed && !isPublicRoute) {
      setShowAuthModal(true);
      router.replace(router.pathname.startsWith('/admin') ? '/admin/login' : '/');
    }
  }, [isAdminLoginRoute, router]);

  useEffect(() => {
    const handler = () => setShowAuthModal(true);
    window.addEventListener('gg-auth-required', handler);
    return () => window.removeEventListener('gg-auth-required', handler);
  }, []);

  useEffect(() => {
    if (router.pathname === '/login' || isAdminLoginRoute) {
      setShowAuthModal(false);
    }
  }, [isAdminLoginRoute, router.pathname]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
          {!hideNavbar && <Navbar />}
          <Toaster position="top-right" />
          <Component {...pageProps} />
          {!hideFooter && <Footer />}
          {showAuthModal && router.pathname === '/' && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-6">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
                <h2 className="text-xl font-semibold text-slate-900">
                  Login required
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Please log in to access this page or continue with your
                  donation.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    className="btn-accent rounded-full px-4 py-2 text-sm font-semibold"
                    onClick={() => {
                      setShowAuthModal(false);
                      router.push('/login');
                    }}
                    type="button"
                  >
                    Go to Login
                  </button>
                  <button
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                    onClick={() => setShowAuthModal(false)}
                    type="button"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          )}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
