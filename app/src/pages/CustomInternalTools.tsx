import { Share2, Plus, Link2, CheckCircle, AlertCircle, Upload, Settings } from 'lucide-react';

export default function CustomInternalTools() {
  const platforms = [
    {
      id: 1,
      name: 'Facebook',
      icon: '📘',
      status: 'Connected',
      accounts: 2,
      lastSync: '2 hours ago',
      color: '#1877F2'
    },
    {
      id: 2,
      name: 'Instagram',
      icon: '📷',
      status: 'Connected',
      accounts: 2,
      lastSync: '30 min ago',
      color: '#E4405F'
    },
    {
      id: 3,
      name: 'LinkedIn',
      icon: '💼',
      status: 'Connected',
      accounts: 1,
      lastSync: '1 hour ago',
      color: '#0A66C2'
    },
    {
      id: 4,
      name: 'Twitter',
      icon: '🐦',
      status: 'Not Connected',
      accounts: 0,
      lastSync: '-',
      color: '#000000'
    },
    {
      id: 5,
      name: 'TikTok',
      icon: '🎵',
      status: 'Connected',
      accounts: 1,
      lastSync: '45 min ago',
      color: '#000000'
    },
    {
      id: 6,
      name: 'YouTube',
      icon: '📹',
      status: 'Not Connected',
      accounts: 0,
      lastSync: '-',
      color: '#FF0000'
    },
  ];

  const publishedContent = [
    {
      id: 1,
      title: 'New Product Launch Announcement',
      platforms: ['Facebook', 'Instagram', 'LinkedIn'],
      date: '2 days ago',
      engagements: 2543,
      status: 'Published'
    },
    {
      id: 2,
      title: 'Behind the Scenes Team Update',
      platforms: ['Instagram', 'TikTok'],
      date: '1 day ago',
      engagements: 1876,
      status: 'Published'
    },
    {
      id: 3,
      title: 'Customer Success Story',
      platforms: ['LinkedIn', 'Facebook'],
      date: '5 hours ago',
      engagements: 945,
      status: 'Published'
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>Custom Internal Tools</h1>
          <p style={{ color: '#8A8A93' }}>Multi-platform content distribution & social media management</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
          style={{
            background: '#6B8AFF',
            color: '#F0EDE6',
            border: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5A7AEE';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6B8AFF';
          }}
        >
          <Upload size={18} />
          <span>Publish Content</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="surface-card p-6" style={{ backdropFilter: 'blur(24px)' }}>
          <p className="text-sm mb-2" style={{ color: '#8A8A93' }}>Connected Platforms</p>
          <p className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>5</p>
          <p className="text-xs" style={{ color: '#4ADE80' }}>6 available</p>
        </div>
        <div className="surface-card p-6" style={{ backdropFilter: 'blur(24px)' }}>
          <p className="text-sm mb-2" style={{ color: '#8A8A93' }}>Total Accounts</p>
          <p className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>6</p>
          <p className="text-xs" style={{ color: '#4ADE80' }}>All synced</p>
        </div>
        <div className="surface-card p-6" style={{ backdropFilter: 'blur(24px)' }}>
          <p className="text-sm mb-2" style={{ color: '#8A8A93' }}>Content Published</p>
          <p className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>156</p>
          <p className="text-xs" style={{ color: '#4ADE80' }}>This month</p>
        </div>
        <div className="surface-card p-6" style={{ backdropFilter: 'blur(24px)' }}>
          <p className="text-sm mb-2" style={{ color: '#8A8A93' }}>Total Engagements</p>
          <p className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>54.2K</p>
          <p className="text-xs" style={{ color: '#4ADE80' }}>+12% vs last month</p>
        </div>
      </div>

      {/* Connected Platforms */}
      <div className="surface-card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: '#F0EDE6' }}>Social Media Platforms</h2>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-all duration-200"
            style={{
              background: 'rgba(107, 138, 255, 0.1)',
              color: '#6B8AFF',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(107, 138, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(107, 138, 255, 0.1)';
            }}
          >
            <Plus size={16} />
            Connect Platform
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="p-4 rounded-lg border transition-all duration-200"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.01)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{platform.icon}</div>
                {platform.status === 'Connected' ? (
                  <CheckCircle size={16} style={{ color: '#4ADE80' }} />
                ) : (
                  <AlertCircle size={16} style={{ color: '#FF8A5C' }} />
                )}
              </div>
              
              <h3 className="font-medium text-sm mb-1" style={{ color: '#F0EDE6' }}>
                {platform.name}
              </h3>
              
              <div className="mb-3">
                <p className="text-xs mb-1" style={{ color: '#8A8A93' }}>
                  {platform.status === 'Connected' ? 'Accounts' : 'Status'}
                </p>
                <p
                  className="text-xs font-mono"
                  style={{
                    color: platform.status === 'Connected' ? '#4ADE80' : '#FF8A5C',
                  }}
                >
                  {platform.status === 'Connected' ? `${platform.accounts} connected` : 'Not connected'}
                </p>
              </div>

              {platform.status === 'Connected' && (
                <p className="text-xs" style={{ color: '#8A8A93' }}>
                  Synced: {platform.lastSync}
                </p>
              )}

              <button
                className="w-full mt-3 px-2 py-1.5 rounded text-xs transition-all duration-200"
                style={{
                  background: platform.status === 'Connected' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(107, 138, 255, 0.1)',
                  color: platform.status === 'Connected' ? '#A78BFA' : '#6B8AFF',
                  border: 'none',
                }}
                onMouseEnter={(e) => {
                  const bg = platform.status === 'Connected' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(107, 138, 255, 0.2)';
                  e.currentTarget.style.background = bg;
                }}
                onMouseLeave={(e) => {
                  const bg = platform.status === 'Connected' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(107, 138, 255, 0.1)';
                  e.currentTarget.style.background = bg;
                }}
              >
                {platform.status === 'Connected' ? 'Manage' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* One-Click Publishing Feature */}
      <div className="grid grid-cols-2 gap-6">
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold mb-6" style={{ color: '#F0EDE6' }}>
            <Share2 className="inline mr-2" size={20} />
            One-Click Publishing
          </h2>
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg border-2 border-dashed transition-all duration-200 text-center"
              style={{
                borderColor: 'rgba(107, 138, 255, 0.3)',
                background: 'rgba(107, 138, 255, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(107, 138, 255, 0.6)';
                e.currentTarget.style.background = 'rgba(107, 138, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(107, 138, 255, 0.3)';
                e.currentTarget.style.background = 'rgba(107, 138, 255, 0.05)';
              }}
            >
              <Upload size={32} style={{ color: '#6B8AFF', margin: '0 auto 12px' }} />
              <p className="text-sm mb-1" style={{ color: '#F0EDE6' }}>Drag & drop or click to upload</p>
              <p className="text-xs" style={{ color: '#8A8A93' }}>Select which platforms to publish to</p>
            </div>

            <div className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: '#F0EDE6' }}>Auto-sync to:</p>
              <div className="flex flex-wrap gap-2">
                {['Facebook', 'Instagram', 'LinkedIn', 'TikTok'].map((plat) => (
                  <div
                    key={plat}
                    className="px-2 py-1 rounded text-xs"
                    style={{ background: 'rgba(107, 138, 255, 0.2)', color: '#6B8AFF' }}
                  >
                    ✓ {plat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recently Published */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold mb-6" style={{ color: '#F0EDE6' }}>Recently Published</h2>
          <div className="space-y-4">
            {publishedContent.map((content) => (
              <div
                key={content.id}
                className="p-4 rounded-lg border transition-all duration-200"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.01)',
                }}
              >
                <h3 className="text-sm font-medium mb-2" style={{ color: '#F0EDE6' }}>
                  {content.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {content.platforms.map((plat) => (
                    <div
                      key={plat}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        background: 'rgba(74, 222, 128, 0.15)',
                        color: '#4ADE80',
                      }}
                    >
                      {plat}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <p style={{ color: '#8A8A93' }}>{content.date}</p>
                  <p style={{ color: '#6B8AFF' }}>{content.engagements} engagements</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

