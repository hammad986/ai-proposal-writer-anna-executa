import type { GeneratedProposal, ProposalFormData } from './types'

export const technicalRequirements = [
  'User Authentication',
  'Payment Integration',
  'Admin Dashboard',
  'API Integration',
  'AI/ML Features',
  'Real-time Features',
  'Mobile Responsive',
  'SEO Optimization',
  'Analytics & Reporting',
  'Email Notifications',
  'Multi-language',
  'Cloud Storage',
]

export const additionalServices = [
  'Domain & Hosting Setup',
  'Logo Design',
  'Content Writing',
  'SEO Setup',
  'Training Session',
  'Technical Documentation',
]

export const includedSections = [
  'Executive Summary',
  'Understanding of Requirements',
  'Scope of Work',
  'Technical Approach',
  'Timeline & Milestones',
  'Investment & Pricing',
  'Terms & Conditions',
  'Next Steps',
]

export const emptyFormData: ProposalFormData = {
  step1: {
    agencyName: '',
    agencyTagline: 'AI & Web Development Agency',
    agencyEmail: '',
    agencyWebsite: '',
    clientName: '',
    clientCompany: '',
    projectName: '',
    projectType: 'Web Development',
    industry: 'E-commerce',
    problemStatement: '',
  },
  step2: {
    keyFeatures: '',
    technicalRequirements: [],
    preferredTechStack: '',
    constraints: '',
    targetUsers: '',
  },
  step3: {
    complexity: 'standard',
    budgetRange: '₹75,000 – ₹2,00,000',
    advancePercent: 40,
    revisions: 3,
    warrantyPeriod: '3 Months',
    additionalServices: [],
    paymentMilestone: '40-30-30',
  },
  step4: {
    tone: 'professional',
    language: 'English',
    includedSections,
    specialEmphasis: '',
  },
}

const demoForm: ProposalFormData = {
  ...emptyFormData,
  step1: {
    ...emptyFormData.step1,
    agencyName: 'Aetherion Labs',
    clientName: 'Demo Client',
  },
}

const demoSections = (project: string) => [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    type: 'text' as const,
    content: `This proposal outlines a focused delivery plan for ${project}. The project is structured to move from discovery to launch with clear checkpoints, practical milestones, and measurable business outcomes.`,
    isEdited: false,
  },
  {
    id: 'scope_of_work',
    title: 'Scope of Work',
    type: 'list' as const,
    content: '- Product discovery and requirements mapping\n- User-focused interface design\n- Core application development\n- Testing, launch support, and handover',
    isEdited: false,
  },
  {
    id: 'timeline',
    title: 'Timeline & Milestones',
    type: 'phases' as const,
    content: '## Phase 1: Discovery (1 week)\n- Requirements workshop\n- Success metrics\n\n## Phase 2: Build (3 weeks)\n- Feature development\n- Internal QA\n\n## Phase 3: Launch (1 week)\n- Deployment\n- Team handover',
    isEdited: false,
  },
  {
    id: 'investment_pricing',
    title: 'Investment & Pricing',
    type: 'table' as const,
    content: '| Phase / Module | Deliverables | Allocation |\n|---|---|---|\n| Discovery & UI Architecture | User flows, Figma prototypes, architecture | 25% |\n| Core Application Development | Frontend, Backend, Integrations | 50% |\n| Testing & Quality Assurance | Cross-browser QA, Performance optimization | 15% |\n| Deployment & Handover | Cloud hosting, Documentation, Training | 10% |',
    isEdited: false,
  },
]

export const demoProposals: GeneratedProposal[] = [
  {
    id: 'demo_stylehub',
    formData: {
      ...demoForm,
      step1: {
        ...demoForm.step1,
        clientCompany: 'StyleHub Pvt Ltd',
        projectName: 'E-commerce Platform for StyleHub',
        projectType: 'Web Development',
        industry: 'E-commerce',
      },
    },
    title: 'E-commerce Platform for StyleHub',
    subtitle: 'Prepared for StyleHub Pvt Ltd by Aetherion Labs',
    generatedDate: '2025-05-10',
    validUntil: '2025-06-09',
    sections: demoSections('StyleHub e-commerce platform'),
    status: 'accepted',
    totalValue: '₹1,25,000',
    createdAt: '2025-05-10',
    updatedAt: '2025-05-10',
  },
  {
    id: 'demo_medquick',
    formData: {
      ...demoForm,
      step1: {
        ...demoForm.step1,
        clientCompany: 'MedQuick Health',
        projectName: 'AI Chatbot System for MedQuick',
        projectType: 'AI/ML System',
        industry: 'Healthcare',
      },
    },
    title: 'AI Chatbot System for MedQuick',
    subtitle: 'Prepared for MedQuick Health by Aetherion Labs',
    generatedDate: '2025-05-20',
    validUntil: '2025-06-19',
    sections: demoSections('MedQuick AI chatbot system'),
    status: 'sent',
    totalValue: '₹85,000',
    createdAt: '2025-05-20',
    updatedAt: '2025-05-20',
  },
]
