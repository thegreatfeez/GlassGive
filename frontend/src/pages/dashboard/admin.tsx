import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { authService, API_BASE } from '../../services/authService';
import toast from 'react-hot-toast';

const fallbackRequestImage =
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80';

const getMetadataValue = (request: any, key: string) =>
  request?.metadata && typeof request.metadata === 'object' ? request.metadata[key] : undefined;

const getRequestCategory = (request: any) =>
  getMetadataValue(request, 'category') || request?.businessType || request?.type;

const AdminDashboard: NextPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState<any>(null);

  useEffect(() => {
    const user = authService.getUser();

    if (!user) {
      router.replace('/admin/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      authService.logout();
      toast.error('Admin access required.');
      router.replace('/admin/login');
    }
  }, [router]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/pending`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const data = await res.json();
      const nextRequests = data.requests || [];
      setRequests(nextRequests);
      setSelectedRequest((current: any) =>
        current && nextRequests.some((request: any) => request.id === current.id)
          ? nextRequests.find((request: any) => request.id === current.id)
          : nextRequests[0] || null,
      );
    } catch (_err) {
      toast.error('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (_err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = authService.getUser();
    if (!user || user.role !== 'ADMIN') return;

    if (activeTab === 'requests') {
      fetchRequests();
    } else {
      fetchUsers();
    }
  }, [activeTab, fetchRequests, fetchUsers]);

  const deployRequest = async (requestId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        toast.success('Campaign LIVE on Hedera!');
        fetchRequests();
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
    } catch (_err) {
      toast.error('Network error.');
    } finally {
      setProcessing(false);
      setApprovalRequest(null);
    }
  };

  const handleApprove = (request: any) => {
    setApprovalRequest(request);
  };

  const handleSign = async (requestId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/signatures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ requestId, signature: `MANUAL_UI_SIG_${Date.now()}` }),
      });
      const data = await res.json();
      toast.success(data.message);
      fetchRequests();
    } catch (_err) {
      toast.error('Signature failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      }
    } catch (_err) {
      toast.error('Update failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSyncContract = async (userId: string, currentIsAdmin: boolean) => {
    const action = currentIsAdmin ? 'REMOVE' : 'ADD';
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/contract-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (_err) {
      toast.error('Sync failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>GlassGive - Admin Verification Portal</title>
      </Head>

      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Admin Portal</h1>
              <p className="mt-2 text-sm text-slate-500">Manage campaign verifications and platform authorities.</p>
            </div>
          </header>

          <div className="flex gap-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-4 text-sm font-semibold transition ${activeTab === 'requests' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}
            >
              Verification Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 text-sm font-semibold transition ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400'}`}
            >
              Manage Admins
            </button>
          </div>

          {activeTab === 'requests' ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                  <div className="p-12 text-center text-slate-500">Loading requests...</div>
                ) : requests.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">No pending requests.</div>
                ) : (
                  <div className="px-6 pb-6 pt-4 text-sm text-slate-500">
                    {requests.map((row) => (
                      <div
                        key={row.id}
                        onClick={() => setSelectedRequest(row)}
                        className={`cursor-pointer rounded-xl border-b border-slate-100 px-3 py-4 transition hover:bg-slate-50 ${selectedRequest?.id === row.id ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-semibold text-slate-900">{row.title}</span>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                              <span>{row.type}</span>
                              <span>•</span>
                              <span>{getRequestCategory(row)}</span>
                              <span>•</span>
                              <span>Goal: ${Number(row.goalAmount || 0).toLocaleString()}</span>
                            </div>
                          </div>
                          <span className="flex items-center gap-2 text-xs font-semibold">
                            <span className={`h-2 w-2 rounded-full ${row.signatureCount >= row.threshold ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {row.signatureCount}/{row.threshold} Sigs
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                          {row.purpose || row.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <aside className="sticky top-6 self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {!selectedRequest ? (
                  <div className="py-12 text-center text-slate-500">Select a request</div>
                ) : (
                  <>
                    <div className="relative h-52">
                      <Image
                        src={selectedRequest.imageUrl || fallbackRequestImage}
                        alt={selectedRequest.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
                            {selectedRequest.type}
                          </span>
                          <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
                            {getRequestCategory(selectedRequest)}
                          </span>
                        </div>
                        <h2 className="mt-3 text-2xl font-semibold">{selectedRequest.title}</h2>
                        <p className="mt-2 text-sm text-white/80">
                          Submitted by {selectedRequest.creator?.displayName || selectedRequest.creator?.email || 'Unknown creator'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5 p-6 text-sm text-slate-600">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Goal</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            ${Number(selectedRequest.goalAmount || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Deadline</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {new Date(selectedRequest.timelineEnd).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Creator</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {selectedRequest.creator?.email || selectedRequest.creator?.hederaAccountId || 'No contact'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">Approvals</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {selectedRequest.signatureCount}/{selectedRequest.threshold} signatures
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Purpose</p>
                        <p className="mt-1 leading-relaxed text-slate-700">
                          {selectedRequest.purpose || 'No purpose provided.'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-400">Description</p>
                        <p className="mt-1 leading-relaxed text-slate-700">
                          {selectedRequest.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">Category</p>
                          <p className="mt-1 font-semibold text-slate-900">
                            {getRequestCategory(selectedRequest)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-400">Wallet</p>
                          <p className="mt-1 break-all font-mono text-xs text-slate-900">
                            {selectedRequest.walletAddress}
                          </p>
                        </div>
                        {selectedRequest.type === 'GRANT' && (
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase text-slate-400">Business Type</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {selectedRequest.businessType || 'Not provided'}
                            </p>
                          </div>
                        )}
                        {selectedRequest.type === 'GRANT' && (
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase text-slate-400">Registration ID</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {getMetadataValue(selectedRequest, 'registrationId') || 'Not provided'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase text-slate-400">Submission Records</p>
                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                          <p>Metadata HFS: {selectedRequest.hfsFileId || 'Not uploaded'}</p>
                          {selectedRequest.businessPlanHfsId && <p>Business Plan HFS: {selectedRequest.businessPlanHfsId}</p>}
                          {selectedRequest.proofOfBusinessHfsId && <p>Proof of Business HFS: {selectedRequest.proofOfBusinessHfsId}</p>}
                          <p>Created: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSign(selectedRequest.id)}
                        disabled={processing}
                        className="w-full rounded-2xl border border-blue-600 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 disabled:opacity-50"
                      >
                        {processing ? '...' : 'Sign Verification'}
                      </button>
                      <button
                        onClick={() => handleApprove(selectedRequest)}
                        disabled={processing || selectedRequest.signatureCount < selectedRequest.threshold}
                        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow-md transition ${
                          selectedRequest.signatureCount < selectedRequest.threshold
                            ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                            : 'btn-accent hover:-translate-y-0.5'
                        }`}
                      >
                        {processing ? 'Deploying...' : 'Deploy On-Chain'}
                      </button>
                    </div>
                  </>
                )}
              </aside>
            </div>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-slate-900">User & Admin Directory</h2>
              {loading ? (
                <div className="p-12 text-center text-slate-500">Loading directory...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                      <tr>
                        <th className="pb-3 pr-4">User</th>
                        <th className="pb-3 pr-4">Wallet</th>
                        <th className="pb-3 pr-4">Role</th>
                        <th className="pb-3 pr-4">Contract Admin</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((user) => (
                        <tr key={user.id} className="group hover:bg-slate-50/50">
                          <td className="py-4 pr-4">
                            <div className="font-semibold text-slate-900">{user.displayName || 'Anonymous'}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </td>
                          <td className="py-4 pr-4 font-mono text-xs text-slate-500">{user.walletAddress?.slice(0, 10)}...</td>
                          <td className="py-4 pr-4">
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${user.isContractAdmin ? 'text-emerald-600' : 'text-slate-300'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${user.isContractAdmin ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              {user.isContractAdmin ? 'ON-CHAIN' : 'NONE'}
                            </span>
                          </td>
                          <td className="space-x-2 py-4">
                            <button
                              onClick={() => handleToggleRole(user.id, user.role)}
                              className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                              {user.role === 'ADMIN' ? 'Make User' : 'Make Admin'}
                            </button>
                            {user.walletAddress && (
                              <button
                                onClick={() => handleSyncContract(user.id, user.isContractAdmin)}
                                className="text-xs font-semibold text-emerald-600 hover:underline"
                              >
                                {user.isContractAdmin ? 'Revoke On-Chain' : 'Sync On-Chain'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {approvalRequest && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-6">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                Final Approval
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Deploy Campaign Contract to Hedera
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                This will publish the verified request to Hedera and make the campaign live for donations.
              </p>
            </div>

            <div className="space-y-4 px-6 py-6 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Request</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{approvalRequest.title}</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-semibold uppercase text-slate-400">Type</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{approvalRequest.type}</p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase text-slate-400">Goal</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">${Number(approvalRequest.goalAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase text-slate-400">Deadline</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {new Date(approvalRequest.timelineEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold uppercase text-slate-400">Approvals</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {approvalRequest.signatureCount}/{approvalRequest.threshold} signatures
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="font-semibold">Heads up</p>
                <p className="mt-1 text-sm">
                  Deploying will create the campaign on Hedera and move this request into the live fundraising state.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setApprovalRequest(null)}
                disabled={processing}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deployRequest(approvalRequest.id)}
                disabled={processing}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-50"
              >
                {processing ? 'Deploying...' : 'Approve and Deploy to Hedera'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
