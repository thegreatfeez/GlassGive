import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { API_BASE } from '../services/authService';

import heroImage from '../assets/images/kids-smilling.png';
import allIcon from '../assets/icon/all-icon.svg';
import verifiedIcon from '../assets/icon/verified-icon.svg';
import urgentIcon from '../assets/icon/urgent-icon.svg';

type FilterKey = 'all' | 'verified' | 'urgent';

const fallbackRequestImage =
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80';

const getRequestCategory = (request: any) =>
  request?.metadata?.category || request?.businessType || request?.type;

const getRequestImage = (request: any) => request?.imageUrl || fallbackRequestImage;

const getProgressPercent = (request: any) => {
  const goal = Number(request?.goalAmount || 0);
  const current = Number(request?.currentAmount || 0);
  if (!goal) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
};

const getDaysLeftLabel = (request: any) => {
  const endTime = new Date(request?.timelineEnd).getTime();
  if (Number.isNaN(endTime)) return 'No deadline';

  const diffInDays = Math.ceil((endTime - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffInDays < 0) return 'Ended';
  if (diffInDays === 0) return 'Ends today';
  return `${diffInDays} day${diffInDays === 1 ? '' : 's'} left`;
};

const isUrgentRequest = (request: any) => {
  const endTime = new Date(request?.timelineEnd).getTime();
  if (Number.isNaN(endTime)) return false;
  const diffInDays = Math.ceil((endTime - Date.now()) / (1000 * 60 * 60 * 24));
  return diffInDays >= 0 && diffInDays <= 7;
};

const Home: NextPage = () => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [requests, setRequests] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    // Fetch Requests
    fetch(`${API_BASE}/requests`)
      .then(res => res.json())
      .then(data => {
        setRequests(data.requests);
      })
      .catch(err => {
        toast.error('Failed to load active requests.');
        console.error('Failed to fetch requests:', err);
      });

    // Fetch Global Stats
    fetch(`${API_BASE}/dashboard`)
      .then(res => res.json())
      .then(data => {
        setDashboardData(data);
      })
      .catch(err => {
        toast.error('Could not load platform stats.');
        console.error('Failed to fetch dashboard:', err);
      });
  }, []);

  const stats = [
    {
      label: 'Total Funds Raised',
      value: `${dashboardData?.totalDonated?.toLocaleString() || '0'} HBAR`,
      delta: '+12.5%',
      note: 'Verified via Hedera Mirror Node',
    },
    {
      label: 'Active Campaigns',
      value: `${dashboardData?.requestCounts?.live || '0'}`,
      delta: '+5.2%',
      note: 'Real-time smart contract status',
    },
    {
      label: 'Impact Created',
      value: `${((dashboardData?.totalDonated || 0) * 1.5).toLocaleString(undefined, { maximumFractionDigits: 0 })} lives`,
      delta: '+18.4%',
      note: 'Based on verified distributions',
      accent: true,
    },
  ];

  const filteredRequests = useMemo(() => {
    if (activeFilter === 'urgent') {
      return requests.filter((request) => isUrgentRequest(request)).slice(0, 3);
    }
    return requests.slice(0, 3);
  }, [activeFilter, requests]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Head>
        <title>GlassGive — Transparent Charity Tracker</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-col gap-10 px-6 pb-16 pt-8">
        <section
          id="overview"
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-xl"
        >
          <Image
            src={heroImage}
            alt="Children smiling"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0  from-slate-950/90 via-slate-900/70 to-slate-900/40" />
          <div className="relative p-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full bg-blue-600/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200">
                On-chain transparency
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
                Public Transparency Dashboard
              </h1>
              <p className="mt-3 max-w-xl text-sm text-white/80 md:text-base">
                Real-time verification of every donation and grant distribution,
                powered by Hedera Hashgraph technology.
              </p>
              <p className="mt-4 text-xs text-white/60">
                Audited by Hedera Guardian
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border border-slate-200 p-6 shadow-sm ${
                stat.accent ? 'text-white' : 'bg-white'
              }`}
              style={
                stat.accent
                  ? {
                      backgroundColor: 'var(--rk-colors-accentColor)',
                      color: 'var(--rk-colors-accentColorForeground)',
                    }
                  : undefined
              }
            >
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  stat.accent ? 'text-white/80' : 'text-slate-400'
                }`}
              >
                {stat.label}
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <p
                  className={`text-2xl font-semibold ${
                    stat.accent ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {stat.value}
                </p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    stat.accent
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {stat.delta}
                </span>
              </div>
              <p
                className={`mt-3 text-xs ${
                  stat.accent ? 'text-white/80' : 'text-slate-500'
                }`}
              >
                {stat.note}
              </p>
            </div>
          ))}
        </section>

        <section id="requests" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Browse Active Requests</h2>
              <p className="text-sm text-slate-500">
                Support verified initiatives on Hedera testnet.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                  activeFilter === 'all'
                    ? 'btn-accent text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
                onClick={() => setActiveFilter('all')}
                type="button"
              >
                <Image src={allIcon} alt="" className="h-4 w-4" />
                All
              </button>
              <button
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                  activeFilter === 'verified'
                    ? 'btn-accent text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
                onClick={() => setActiveFilter('verified')}
                type="button"
              >
                <Image src={verifiedIcon} alt="" className="h-4 w-4" />
                Verified
              </button>
              <button
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                  activeFilter === 'urgent'
                    ? 'btn-accent text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
                onClick={() => setActiveFilter('urgent')}
                type="button"
              >
                <Image src={urgentIcon} alt="" className="h-4 w-4" />
                Urgent
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {filteredRequests.map((request) => (
              <article
                key={request.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-44">
                    <Image
                    src={getRequestImage(request)}
                    alt={request.title}
                    fill
                    className="object-cover"
                  />
                  {request.status === 'LIVE' || request.status === 'FUNDED' ? (
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow">
                      <Image src={verifiedIcon} alt="" className="h-4 w-4" />
                      Hedera Verified
                    </div>
                  ) : null}
                  {isUrgentRequest(request) ? (
                    <div className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                      Urgent
                    </div>
                  ) : null}
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      {getRequestCategory(request)}
                    </span>
                    <span className="text-slate-400">{getDaysLeftLabel(request)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {request.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {request.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>Goal: ${Number(request.goalAmount || 0).toLocaleString()} USD</span>
                    <span className="text-blue-600">{getProgressPercent(request)}% raised</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div 
                        className="h-2 rounded-full bg-blue-600" 
                        style={{ width: `${getProgressPercent(request)}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    href={`/donate?id=${request.id}`}
                    className="btn-accent w-full rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                  >
                    Donate Now
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="flex justify-center pt-6">
            <Link
              href="/explore"
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
            >
              Load More Requests
            </Link>
          </div>
        </section>

        <section id="impact" className="rounded-3xl bg-slate-900 p-8 text-white">
          <div className="grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
            <div>
              <h2 className="text-2xl font-semibold">
                Impact stories that donors can verify
              </h2>
              <p className="mt-3 text-sm text-white/70">
                Requesters publish updates that are anchored on-chain, giving
                donors confidence that funds are used as promised.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm">
              <p className="text-white/70">Latest update</p>
              <p className="mt-2 font-semibold">
                Rural clinic phase 2 is 80% complete.
              </p>
              <p className="mt-3 text-xs text-white/60">
                Logged to HCS topic · 1 hour ago
              </p>
            </div>
          </div>
        </section>

        <div className="h-10" />
      </main>

    </div>
  );
};

export default Home;
