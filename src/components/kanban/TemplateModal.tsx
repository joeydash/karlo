import React, { useState } from 'react';
import { X, Layout, Loader2, CheckCircle, Users, Briefcase, Target, Calendar, Zap, Code, Palette, ShoppingCart, Heart, GraduationCap, Wrench, IndianRupee, Headphones, Clipboard, Rocket, FileText, Megaphone, UserCheck, Building, Lightbulb, Truck, Shield, Camera, Music, Gamepad2, Coffee, Plane, Home, Car, Smartphone, Globe, Settings, Search } from 'lucide-react';
import { useKanban } from '../../hooks/useKanban';

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  lists: string[];
  color: string;
  category: string;
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

const DEFAULT_TEMPLATE_COLOR = '#6B7280'; // Gray color for all template lists

// Predefined colors for template list chips
const TEMPLATE_CHIP_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

// Function to get color for a list based on its index
const getChipColor = (index: number) => {
  return TEMPLATE_CHIP_COLORS[index % TEMPLATE_CHIP_COLORS.length];
};

const categories: Category[] = [
  { id: 'all', name: 'All Templates', icon: Layout },
  { id: 'basic', name: 'Basic Workflow', icon: Clipboard },
  { id: 'software', name: 'Software Development', icon: Code },
  { id: 'project', name: 'Project Management', icon: Briefcase },
  { id: 'marketing', name: 'Marketing & Content', icon: Megaphone },
  { id: 'sales', name: 'Sales & CRM', icon: ShoppingCart },
  { id: 'hr', name: 'HR & Recruiting', icon: UserCheck },
  { id: 'operations', name: 'Operations', icon: Settings },
  { id: 'design', name: 'Design & Creative', icon: Palette },
  { id: 'support', name: 'Support & Service', icon: Headphones },
  { id: 'finance', name: 'Finance & Accounting', icon: IndianRupee },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'events', name: 'Event Management', icon: Calendar },
  { id: 'personal', name: 'Personal Productivity', icon: Heart }
];

