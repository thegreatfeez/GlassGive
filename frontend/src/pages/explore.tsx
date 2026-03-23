import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { API_BASE } from '../services/authService';

import allIcon from '../assets/icon/all-icon.svg';
import verifiedIcon from '../assets/icon/verified-icon.svg';
import urgentIcon from '../assets/icon/urgent-icon.svg';

const Explore: NextPage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'CHARITY' | 'GRANT'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Education', 'Healthcare', 'Environment', 'Crisis Relief', 'Innovation'];

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/requests?status=LIVE`;
      if (selectedType !== 'all') {
        url += `&type=${selectedType}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      toast.error('Failed to fetch campaigns. Please try again.');
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [requests, searchQuery, selectedCategory]);

  return (
    <>
      <Head>
        <title>GlassGive — Explore Campaigns</title>
      </Head>

      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <header>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Explore Campaigns</h1>
                <p className="mt-2 text-slate-500">Discover and support transparent causes on Hedera</p>
              </div>
              <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-sm border border-slate-200">
                <span className="text-slate-400">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search causes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-slate-200 pb-2">
              <button 
                onClick={() => setSelectedType('all')}
                className={`flex items-center gap-2 pb-4 text-sm font-semibold transition ${selectedType === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Image src={allIcon} alt="" className="h-4 w-4" />
                All Causes
              </button>
              <button 
                onClick={() => setSelectedType('CHARITY')}
                className={`flex items-center gap-2 pb-4 text-sm font-semibold transition ${selectedType === 'CHARITY' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Image src={verifiedIcon} alt="" className="h-4 w-4" />
                Charities
              </button>
              <button 
                onClick={() => setSelectedType('GRANT')}
                className={`flex items-center gap-2 pb-4 text-sm font-semibold transition ${selectedType === 'GRANT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Image src={urgentIcon} alt="" className="h-4 w-4" />
                Grants
              </button>
            </div>
          </header>

          <section>
            <div className="flex flex-wrap items-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${selectedCategory === category ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-slate-500 font-medium">Fetching verified campaigns...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <span className="text-2xl text-slate-400">?</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No campaigns found</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-xs">
                We couldn&apos;t find any campaigns matching your current filters. Try adjusting your search or category.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedType('all'); }}
                className="mt-6 text-sm font-semibold text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
                <article
                  key={request.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-48 w-full">
                    <Image src={request.imageUrl || allIcon} alt={request.title} fill className="object-cover" />
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900 backdrop-blur-sm">
                      {request.category}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-600">
                      <span>{request.type}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                      <span className="text-slate-400">{Math.max(0, Math.ceil((new Date(request.timelineEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left</span>
                    </div>
                    <h4 className="mt-3 text-lg font-bold text-slate-900 line-clamp-1">{request.title}</h4>
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">{request.purpose}</p>
                    
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">Raised: <span className="text-slate-900">${request.currentAmount?.toLocaleString()}</span></span>
                        <span className="text-blue-600">{Math.round((request.currentAmount / request.goalAmount) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div 
                          className="h-1.5 rounded-full bg-blue-600" 
                          style={{ width: `${Math.min(100, (request.currentAmount / request.goalAmount) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <Link 
                      href={`/donate?id=${request.id}`}
                      className="mt-6 block w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      View Campaign
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Explore;
