export interface Company {
  id: string;
  name: string;
  industry: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  users: number;
  status: 'Active' | 'Trial' | 'Suspended';
  createdDate: string;
  logo: string;
  owner: string;
  storageUsed: string;
  connectedPlatforms: string[];
  aiUsage: number;
  postsPublished: number;
}

export interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  expectedRevenue: string;
  nextFollowUp: string;
  status: 'New Lead' | 'Contacted' | 'Demo Scheduled' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';
}

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  avatar: string;
}

export interface AIJob {
  id: string;
  jobName: string;
  company: string;
  status: 'Running' | 'Completed' | 'Failed' | 'Pending';
  executionTime: string;
  createdTime: string;
}

export interface Subscription {
  id: string;
  company: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  renewalDate: string;
  amount: string;
  status: 'Active' | 'Past Due' | 'Cancelled';
}

export interface SupportTicket {
  id: string;
  ticketId: string;
  company: string;
  issue: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Resolved' | 'Pending';
  assignedTo: string;
}

export interface Activity {
  id: string;
  text: string;
  timestamp: string;
  color: string;
  initial: string;
}

export interface PlatformStatus {
  name: string;
  status: 'Operational' | 'Degraded' | 'Down';
}

export const companies: Company[] = [
  { id: '1', name: 'ABC Realty', industry: 'Real Estate', plan: 'Pro', users: 12, status: 'Active', createdDate: '2024-01-15', logo: 'AB', owner: 'John Smith', storageUsed: '45.2 GB', connectedPlatforms: ['Instagram', 'Facebook', 'TikTok'], aiUsage: 2847, postsPublished: 156 },
  { id: '2', name: 'XYZ Gym', industry: 'Fitness', plan: 'Enterprise', users: 8, status: 'Active', createdDate: '2024-02-20', logo: 'XY', owner: 'Sarah Johnson', storageUsed: '28.7 GB', connectedPlatforms: ['Instagram', 'YouTube'], aiUsage: 1923, postsPublished: 89 },
  { id: '3', name: 'TechStart Inc', industry: 'Technology', plan: 'Starter', users: 3, status: 'Trial', createdDate: '2024-03-10', logo: 'TS', owner: 'Mike Chen', storageUsed: '8.1 GB', connectedPlatforms: ['Twitter', 'LinkedIn'], aiUsage: 456, postsPublished: 23 },
  { id: '4', name: 'GreenLeaf Cafe', industry: 'Food & Beverage', plan: 'Pro', users: 5, status: 'Active', createdDate: '2024-01-28', logo: 'GL', owner: 'Emma Davis', storageUsed: '15.3 GB', connectedPlatforms: ['Instagram', 'Facebook'], aiUsage: 1234, postsPublished: 67 },
  { id: '5', name: 'UrbanStyle Boutique', industry: 'Retail', plan: 'Starter', users: 2, status: 'Active', createdDate: '2024-04-05', logo: 'US', owner: 'Lisa Wang', storageUsed: '5.6 GB', connectedPlatforms: ['Instagram', 'TikTok'], aiUsage: 789, postsPublished: 45 },
  { id: '6', name: 'FitLife Studios', industry: 'Fitness', plan: 'Pro', users: 9, status: 'Active', createdDate: '2024-02-14', logo: 'FL', owner: 'David Park', storageUsed: '32.1 GB', connectedPlatforms: ['YouTube', 'Instagram'], aiUsage: 2156, postsPublished: 112 },
  { id: '7', name: 'Digital Marketing Pro', industry: 'Marketing', plan: 'Enterprise', users: 15, status: 'Active', createdDate: '2023-11-20', logo: 'DM', owner: 'Rachel Green', storageUsed: '67.8 GB', connectedPlatforms: ['All Platforms'], aiUsage: 4521, postsPublished: 234 },
  { id: '8', name: 'Coastal Dental', industry: 'Healthcare', plan: 'Pro', users: 6, status: 'Active', createdDate: '2024-03-22', logo: 'CD', owner: 'Dr. James Wilson', storageUsed: '19.4 GB', connectedPlatforms: ['Facebook', 'Instagram'], aiUsage: 987, postsPublished: 56 },
  { id: '9', name: 'Nova Consulting', industry: 'Consulting', plan: 'Starter', users: 2, status: 'Suspended', createdDate: '2024-01-08', logo: 'NC', owner: 'Amy Taylor', storageUsed: '3.2 GB', connectedPlatforms: ['LinkedIn'], aiUsage: 123, postsPublished: 8 },
  { id: '10', name: 'Rise Education', industry: 'Education', plan: 'Pro', users: 10, status: 'Active', createdDate: '2024-02-01', logo: 'RE', owner: 'Mark Anderson', storageUsed: '41.5 GB', connectedPlatforms: ['YouTube', 'Facebook'], aiUsage: 1876, postsPublished: 98 },
];

