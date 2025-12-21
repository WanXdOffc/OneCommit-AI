'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function HomePage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    // Trigger server boot
    fetch('/api/boot')
      .then(() => setBooting(false))
      .catch(err => {
        console.error('Boot check failed:', err);
        setBooting(false);
      });

    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleDiscordLogin = () => {
    window.location.href = '/api/auth/discord';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navbar */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🧠</div>
              <span className="text-xl font-bold text-white">OneCommit AI</span>
            </div>
            <button
              onClick={handleDiscordLogin}
              className="btn btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Login with Discord</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-500/10 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            <p className="font-medium">Authentication Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          {/* Logo/Title */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-7xl font-bold">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                OneCommit AI
              </span>
            </h1>
            <p className="text-2xl text-gray-300">
              AI-Powered Hackathon Monitoring Platform
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Track commits, analyze code quality with AI, and compete in real-time leaderboards. 
              All powered by Discord integration.
            </p>
          </div>

          {/* CTA Button */}
          <div className="animate-slide-up">
            <button
              onClick={handleDiscordLogin}
              className="group relative inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl px-10 py-5 rounded-xl font-semibold shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Get Started with Discord</span>
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="glass rounded-2xl p-8 hover:scale-105 transition-transform duration-300">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-2xl font-bold text-white mb-3">GitHub Integration</h3>
              <p className="text-gray-300">
                Real-time commit tracking with webhook integration. Monitor every push instantly.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 hover:scale-105 transition-transform duration-300">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold text-white mb-3">AI Analysis</h3>
              <p className="text-gray-300">
                Intelligent commit quality assessment with spam detection and detailed feedback.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 hover:scale-105 transition-transform duration-300">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-2xl font-bold text-white mb-3">Discord Bot</h3>
              <p className="text-gray-300">
                Seamless event management and real-time notifications in your Discord server.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <div className="text-4xl font-bold text-blue-400">AI</div>
              <div className="text-gray-400 mt-2">Powered Analysis</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <div className="text-4xl font-bold text-purple-400">Real-time</div>
              <div className="text-gray-400 mt-2">Tracking</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <div className="text-4xl font-bold text-pink-400">Discord</div>
              <div className="text-gray-400 mt-2">Integration</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <div className="text-4xl font-bold text-green-400">Open</div>
              <div className="text-gray-400 mt-2">Source</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>OneCommit AI © 2024 - Built with Next.js, MongoDB, AI & Discord.js</p>
          <p className="mt-2 text-sm">Made with ❤️ for Hackathon Communities</p>
        </div>
      </footer>
    </div>
  );
}