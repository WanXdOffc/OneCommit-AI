'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatsCard from '@/components/StatsCard';
import CommitsChart from '@/components/Charts/CommitsChart';
import QualityChart from '@/components/Charts/QualityChart';
import CategoryChart from '@/components/Charts/CategoryChart';

export default function AdminStatsPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [commits, setCommits] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchUser(token);
    fetchStats();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent && selectedEvent !== 'all') {
      fetchEventInsights(selectedEvent);
      fetchEventCommits(selectedEvent);
    }
  }, [selectedEvent]);

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
      }
    } catch (error) {
      console.error('Error:', error);
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

  async function fetchEvents() {
    try {
      const res = await fetch('/api/event/list?limit=50');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function fetchEventInsights(eventId) {
    try {
      const res = await fetch(`/api/ai/insights?eventId=${eventId}`);
      const data = await res.json();
      setInsights(data.insights);
    } catch (error) {
      console.error('Error:', error);
      setInsights(null);
    }
  }

  async function fetchEventCommits(eventId) {
    try {
      const res = await fetch(`/api/commit/list?eventId=${eventId}&limit=100`);
      const data = await res.json();
      setCommits(data.commits || []);
    } catch (error) {
      console.error('Error:', error);
      setCommits([]);
    }
  }

  // Process data for charts
  const qualityDistribution = insights ? [
    { name: 'Excellent (80-100)', count: insights.qualityDistribution.excellent },
    { name: 'Good (60-79)', count: insights.qualityDistribution.good },
    { name: 'Fair (40-59)', count: insights.qualityDistribution.fair },
    { name: 'Poor (0-39)', count: insights.qualityDistribution.poor },
  ] : [];

  const categoryData = insights ? Object.entries(insights.categories).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })) : [];

  const commitsOverTime = commits.reduce((acc, commit) => {
    const date = new Date(commit.timestamp).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.commits++;
      existing.score += commit.score?.total || 0;
    } else {
      acc.push({
        date,
        commits: 1,
        score: commit.score?.total || 0
      });
    }
    return acc;
  }, []);

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
          <h1 className="text-3xl font-bold text-white">Statistics & Analytics</h1>
          <p className="text-gray-400 mt-2">Platform-wide insights and event analytics</p>
        </div>

        {/* Platform Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Total Users" 
              value={stats.users} 
              icon="👥" 
              color="blue"
              subtitle={`${stats.admins} admins`}
            />
            <StatsCard 
              title="Total Events" 
              value={stats.events.total} 
              icon="🎪" 
              color="purple"
              subtitle={`${stats.events.running} running`}
            />
            <StatsCard 
              title="Total Commits" 
              value={stats.commits.total} 
              icon="📝" 
              color="green"
              subtitle={`${stats.commits.valid} valid`}
            />
            <StatsCard 
              title="Repositories" 
              value={stats.repos} 
              icon="📦" 
              color="yellow"
              subtitle={`${stats.commits.spam} spam detected`}
            />
          </div>
        )}

        {/* Event Selector */}
        <div className="card mb-8">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Select Event for Detailed Analytics
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="input max-w-md"
          >
            <option value="all">All Events (No charts)</option>
            {events.map(event => (
              <option key={event._id} value={event._id}>
                {event.name} ({event.status})
              </option>
            ))}
          </select>
        </div>

        {/* Event Analytics */}
        {selectedEvent && selectedEvent !== 'all' && insights && (
          <>
            {/* AI Insights Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard 
                title="Average Quality" 
                value={`${insights.averageQuality}/100`}
                icon="🎯" 
                color="blue"
              />
              <StatsCard 
                title="Analyzed Commits" 
                value={insights.totalAnalyzed}
                icon="🤖" 
                color="purple"
              />
              <StatsCard 
                title="Spam Rate" 
                value={`${insights.spamPercentage}%`}
                icon="🚫" 
                color="red"
              />
              <StatsCard 
                title="Top Technology" 
                value={insights.topTechnologies?.[0]?.technology || 'N/A'}
                icon="💻" 
                color="green"
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Commits Over Time</h3>
                <CommitsChart data={commitsOverTime} />
              </div>

              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Quality Distribution</h3>
                <QualityChart data={qualityDistribution} />
              </div>

              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Commit Categories</h3>
                <CategoryChart data={categoryData} />
              </div>

              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Complexity Breakdown</h3>
                <QualityChart data={[
                  { name: 'Low', count: insights.complexity.low },
                  { name: 'Medium', count: insights.complexity.medium },
                  { name: 'High', count: insights.complexity.high },
                ]} />
              </div>
            </div>

            {/* Technologies Used */}
            {insights.topTechnologies && insights.topTechnologies.length > 0 && (
              <div className="card mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Top Technologies</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {insights.topTechnologies.map((tech, i) => (
                    <div key={i} className="bg-slate-700 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-white">{tech.count}</div>
                      <div className="text-sm text-gray-400">{tech.technology}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Common Suggestions */}
            {insights.topSuggestions && insights.topSuggestions.length > 0 && (
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-4">Common AI Suggestions</h3>
                <div className="space-y-2">
                  {insights.topSuggestions.map((sug, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-700 p-3 rounded">
                      <span className="text-gray-300">{sug.suggestion}</span>
                      <span className="badge badge-info">{sug.count} times</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {selectedEvent === 'all' && (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Select an Event</h3>
            <p className="text-gray-400">Choose an event to view detailed analytics and charts</p>
          </div>
        )}
      </main>
    </div>
  );
}