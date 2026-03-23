import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { authService, API_BASE } from '../../services/authService';

import grantIcon from '../../assets/icon/grant-icon.svg';
import fileIcon from '../../assets/icon/file-icon.svg';
import imageUploadIcon from '../../assets/icon/imageUpload-icon.svg';

const GrantRequest: NextPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    purpose: '',
    description: '',
    businessType: 'Social Enterprise',
    registrationId: '',
    goalAmount: '',
    timelineMonths: '',
    category: 'Innovation',
  });

  const [businessPlanFile, setBusinessPlanFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.goalAmount || !formData.businessType) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('type', 'GRANT');
    data.append('title', formData.title);
    data.append('purpose', formData.purpose);
    data.append('description', formData.description);
    data.append('goalAmount', formData.goalAmount);
    
    // Calculate timeline end date based on months
    const now = new Date();
    const timelineEnd = new Date(now.setMonth(now.getMonth() + Number(formData.timelineMonths || 6)));
    data.append('timelineEnd', timelineEnd.toISOString());

    data.append('businessType', formData.businessType);
    data.append('registrationId', formData.registrationId);
    data.append('category', formData.category);

    if (businessPlanFile) {
      data.append('businessPlan', businessPlanFile);
    }
    if (imageFile) {
      data.append('image', imageFile);
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
        toast.success('Grant application submitted successfully!');
        router.push('/dashboard/grant');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Application failed.');
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
        <title>GlassGive — Grant Request Submission</title>
      </Head>

      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Grant Request Submission
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Provide detailed business and project information for Hedera
              funding consideration.
            </p>
          </div>

          <div className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-slate-100 p-1">
            <Link
              href="/requests/charity"
              className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-500"
            >
              Charity Request
            </Link>
            <span className="flex-1 rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-blue-600 shadow-sm">
              Grant Request
            </span>
          </div>

          <section className="grid gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  1
                </span>
                Basic Info
              </div>
              <div className="mt-4 grid gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Grant Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sustainable Energy Network Expansion"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="Briefly state the main goal of the project"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Full Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your project, methodology, and expected outcomes in detail..."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  2
                </span>
                Business Details
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Business Type *
                  </label>
                  <select 
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.businessType}
                    onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                  >
                    <option>Social Enterprise</option>
                    <option>Non-profit</option>
                    <option>Startup</option>
                    <option>Small Business</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Registration ID / Proof of Business
                  </label>
                  <input
                    type="text"
                    placeholder="Tax ID or Registration Number"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.registrationId}
                    onChange={(e) => setFormData({...formData, registrationId: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  3
                </span>
                Funding
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Amount Requested ($) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="$ 0.00"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.goalAmount}
                    onChange={(e) => setFormData({...formData, goalAmount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Timeline (Months)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                    value={formData.timelineMonths}
                    onChange={(e) => setFormData({...formData, timelineMonths: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  4
                </span>
                Documentation
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-slate-700 mb-2">
                    Business Plan (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    className="text-xs"
                    onChange={(e) => setBusinessPlanFile(e.target.files?.[0] || null)}
                  />
                  {businessPlanFile && <p className="mt-1 text-xs text-blue-600">Selected: {businessPlanFile.name}</p>}
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-slate-700 mb-2">
                    Impact Images
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="text-xs"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {imageFile && <p className="mt-1 text-xs text-blue-600">Selected: {imageFile.name}</p>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-4">
              <button 
                type="submit"
                disabled={loading}
                className={`btn-accent rounded-full px-8 py-3 text-sm font-bold shadow-md transition ${loading ? 'opacity-50' : 'hover:-translate-y-0.5'}`}
              >
                {loading ? 'Submitting Application...' : 'Submit Application for Review'}
              </button>
            </div>
          </section>
        </form>
      </main>
    </>
  );
};

export default GrantRequest;
