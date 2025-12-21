'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatsCard from '@/components/StatsCard';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchUser(token);
    fetchStats();
  }, []);

  async function fetchUser(token) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        setUser(data.user);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-2xl text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">Manage events, users, and platform</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard title="Total Users" value={stats.users} icon="👥" color="blue" />
            <StatsCard title="Total Events" value={stats.events.total} icon="🎪" color="purple" />
            <StatsCard title="Total Commits" value={stats.commits.total} icon="📝" color="green" />
            <StatsCard title="Running Events" value={stats.events.running} icon="🟢" color="yellow" />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/events">
            <div className="card hover:bg-slate-750 transition-colors cursor-pointer">
              <div className="text-4xl mb-4">🎪</div>
              <h3 className="text-xl font-bold text-white mb-2">Manage Events</h3>
              <p className="text-gray-400">Create, edit, and manage hackathon events</p>
            </div>
          </Link>

          <Link href="/admin/stats">
            <div className="card hover:bg-slate-750 transition-colors cursor-pointer">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">View Statistics</h3>
              <p className="text-gray-400">Detailed platform analytics and charts</p>
            </div>
          </Link>

          <div className="card">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2">Discord Bot</h3>
            <p className="text-gray-400">Bot is active in your Discord server</p>
          </div>
        </div>
      </main>
    </div>
  );
}