export const leads: Lead[] = [
  { id: '1', companyName: 'Sunrise Hotels', contactPerson: 'Robert Chen', email: 'robert@sunrisehotels.com', phone: '+1 (555) 234-5678', industry: 'Hospitality', expectedRevenue: '$24,000/yr', nextFollowUp: 'Tomorrow', status: 'New Lead' },
  { id: '2', companyName: 'Peak Fitness', contactPerson: 'Amanda Lee', email: 'amanda@peakfitness.com', phone: '+1 (555) 876-5432', industry: 'Fitness', expectedRevenue: '$18,000/yr', nextFollowUp: 'In 2 days', status: 'Contacted' },
  { id: '3', companyName: 'Bright Minds Academy', contactPerson: 'Dr. Susan Park', email: 'susan@brightminds.edu', phone: '+1 (555) 345-6789', industry: 'Education', expectedRevenue: '$36,000/yr', nextFollowUp: 'Next week', status: 'Demo Scheduled' },
  { id: '4', companyName: 'Metro Law Firm', contactPerson: 'James Mitchell', email: 'james@metrolaw.com', phone: '+1 (555) 456-7890', industry: 'Legal', expectedRevenue: '$48,000/yr', nextFollowUp: 'Tomorrow', status: 'Proposal Sent' },
  { id: '5', companyName: 'Green Earth Organics', contactPerson: 'Lisa Wong', email: 'lisa@greenearth.com', phone: '+1 (555) 567-8901', industry: 'Food & Beverage', expectedRevenue: '$12,000/yr', nextFollowUp: 'In 3 days', status: 'Negotiation' },
  { id: '6', companyName: 'AutoMax Dealership', contactPerson: 'Tom Bradley', email: 'tom@automax.com', phone: '+1 (555) 678-9012', industry: 'Automotive', expectedRevenue: '$60,000/yr', nextFollowUp: 'Today', status: 'Won' },
  { id: '7', companyName: 'City Art Gallery', contactPerson: 'Nina Patel', email: 'nina@cityart.com', phone: '+1 (555) 789-0123', industry: 'Arts', expectedRevenue: '$8,000/yr', nextFollowUp: '-', status: 'Lost' },
  { id: '8', companyName: 'Swift Logistics', contactPerson: 'Carlos Rivera', email: 'carlos@swiftlogistics.com', phone: '+1 (555) 890-1234', industry: 'Logistics', expectedRevenue: '$42,000/yr', nextFollowUp: 'Next week', status: 'New Lead' },
  { id: '9', companyName: 'Zen Wellness Spa', contactPerson: 'Maya Johnson', email: 'maya@zenwellness.com', phone: '+1 (555) 901-2345', industry: 'Wellness', expectedRevenue: '$15,000/yr', nextFollowUp: 'In 2 days', status: 'Contacted' },
  { id: '10', companyName: 'BuildRight Construction', contactPerson: 'Steve Adams', email: 'steve@buildright.com', phone: '+1 (555) 012-3456', industry: 'Construction', expectedRevenue: '$30,000/yr', nextFollowUp: 'Tomorrow', status: 'Demo Scheduled' },
  { id: '11', companyName: 'Flavor Fusion', contactPerson: 'Maria Garcia', email: 'maria@flavorfusion.com', phone: '+1 (555) 123-4567', industry: 'Food & Beverage', expectedRevenue: '$10,000/yr', nextFollowUp: 'Next week', status: 'Proposal Sent' },
  { id: '12', companyName: 'DataDrive Analytics', contactPerson: 'Alex Kim', email: 'alex@datadrive.com', phone: '+1 (555) 234-5678', industry: 'Technology', expectedRevenue: '$72,000/yr', nextFollowUp: 'In 3 days', status: 'Negotiation' },
];

