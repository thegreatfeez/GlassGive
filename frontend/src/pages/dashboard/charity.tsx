import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import toast from 'react-hot-toast';
import { useCampaign } from '../../hooks/useCampaign';
import { authService, API_BASE } from '../../services/authService';

import charityIcon from '../../assets/icon/charity-icon.svg';
import verifiedIcon from '../../assets/icon/verified-icon.svg';
import trustIcon from '../../assets/icon/trust-icon.svg';

const CharityDashboard: NextPage = () => {
  const { address } = useAccount();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCampaign();
  }, []);

  const fetchMyCampaign = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/me`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      const data = await res.json();
      const myCharities = (data.requests || []).filter((r: any) => r.type === 'CHARITY');
      setRequests(myCharities);
      setSelectedRequestId((currentId) =>
        currentId && myCharities.some((request: any) => request.id === currentId)
          ? currentId
          : myCharities[0]?.id ?? null,
      );
    } catch (err) {
      toast.error('Failed to load your charity campaign.');
      console.error('Failed to fetch charity request:', err);
    } finally {
      setLoading(false);
    }
  };

  const request = requests.find((item) => item.id === selectedRequestId) ?? requests[0] ?? null;

  const {
    releaseFunds,
    withdraw,
    isReleased,
    pendingWithdrawal,
    deadline,
    isPending,
    isConfirmed,
    error,
    refetchAll
  } = useCampaign(request?.contractAddress as `0x${string}`);

  useEffect(() => {
    if (isPending) {
      toast.loading('Processing on-chain transaction...', { id: 'charity-tx' });
    }
    if (isConfirmed) {
      toast.success('Transaction confirmed!', { id: 'charity-tx' });
      refetchAll();
    }
    if (error) {
      toast.error(`Transaction failed: ${error.message}`, { id: 'charity-tx' });
    }
  }, [isPending, isConfirmed, error, refetchAll]);

  const isDeadlinePassed = deadline ? Number(deadline) <= Math.floor(Date.now() / 1000) : false;

  return (
    <>
      <Head>
        <title>GlassGive — Charity Dashboard</title>
      </Head>

      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-slate-100 p-1">
            <Link
              href="/dashboard"
              className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-500"
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
              className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-blue-600 shadow-sm"
            >
              Charity Dashboard
            </Link>
          </div>

          {loading ? (
             <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <p className="text-slate-500">Loading your campaign status...</p>
             </div>
          ) : !request ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-slate-500 text-lg">You haven&apos;t submitted any charity requests yet.</p>
                <Link href="/requests/charity" className="btn-accent mt-4 inline-block rounded-full px-6 py-2 text-sm font-semibold">
                    Start a Campaign
                </Link>
            </div>
          ) : (
            <>
              {requests.length > 1 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Your Charity Campaigns</p>
                      <p className="text-xs text-slate-500">Switch between all charity requests you&apos;ve created.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {requests.length} campaigns
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {requests.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedRequestId(item.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          item.id === request.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                      <Image src={charityIcon} alt="" className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">
                        {request.title}
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                          {request.status}
                        </span>
                        {request.contractAddress && (
                            <span className="font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                Contract: {request.contractAddress.slice(0, 8)}...
                            </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="btn-accent rounded-full px-4 py-2 text-sm font-semibold shadow-sm">
                    Campaign Stats
                  </button>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                      <Image src={verifiedIcon} alt="" className="h-5 w-5" />
                      Funding Progress
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>Raised</span>
                      <span>Goal</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-2xl font-semibold text-slate-900">
                      <span>${request.currentAmount?.toLocaleString() || '0'}</span>
                      <span>${request.goalAmount?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                      <div 
                        className="h-2 rounded-full bg-emerald-500" 
                        style={{ width: `${Math.min(100, (request.currentAmount / request.goalAmount) * 100 || 0)}%` }}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span className="font-semibold text-emerald-600">
                        {Math.round((request.currentAmount / request.goalAmount) * 100 || 0)}% Complete
                      </span>
                      <span>{Math.max(0, Math.ceil((new Date(request.timelineEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                      <Image src={trustIcon} alt="" className="h-5 w-5" />
                      Fund Management
                    </div>
                    <div className="mt-4 space-y-4">
                      {!isReleased ? (
                        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                          <p className="font-semibold">Funds Locked in Escrow</p>
                          <p className="mt-1 text-xs opacity-80">
                            {isDeadlinePassed 
                              ? 'The campaign deadline has passed. You can now release the funds to prepare for withdrawal.'
                              : `Funds will be available for release after ${deadline ? new Date(Number(deadline) * 1000).toLocaleDateString() : 'the deadline'}.`}
                          </p>
                          <button 
                            className={`mt-4 w-full rounded-xl py-2 text-xs font-bold uppercase tracking-wider text-white transition ${isDeadlinePassed && !isPending ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'}`}
                            onClick={() => releaseFunds()}
                            disabled={!isDeadlinePassed || isPending}
                          >
                            {isPending ? 'Processing...' : 'Release Funds to Wallet'}
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                          <p className="font-semibold">Funds Released</p>
                          <p className="mt-1 text-xs opacity-80">
                            The funds have been released from the campaign escrow. You can now withdraw your share.
                          </p>
                          <div className="mt-4 flex items-center justify-between border-t border-blue-100 pt-4">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-blue-600">Available to Withdraw</p>
                              <p className="text-lg font-bold">{pendingWithdrawal ? formatEther(pendingWithdrawal as bigint) : '0'} HBAR</p>
                            </div>
                            <button 
                              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase text-white transition ${pendingWithdrawal && (pendingWithdrawal as bigint) > BigInt(0) && !isPending ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
                              onClick={() => withdraw()}
                              disabled={!pendingWithdrawal || (pendingWithdrawal as bigint) === BigInt(0) || isPending}
                            >
                              Withdraw
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                    <Image src={trustIcon} alt="" className="h-5 w-5" />
                    On-Chain Transparency
                  </div>
                  <div className="mt-6 space-y-6 text-sm text-slate-600">
                    <div className="flex items-start gap-4">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${request.hcsTopicId ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {request.hcsTopicId ? '✓' : '○'}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">
                          HCS Topic Created
                        </p>
                        <p className="text-xs font-mono mt-1 text-slate-500">{request.hcsTopicId || 'Not yet created'}</p>
                      </div>
                    </div>
                    <div className={`rounded-2xl border px-4 py-4 ${request.contractAddress ? 'border-emerald-100 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold ${request.contractAddress ? 'text-emerald-700' : 'text-slate-500'}`}>
                          Campaign Contract
                        </p>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold text-white ${request.contractAddress ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                          {request.contractAddress ? 'LIVE' : 'WAITING'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {request.contractAddress 
                            ? `Contract deployed at ${request.contractAddress}. All donations flow through this escrow.` 
                            : 'Contract will be deployed automatically once verified by admins.'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Auditable History
                      </p>
                      <p className="text-sm text-slate-500">
                        Every dollar raised and spent is recorded immutably on Hedera. View all transactions on HashScan.
                      </p>
                      {request.contractAddress && (
                          <a 
                            href={`https://hashscan.io/testnet/contract/${request.contractAddress}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs text-blue-600 font-semibold underline"
                          >
                              View on HashScan →
                          </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="rounded-2xl bg-emerald-600 px-6 py-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Need support?</p>
                <p className="text-sm text-white/80">
                  Our charity success team is here to help you report impact.
                </p>
              </div>
              <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-emerald-700">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default CharityDashboard;
