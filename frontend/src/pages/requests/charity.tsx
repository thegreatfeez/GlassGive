import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { authService, API_BASE } from '../../services/authService';

import charityIcon from '../../assets/icon/charity-icon.svg';
import trustIcon from '../../assets/icon/trust-icon.svg';
import fileIcon from '../../assets/icon/file-icon.svg';

const CharityRequest: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    purpose: '',
    description: '',
    goalAmount: '',
    timelineEnd: '',
    category: 'Humanitarian',
  });
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.goalAmount || !formData.timelineEnd) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('type', 'CHARITY');
    data.append('title', formData.title);
    data.append('purpose', formData.purpose);
    data.append('description', formData.description);
    data.append('goalAmount', formData.goalAmount);
    data.append('timelineEnd', new Date(formData.timelineEnd).toISOString());
    // Metadata JSON for HFS
    data.append('category', formData.category);

    if (image) {
      data.append('image', image);
    }

    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: data,
      });

      if (res.ok) {
        toast.success('Request submitted! Waiting for admin approval.');
        router.push('/dashboard/charity');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Submission failed.');
      }
    } catch (err) {
      toast.error('Network error. Check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>GlassGive — Submit Charity Request</title>
      </Head>

      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Submit Request
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Apply for funding or support for your initiative.
            </p>
          </div>

          <div className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-slate-100 p-1">
            <span className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-blue-600 shadow-sm">
              Charity Request
            </span>
            <Link
              href="/requests/grant"
              className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-500"
            >
              Grant Request
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="grid gap-6">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Request Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean Water Initiative 2024"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <select 
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Humanitarian</option>
                    <option>Education</option>
                    <option>Healthcare</option>
                    <option>Environment</option>
                    <option>Crisis Relief</option>
                  </select>
                </div>
                <div>
                   <label className="text-sm font-semibold text-slate-700">
                    Campaign Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 w-full text-xs"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Purpose
                </label>
                <input
                  type="text"
                  placeholder="Briefly explain the goal"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Detailed Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the project in detail, including impact and implementation strategy..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Target Amount ($) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="5000.00"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.goalAmount}
                    onChange={(e) => setFormData({...formData, goalAmount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Deadline Date *
                  </label>
                  <input
                    type="date"
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.timelineEnd}
                    onChange={(e) => setFormData({...formData, timelineEnd: e.target.value})}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-slate-600">
                <div className="flex items-center gap-3 text-sm font-semibold text-blue-700">
                  <Image src={trustIcon} alt="" className="h-6 w-6" />
                  Trust & Verification Process
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  All submitted requests undergo a rigorous multi-sig
                  administrative verification. Once approved, the request is
                  immutably logged on the Hedera Consensus Service (HCS),
                  ensuring full transparency and auditability.
                </p>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`btn-accent w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow-md ${loading ? 'opacity-50' : ''}`}
              >
                {loading ? 'Submitting...' : 'Submit Request for Verification'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
};

export default CharityRequest;
