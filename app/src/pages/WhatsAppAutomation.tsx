import { MessageSquare, Plus, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function WhatsAppAutomation() {
  const campaigns = [
    {
      id: 1,
      name: 'Welcome Message Campaign',
      status: 'Active',
      recipients: 1234,
      sent: 1234,
      opened: 1089,
      responses: 567,
      template: 'Welcome Template',
      lastRun: '2 hours ago',
      color: '#6B8AFF'
    },
    {
      id: 2,
      name: 'Promotional Offer',
      status: 'Scheduled',
      recipients: 2500,
      sent: 0,
      opened: 0,
      responses: 0,
      template: 'Promo Template',
      lastRun: 'Scheduled for 3 PM',
      color: '#4ADE80'
    },
    {
      id: 3,
      name: 'Order Confirmation',
      status: 'Active',
      recipients: 3456,
      sent: 3456,
      opened: 3124,
      responses: 892,
      template: 'Order Template',
      lastRun: '30 min ago',
      color: '#A78BFA'
    },
  ];

  const templates = [
    { id: 1, name: 'Welcome Template', messages: 245 },
    { id: 2, name: 'Promo Template', messages: 156 },
    { id: 3, name: 'Order Template', messages: 389 },
    { id: 4, name: 'Support Template', messages: 67 },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>WhatsApp Automation</h1>
          <p style={{ color: '#8A8A93' }}>Send automated messages directly to your customers</p>
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
          <Plus size={18} />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="surface-card p-6" style={{ backdropFilter: 'blur(24px)' }}>
          <p className="text-sm mb-2" style={{ color: '#8A8A93' }}>Total Sent</p>
          <p className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>7,124</p>
          <p className="text-xs" style={{ color: '#4ADE80' }}>+234 this month</p>
        </div>
        <div className="surface-card p-6" style={{ backdropFilter: 'blur(24px)' }}>
          <p className="text-sm mb-2" style={{ color: '#8A8A93' }}>Delivery Rate</p>
          <p className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>98.5%</p>
          <p className="text-xs" style={{ color: '#4ADE80' }}>+2.3% this week</p>
        </div>
        <div className="surface-card p-6" style={{ backdropFilter: 'blur(24px)' }}>
          <p className="text-sm mb-2" style={{ color: '#8A8A93' }}>Open Rate</p>
          <p className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>87.2%</p>
          <p className="text-xs" style={{ color: '#4ADE80' }}>+5.1% this week</p>
        </div>
        <div className="surface-card p-6" style={{ backdropFilter: 'blur(24px)' }}>
          <p className="text-sm mb-2" style={{ color: '#8A8A93' }}>Active Campaigns</p>
          <p className="text-3xl font-bold mb-2" style={{ color: '#F0EDE6' }}>2</p>
          <p className="text-xs" style={{ color: '#4ADE80' }}>2 scheduled</p>
        </div>
      </div>

      {/* Campaigns */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold mb-6" style={{ color: '#F0EDE6' }}>Active Campaigns</h2>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-4 rounded-lg border transition-all duration-200"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.01)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${campaign.color}20` }}
                    >
                      <MessageSquare size={16} style={{ color: campaign.color }} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm" style={{ color: '#F0EDE6' }}>{campaign.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: '#8A8A93' }}>{campaign.template}</p>
                    </div>
                  </div>
                  <div
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: campaign.status === 'Active' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(100, 150, 255, 0.15)',
                      color: campaign.status === 'Active' ? '#4ADE80' : '#6B8AFF',
                    }}
                  >
                    {campaign.status}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p style={{ color: '#8A8A93' }}>Recipients</p>
                    <p className="font-mono" style={{ color: '#F0EDE6' }}>{campaign.recipients}</p>
                  </div>
                  <div>
                    <p style={{ color: '#8A8A93' }}>Opened</p>
                    <p className="font-mono" style={{ color: '#F0EDE6' }}>{campaign.opened}</p>
                  </div>
                  <div>
                    <p style={{ color: '#8A8A93' }}>Responses</p>
                    <p className="font-mono" style={{ color: '#F0EDE6' }}>{campaign.responses}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold mb-6" style={{ color: '#F0EDE6' }}>Message Templates</h2>
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200"
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
                <div>
                  <h3 className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{template.name}</h3>
                  <p className="text-xs mt-1" style={{ color: '#8A8A93' }}>Used {template.messages} times</p>
                </div>
                <button
                  className="px-3 py-1 rounded text-xs transition-all duration-200"
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
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

