import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import { API_BASE } from '../services/authService';
import { useCampaign } from '../hooks/useCampaign';

import cardImageOne from '../assets/images/card1.png';
import verifiedIcon from '../assets/icon/verified-icon.svg';
import trustIcon from '../assets/icon/trust-icon.svg';

const presetAmounts = [10, 50, 100, 500];
const HBAR_PRICE_USD = 0.04; // Mock price for conversion: 1 HBAR ≈ $0.04
const MIN_DONATION_USD = 0.01;

const Donate: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  
  const [amountUsdInput, setAmountUsdInput] = useState('0');
  const [request, setRequest] = useState<any>(null);
  const [hbarPrice, setHbarPrice] = useState(0.04); // Default fallback
  const [loading, setLoading] = useState(true);

  // Initialize campaign hook
  const { donate, isPending, isConfirmed, error } = useCampaign(request?.contractAddress as `0x${string}`);

  useEffect(() => {
    // Fetch live HBAR price
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd')
      .then(res => res.json())
      .then(data => {
        if (data?.['hedera-hashgraph']?.usd) {
          setHbarPrice(data['hedera-hashgraph'].usd);
        }
      })
      .catch(err => console.error('Failed to fetch HBAR price:', err));

    if (id) {
      setLoading(true);
      fetch(`${API_BASE}/requests/${id}`)
        .then(res => res.json())
        .then(data => {
          setRequest(data.request);
          setLoading(false);
        })
        .catch(err => {
          toast.error('Failed to load campaign. Check your connection.');
          console.error('Failed to fetch request:', err);
          setLoading(false);
        });
    }
  }, [id]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success('Donation confirmed on Hedera hashgraph!', { id: 'donate-tx' });
    }
  }, [isConfirmed]);

  const amountUsd = Number.parseFloat(amountUsdInput);
  const amountUsdValue = Number.isFinite(amountUsd) ? amountUsd : 0;
  const hbarAmount = (amountUsdValue / hbarPrice).toFixed(2);

  const handleDonate = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (!request?.contractAddress) {
      toast.error("This campaign is not yet active on-chain.");
      return;
    }

    if (!Number.isFinite(amountUsd) || amountUsd < MIN_DONATION_USD) {
      toast.error('Donation amount must be greater than $0.');
      return;
    }

    try {
      toast.loading('Confirming in wallet...', { id: 'donate-tx' });
      await donate(hbarAmount);
    } catch (err) {
      toast.error('Donation failed. Please try again.', { id: 'donate-tx' });
      console.error('Donation failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading campaign details...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Campaign not found.
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>GlassGive — Donate to {request.title}</title>
      </Head>

      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                <Image src={request.imageUrl || cardImageOne} alt="" fill className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  You are donating to:
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-900">
                  {request.title}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  📍 {request.purpose}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-center text-2xl font-semibold text-slate-900">
              Enter Donation Amount
            </h2>

            <div className="mt-6">
              <label className="text-sm font-semibold text-slate-600">
                Amount in USD
              </label>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="text-2xl font-semibold text-slate-400">$</span>
                <input
                  type="number"
                  value={amountUsdInput}
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  onFocus={(event) => event.target.select()}
                  onChange={(event) => {
                    const rawValue = event.target.value;
                    if (rawValue === '') {
                      setAmountUsdInput('');
                      return;
                    }
                    if (!/^\d*\.?\d*$/.test(rawValue)) {
                      return;
                    }
                    setAmountUsdInput(rawValue);
                  }}
                  onBlur={() => {
                    if (!Number.isFinite(amountUsd) || amountUsd < 0) {
                      setAmountUsdInput('0');
                    }
                  }}
                  className="w-full bg-transparent text-3xl font-semibold text-slate-900 focus:outline-none"
                />
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                  USD
                </span>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-slate-500">
              ≈ {Number(hbarAmount).toLocaleString()} HBAR
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountUsdInput(String(preset))}
                  className={`rounded-2xl border px-4 py-3 text-center text-base font-semibold transition ${
                    amountUsdValue === preset
                      ? 'border-blue-600 text-blue-600 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Image src={verifiedIcon} alt="" className="h-5 w-5" />
                  <span>97% goes to Project</span>
                </div>
                <span className="font-semibold text-slate-900">
                  ${(amountUsdValue * 0.97).toFixed(2)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Image src={trustIcon} alt="" className="h-5 w-5" />
                  <span>3% Protocol Fee</span>
                </div>
                <span className="font-semibold text-slate-900">
                  ${(amountUsdValue * 0.03).toFixed(2)}
                </span>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
                  <span>Total Payment</span>
                  <span className="text-blue-600">
                    ${amountUsdValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">
                Error: {error.message}
              </div>
            )}

            <button
              className={`btn-accent mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-base font-semibold shadow-lg transition ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleDonate}
              disabled={isPending || !Number.isFinite(amountUsd) || amountUsd < MIN_DONATION_USD}
              type="button"
            >
              {isPending ? 'Processing...' : isConfirmed ? 'Donation Complete!' : 'Confirm Donation →'}
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              Secure transaction via Hedera Hashgraph. Your donation is fully
              traceable on-chain for maximum transparency.
            </p>
          </section>
        </div>
      </main>
    </>
  );
};

export default Donate;