const templates: Template[] = [
  // Basic Workflow (6 templates)
  {
    id: 'kanban-basic',
    name: 'Basic Kanban',
    description: 'Simple three-column workflow for task management',
    icon: Layout,
    lists: ['To Do', 'In Progress', 'Done'],
    color: 'from-blue-500 to-blue-600',
    category: 'basic'
  },
  {
    id: 'simple-workflow',
    name: 'Simple Workflow',
    description: 'Basic task flow for small teams',
    icon: Clipboard,
    lists: ['Backlog', 'Active', 'Complete'],
    color: 'from-gray-500 to-gray-600',
    category: 'basic'
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Perfect for beginners to Kanban',
    icon: Rocket,
    lists: ['Ideas', 'Doing', 'Done'],
    color: 'from-emerald-500 to-emerald-600',
    category: 'basic'
  },
  {
    id: 'task-tracker',
    name: 'Task Tracker',
    description: 'Simple task tracking workflow',
    icon: CheckCircle,
    lists: ['New Tasks', 'In Progress', 'Review', 'Completed'],
    color: 'from-violet-500 to-violet-600',
    category: 'basic'
  },
  {
    id: 'team-board',
    name: 'Team Board',
    description: 'Basic team collaboration board',
    icon: Users,
    lists: ['Queue', 'Working', 'Testing', 'Done'],
    color: 'from-teal-500 to-teal-600',
    category: 'basic'
  },
  {
    id: 'weekly-planner',
    name: 'Weekly Planner',
    description: 'Weekly task planning workflow',
    icon: Calendar,
    lists: ['This Week', 'In Progress', 'Blocked', 'Completed'],
    color: 'from-rose-500 to-rose-600',
    category: 'basic'
  },

  // Software Development (15 templates)
  {
    id: 'kanban-advanced',
    name: 'Advanced Kanban',
    description: 'Enhanced workflow with priority lanes and review stages',
    icon: Zap,
    lists: ['OPEN', 'TODO', 'PROGRESS', 'PENDING/BLOCKER', 'IN REVIEW', 'CLOSED'],
    color: 'from-cyan-500 to-cyan-600',
    category: 'software'
  },
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    description: 'Agile development workflow for sprint-based teams',
    icon: Target,
    lists: ['Product Backlog', 'Sprint Backlog', 'In Development', 'Code Review', 'Testing', 'Done'],
    color: 'from-purple-500 to-purple-600',
    category: 'software'
  },
  {
    id: 'bug-tracking',
    name: 'Bug Tracking',
    description: 'Track and resolve software bugs efficiently',
    icon: Shield,
    lists: ['Reported', 'Triaged', 'In Progress', 'Testing', 'Verified', 'Closed'],
    color: 'from-red-500 to-red-600',
    category: 'software'
  },
  {
    id: 'feature-development',
    name: 'Feature Development',
    description: 'New feature development pipeline',
    icon: Lightbulb,
    lists: ['Feature Request', 'Design', 'Development', 'Code Review', 'QA', 'Release'],
    color: 'from-amber-500 to-amber-600',
    category: 'software'
  },
  {
    id: 'code-review',
    name: 'Code Review Process',
    description: 'Streamlined code review workflow',
    icon: Code,
    lists: ['Submitted', 'Under Review', 'Needs Changes', 'Approved', 'Merged'],
    color: 'from-indigo-500 to-indigo-600',
    category: 'software'
  },
  {
    id: 'devops-pipeline',
    name: 'DevOps Pipeline',
    description: 'CI/CD and deployment workflow',
    icon: Settings,
    lists: ['Development', 'Build', 'Test', 'Staging', 'Production', 'Monitoring'],
    color: 'from-slate-500 to-slate-600',
    category: 'software'
  },
  {
    id: 'mobile-development',
    name: 'Mobile Development',
    description: 'Mobile app development workflow',
    icon: Smartphone,
    lists: ['Backlog', 'Design', 'iOS Dev', 'Android Dev', 'Testing', 'App Store'],
    color: 'from-pink-500 to-pink-600',
    category: 'software'
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Frontend and backend web development',
    icon: Globe,
    lists: ['Planning', 'Frontend', 'Backend', 'Integration', 'Testing', 'Deployment'],
    color: 'from-blue-500 to-blue-600',
    category: 'software'
  },
  {
    id: 'qa-testing',
    name: 'QA Testing',
    description: 'Quality assurance and testing workflow',
    icon: CheckCircle,
    lists: ['Test Planning', 'Manual Testing', 'Automated Testing', 'Bug Report', 'Verification', 'Passed'],
    color: 'from-green-500 to-green-600',
    category: 'software'
  },
  {
    id: 'product-release',
    name: 'Product Release',
    description: 'Software product release management',
    icon: Rocket,
    lists: ['Planning', 'Development', 'Beta Testing', 'Release Prep', 'Launch', 'Post-Launch'],
    color: 'from-orange-500 to-orange-600',
    category: 'software'
  },
  {
    id: 'api-development',
    name: 'API Development',
    description: 'RESTful API development workflow',
    icon: Code,
    lists: ['Specification', 'Development', 'Testing', 'Documentation', 'Deployment', 'Monitoring'],
    color: 'from-cyan-500 to-cyan-600',
    category: 'software'
  },
  {
    id: 'database-migration',
    name: 'Database Migration',
    description: 'Database schema and data migration',
    icon: Settings,
    lists: ['Planning', 'Schema Design', 'Migration Script', 'Testing', 'Staging', 'Production'],
    color: 'from-violet-500 to-violet-600',
    category: 'software'
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    description: 'Security assessment and vulnerability management',
    icon: Shield,
    lists: ['Scope Definition', 'Assessment', 'Vulnerability Found', 'Remediation', 'Testing', 'Closed'],
    color: 'from-red-500 to-red-600',
    category: 'software'
  },
  {
    id: 'performance-optimization',
    name: 'Performance Optimization',
    description: 'Application performance improvement workflow',
    icon: Zap,
    lists: ['Baseline', 'Analysis', 'Optimization', 'Testing', 'Validation', 'Deployed'],
    color: 'from-yellow-500 to-yellow-600',
    category: 'software'
  },
  {
    id: 'microservices',
    name: 'Microservices Development',
    description: 'Microservices architecture development',
    icon: Building,
    lists: ['Service Design', 'Development', 'Unit Testing', 'Integration', 'Deployment', 'Monitoring'],
    color: 'from-teal-500 to-teal-600',
    category: 'software'
  },

  // Project Management (10 templates)
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Complete project workflow with planning and review stages',
    icon: Briefcase,
    lists: ['Backlog', 'Planning', 'In Progress', 'Review', 'Testing', 'Completed'],
    color: 'from-green-500 to-green-600',
    category: 'project'
  },
  {
    id: 'construction-project',
    name: 'Construction Project',
    description: 'Construction and building project management',
    icon: Wrench,
    lists: ['Planning', 'Permits', 'Foundation', 'Construction', 'Inspection', 'Completion'],
    color: 'from-amber-500 to-amber-600',
    category: 'project'
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'New product launch project workflow',
    icon: Rocket,
    lists: ['Concept', 'Development', 'Testing', 'Marketing', 'Launch', 'Post-Launch'],
    color: 'from-purple-500 to-purple-600',
    category: 'project'
  },
  {
    id: 'research-project',
    name: 'Research Project',
    description: 'Academic or market research project flow',
    icon: GraduationCap,
    lists: ['Literature Review', 'Methodology', 'Data Collection', 'Analysis', 'Writing', 'Publication'],
    color: 'from-indigo-500 to-indigo-600',
    category: 'project'
  },
  {
    id: 'renovation-project',
    name: 'Renovation Project',
    description: 'Home or office renovation management',
    icon: Home,
    lists: ['Planning', 'Design', 'Permits', 'Demolition', 'Construction', 'Finishing'],
    color: 'from-orange-500 to-orange-600',
    category: 'project'
  },
  {
    id: 'it-implementation',
    name: 'IT Implementation',
    description: 'IT system implementation project',
    icon: Settings,
    lists: ['Requirements', 'Design', 'Development', 'Testing', 'Deployment', 'Support'],
    color: 'from-slate-500 to-slate-600',
    category: 'project'
  },
  {
    id: 'consulting-project',
    name: 'Consulting Project',
    description: 'Client consulting engagement workflow',
    icon: Users,
    lists: ['Discovery', 'Analysis', 'Strategy', 'Implementation', 'Review', 'Handover'],
    color: 'from-teal-500 to-teal-600',
    category: 'project'
  },
  {
    id: 'compliance-project',
    name: 'Compliance Project',
    description: 'Regulatory compliance implementation',
    icon: Shield,
    lists: ['Assessment', 'Gap Analysis', 'Planning', 'Implementation', 'Audit', 'Certification'],
    color: 'from-red-500 to-red-600',
    category: 'project'
  },
  {
    id: 'merger-acquisition',
    name: 'Merger & Acquisition',
    description: 'M&A project management workflow',
    icon: Building,
    lists: ['Due Diligence', 'Valuation', 'Negotiation', 'Legal Review', 'Integration', 'Closure'],
    color: 'from-gray-500 to-gray-600',
    category: 'project'
  },
  {
    id: 'change-management',
    name: 'Change Management',
    description: 'Organizational change management',
    icon: Briefcase,
    lists: ['Assessment', 'Planning', 'Communication', 'Training', 'Implementation', 'Adoption'],
    color: 'from-blue-500 to-blue-600',
    category: 'project'
  },

  // Marketing & Content (12 templates)
  {
    id: 'content-creation',
    name: 'Content Creation',
    description: 'Editorial workflow for content teams and creators',
    icon: Calendar,
    lists: ['Ideas', 'Research', 'Writing', 'Review', 'Editing', 'Published'],
    color: 'from-orange-500 to-orange-600',
    category: 'marketing'
  },
  {
    id: 'social-media',
    name: 'Social Media Campaign',
    description: 'Social media marketing campaign workflow',
    icon: Megaphone,
    lists: ['Planning', 'Content Creation', 'Review', 'Scheduling', 'Published', 'Analytics'],
    color: 'from-pink-500 to-pink-600',
    category: 'marketing'
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing',
    description: 'Email campaign creation and management',
    icon: FileText,
    lists: ['Strategy', 'Design', 'Content', 'Testing', 'Send', 'Analysis'],
    color: 'from-indigo-500 to-indigo-600',
    category: 'marketing'
  },
  {
    id: 'video-production',
    name: 'Video Production',
    description: 'Video content production workflow',
    icon: Camera,
    lists: ['Concept', 'Script', 'Filming', 'Editing', 'Review', 'Published'],
    color: 'from-red-500 to-red-600',
    category: 'marketing'
  },
  {
    id: 'podcast-production',
    name: 'Podcast Production',
    description: 'Podcast episode creation workflow',
    icon: Music,
    lists: ['Topic Research', 'Recording', 'Editing', 'Show Notes', 'Publishing', 'Promotion'],
    color: 'from-purple-500 to-purple-600',
    category: 'marketing'
  },
  {
    id: 'blog-editorial',
    name: 'Blog Editorial',
    description: 'Blog content editorial calendar',
    icon: FileText,
    lists: ['Ideas', 'Assigned', 'Writing', 'Editor Review', 'SEO Review', 'Published'],
    color: 'from-green-500 to-green-600',
    category: 'marketing'
  },
  {
    id: 'brand-campaign',
    name: 'Brand Campaign',
    description: 'Brand awareness campaign management',
    icon: Palette,
    lists: ['Strategy', 'Creative Brief', 'Design', 'Review', 'Launch', 'Monitor'],
    color: 'from-cyan-500 to-cyan-600',
    category: 'marketing'
  },
  {
    id: 'seo-optimization',
    name: 'SEO Optimization',
    description: 'Search engine optimization workflow',
    icon: Globe,
    lists: ['Keyword Research', 'Content Audit', 'Optimization', 'Testing', 'Monitoring', 'Reporting'],
    color: 'from-yellow-500 to-yellow-600',
    category: 'marketing'
  },
  {
    id: 'paid-advertising',
    name: 'Paid Advertising',
    description: 'PPC and paid advertising campaign management',
    icon: IndianRupee,
    lists: ['Strategy', 'Ad Creation', 'Review', 'Launch', 'Optimization', 'Reporting'],
    color: 'from-emerald-500 to-emerald-600',
    category: 'marketing'
  },
  {
    id: 'pr-campaign',
    name: 'PR Campaign',
    description: 'Public relations campaign workflow',
    icon: Megaphone,
    lists: ['Planning', 'Media List', 'Pitch Creation', 'Outreach', 'Follow-up', 'Coverage'],
    color: 'from-rose-500 to-rose-600',
    category: 'marketing'
  },
  {
    id: 'webinar-series',
    name: 'Webinar Series',
    description: 'Webinar planning and execution workflow',
    icon: Calendar,
    lists: ['Topic Planning', 'Speaker Prep', 'Promotion', 'Registration', 'Event', 'Follow-up'],
    color: 'from-violet-500 to-violet-600',
    category: 'marketing'
  },
  {
    id: 'influencer-campaign',
    name: 'Influencer Campaign',
    description: 'Influencer marketing campaign management',
    icon: Users,
    lists: ['Influencer Research', 'Outreach', 'Negotiation', 'Content Brief', 'Content Review', 'Published'],
    color: 'from-teal-500 to-teal-600',
    category: 'marketing'
  },

  // Sales & CRM (10 templates)
  {
    id: 'sales-pipeline',
    name: 'Sales Pipeline',
    description: 'Standard sales process management',
    icon: ShoppingCart,
    lists: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    color: 'from-green-500 to-green-600',
    category: 'sales'
  },
  {
    id: 'lead-qualification',
    name: 'Lead Qualification',
    description: 'Lead qualification and nurturing process',
    icon: Target,
    lists: ['New Lead', 'Contacted', 'Qualified', 'Opportunity', 'Proposal', 'Customer'],
    color: 'from-blue-500 to-blue-600',
    category: 'sales'
  },
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding',
    description: 'New customer onboarding workflow',
    icon: UserCheck,
    lists: ['Welcome', 'Setup', 'Training', 'First Use', 'Check-in', 'Success'],
    color: 'from-purple-500 to-purple-600',
    category: 'sales'
  },
  {
    id: 'account-management',
    name: 'Account Management',
    description: 'Key account management workflow',
    icon: Building,
    lists: ['Planning', 'Relationship Building', 'Opportunity ID', 'Proposal', 'Negotiation', 'Renewal'],
    color: 'from-indigo-500 to-indigo-600',
    category: 'sales'
  },
  {
    id: 'trade-show',
    name: 'Trade Show Management',
    description: 'Trade show planning and execution',
    icon: Calendar,
    lists: ['Planning', 'Booth Design', 'Marketing', 'Staff Prep', 'Event', 'Follow-up'],
    color: 'from-orange-500 to-orange-600',
    category: 'sales'
  },
  {
    id: 'proposal-process',
    name: 'Proposal Process',
    description: 'RFP and proposal response workflow',
    icon: FileText,
    lists: ['RFP Review', 'Go/No-Go', 'Writing', 'Review', 'Submission', 'Follow-up'],
    color: 'from-cyan-500 to-cyan-600',
    category: 'sales'
  },
  {
    id: 'partnership-development',
    name: 'Partnership Development',
    description: 'Business partnership development process',
    icon: Briefcase,
    lists: ['Prospecting', 'Initial Contact', 'Discussion', 'Negotiation', 'Agreement', 'Launch'],
    color: 'from-teal-500 to-teal-600',
    category: 'sales'
  },
  {
    id: 'contract-negotiation',
    name: 'Contract Negotiation',
    description: 'Contract review and negotiation workflow',
    icon: FileText,
    lists: ['Initial Draft', 'Review', 'Negotiation', 'Revisions', 'Approval', 'Signed'],
    color: 'from-gray-500 to-gray-600',
    category: 'sales'
  },
  {
    id: 'customer-renewal',
    name: 'Customer Renewal',
    description: 'Customer contract renewal process',
    icon: Calendar,
    lists: ['Renewal Notice', 'Health Check', 'Negotiation', 'Approval', 'Contract', 'Renewed'],
    color: 'from-emerald-500 to-emerald-600',
    category: 'sales'
  },
  {
    id: 'upsell-process',
    name: 'Upsell Process',
    description: 'Customer upselling and cross-selling workflow',
    icon: ShoppingCart,
    lists: ['Opportunity ID', 'Qualification', 'Proposal', 'Demo', 'Negotiation', 'Closed'],
    color: 'from-rose-500 to-rose-600',
    category: 'sales'
  },

  // HR & Recruiting (10 templates)
  {
    id: 'hiring-process',
    name: 'Hiring Process',
    description: 'Complete recruitment and hiring workflow',
    icon: UserCheck,
    lists: ['Job Posting', 'Screening', 'Phone Interview', 'On-site Interview', 'Reference Check', 'Offer'],
    color: 'from-blue-500 to-blue-600',
    category: 'hr'
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'New employee onboarding checklist',
    icon: Users,
    lists: ['Pre-boarding', 'First Day', 'Week 1', 'Month 1', 'Month 3', 'Completed'],
    color: 'from-green-500 to-green-600',
    category: 'hr'
  },
  {
    id: 'performance-review',
    name: 'Performance Review',
    description: 'Employee performance review process',
    icon: Target,
    lists: ['Self Assessment', 'Manager Review', 'Peer Feedback', 'Goal Setting', 'Development Plan', 'Complete'],
    color: 'from-purple-500 to-purple-600',
    category: 'hr'
  },
  {
    id: 'training-program',
    name: 'Training Program',
    description: 'Employee training and development program',
    icon: GraduationCap,
    lists: ['Planning', 'Material Creation', 'Scheduling', 'Training', 'Assessment', 'Certified'],
    color: 'from-orange-500 to-orange-600',
    category: 'hr'
  },
  {
    id: 'exit-process',
    name: 'Employee Exit Process',
    description: 'Employee departure and offboarding workflow',
    icon: UserCheck,
    lists: ['Notice Received', 'Transition Plan', 'Knowledge Transfer', 'Exit Interview', 'Asset Return', 'Complete'],
    color: 'from-red-500 to-red-600',
    category: 'hr'
  },
  {
    id: 'policy-development',
    name: 'Policy Development',
    description: 'HR policy creation and implementation',
    icon: FileText,
    lists: ['Research', 'Draft Policy', 'Legal Review', 'Stakeholder Review', 'Approval', 'Implementation'],
    color: 'from-indigo-500 to-indigo-600',
    category: 'hr'
  },
  {
    id: 'compensation-review',
    name: 'Compensation Review',
    description: 'Salary and compensation review process',
    icon: IndianRupee,
    lists: ['Market Research', 'Analysis', 'Recommendations', 'Budget Review', 'Approval', 'Implementation'],
    color: 'from-emerald-500 to-emerald-600',
    category: 'hr'
  },
  {
    id: 'diversity-initiative',
    name: 'Diversity Initiative',
    description: 'Diversity and inclusion program management',
    icon: Users,
    lists: ['Assessment', 'Planning', 'Program Design', 'Implementation', 'Training', 'Evaluation'],
    color: 'from-cyan-500 to-cyan-600',
    category: 'hr'
  },
  {
    id: 'employee-survey',
    name: 'Employee Survey',
    description: 'Employee satisfaction survey workflow',
    icon: Clipboard,
    lists: ['Survey Design', 'Distribution', 'Data Collection', 'Analysis', 'Action Planning', 'Follow-up'],
    color: 'from-yellow-500 to-yellow-600',
    category: 'hr'
  },
  {
    id: 'workplace-investigation',
    name: 'Workplace Investigation',
    description: 'HR complaint and investigation process',
    icon: Shield,
    lists: ['Complaint Received', 'Initial Review', 'Investigation', 'Interview', 'Decision', 'Follow-up'],
    color: 'from-gray-500 to-gray-600',
    category: 'hr'
  },

  // Operations (8 templates)
  {
    id: 'supply-chain',
    name: 'Supply Chain Management',
    description: 'Supply chain and procurement workflow',
    icon: Truck,
    lists: ['Planning', 'Sourcing', 'Procurement', 'Manufacturing', 'Delivery', 'Returns'],
    color: 'from-brown-500 to-brown-600',
    category: 'operations'
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management',
    description: 'Inventory tracking and management',
    icon: Clipboard,
    lists: ['Stock Check', 'Reorder Point', 'Ordering', 'Receiving', 'Quality Check', 'Stocked'],
    color: 'from-slate-500 to-slate-600',
    category: 'operations'
  },
  {
    id: 'quality-control',
    name: 'Quality Control',
    description: 'Quality assurance and control process',
    icon: CheckCircle,
    lists: ['Incoming Inspection', 'Process Control', 'Final Inspection', 'Non-conformance', 'Corrective Action', 'Approved'],
    color: 'from-green-500 to-green-600',
    category: 'operations'
  },
  {
    id: 'maintenance-schedule',
    name: 'Maintenance Schedule',
    description: 'Equipment maintenance scheduling workflow',
    icon: Wrench,
    lists: ['Scheduled', 'Parts Ordered', 'Maintenance Due', 'In Progress', 'Testing', 'Complete'],
    color: 'from-orange-500 to-orange-600',
    category: 'operations'
  },
  {
    id: 'vendor-management',
    name: 'Vendor Management',
    description: 'Vendor evaluation and management process',
    icon: Building,
    lists: ['Vendor Research', 'RFQ Sent', 'Proposal Review', 'Evaluation', 'Contract', 'Active Vendor'],
    color: 'from-purple-500 to-purple-600',
    category: 'operations'
  },
  {
    id: 'process-improvement',
    name: 'Process Improvement',
    description: 'Continuous process improvement workflow',
    icon: Zap,
    lists: ['Identify Issue', 'Root Cause', 'Solution Design', 'Testing', 'Implementation', 'Monitor'],
    color: 'from-cyan-500 to-cyan-600',
    category: 'operations'
  },
  {
    id: 'facility-management',
    name: 'Facility Management',
    description: 'Office and facility management workflow',
    icon: Building,
    lists: ['Request Received', 'Assessment', 'Planning', 'Approval', 'Execution', 'Complete'],
    color: 'from-teal-500 to-teal-600',
    category: 'operations'
  },
  {
    id: 'safety-compliance',
    name: 'Safety Compliance',
    description: 'Safety and compliance management workflow',
    icon: Shield,
    lists: ['Risk Assessment', 'Mitigation Plan', 'Training', 'Audit', 'Corrective Action', 'Compliant'],
    color: 'from-red-500 to-red-600',
    category: 'operations'
  },

  // Design & Creative (8 templates)
  {
    id: 'design-process',
    name: 'Design Process',
    description: 'Creative design project workflow',
    icon: Palette,
    lists: ['Brief', 'Research', 'Concept', 'Design', 'Review', 'Final'],
    color: 'from-pink-500 to-pink-600',
    category: 'design'
  },
  {
    id: 'website-design',
    name: 'Website Design',
    description: 'Website design and development workflow',
    icon: Globe,
    lists: ['Discovery', 'Wireframes', 'Design', 'Development', 'Testing', 'Launch'],
    color: 'from-blue-500 to-blue-600',
    category: 'design'
  },
  {
    id: 'brand-identity',
    name: 'Brand Identity',
    description: 'Brand identity design process',
    icon: Palette,
    lists: ['Research', 'Strategy', 'Logo Design', 'Brand Guidelines', 'Applications', 'Delivery'],
    color: 'from-purple-500 to-purple-600',
    category: 'design'
  },
  {
    id: 'print-production',
    name: 'Print Production',
    description: 'Print design and production workflow',
    icon: FileText,
    lists: ['Brief', 'Design', 'Proofing', 'Client Approval', 'Production', 'Delivery'],
    color: 'from-green-500 to-green-600',
    category: 'design'
  },
  {
    id: 'ux-research',
    name: 'UX Research',
    description: 'User experience research workflow',
    icon: Users,
    lists: ['Planning', 'Recruitment', 'Research', 'Analysis', 'Insights', 'Recommendations'],
    color: 'from-orange-500 to-orange-600',
    category: 'design'
  },
  {
    id: 'packaging-design',
    name: 'Packaging Design',
    description: 'Product packaging design workflow',
    icon: Palette,
    lists: ['Brief', 'Concept', 'Design', 'Mockup', 'Client Review', 'Production'],
    color: 'from-cyan-500 to-cyan-600',
    category: 'design'
  },
  {
    id: 'app-ui-design',
    name: 'App UI Design',
    description: 'Mobile app UI/UX design process',
    icon: Smartphone,
    lists: ['User Research', 'Wireframes', 'Visual Design', 'Prototype', 'User Testing', 'Hand-off'],
    color: 'from-indigo-500 to-indigo-600',
    category: 'design'
  },
  {
    id: 'photography-project',
    name: 'Photography Project',
    description: 'Photography project management workflow',
    icon: Camera,
    lists: ['Planning', 'Pre-production', 'Shoot', 'Post-processing', 'Review', 'Delivery'],
    color: 'from-rose-500 to-rose-600',
    category: 'design'
  },

  // Support & Service (6 templates)
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Customer support ticket management',
    icon: Headphones,
    lists: ['New Ticket', 'In Progress', 'Waiting for Customer', 'Escalated', 'Resolved', 'Closed'],
    color: 'from-blue-500 to-blue-600',
    category: 'support'
  },
  {
    id: 'technical-support',
    name: 'Technical Support',
    description: 'Technical issue resolution workflow',
    icon: Wrench,
    lists: ['Reported', 'Triaged', 'Investigating', 'Fix in Progress', 'Testing', 'Resolved'],
    color: 'from-orange-500 to-orange-600',
    category: 'support'
  },
  {
    id: 'incident-management',
    name: 'Incident Management',
    description: 'IT incident response and resolution',
    icon: Shield,
    lists: ['Incident Reported', 'Assessment', 'Response Team', 'Resolution', 'Recovery', 'Post-mortem'],
    color: 'from-red-500 to-red-600',
    category: 'support'
  },
  {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    description: 'Knowledge base article creation workflow',
    icon: FileText,
    lists: ['Topic Identified', 'Research', 'Writing', 'Review', 'Approval', 'Published'],
    color: 'from-green-500 to-green-600',
    category: 'support'
  },
  {
    id: 'warranty-claims',
    name: 'Warranty Claims',
    description: 'Product warranty claim processing',
    icon: CheckCircle,
    lists: ['Claim Received', 'Validation', 'Investigation', 'Decision', 'Processing', 'Closed'],
    color: 'from-purple-500 to-purple-600',
    category: 'support'
  },
  {
    id: 'service-delivery',
    name: 'Service Delivery',
    description: 'Professional service delivery workflow',
    icon: Briefcase,
    lists: ['Service Request', 'Planning', 'Resource Allocation', 'Delivery', 'Quality Check', 'Complete'],
    color: 'from-teal-500 to-teal-600',
    category: 'support'
  },

  // Finance & Accounting (6 templates)
  {
    id: 'budget-planning',
    name: 'Budget Planning',
    description: 'Annual budget planning and approval process',
    icon: IndianRupee,
    lists: ['Guidelines', 'Department Input', 'Consolidation', 'Review', 'Approval', 'Final Budget'],
    color: 'from-green-500 to-green-600',
    category: 'finance'
  },
  {
    id: 'invoice-processing',
    name: 'Invoice Processing',
    description: 'Accounts payable invoice processing',
    icon: FileText,
    lists: ['Received', 'Validation', 'Approval', 'Processing', 'Payment', 'Archived'],
    color: 'from-blue-500 to-blue-600',
    category: 'finance'
  },
  {
    id: 'financial-audit',
    name: 'Financial Audit',
    description: 'Annual financial audit process',
    icon: Clipboard,
    lists: ['Planning', 'Fieldwork', 'Testing', 'Findings', 'Management Response', 'Report'],
    color: 'from-purple-500 to-purple-600',
    category: 'finance'
  },
  {
    id: 'expense-approval',
    name: 'Expense Approval',
    description: 'Employee expense report approval workflow',
    icon: IndianRupee,
    lists: ['Submitted', 'Manager Review', 'Finance Review', 'Approved', 'Reimbursed', 'Closed'],
    color: 'from-orange-500 to-orange-600',
    category: 'finance'
  },
  {
    id: 'financial-reporting',
    name: 'Financial Reporting',
    description: 'Monthly/quarterly financial reporting process',
    icon: FileText,
    lists: ['Data Collection', 'Analysis', 'Report Preparation', 'Review', 'Management Review', 'Published'],
    color: 'from-indigo-500 to-indigo-600',
    category: 'finance'
  },
  {
    id: 'credit-approval',
    name: 'Credit Approval',
    description: 'Customer credit approval process',
    icon: CheckCircle,
    lists: ['Application', 'Credit Check', 'Analysis', 'Decision', 'Documentation', 'Active'],
    color: 'from-cyan-500 to-cyan-600',
    category: 'finance'
  },

  // Education (4 templates)
  {
    id: 'course-development',
    name: 'Course Development',
    description: 'Educational course development workflow',
    icon: GraduationCap,
    lists: ['Planning', 'Content Creation', 'Review', 'Testing', 'Approval', 'Launch'],
    color: 'from-blue-500 to-blue-600',
    category: 'education'
  },
  {
    id: 'student-admission',
    name: 'Student Admission',
    description: 'Student admission and enrollment process',
    icon: Users,
    lists: ['Application', 'Review', 'Interview', 'Decision', 'Enrollment', 'Onboarding'],
    color: 'from-green-500 to-green-600',
    category: 'education'
  },
  {
    id: 'curriculum-review',
    name: 'Curriculum Review',
    description: 'Academic curriculum review and update process',
    icon: FileText,
    lists: ['Current Review', 'Gap Analysis', 'Research', 'Design', 'Approval', 'Implementation'],
    color: 'from-purple-500 to-purple-600',
    category: 'education'
  },
  {
    id: 'online-learning',
    name: 'Online Learning Platform',
    description: 'E-learning content development workflow',
    icon: Globe,
    lists: ['Content Planning', 'Video Production', 'Interactive Elements', 'Testing', 'Review', 'Published'],
    color: 'from-orange-500 to-orange-600',
    category: 'education'
  },

  // Event Management (5 templates)
  {
    id: 'conference-planning',
    name: 'Conference Planning',
    description: 'Large conference planning and execution',
    icon: Calendar,
    lists: ['Planning', 'Venue', 'Speakers', 'Marketing', 'Registration', 'Event', 'Follow-up'],
    color: 'from-purple-500 to-purple-600',
    category: 'events'
  },
  {
    id: 'wedding-planning',
    name: 'Wedding Planning',
    description: 'Wedding planning and coordination workflow',
    icon: Heart,
    lists: ['Initial Planning', 'Venue & Vendors', 'Invitations', 'Final Details', 'Wedding Day', 'Follow-up'],
    color: 'from-pink-500 to-pink-600',
    category: 'events'
  },
  {
    id: 'product-launch-event',
    name: 'Product Launch Event',
    description: 'Product launch event planning workflow',
    icon: Rocket,
    lists: ['Concept', 'Planning', 'Marketing', 'Setup', 'Event', 'Follow-up'],
    color: 'from-blue-500 to-blue-600',
    category: 'events'
  },
  {
    id: 'team-retreat',
    name: 'Team Retreat',
    description: 'Company team retreat planning workflow',
    icon: Coffee,
    lists: ['Planning', 'Location', 'Activities', 'Logistics', 'Retreat', 'Debrief'],
    color: 'from-green-500 to-green-600',
    category: 'events'
  },
  {
    id: 'virtual-event',
    name: 'Virtual Event',
    description: 'Online virtual event planning and execution',
    icon: Globe,
    lists: ['Platform Setup', 'Content Prep', 'Tech Testing', 'Promotion', 'Event', 'Recording'],
    color: 'from-cyan-500 to-cyan-600',
    category: 'events'
  },

  // Personal Productivity (5 templates)
  {
    id: 'personal-tasks',
    name: 'Personal Tasks',
    description: 'Personal task and goal management',
    icon: Heart,
    lists: ['Ideas', 'To Do', 'In Progress', 'Waiting', 'Done'],
    color: 'from-rose-500 to-rose-600',
    category: 'personal'
  },
  {
    id: 'habit-tracking',
    name: 'Habit Tracking',
    description: 'Personal habit formation and tracking',
    icon: Target,
    lists: ['New Habit', 'Week 1', 'Week 2-4', 'Month 2-3', 'Established'],
    color: 'from-green-500 to-green-600',
    category: 'personal'
  },
  {
    id: 'travel-planning',
    name: 'Travel Planning',
    description: 'Personal travel planning workflow',
    icon: Plane,
    lists: ['Research', 'Booking', 'Preparation', 'Packing', 'Travel', 'Memories'],
    color: 'from-blue-500 to-blue-600',
    category: 'personal'
  },
  {
    id: 'home-projects',
    name: 'Home Projects',
    description: 'Home improvement and DIY project management',
    icon: Home,
    lists: ['Ideas', 'Planning', 'Materials', 'In Progress', 'Review', 'Complete'],
    color: 'from-orange-500 to-orange-600',
    category: 'personal'
  },
  {
    id: 'learning-goals',
    name: 'Learning Goals',
    description: 'Personal learning and skill development',
    icon: GraduationCap,
    lists: ['Want to Learn', 'Learning', 'Practicing', 'Teaching Others', 'Mastered'],
    color: 'from-purple-500 to-purple-600',
    category: 'personal'
  },
  {
    id: 'team-workflow',
    name: 'Team Workflow',
    description: 'General team collaboration with approval process',
    icon: Users,
    lists: ['Requested', 'Assigned', 'In Progress', 'Pending Approval', 'Approved', 'Completed'],
    color: 'from-indigo-500 to-indigo-600',
    category: 'basic'
  }
];

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, boardId }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isApplying, setIsApplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { createList } = useKanban();

  if (!isOpen) return null;

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;

    setIsApplying(true);

    try {
      // Create lists sequentially to maintain order
      for (let i = 0; i < selectedTemplate.lists.length; i++) {
        const listName = selectedTemplate.lists[i];
        const listColor = getChipColor(i); // Get the color for this list
        const result = await createList(boardId, listName, listColor);
        
        if (!result.success) {
          console.error(`Failed to create list: ${listName}`);
          // Continue with other lists even if one fails
        }
      }

      // Close modal after successful creation
      onClose();
    } catch (error) {
      console.error('Error applying template:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    if (!isApplying) {
      setSelectedTemplate(null);
      setSelectedCategory('all');
      setSearchTerm('');
      onClose();
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Template</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} 
              {searchTerm && ` found for "${searchTerm}"`}
              {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isApplying}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter - Horizontal Scroll */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedTemplate(null); // Clear selection when changing category
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.name}</span>
                  <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs">
                    {category.id === 'all' ? filteredTemplates.length : templates.filter(t => t.category === category.id && (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase()))).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`
                  relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color}`}>
                    <template.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.lists.map((list, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: getChipColor(index) }}
                        >
                          {list}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {selectedTemplate?.id === template.id && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Preview Section */}
          {selectedTemplate && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview: {selectedTemplate.name}
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {selectedTemplate.lists.map((listName, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-48 bg-gray-100 dark:bg-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getChipColor(index) }}
                      />
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {listName}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white dark:bg-gray-600 rounded p-2 text-xs text-gray-600 dark:text-gray-300">
                        Sample card
                      </div>
                      <div className="bg-white dark:bg-gray-600 rounded p-2 text-xs text-gray-600 dark:text-gray-300">
                        Another task
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6 bg-white dark:bg-gray-800 rounded-b-3xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={isApplying}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyTemplate}
              disabled={!selectedTemplate || isApplying}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isApplying && <Loader2 className="w-4 h-4 animate-spin" />}
              <CheckCircle className="w-4 h-4" />
              <span>{isApplying ? 'Applying...' : 'Apply Template'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;