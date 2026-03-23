import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authService, API_BASE } from '../services/authService';
import toast from 'react-hot-toast';

import verifiedIcon from '../assets/icon/verified-icon.svg';
import imageUploadIcon from '../assets/icon/imageUpload-icon.svg';
import fileIcon from '../assets/icon/file-icon.svg';
import trustIcon from '../assets/icon/trust-icon.svg';

const fallbackRequestImage =
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80';

const getRequestCategory = (request: any) =>
  request?.metadata?.category || request?.businessType || request?.type;

const Dashboard: NextPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('USER');

  useEffect(() => {
    const user = authService.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setUserRole(user.role);
    fetchMyDashboard();
  }, []);

  const fetchMyDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/me`, {
        headers: {
          Authorization: `Bearer ${authService.getToken()}`,
        },
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      toast.error('Could not load your impact data.');
      console.error('Failed to fetch user dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-semibold">Loading your impact...</p>
      </div>
    );
  }

  if (userRole === 'USER') {
    const myRequests = data?.requests || [];
    const liveRequests = myRequests.filter((request: any) => request.status === 'LIVE');
    const pendingRequests = myRequests.filter((request: any) => request.status === 'PENDING_VERIFICATION');

    return (
      <>
        <Head>
          <title>GlassGive - Dashboard</title>
        </Head>
        <main className="min-h-screen bg-slate-50 px-6 py-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <div className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-slate-100 p-1">
              <Link
                href="/dashboard"
                className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-blue-600 shadow-sm"
              >
                Donor Dashboard
              </Link>
              <Link
                href="/dashboard/grant"
                className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-500"
              >
                Grant Dashboard
              </Link>
              <Link
                href="/dashboard/charity"
                className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-500"
              >
                Charity Dashboard
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="space-y-2 text-sm font-semibold text-slate-600">
                  <Link href="/dashboard" className="btn-accent flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-white">
                    <Image src={verifiedIcon} alt="" className="h-4 w-4" />
                    Dashboard
                  </Link>
                </div>
              </aside>

              <section className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h1 className="text-2xl font-semibold text-slate-900">Creator Overview</h1>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    Approved charity and grant requests appear here alongside anything still waiting for review.
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Requests</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{myRequests.length}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Live On-Chain</p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-700">{liveRequests.length}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Pending Review</p>
                      <p className="mt-2 text-2xl font-semibold text-amber-700">{pendingRequests.length}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Your Requests</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        This list includes pending, approved, and already deployed campaigns.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href="/requests/charity"
                        className="btn-accent rounded-full px-4 py-2 text-sm font-semibold shadow-sm"
                      >
                        New Charity
                      </Link>
                      <Link
                        href="/requests/grant"
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
                      >
                        New Grant
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {myRequests.length > 0 ? (
                      myRequests.map((request: any) => (
                        <div key={request.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                          <div className="relative h-40">
                            <Image
                              src={request.imageUrl || fallbackRequestImage}
                              alt={request.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4">
                              <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                                {getRequestCategory(request)}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{request.title}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {request.type} · Ends {new Date(request.timelineEnd).toLocaleDateString()}
                                </p>
                              </div>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  request.status === 'LIVE'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : request.status === 'PENDING_VERIFICATION'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {request.status}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                              {request.purpose || request.description}
                            </p>
                            <div className="mt-4 grid gap-3 text-xs text-slate-500 md:grid-cols-3">
                              <div className="rounded-xl bg-white px-3 py-2">
                                <p className="font-semibold uppercase text-slate-400">Goal</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  ${Number(request.goalAmount || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="rounded-xl bg-white px-3 py-2">
                                <p className="font-semibold uppercase text-slate-400">Raised</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  ${Number(request.currentAmount || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="rounded-xl bg-white px-3 py-2">
                                <p className="font-semibold uppercase text-slate-400">Submitted</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Link
                                href={request.type === 'GRANT' ? '/dashboard/grant' : '/dashboard/charity'}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                              >
                                Open Dashboard
                              </Link>
                              <Link
                                href={`/donate?id=${request.id}`}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                              >
                                View Public Page
                              </Link>
                              {request.contractAddress && (
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-mono text-blue-600">
                                  {request.contractAddress.slice(0, 10)}...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                        <p className="text-sm text-slate-500">
                          You haven&apos;t submitted any charity or grant requests yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <h2 className="text-2xl font-semibold text-slate-900">Unlock Your Donor Dashboard</h2>
                  <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-500">
                    Make your first transparent donation to automatically upgrade to Donor status and unlock your personal impact analytics too.
                  </p>
                  <div className="mt-8 flex justify-center">
                    <Link
                      href="/explore"
                      className="btn-accent block rounded-xl px-8 py-3 text-sm font-semibold shadow-md"
                    >
                      Explore Live Campaigns
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>GlassGive - Donor Dashboard</title>
      </Head>

      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-slate-100 p-1">
            <Link
              href="/dashboard"
              className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-blue-600 shadow-sm"
            >
              Donor Dashboard
            </Link>
            <Link
              href="/dashboard/grant"
              className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-500"
            >
              Grant Dashboard
            </Link>
            <Link
              href="/dashboard/charity"
              className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-500"
            >
              Charity Dashboard
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-2 text-sm font-semibold text-slate-600">
                <Link href="/dashboard" className="btn-accent flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-white">
                  <Image src={verifiedIcon} alt="" className="h-4 w-4" />
                  Dashboard
                </Link>
                <button className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left transition hover:bg-slate-50">
                  <Image src={imageUploadIcon} alt="" className="h-4 w-4" />
                  Impact Map
                </button>
                <button className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left transition hover:bg-slate-50">
                  <Image src={fileIcon} alt="" className="h-4 w-4" />
                  Tax Receipts
                </button>
                <button className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left transition hover:bg-slate-50">
                  <Image src={trustIcon} alt="" className="h-4 w-4" />
                  History
                </button>
              </div>
            </aside>

            <section className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">
                  Hello, {data?.user?.displayName || 'Supporter'}!
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Your total impact so far:{' '}
                  <span className="font-semibold text-blue-600">${data?.stats?.totalDonated?.toLocaleString() || '0.00'}</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="btn-accent rounded-full px-4 py-2 text-sm font-semibold">
                    Share Impact
                  </button>
                  <Link href="/donate" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                    Make a Donation
                  </Link>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Member Status
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">
                    {data?.stats?.totalDonated > 1000 ? 'Platinum Donor' : data?.stats?.totalDonated > 100 ? 'Gold Donor' : 'Bronze Supporter'}
                  </p>
                  <p className="text-sm text-slate-500">Hedera ID: {data?.user?.hederaAccountId || 'Not linked'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      Contribution Activity
                    </p>
                    <span className="text-xs font-semibold text-emerald-600">
                      {data?.donations?.length || 0} donations tracked
                    </span>
                  </div>
                  <div className="mt-6 flex h-32 items-end justify-between gap-1">
                    {[40, 70, 45, 90, 65, 80, 50, 95, 60, 85, 40, 100].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm bg-blue-100" style={{ height: `${h}%` }}>
                        <div className="h-full w-full rounded-t-sm bg-blue-600 opacity-20 transition hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between text-[10px] font-bold uppercase text-slate-400">
                    <span>JAN</span>
                    <span>MAR</span>
                    <span>MAY</span>
                    <span>JUL</span>
                    <span>SEP</span>
                    <span>NOV</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Recent Donation History
                    </h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {data?.donations?.length > 0 ? (
                      data.donations.map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                          <div>
                            <p className="font-semibold text-slate-900">{d.request?.title}</p>
                            <p className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">${d.amount.toLocaleString()}</p>
                            {d.request?.contractAddress && (
                              <a
                                href={`https://hashscan.io/testnet/transaction/${d.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-slate-400 underline hover:text-blue-500"
                              >
                                Verify On-Chain
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-sm text-slate-500">
                        No donations yet. Start your journey today!
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Where Your Money Goes
                  </h2>
                  <div className="mt-4 space-y-4 text-sm text-slate-600">
                    <div>
                      <div className="flex justify-between">
                        <span>Verified Charities</span>
                        <span className="font-semibold">65%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className="h-2 w-[65%] rounded-full bg-blue-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>Community Grants</span>
                        <span className="font-semibold">35%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className="h-2 w-[35%] rounded-full bg-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 rounded-xl bg-blue-50 p-4 text-xs text-blue-800">
                    <p className="font-semibold">Mirror Node Verified</p>
                    <p className="mt-1 opacity-80">
                      All your donations are tracked on the Hedera Consensus Service.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Official Tax Receipts (NFT)
                </h2>
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  {data?.donations?.filter((d: any) => d.nftSerial).map((d: any) => (
                    <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                            <Image src={fileIcon} alt="" className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Receipt #{d.nftSerial}
                            </p>
                            <p className="text-xs text-slate-400">{d.request?.title.slice(0, 15)}...</p>
                          </div>
                        </div>
                        <a
                          href={`https://hashscan.io/testnet/token/${process.env.NEXT_PUBLIC_NFT_TOKEN_ID}/instance/${d.nftSerial}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          View NFT
                        </a>
                      </div>
                    </div>
                  ))}

                  {(!data?.donations || data?.donations?.filter((d: any) => d.nftSerial).length === 0) && (
                    <div className="col-span-3 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                      Donation receipts will appear here as collectible NFTs.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
