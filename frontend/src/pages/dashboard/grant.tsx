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

import grantIcon from '../../assets/icon/grant-icon.svg';
import verifiedIcon from '../../assets/icon/verified-icon.svg';
import trustIcon from '../../assets/icon/trust-icon.svg';
import fileIcon from '../../assets/icon/file-icon.svg';

const GrantDashboard: NextPage = () => {
  const { address } = useAccount();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyGrant();
  }, []);

  const fetchMyGrant = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/me`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      const data = await res.json();
      const myGrants = (data.requests || []).filter((r: any) => r.type === 'GRANT');
      setRequests(myGrants);
      setSelectedRequestId((currentId) =>
        currentId && myGrants.some((request: any) => request.id === currentId)
          ? currentId
          : myGrants[0]?.id ?? null,
      );
    } catch (err) {
      toast.error('Failed to load your grant application.');
      console.error('Failed to fetch grant request:', err);
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
      toast.loading('Processing on-chain transaction...', { id: 'grant-tx' });
    }
    if (isConfirmed) {
      toast.success('Milestone funds released!', { id: 'grant-tx' });
      refetchAll();
    }
    if (error) {
      toast.error(`Transaction failed: ${error.message}`, { id: 'grant-tx' });
    }
  }, [isPending, isConfirmed, error, refetchAll]);

  const isDeadlinePassed = deadline ? Number(deadline) <= Math.floor(Date.now() / 1000) : false;

  return (
    <>
      <Head>
        <title>GlassGive — Grant Dashboard</title>
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
              className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-blue-600 shadow-sm"
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

          {loading ? (
             <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <p className="text-slate-500">Loading your grant status...</p>
             </div>
          ) : !request ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-slate-500 text-lg">You haven&apos;t submitted any grant requests yet.</p>
                <Link href="/requests/grant" className="btn-accent mt-4 inline-block rounded-full px-6 py-2 text-sm font-semibold">
                    Apply for a Grant
                </Link>
            </div>
          ) : (
            <>
              {requests.length > 1 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Your Grant Applications</p>
                      <p className="text-xs text-slate-500">Switch between all grant requests you&apos;ve submitted.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {requests.length} grants
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
                            ? 'bg-blue-600 text-white shadow-sm'
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
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                      <Image src={grantIcon} alt="" className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">
                        {request.title}
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
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
                    Manage Grant
                  </button>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                      <Image src={verifiedIcon} alt="" className="h-5 w-5" />
                      Milestone Progress
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span>Funded</span>
                      <span>Grant Total</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-2xl font-semibold text-slate-900">
                      <span>${request.currentAmount?.toLocaleString() || '0'}</span>
                      <span>${request.goalAmount?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                      <div 
                        className="h-2 rounded-full bg-blue-600" 
                        style={{ width: `${Math.min(100, (request.currentAmount / request.goalAmount) * 100 || 0)}%` }}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                      <span className="font-semibold text-blue-600">
                        {Math.round((request.currentAmount / request.goalAmount) * 100 || 0)}% Disbursed
                      </span>
                      <span>Next: Milestone 2</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                      <Image src={trustIcon} alt="" className="h-5 w-5" />
                      Grant Fund Management
                    </div>
                    <div className="mt-4 space-y-4">
                      {!isReleased ? (
                        <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                          <p className="font-semibold">Funds Held in Escrow</p>
                          <p className="mt-1 text-xs opacity-80">
                            {isDeadlinePassed 
                              ? 'The grant campaign has conclude. You can now release the target funds.'
                              : `Grant funds will be available for release after ${deadline ? new Date(Number(deadline) * 1000).toLocaleDateString() : 'the completion deadline'}.`}
                          </p>
                          <button 
                            className={`mt-4 w-full rounded-xl py-2 text-xs font-bold uppercase tracking-wider text-white transition ${isDeadlinePassed && !isPending ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}`}
                            onClick={() => releaseFunds()}
                            disabled={!isDeadlinePassed || isPending}
                          >
                            {isPending ? 'Processing...' : 'Release Grant Funds'}
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                          <p className="font-semibold">Grant Funds Available</p>
                          <p className="mt-1 text-xs opacity-80">
                            The grant funds have been released. You can now pull the HBAR into your organization&apos;s wallet.
                          </p>
                          <div className="mt-4 flex items-center justify-between border-t border-emerald-100 pt-4">
                            <div>
                              <p className="text-[10px] uppercase font-bold text-emerald-600">Pending Withdrawal</p>
                              <p className="text-lg font-bold">{pendingWithdrawal ? formatEther(pendingWithdrawal as bigint) : '0'} HBAR</p>
                            </div>
                            <button 
                              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase text-white transition ${pendingWithdrawal && (pendingWithdrawal as bigint) > BigInt(0) && !isPending ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'}`}
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

                <div className="flex flex-col gap-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                      <Image src={fileIcon} alt="" className="h-5 w-5" />
                      Grant Documents
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">Proposal_V2.pdf</p>
                          <p className="text-xs text-slate-400">HFS: {request.hfsFileId?.slice(0,10)}...</p>
                        </div>
                        <span className="text-xs text-blue-600 cursor-pointer">View</span>
                      </div>
                      {/* <button className="w-full rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition">
                        Add Documentation
                      </button> */}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                      <Image src={trustIcon} alt="" className="h-5 w-5" />
                      On-Chain Governance
                    </div>
                    <div className="mt-6 space-y-6 text-sm text-slate-600">
                      <div className="flex items-start gap-4">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${request.hcsTopicId ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          {request.hcsTopicId ? '✓' : '○'}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            HCS Topic Verified
                          </p>
                          <p className="text-xs font-mono mt-1 text-slate-500">{request.hcsTopicId || 'Verifying on-chain...'}</p>
                        </div>
                      </div>
                      <div className={`rounded-2xl border px-4 py-4 ${request.contractAddress ? 'border-blue-100 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold ${request.contractAddress ? 'text-blue-700' : 'text-slate-500'}`}>
                            Grant Escrow Contract
                          </p>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold text-white ${request.contractAddress ? 'bg-blue-600' : 'bg-slate-400'}`}>
                            {request.contractAddress ? 'LIVE' : 'VERIFYING'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {request.contractAddress 
                              ? `Funds are held in escrow at ${request.contractAddress}. Released upon admin multi-sig approval.` 
                              : 'Escrow contract will be deployed after administrative review of your business plan.'}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          Immutable Ledger
                        </p>
                        <p className="text-sm text-slate-500">
                          All grant distributions and milestone approvals are logged on the Hedera Consensus Service for donor auditing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="rounded-2xl bg-blue-600 px-6 py-6 text-white shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Grant Compliance</p>
                <p className="text-sm text-white/80">
                  Ensure all milestones are reported on-chain to unlock subsequent funding rounds.
                </p>
              </div>
              <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition">
                Compliance Guide
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default GrantDashboard;
