'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar({ user }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-bold text-white">OneCommit AI</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/events" className="text-gray-300 hover:text-white">
              Events
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-gray-300 hover:text-white">
                Admin
              </Link>
            )}
            
            <div className="flex items-center space-x-3">
              {user?.avatar && (
                <img src={user.avatar} className="w-8 h-8 rounded-full" />
              )}
              <span className="text-white">{user?.name}</span>
              {user?.role === 'admin' && (
                <span className="badge badge-success">Admin</span>
              )}
              <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}