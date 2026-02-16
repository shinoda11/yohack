'use client'

import React from 'react'

export default function FitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>
      {/* Simple header — no sidebar */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="180" height="180" rx="40" fill="#1A1916"/>
            <path d="M90 30 L90 90 L50 150" stroke="#C8B89A" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M90 90 L130 150" stroke="#C8B89A" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="text-lg font-semibold" style={{ color: '#1A1916' }}>YOHACK</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t py-6 text-center text-xs" style={{ color: '#8A7A62' }}>
        <p>&copy; 2024 YOHACK. All rights reserved.</p>
      </footer>
    </div>
  )
}
