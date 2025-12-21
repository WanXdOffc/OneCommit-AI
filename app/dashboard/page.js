'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatsCard from '@/components/StatsCard';
import CommitsChart from '@/components/Charts/CommitsChart';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Get token from URL or localStorage
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    // Fetch user data
    fetchUserData(token);
    fetchStats();
    fetchUserEvents(token);
  }, []);

  async function fetchUserData(token) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
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
      console.error('Error fetching stats:', error);
    }
  }

  async function fetchUserEvents(token) {
    try {
      const res = await fetch('/api/user/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-400 mt-2">
            Track your commits and compete in hackathons
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Users"
              value={stats.users}
              icon="👥"
              color="blue"
            />
            <StatsCard
              title="Active Events"
              value={stats.events.running}
              icon="🎪"
              color="green"
            />
            <StatsCard
              title="Total Commits"
              value={stats.commits.total}
              icon="📝"
              color="purple"
            />
            <StatsCard
              title="Your Events"
              value={events.length}
              icon="⭐"
              color="yellow"
            />
          </div>
        )}

        {/* Your Events */}
        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6">Your Events</h2>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎪</div>
              <p className="text-gray-400 mb-4">You haven't joined any events yet</p>
              <a href="/events" className="btn btn-primary">
                Browse Events
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <div key={event._id} className="bg-slate-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">{event.name}</h3>
                      <p className="text-gray-400">{event.description}</p>
                    </div>
                    <span className={`badge ${
                      event.status === 'running' ? 'badge-success' :
                      event.status === 'finished' ? 'badge-error' :
                      'badge-warning'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  {event.myScore && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Score</div>
                        <div className="text-2xl font-bold text-white">
                          {event.myScore.totalScore}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Rank</div>
                        <div className="text-2xl font-bold text-white">
                          #{event.myScore.rank || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Commits</div>
                        <div className="text-2xl font-bold text-white">
                          {event.myScore.totalCommits}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <a href={`/events/${event._id}`} className="btn btn-outline">
                          View Details
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}