export const users: User[] = [
  { id: '1', name: 'John Smith', email: 'john@abcrealty.com', company: 'ABC Realty', role: 'Admin', status: 'Active', lastLogin: '2 min ago', avatar: 'JS' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@xyzgym.com', company: 'XYZ Gym', role: 'Admin', status: 'Active', lastLogin: '15 min ago', avatar: 'SJ' },
  { id: '3', name: 'Mike Chen', email: 'mike@techstart.com', company: 'TechStart Inc', role: 'Editor', status: 'Active', lastLogin: '1 hour ago', avatar: 'MC' },
  { id: '4', name: 'Emma Davis', email: 'emma@greenleaf.com', company: 'GreenLeaf Cafe', role: 'Admin', status: 'Active', lastLogin: '30 min ago', avatar: 'ED' },
  { id: '5', name: 'Lisa Wang', email: 'lisa@urbanstyle.com', company: 'UrbanStyle Boutique', role: 'Viewer', status: 'Inactive', lastLogin: '3 days ago', avatar: 'LW' },
  { id: '6', name: 'David Park', email: 'david@fitlife.com', company: 'FitLife Studios', role: 'Editor', status: 'Active', lastLogin: '5 min ago', avatar: 'DP' },
  { id: '7', name: 'Rachel Green', email: 'rachel@digitalmarketing.com', company: 'Digital Marketing Pro', role: 'Admin', status: 'Active', lastLogin: '1 min ago', avatar: 'RG' },
  { id: '8', name: 'Dr. James Wilson', email: 'james@coastaldental.com', company: 'Coastal Dental', role: 'Editor', status: 'Active', lastLogin: '45 min ago', avatar: 'JW' },
  { id: '9', name: 'Amy Taylor', email: 'amy@novaconsulting.com', company: 'Nova Consulting', role: 'Viewer', status: 'Inactive', lastLogin: '1 week ago', avatar: 'AT' },
  { id: '10', name: 'Mark Anderson', email: 'mark@riseeducation.com', company: 'Rise Education', role: 'Admin', status: 'Active', lastLogin: '10 min ago', avatar: 'MA' },
];

export const aiJobs: AIJob[] = [
  { id: '1', jobName: 'Video Generation #2847', company: 'ABC Realty', status: 'Running', executionTime: '2m 34s', createdTime: '5 min ago' },
  { id: '2', jobName: 'Caption Batch #156', company: 'XYZ Gym', status: 'Completed', executionTime: '45s', createdTime: '12 min ago' },
  { id: '3', jobName: 'Image Enhancement #892', company: 'GreenLeaf Cafe', status: 'Failed', executionTime: '1m 12s', createdTime: '18 min ago' },
  { id: '4', jobName: 'Content Schedule #445', company: 'Digital Marketing Pro', status: 'Running', executionTime: '5m 22s', createdTime: '22 min ago' },
  { id: '5', jobName: 'Script Generation #223', company: 'Rise Education', status: 'Pending', executionTime: '-', createdTime: '30 min ago' },
  { id: '6', jobName: 'Thumbnail Batch #78', company: 'FitLife Studios', status: 'Completed', executionTime: '32s', createdTime: '1 hour ago' },
  { id: '7', jobName: 'Voiceover #1567', company: 'Coastal Dental', status: 'Completed', executionTime: '2m 15s', createdTime: '1.5 hours ago' },
  { id: '8', jobName: 'Analytics Report #89', company: 'ABC Realty', status: 'Failed', executionTime: '3m 45s', createdTime: '2 hours ago' },
  { id: '9', jobName: 'Social Post Batch #334', company: 'UrbanStyle Boutique', status: 'Pending', executionTime: '-', createdTime: '2.5 hours ago' },
  { id: '10', jobName: 'Video Edit #1123', company: 'XYZ Gym', status: 'Running', executionTime: '8m 12s', createdTime: '3 hours ago' },
];

export const subscriptions: Subscription[] = [
  { id: '1', company: 'ABC Realty', plan: 'Pro', renewalDate: 'Jan 15, 2025', amount: '$299/mo', status: 'Active' },
  { id: '2', company: 'XYZ Gym', plan: 'Enterprise', renewalDate: 'Feb 20, 2025', amount: '$799/mo', status: 'Active' },
  { id: '3', company: 'TechStart Inc', plan: 'Starter', renewalDate: 'Mar 10, 2025', amount: '$99/mo', status: 'Active' },
  { id: '4', company: 'GreenLeaf Cafe', plan: 'Pro', renewalDate: 'Jan 28, 2025', amount: '$299/mo', status: 'Active' },
  { id: '5', company: 'UrbanStyle Boutique', plan: 'Starter', renewalDate: 'Apr 05, 2025', amount: '$99/mo', status: 'Active' },
  { id: '6', company: 'FitLife Studios', plan: 'Pro', renewalDate: 'Feb 14, 2025', amount: '$299/mo', status: 'Active' },
  { id: '7', company: 'Digital Marketing Pro', plan: 'Enterprise', renewalDate: 'Nov 20, 2025', amount: '$799/mo', status: 'Active' },
  { id: '8', company: 'Coastal Dental', plan: 'Pro', renewalDate: 'Mar 22, 2025', amount: '$299/mo', status: 'Active' },
  { id: '9', company: 'Nova Consulting', plan: 'Starter', renewalDate: 'Jan 08, 2025', amount: '$99/mo', status: 'Past Due' },
  { id: '10', company: 'Rise Education', plan: 'Pro', renewalDate: 'Feb 01, 2025', amount: '$299/mo', status: 'Active' },
];

export const supportTickets: SupportTicket[] = [
  { id: '1', ticketId: 'SUP-2025-001', company: 'ABC Realty', issue: 'Video upload stuck at 85%', priority: 'High', status: 'Open', assignedTo: 'Alex Kim' },
  { id: '2', ticketId: 'SUP-2025-002', company: 'XYZ Gym', issue: 'Instagram connection expired', priority: 'Medium', status: 'Resolved', assignedTo: 'Sam Lee' },
  { id: '3', ticketId: 'SUP-2025-003', company: 'TechStart Inc', issue: 'Billing question about overage', priority: 'Low', status: 'Pending', assignedTo: 'Jordan Patel' },
  { id: '4', ticketId: 'SUP-2025-004', company: 'GreenLeaf Cafe', issue: 'Cannot schedule posts for Facebook', priority: 'High', status: 'Open', assignedTo: 'Alex Kim' },
  { id: '5', ticketId: 'SUP-2025-005', company: 'FitLife Studios', issue: 'AI voiceover not generating', priority: 'Medium', status: 'Open', assignedTo: 'Sam Lee' },
  { id: '6', ticketId: 'SUP-2025-006', company: 'Digital Marketing Pro', issue: 'Analytics dashboard loading slow', priority: 'Medium', status: 'Resolved', assignedTo: 'Jordan Patel' },
  { id: '7', ticketId: 'SUP-2025-007', company: 'Coastal Dental', issue: 'Team member invite not working', priority: 'Low', status: 'Pending', assignedTo: 'Alex Kim' },
  { id: '8', ticketId: 'SUP-2025-008', company: 'Rise Education', issue: 'Storage limit reached warning', priority: 'High', status: 'Open', assignedTo: 'Sam Lee' },
];

export const activities: Activity[] = [
  { id: '1', text: 'ABC Realty uploaded 5 videos', timestamp: '2 min ago', color: '#6B8AFF', initial: 'A' },
  { id: '2', text: 'XYZ Gym upgraded to Pro plan', timestamp: '15 min ago', color: '#FF8A5C', initial: 'X' },
  { id: '3', text: 'New company registered: TechStart Inc', timestamp: '32 min ago', color: '#4ADE80', initial: 'T' },
  { id: '4', text: 'Payment received from Digital Marketing Pro', timestamp: '1 hour ago', color: '#6B8AFF', initial: 'D' },
  { id: '5', text: 'FitLife Studios generated 12 AI posts', timestamp: '2 hours ago', color: '#FF8A5C', initial: 'F' },
];

export const platformStatuses: PlatformStatus[] = [
  { name: 'Backend', status: 'Operational' },
  { name: 'Database', status: 'Operational' },
  { name: 'AI Services', status: 'Operational' },
  { name: 'Queue', status: 'Operational' },
  { name: 'Storage', status: 'Operational' },
];

export const analyticsData = {
  revenue: [
    { month: 'Jan', value: 28400 },
    { month: 'Feb', value: 31200 },
    { month: 'Mar', value: 29800 },
    { month: 'Apr', value: 35600 },
    { month: 'May', value: 38900 },
    { month: 'Jun', value: 42380 },
  ],
  clients: [
    { month: 'Jan', value: 890 },
    { month: 'Feb', value: 967 },
    { month: 'Mar', value: 1034 },
    { month: 'Apr', value: 1123 },
    { month: 'May', value: 1189 },
    { month: 'Jun', value: 1247 },
  ],
  aiUsage: [
    { month: 'Jan', value: 12500 },
    { month: 'Feb', value: 15200 },
    { month: 'Mar', value: 18900 },
    { month: 'Apr', value: 22100 },
    { month: 'May', value: 28400 },
    { month: 'Jun', value: 34560 },
  ],
  activeUsers: [
    { month: 'Jan', value: 2340 },
    { month: 'Feb', value: 2560 },
    { month: 'Mar', value: 2780 },
    { month: 'Apr', value: 3120 },
    { month: 'May', value: 3560 },
    { month: 'Jun', value: 4120 },
  ],
};
