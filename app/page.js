export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo/Title */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold text-gradient">
              OneCommit AI
            </h1>
            <p className="text-xl text-slate-600">
              AI-Powered Hackathon Monitoring Platform
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="card">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold mb-2">GitHub Integration</h3>
              <p className="text-slate-600">
                Real-time commit tracking with webhook integration
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-2">AI Analysis</h3>
              <p className="text-slate-600">
                Intelligent commit quality assessment and scoring
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-2">Discord Bot</h3>
              <p className="text-slate-600">
                Seamless event management and notifications
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mt-8">
            <a href="/dashboard" className="btn btn-primary text-lg px-8 py-3">
              Go to Dashboard
            </a>
            <a href="/admin" className="btn btn-outline text-lg px-8 py-3">
              Admin Panel
            </a>
          </div>

          {/* Status */}
          <div className="mt-12 text-sm text-slate-500">
            <p>🚀 Phase 1 Complete - Foundation Ready</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-500 text-sm">
        <p>OneCommit AI © 2024 - Built with Next.js, MongoDB, and AI</p>
      </footer>
    </div>
  )
}