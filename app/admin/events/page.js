'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function AdminEventsPage() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxParticipants: 50,
    duration: 48,
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchUser(token);
    fetchEvents();
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
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvents() {
    try {
      const res = await fetch('/api/event/list?limit=100');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleCreate() {
    if (!formData.name || !formData.maxParticipants || !formData.duration) {
      alert('Please fill all required fields');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/event/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        alert('Event created successfully!');
        setShowCreateForm(false);
        setFormData({ name: '', description: '', maxParticipants: 50, duration: 48 });
        fetchEvents();
      } else {
        alert(data.error || 'Failed to create event');
      }
    } catch (error) {
      alert('Error creating event');
    } finally {
      setCreating(false);
    }
  }

  async function handleStart(eventId) {
    if (!confirm('Start this event? Participants can no longer join.')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/event/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Event started!');
        fetchEvents();
      } else {
        alert(data.error || 'Failed to start event');
      }
    } catch (error) {
      alert('Error starting event');
    }
  }

  async function handleFinish(eventId) {
    if (!confirm('Finish this event? Scores will be locked.')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/event/finish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Event finished!');
        fetchEvents();
      } else {
        alert(data.error || 'Failed to finish event');
      }
    } catch (error) {
      alert('Error finishing event');
    }
  }

  async function handleDelete(eventId) {
    if (!confirm('Delete this event? This cannot be undone!')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/event/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        alert('Event deleted!');
        fetchEvents();
      } else {
        alert(data.error || 'Failed to delete event');
      }
    } catch (error) {
      alert('Error deleting event');
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Event Management</h1>
            <p className="text-gray-400 mt-2">Create and manage hackathon events</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            {showCreateForm ? '✕ Cancel' : '+ Create Event'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Create New Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input"
                  placeholder="Hackathon 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input"
                  rows={3}
                  placeholder="Event description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Max Participants *
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value)})}
                    className="input"
                    min="1"
                    max="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                    className="input"
                    min="1"
                    max="720"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn btn-primary w-full"
              >
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="space-y-4">
          {events.map(event => (
            <div key={event._id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{event.name}</h3>
                    <span className={`badge ${
                      event.status === 'running' ? 'badge-success' :
                      event.status === 'finished' ? 'badge-error' :
                      'badge-warning'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4">{event.description || 'No description'}</p>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Participants</div>
                      <div className="text-white font-semibold">
                        {event.currentParticipants}/{event.maxParticipants}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Duration</div>
                      <div className="text-white font-semibold">{event.duration}h</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Commits</div>
                      <div className="text-white font-semibold">{event.totalCommits || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Created</div>
                      <div className="text-white font-semibold">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-6">
                  <a href={`/events/${event._id}`} className="btn btn-outline">
                    View
                  </a>
                  {event.status === 'waiting' && (
                    <button
                      onClick={() => handleStart(event._id)}
                      className="btn btn-primary"
                    >
                      Start
                    </button>
                  )}
                  {event.status === 'running' && (
                    <button
                      onClick={() => handleFinish(event._id)}
                      className="btn bg-yellow-600 hover:bg-yellow-700"
                    >
                      Finish
                    </button>
                  )}
                  {event.status !== 'running' && (
                    <button
                      onClick={() => handleDelete(event._id)}
                      className="btn bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎪</div>
              <h3 className="text-xl font-bold text-white mb-2">No events yet</h3>
              <p className="text-gray-400">Create your first event to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}