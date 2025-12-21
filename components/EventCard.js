import Link from 'next/link';

export default function EventCard({ event }) {
  const statusColors = {
    waiting: 'bg-yellow-500/10 text-yellow-400 border-yellow-500',
    running: 'bg-green-500/10 text-green-400 border-green-500',
    finished: 'bg-red-500/10 text-red-400 border-red-500',
    cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500',
  };

  const statusEmoji = {
    waiting: '⏳',
    running: '🟢',
    finished: '🏁',
    cancelled: '❌',
  };

  return (
    <Link href={`/events/${event._id}`}>
      <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-750 transition-all cursor-pointer border border-slate-700 hover:border-slate-600">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{event.description || 'No description'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[event.status]}`}>
            {statusEmoji[event.status]} {event.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-xs text-gray-500">Participants</div>
            <div className="text-lg font-semibold text-white">
              {event.currentParticipants}/{event.maxParticipants}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Duration</div>
            <div className="text-lg font-semibold text-white">{event.duration}h</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Commits</div>
            <div className="text-lg font-semibold text-white">{event.totalCommits || 0}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Slots</div>
            <div className="text-lg font-semibold text-white">
              {event.maxParticipants - event.currentParticipants}
            </div>
          </div>
        </div>

        {event.startTime && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-xs text-gray-500">
              {event.status === 'running' ? 'Started' : event.status === 'finished' ? 'Ended' : 'Starts'}:{' '}
              {new Date(event.startTime).toLocaleDateString()} {new Date(event.startTime).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}