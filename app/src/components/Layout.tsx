import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import ParticleOverlay from './ParticleOverlay';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <button
        type="button"
        className="fixed left-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#F0EDE6',
        }}
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <ParticleOverlay />

      <main
        className="relative min-h-screen w-full transition-all duration-300 lg:ml-[240px] lg:w-[calc(100%-240px)]"
        style={{ background: '#0A0A0F' }}
      >
        <Outlet />
      </main>
    </div>
  );
}

