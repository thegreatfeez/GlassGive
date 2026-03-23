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
import { authService } from '../services/authService';

import charityIcon from '../assets/icon/charity-icon.svg';
import connectWalletIcon from '../assets/icon/connectWallet-icon.svg';
import googleIcon from '../assets/icon/google-icon.svg';
import hederaIcon from '../assets/icon/hedera-icon.png';

const Login: NextPage = () => {
  const { openConnectModal } = useConnectModal();
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  // Initialize Magic on the client side
  const [magic, setMagic] = useState<Magic | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pk = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'pk_live_your_magic_key_here';
      setMagic(new Magic(pk));
    }
  }, []);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace('/');
    }
  }, [router]);

  // Handle Wallet Login after connection
  useEffect(() => {
    const performWalletLogin = async () => {
      if (!isConnected || !address || authService.isAuthenticated() || loading) return;

      // Ensure the wallet is on the Hedera Testnet (296) before requesting a signature
      if (chain?.id !== 296) {
        console.log('Waiting for network switch to Hedera Testnet...');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const message = `Sign this message to log in to GlassGive: ${new Date().toISOString()}`;
        const signature = await signMessageAsync({ message });
        
        await authService.loginWithWallet(address, signature);
        toast.success('Wallet connected!');
        router.push('/');
      } catch (err: any) {
        toast.error('Wallet login failed.');
        console.error('Wallet login failed:', err);
        setError(err.message || 'Failed to sign in with wallet');
        setLoading(false);
      }
    };

    performWalletLogin();
  }, [isConnected, address, chain, signMessageAsync, router, loading]);

  const handleMagicLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!magic || !email) return;
    
    setLoading(true);
    setError(null);
    try {
      const didToken = await magic.auth.loginWithMagicLink({ email });
      if (didToken) {
        await authService.loginWithMagic(didToken);
        toast.success('Logged in with Magic Link!');
        router.push('/');
      }
    } catch (err: any) {
      toast.error('Magic login failed.');
      console.error('Magic login failed:', err);
      setError(err.message || 'Magic login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>GlassGive — Login</title>
      </Head>

      <div className="min-h-screen bg-slate-50">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3 text-slate-900">
            <Image src={charityIcon} alt="GlassGive" className="h-8 w-8" />
            <span className="text-base font-semibold">GlassGive</span>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="bg-slate-50 px-8 py-8 text-center">
              <h1 className="text-2xl font-semibold text-slate-900">
                Welcome Back
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Securely access your charity tracking dashboard
              </p>
            </div>

            <div className="space-y-6 px-8 py-8 text-center">
              <p className="text-sm text-slate-500">
                Experience seamless giving with account abstraction technology.
                No complex seed phrases required.
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Platform admins should use the{' '}
                <Link href="/admin/login" className="font-semibold text-blue-600">
                  admin login portal
                </Link>
                .
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600">
                  {error}
                </div>
              )}

              <button
                className={`btn-accent flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => openConnectModal?.()}
                disabled={loading}
                type="button"
              >
                <Image
                  src={connectWalletIcon}
                  alt=""
                  className="h-5 w-5"
                />
                {loading ? 'Processing...' : 'Connect Wallet'}
              </button>

              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                OR
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={handleMagicLogin} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
                    disabled={loading}
                  />
                </div>
                <button
                  className={`flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 ${loading ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                  disabled={loading || !email}
                  type="submit"
                >
                  <span className="text-lg">✉️</span>
                  {loading ? 'Sending Magic Link...' : 'Continue with Email'}
                </button>
              </form>

              <p className="text-xs text-slate-500">
                New to GlassGive?{' '}
                <Link href="/" className="font-semibold text-blue-600">
                  Learn more
                </Link>{' '}
                about how we use Hedera.
              </p>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-slate-50 px-6 py-8 text-center text-xs text-slate-400">
          <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Powered by
            <span className="flex items-center gap-2 text-slate-600 normal-case tracking-normal">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200">
                <Image src={hederaIcon} alt="Hedera" className="h-4 w-4" />
              </span>
              Hedera Hashgraph
            </span>
          </div>
          <p>© 2024 Charity Tracker Protocol. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
};

export default Login;
