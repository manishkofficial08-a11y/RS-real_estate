import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ParticleOverlay from './ParticleOverlay';

export default function Layout() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <Sidebar />
      <ParticleOverlay />
      <main
        className="min-h-screen relative"
        style={{
          marginLeft: 240,
          width: 'calc(100% - 240px)',
          background: '#0A0A0F',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
