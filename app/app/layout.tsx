'use client'

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="min-h-screen pt-14 lg:pt-0 lg:ml-64">
        {children}
      </main>
    </div>
  )
}
