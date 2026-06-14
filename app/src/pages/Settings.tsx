import { useState } from 'react';
import { Eye, EyeOff, Shield, Smartphone, Trash2 } from 'lucide-react';

const sessions = [
  { device: 'Chrome on macOS', location: 'San Francisco, CA', current: true },
  { device: 'Safari on iPhone', location: 'San Francisco, CA', current: false },
  { device: 'Firefox on Windows', location: 'New York, NY', current: false },
];

export default function Settings() {
  const [tab, setTab] = useState<'general' | 'ai' | 'security'>('general');
  const [platformName, setPlatformName] = useState('MMe-AI');
  const [supportEmail, setSupportEmail] = useState('support@aigrowth.os');
  const [aiModel, setAiModel] = useState('GPT-4o');
  const [aiCredits, setAiCredits] = useState('1000');
  const [storageLimit, setStorageLimit] = useState('50');
  const [twoFA, setTwoFA] = useState(true);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const tabs = [
    { key: 'general' as const, label: 'General' },
    { key: 'ai' as const, label: 'AI Settings' },
    { key: 'security' as const, label: 'Security' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Configure your platform settings</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              background: tab === t.key ? 'rgba(107, 138, 255, 0.12)' : 'transparent',
              color: tab === t.key ? '#6B8AFF' : '#8A8A93',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {tab === 'general' && (
        <div className="max-w-xl space-y-6">
          <div className="surface-card p-6">
            <label className="block text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Platform Name</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="input-dark w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div className="surface-card p-6">
            <label className="block text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Logo</label>
            <div
              className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
              style={{
                border: '2px dashed rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(107, 138, 255, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold"
                style={{ background: 'linear-gradient(135deg, #6B8AFF, #4A6BFF)', color: '#F0EDE6' }}
              >
                A
              </div>
              <span className="text-xs" style={{ color: '#55555C' }}>Click to upload new logo</span>
            </div>
          </div>

          <div className="surface-card p-6">
            <label className="block text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Support Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="input-dark w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div className="surface-card p-6">
            <label className="block text-xs font-mono mb-3" style={{ color: '#8A8A93' }}>Theme</label>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: 'rgba(107, 138, 255, 0.12)',
                  color: '#6B8AFF',
                  border: '1px solid rgba(107, 138, 255, 0.2)',
                }}
              >
                <span className="w-4 h-4 rounded-full" style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.2)' }} />
                Dark
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: 'transparent',
                  color: '#55555C',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span className="w-4 h-4 rounded-full" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)' }} />
                Light
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Tab */}
      {tab === 'ai' && (
        <div className="max-w-xl space-y-6">
          <div className="surface-card p-6">
            <label className="block text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Default AI Model</label>
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="input-dark w-full px-4 py-2.5 text-sm appearance-none cursor-pointer"
            >
              <option value="GPT-4o" style={{ background: '#0F0F14' }}>GPT-4o</option>
              <option value="GPT-4 Turbo" style={{ background: '#0F0F14' }}>GPT-4 Turbo</option>
              <option value="Claude 3 Opus" style={{ background: '#0F0F14' }}>Claude 3 Opus</option>
              <option value="Claude 3 Sonnet" style={{ background: '#0F0F14' }}>Claude 3 Sonnet</option>
            </select>
          </div>

          <div className="surface-card p-6">
            <label className="block text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Default AI Credits</label>
            <input
              type="text"
              value={aiCredits}
              onChange={(e) => setAiCredits(e.target.value)}
              className="input-dark w-full px-4 py-2.5 text-sm"
            />
            <p className="text-xs mt-2" style={{ color: '#55555C' }}>Monthly AI credits per company</p>
          </div>

          <div className="surface-card p-6">
            <label className="block text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Default Storage Limit</label>
            <div className="relative">
              <input
                type="text"
                value={storageLimit}
                onChange={(e) => setStorageLimit(e.target.value)}
                className="input-dark w-full px-4 py-2.5 text-sm pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono" style={{ color: '#55555C' }}>GB</span>
            </div>
            <p className="text-xs mt-2" style={{ color: '#55555C' }}>Storage limit per company</p>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div className="max-w-xl space-y-6">
          <div className="surface-card p-6">
            <h3 className="text-sm font-medium mb-4" style={{ color: '#F0EDE6' }}>Change Password</h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Current Password</label>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  placeholder="Enter current password"
                  className="input-dark w-full px-4 py-2.5 text-sm pr-10"
                />
                <button
                  className="absolute right-3 top-[34px] transition-colors"
                  style={{ color: '#55555C' }}
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#8A8A93'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#55555C'; }}
                >
                  {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="relative">
                <label className="block text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>New Password</label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="input-dark w-full px-4 py-2.5 text-sm pr-10"
                />
                <button
                  className="absolute right-3 top-[34px] transition-colors"
                  style={{ color: '#55555C' }}
                  onClick={() => setShowNewPass(!showNewPass)}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#8A8A93'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#55555C'; }}
                >
                  {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div>
                <label className="block text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="input-dark w-full px-4 py-2.5 text-sm"
                />
              </div>
              <button
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: '#6B8AFF', color: '#0A0A0F' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#7B9AFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#6B8AFF'; }}
              >
                Update Password
              </button>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(107, 138, 255, 0.12)', color: '#6B8AFF' }}
                >
                  <Smartphone size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>Two-Factor Authentication</p>
                  <p className="text-xs" style={{ color: '#55555C' }}>Add an extra layer of security</p>
                </div>
              </div>
              <button
                onClick={() => setTwoFA(!twoFA)}
                className="relative w-11 h-6 rounded-full transition-colors duration-300"
                style={{ background: twoFA ? '#6B8AFF' : '#55555C' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-300"
                  style={{
                    background: '#F0EDE6',
                    transform: twoFA ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </button>
            </div>
          </div>

          <div className="surface-card p-6">
            <h3 className="text-sm font-medium mb-4" style={{ color: '#F0EDE6' }}>Session Management</h3>
            <div className="space-y-3">
              {sessions.map((session, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: idx < sessions.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={14} style={{ color: '#8A8A93' }} />
                    <div>
                      <p className="text-sm" style={{ color: '#F0EDE6' }}>
                        {session.device}
                        {session.current && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full badge-green">Current</span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: '#55555C' }}>{session.location}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <button
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: '#55555C' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FF5A5A'; e.currentTarget.style.background = 'rgba(255, 90, 90, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#55555C'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>MMe-AI v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}

