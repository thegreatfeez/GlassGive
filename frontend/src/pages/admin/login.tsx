import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { Magic } from 'magic-sdk';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

import charityIcon from '../../assets/icon/charity-icon.svg';
import connectWalletIcon from '../../assets/icon/connectWallet-icon.svg';
import hederaIcon from '../../assets/icon/hedera-icon.png';

const AdminLogin: NextPage = () => {
  const { openConnectModal } = useConnectModal();
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [magic, setMagic] = useState<Magic | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pk = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'pk_live_your_magic_key_here';
      setMagic(new Magic(pk));
    }
  }, []);

  useEffect(() => {
    const user = authService.getUser();
    if (!user) return;

    if (user.role === 'ADMIN') {
      router.replace('/dashboard/admin');
      return;
    }

    authService.logout();
    setError('Your current session is not an admin account.');
  }, [router]);

  useEffect(() => {
    const performAdminWalletLogin = async () => {
      if (!isConnected || !address || authService.isAuthenticated() || loading) return;

      if (chain?.id !== 296) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const message = `Sign this message to log in to the GlassGive admin portal: ${new Date().toISOString()}`;
        const signature = await signMessageAsync({ message });

        await authService.loginAdminWithWallet(address, signature);
        toast.success('Admin login successful.');
        router.push('/dashboard/admin');
      } catch (err: any) {
        const message = err.message || 'Failed to sign in as admin';
        toast.error(message);
        setError(message);
        setLoading(false);
      }
    };

    performAdminWalletLogin();
  }, [address, chain, isConnected, loading, router, signMessageAsync]);

  const handleMagicLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!magic || !email) return;

    setLoading(true);
    setError(null);

    try {
      const didToken = await magic.auth.loginWithMagicLink({ email });
      if (didToken) {
        await authService.loginAdminWithMagic(didToken);
        toast.success('Admin login successful.');
        router.push('/dashboard/admin');
      }
    } catch (err: any) {
      const message = err.message || 'Admin Magic login failed';
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>GlassGive - Admin Login</title>
      </Head>

      <div className="min-h-screen bg-slate-950">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
          <div className="flex items-center gap-3 text-white">
            <Image src={charityIcon} alt="GlassGive" className="h-8 w-8" />
            <div>
              <span className="block text-base font-semibold">GlassGive</span>
              <span className="text-xs uppercase tracking-[0.25em] text-emerald-300">Admin Portal</span>
            </div>
          </div>
          <Link href="/login" className="text-sm font-semibold text-slate-300 transition hover:text-white">
            Standard Login
          </Link>
        </header>

        <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-2xl">
            <div className="border-b border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_55%)] px-8 py-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Restricted Access</p>
              <h1 className="mt-3 text-3xl font-semibold">Admin Sign In</h1>
              <p className="mt-2 text-sm text-slate-400">
                Only accounts with the admin role can continue past this point.
              </p>
            </div>

            <div className="space-y-6 px-8 py-8">
              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:bg-emerald-300 ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={() => openConnectModal?.()}
                disabled={loading}
                type="button"
              >
                <Image src={connectWalletIcon} alt="" className="h-5 w-5" />
                {loading ? 'Processing...' : 'Connect Admin Wallet'}
              </button>

              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                <span className="h-px flex-1 bg-slate-800" />
                Or
                <span className="h-px flex-1 bg-slate-800" />
              </div>

              <form onSubmit={handleMagicLogin} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300">Admin Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="admin@glassgive.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    disabled={loading}
                  />
                </div>
                <button
                  className={`w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                  disabled={loading || !email}
                  type="submit"
                >
                  {loading ? 'Sending Magic Link...' : 'Continue as Admin'}
                </button>
              </form>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-800 bg-slate-950 px-6 py-8 text-center text-xs text-slate-500">
          <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
            Secured By
            <span className="flex items-center gap-2 text-slate-300 normal-case tracking-normal">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800">
                <Image src={hederaIcon} alt="Hedera" className="h-4 w-4" />
              </span>
              Hedera Hashgraph
            </span>
          </div>
          <p>Admin access is audited and limited to approved platform operators.</p>
        </footer>
      </div>
    </>
  );
};

export default AdminLogin;
