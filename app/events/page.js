'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';

export default function EventsPage() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchUser(token);
    fetchEvents();
  }, [filter]);

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
      console.error('Error fetching user:', error);
    }
  }

  async function fetchEvents() {
    try {
      const url = filter === 'all' 
        ? '/api/event/list?limit=50'
        : `/api/event/list?status=${filter}&limit=50`;
      
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  const filterButtons = [
    { value: 'all', label: 'All Events', icon: '🎪' },
    { value: 'waiting', label: 'Waiting', icon: '⏳' },
    { value: 'running', label: 'Running', icon: '🟢' },
    { value: 'finished', label: 'Finished', icon: '🏁' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-2xl text-white">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Events</h1>
            <p className="text-gray-400 mt-2">Browse and join hackathon events</p>
          </div>
          {user?.role === 'admin' && (
            <a href="/admin/events" className="btn btn-primary">
              + Create Event
            </a>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 mb-8">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === btn.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎪</div>
            <h2 className="text-2xl font-bold text-white mb-2">No events found</h2>
            <p className="text-gray-400">
              {filter === 'all' 
                ? 'No events have been created yet'
                : `No ${filter} events available`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}