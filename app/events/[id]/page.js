'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LeaderboardTable from '@/components/LeaderboardTable';

export default function EventDetailPage({ params }) {
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchUser(token);
    fetchEvent();
  }, [params.id]);

  async function fetchUser(token) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function fetchEvent() {
    try {
      const res = await fetch(`/api/event/${params.id}`);
      const data = await res.json();
      setEvent(data.event);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!repoUrl) {
      alert('Please enter your GitHub repository URL');
      return;
    }

    setJoining(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/event/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: params.id,
          githubUrl: repoUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Successfully joined event!');
        fetchEvent();
      } else {
        alert(data.error || 'Failed to join event');
      }
    } catch (error) {
      alert('Error joining event');
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-2xl text-white">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar user={user} />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-white">Event not found</h1>
        </div>
      </div>
    );
  }

  const isParticipant = event.participants?.some(p => p.user._id === user?._id);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <div className="card mb-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-4">{event.name}</h1>
              <p className="text-gray-400 mb-6">{event.description || 'No description'}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className={`text-lg font-semibold ${
                    event.status === 'running' ? 'text-green-400' :
                    event.status === 'finished' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {event.status ? event.status.toUpperCase() : 'UNKNOWN'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Participants</div>
                  <div className="text-lg font-semibold text-white">
                    {event.currentParticipants || 0}/{event.maxParticipants || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="text-lg font-semibold text-white">
                    {event.duration || 0} hours
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Commits</div>
                  <div className="text-lg font-semibold text-white">
                    {event.totalCommits || 0}
                  </div>
                </div>
              </div>

              {event.startTime && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Start: </span>
                      <span className="text-white">
                        {new Date(event.startTime).toLocaleString()}
                      </span>
                    </div>
                    {event.endTime && (
                      <div>
                        <span className="text-gray-500">End: </span>
                        <span className="text-white">
                          {new Date(event.endTime).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Join Event Section */}
          {!isParticipant && event.status === 'waiting' && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Join this event</h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  placeholder="https://github.com/username/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="input flex-1"
                />
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="btn btn-primary"
                >
                  {joining ? 'Joining...' : 'Join Event'}
                </button>
              </div>
            </div>
          )}

          {isParticipant && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="badge badge-success">✓ You are participating in this event</div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        {event.leaderboard && event.leaderboard.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold text-white mb-6">🏆 Leaderboard</h2>
            <LeaderboardTable leaderboard={event.leaderboard} showAchievements />
          </div>
        )}
      </main>
    </div>
  );
}