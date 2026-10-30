import type {
  BrandConfig,
  ContentLibraryBlock,
  GeneratedProposal,
  PricingItem,
  PricingStructure,
  ProposalAnalytics,
  ProposalFormData,
  ProposalSecurity,
  ProposalTemplate,
  RoiEstimation,
  CurrencyCode,
  PricingTier,
  DealHealthAnalysis,
  DealHealthFactor,
  ContractRiskReport,
  ContractRiskItem,
  DiscoveryQuestion,
} from './types'

export const technicalRequirements = [
  'User Authentication & Roles',
  'Payment Processing (Stripe/PayPal)',
  'Admin Operations Dashboard',
  'REST & GraphQL API Integration',
  'AI/LLM Generation & Agents',
  'Real-time WebSockets & Push Alerts',
  'Responsive Desktop & Mobile Viewports',
  'Search Engine Optimization (SEO)',
  'Analytics, Heatmaps & Telemetry',
  'Transactional Email & SMS Notifications',
  'Multi-currency & Localization',
  'Cloud Storage & Asset CDN',
  'Data Encryption & SOC2 Compliance',
  'Automated CI/CD Pipeline',
]

export const additionalServices = [
  'Cloud Infrastructure & Hosting Provisioning',
  'Brand Guidelines & Vector Design Assets',
  'Conversion-Focused Copywriting',
  'Technical Architecture Documentation',
  'Dedicated Staff Training Workshop',
  'Post-Launch 24/7 Priority SLA',
  'Continuous Security & Penetration Audit',
]

export const includedSections = [
  'Executive Summary',
  'Understanding of Requirements',
  'Scope of Work & Deliverables',
  'Technical Approach & Architecture',
  'Timeline & Phased Milestones',
  'Itemized Investment & Pricing',
  'Terms, Warranties & Governance',
  'Next Steps & Kickoff Schedule',
]

export const defaultBrandConfig: BrandConfig = {
  companyName: 'Aetherion Labs',
  tagline: 'Full-Stack Software, AI Solutions & Digital Growth',
  primaryColor: '#4f46e5', // indigo-600
  accentColor: '#06b6d4', // cyan-500
  email: 'contact@aetherionlabs.com',
  phone: '+1 (555) 329-8401',
  website: 'https://aetherionlabs.com',
  address: 'Suite 400, Tech Innovation Corridor, CA',
  defaultCurrency: 'USD',
  defaultPaymentTerms: '40% advance deposit upon signing, 30% upon Milestone 2 approval, 30% upon final acceptance.',
}

export const proposalTemplates: ProposalTemplate[] = [
  {
    id: 'tpl_fullstack',
    name: 'Full-Stack Web & Mobile Application',
    category: 'Engineering',
    description: 'Comprehensive software delivery from responsive UI to cloud database and API integration.',
    iconName: 'Code2',
    projectType: 'Full-Stack App',
    industry: 'SaaS',
    defaultTone: 'professional',
    sampleProblem: 'Client requires a responsive, scalable full-stack web and mobile application to replace legacy manual workflows, automate transaction routing, and deliver an intuitive self-service portal for active customers.',
    sampleFeatures: [
      'Multi-role authentication with secure session management and role-based access control',
      'Interactive customer portal with real-time analytics, filtering, and reporting',
      'Automated transaction handling with payment gateway integration and invoice generation',
      'RESTful API layer with complete OpenAPI documentation and staging sandbox',
      'Administrative moderation dashboard with audit logging and export capabilities',
    ],
    sections: includedSections,
    samplePricing: [
      {
        id: 'item_1',
        title: 'System Architecture & UX Design',
        description: 'Interactive wireframes, user journeys, data modeling, and API contract specifications',
        category: 'design',
        quantity: 1,
        unitRate: 3500,
      },
      {
        id: 'item_2',
        title: 'Frontend Portal Engineering',
        description: 'Responsive React SPA with state management, accessibility compliance, and component library',
        category: 'development',
        quantity: 1,
        unitRate: 6500,
      },
      {
        id: 'item_3',
        title: 'Backend API & Database Microservices',
        description: 'Secure REST backend, relational data persistence, indexing, and authentication service',
        category: 'development',
        quantity: 1,
        unitRate: 5500,
      },
      {
        id: 'item_4',
        title: 'Cloud DevOps & Automated CI/CD',
        description: 'Docker containerization, staging/production environments, and continuous deployment',
        category: 'infrastructure',
        quantity: 1,
        unitRate: 2000,
      },
      {
        id: 'item_5',
        title: 'Extended 90-Day SLA & Dedicated Support (Optional)',
        description: 'Quarterly bug-fix warranty, monthly security patches, and direct slack access',
        category: 'consulting',
        quantity: 1,
        unitRate: 1800,
        isOptional: true,
        isSelected: false,
      },
    ],
  },
  {
    id: 'tpl_aiml',
    name: 'Enterprise AI & Machine Learning System',
    category: 'AI & Data',
    description: 'Intelligent automation, LLM orchestration, structured data extraction, and RAG knowledge systems.',
    iconName: 'Cpu',
    projectType: 'AI/ML System',
    industry: 'Technology',
    defaultTone: 'technical',
    sampleProblem: 'Client experiences operational friction processing unstructured inquiries and documents. They require a bespoke AI agent and retrieval-augmented generation (RAG) platform to analyze incoming contracts and generate verified responses automatically.',
    sampleFeatures: [
      'Document ingestion pipeline supporting PDF, DOCX, and scanned document optical character recognition',
      'Vector semantic search index with hybrid keyword re-ranking for private company knowledge retrieval',
      'Context-aware LLM reasoning agent with strict anti-hallucination guardrails and citations',
      'Internal verification workbench allowing team members to review, adjust, and approve AI suggestions',
      'Enterprise role governance, data isolation, and encrypted vector persistence',
    ],
    sections: includedSections,
    samplePricing: [
      {
        id: 'ai_1',
        title: 'Data Ingestion & Embedding Pipeline',
        description: 'Automated document processing, chunking strategies, and vector database indexing',
        category: 'development',
        quantity: 1,
        unitRate: 5000,
      },
      {
        id: 'ai_2',
        title: 'RAG Agent Architecture & Prompt Engineering',
        description: 'Custom reasoning chains, guardrails, evaluation benchmarks, and citation linkage',
        category: 'development',
        quantity: 1,
        unitRate: 7500,
      },
      {
        id: 'ai_3',
        title: 'Operator Review Interface & Dashboard',
        description: 'Clean web interface for operators to review AI outputs, manage documents, and inspect logs',
        category: 'design',
        quantity: 1,
        unitRate: 4000,
      },
      {
        id: 'ai_4',
        title: 'Security Hardening & Privacy Auditing',
        description: 'Zero data retention configuration, PII scrubbing, and isolated VPC deployment',
        category: 'infrastructure',
        quantity: 1,
        unitRate: 2500,
      },
      {
        id: 'ai_5',
        title: 'Custom Model Fine-Tuning Pipeline (Optional)',
        description: 'Domain-specific LoRA adapter training for specialized contract terminology',
        category: 'consulting',
        quantity: 1,
        unitRate: 3500,
        isOptional: true,
        isSelected: false,
      },
    ],
  },
  {
    id: 'tpl_consulting',
    name: 'Strategic IT & Cloud Advisory',
    category: 'Consulting',
    description: 'Executive technology assessment, cloud modernization roadmap, architecture review, and governance.',
    iconName: 'Compass',
    projectType: 'IT Consulting & Advisory',
    industry: 'Professional Services',
    defaultTone: 'professional',
    sampleProblem: 'Client requires an objective architectural audit and cloud modernization roadmap to remediate technical debt, reduce infrastructure cloud spend, and align developer practices with modern security standards.',
    sampleFeatures: [
      'Comprehensive codebase, infrastructure, and security posture discovery assessment',
      'Stakeholder executive interviews across engineering, product management, and compliance teams',
      'Target-state architecture blueprint with detailed phased migration roadmap',
      'Cost optimization report with quantifiable cloud hosting reduction opportunities',
      'Executive board presentation and developer workshops on microservices governance',
    ],
    sections: includedSections,
    samplePricing: [
      {
        id: 'con_1',
        title: 'Discovery & Current-State Deep Dive',
        description: 'Code review, dependency auditing, architecture mapping, and stakeholder interviews',
        category: 'consulting',
        quantity: 1,
        unitRate: 4500,
      },
      {
        id: 'con_2',
        title: 'Target Architecture & Cloud Roadmap',
        description: 'Comprehensive 12-month migration blueprint, technology stack matrix, and risk mitigation',
        category: 'consulting',
        quantity: 1,
        unitRate: 5500,
      },
      {
        id: 'con_3',
        title: 'Cloud Cost Optimization & Security Blueprint',
        description: 'Actionable cloud waste remediation plan with projected 30% cost savings',
        category: 'infrastructure',
        quantity: 1,
        unitRate: 3000,
      },
      {
        id: 'con_4',
        title: 'On-Site Executive Briefing & Workshop',
        description: 'Full-day alignment intensive with engineering leaders and executive stakeholders',
        category: 'management',
        quantity: 1,
        unitRate: 2500,
      },
    ],
  },
  {
    id: 'tpl_marketing',
    name: 'Digital Marketing & Growth Retainer',
    category: 'Marketing',
    description: 'Multi-channel acquisition strategy, search engine optimization, content production, and paid conversion funnel.',
    iconName: 'BarChart3',
    projectType: 'Digital Marketing & Growth',
    industry: 'E-commerce',
    defaultTone: 'bold',
    sampleProblem: 'Client requires an integrated digital acquisition engine to reduce customer acquisition costs (CAC), build high-ranking organic search authority, and deploy high-converting landing page funnels.',
    sampleFeatures: [
      'Comprehensive SEO technical audit and competitive keyword gap analysis',
      'Conversion rate optimization (CRO) redesign for primary lead capture landing pages',
      'Targeted paid search & social campaign structuring with custom creative assets',
      'High-authority thought leadership content production and technical distribution',
      'Live executive KPI reporting dashboard tracking CAC, LTV, and pipeline attribution',
    ],
    sections: includedSections,
    samplePricing: [
      {
        id: 'mkt_1',
        title: 'Growth Strategy & Channel Discovery',
        description: 'Market research, competitor benchmarking, keyword universe, and funnel mapping',
        category: 'consulting',
        quantity: 1,
        unitRate: 3000,
      },
      {
        id: 'mkt_2',
        title: 'High-Converting Landing Pages (Set of 3)',
        description: 'Persuasive copywriting, responsive UI design, A/B testing setup, and analytics integration',
        category: 'design',
        quantity: 3,
        unitRate: 1200,
      },
      {
        id: 'mkt_3',
        title: 'Monthly Growth & SEO Retainer (Month 1 Kickoff)',
        description: 'Ongoing technical SEO, link building, weekly campaign optimization, and KPI reporting',
        category: 'management',
        quantity: 1,
        unitRate: 3500,
      },
      {
        id: 'mkt_4',
        title: 'Interactive ROI & Lead Calculator Widget (Optional)',
        description: 'Custom embeddable web calculator designed to capture high-intent inbound leads',
        category: 'development',
        quantity: 1,
        unitRate: 1500,
        isOptional: true,
        isSelected: false,
      },
    ],
  },
  {
    id: 'tpl_design',
    name: 'UI/UX Product Design Retainer',
    category: 'Design',
    description: 'User research, wireframing, high-fidelity Figma design system, clickable prototypes, and usability testing.',
    iconName: 'Palette',
    projectType: 'UI/UX Product Design',
    industry: 'Fintech',
    defaultTone: 'friendly',
    sampleProblem: 'Client has an innovative financial workflow but struggles with user onboarding drop-off. They need an end-to-end UX overhaul with an accessible design system to maximize activation and retention.',
    sampleFeatures: [
      'User interview discovery and customer journey friction mapping',
      'Low-fidelity information architecture and wireframe flows',
      'Complete modular Figma Design System with tokens, typography, and interactive components',
      'High-fidelity clickable interactive prototypes for user testing and developer handover',
      'Usability testing sprint with synthesized findings and prioritized iteration backlog',
    ],
    sections: includedSections,
    samplePricing: [
      {
        id: 'des_1',
        title: 'UX Research & Journey Mapping',
        description: 'Customer interviews, heuristic evaluation, persona synthesis, and journey flows',
        category: 'design',
        quantity: 1,
        unitRate: 3200,
      },
      {
        id: 'des_2',
        title: 'Modular Figma Design System',
        description: 'Comprehensive component library, color palettes, auto-layout tokens, and icons',
        category: 'design',
        quantity: 1,
        unitRate: 4800,
      },
      {
        id: 'des_3',
        title: 'High-Fidelity Application Screens (25+ Views)',
        description: 'Pixel-perfect mobile and desktop views covering all core customer and admin journeys',
        category: 'design',
        quantity: 1,
        unitRate: 5000,
      },
      {
        id: 'des_4',
        title: 'Clickable Prototype & Usability Validation',
        description: 'Interactive prototype with 5 moderated user testing sessions and feedback matrix',
        category: 'consulting',
        quantity: 1,
        unitRate: 2500,
      },
    ],
  },
  {
    id: 'tpl_custom_eng',
    name: 'Custom Enterprise Software Engineering',
    category: 'Engineering',
    description: 'High-scale bespoke enterprise platform, secure microservices, legacy integration, and stringent SLAs.',
    iconName: 'Server',
    projectType: 'Custom Software',
    industry: 'Healthcare',
    defaultTone: 'professional',
    sampleProblem: 'Client operates a distributed medical logistics network requiring a HIPAA-compliant, zero-downtime platform to coordinate hospital shipments, manage asset tracking, and maintain strict regulatory audits.',
    sampleFeatures: [
      'HIPAA and SOC2 Type II compliant cloud architecture with zero-knowledge data encryption',
      'Real-time IoT shipment tracker with GPS geofencing and temperature telemetry alerts',
      'Role-governed physician and coordinator portals with biometric single sign-on (SSO)',
      'Immutable audit logging ensuring complete chain-of-custody compliance',
      'High-availability Kubernetes deployment across multi-region cloud availability zones',
    ],
    sections: includedSections,
    samplePricing: [
      {
        id: 'ent_1',
        title: 'Compliance Discovery & System Security Architecture',
        description: 'HIPAA controls, data encryption at rest and in transit, threat modeling, and BAA setup',
        category: 'consulting',
        quantity: 1,
        unitRate: 6500,
      },
      {
        id: 'ent_2',
        title: 'Core Telemetry Engine & Microservices',
        description: 'Real-time telemetry ingestion, event streaming, alert triggers, and hospital API gateways',
        category: 'development',
        quantity: 1,
        unitRate: 12000,
      },
      {
        id: 'ent_3',
        title: 'Clinical Operations Web Application',
        description: 'Accessible, high-contrast interface for dispatchers and clinical asset managers',
        category: 'development',
        quantity: 1,
        unitRate: 8500,
      },
      {
        id: 'ent_4',
        title: 'Multi-Region Kubernetes Infrastructure & Disaster Recovery',
        description: 'Terraform IaC, zero-downtime rolling upgrades, automated failover, and backup drills',
        category: 'infrastructure',
        quantity: 1,
        unitRate: 5500,
      },
      {
        id: 'ent_5',
        title: 'Third-Party Independent Penetration Test (Optional)',
        description: 'Certified white-hat security penetration audit and remediation sign-off report',
        category: 'consulting',
        quantity: 1,
        unitRate: 4500,
        isOptional: true,
        isSelected: false,
      },
    ],
  },
]

export const emptyFormData: ProposalFormData = {
  step1: {
    agencyName: '',
    agencyTagline: 'AI & Full-Stack Development Agency',
    agencyEmail: '',
    agencyWebsite: '',
    clientName: '',
    clientCompany: '',
    projectName: '',
    projectType: 'Web Development',
    industry: 'Technology',
    problemStatement: '',
  },
  step2: {
    keyFeatures: '',
    technicalRequirements: [
      'User Authentication & Roles',
      'Responsive Desktop & Mobile Viewports',
      'REST & GraphQL API Integration',
      'Admin Operations Dashboard',
    ],
    preferredTechStack: 'TypeScript, React, Node.js, PostgreSQL, Tailwind CSS',
    constraints: 'Standard production timeline, clean documentation, and high availability.',
    targetUsers: 'Primary customers, operational staff, and management administrators.',
  },
  step3: {
    complexity: 'standard',
    budgetRange: '$12,000 – $22,000',
    advancePercent: 40,
    revisions: 3,
    warrantyPeriod: '3 Months',
    additionalServices: ['Cloud Infrastructure & Hosting Provisioning', 'Dedicated Staff Training Workshop'],
    paymentMilestone: '40-30-30',
  },
  step4: {
    tone: 'professional',
    language: 'English',
    includedSections,
    specialEmphasis: 'Emphasize production reliability, rapid milestone visibility, and intellectual property protection.',
  },
}

export function createDefaultPricingStructure(
  currency: 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' = 'USD',
  budgetStr?: string
): PricingStructure {
  return {
    pricingModel: 'fixed',
    currency,
    items: [
      {
        id: 'p_1',
        title: 'Discovery, Architecture & UX Wireframing',
        description: 'Detailed specification, user journeys, data schema, and technical design validation',
        category: 'design',
        quantity: 1,
        unitRate: 3500,
        isSelected: true,
      },
      {
        id: 'p_2',
        title: 'Core Application Engineering & API Integration',
        description: 'Frontend client, backend services, database migrations, and business logic implementation',
        category: 'development',
        quantity: 1,
        unitRate: 8500,
        isSelected: true,
      },
      {
        id: 'p_3',
        title: 'Quality Assurance, Performance & Security Verification',
        description: 'Comprehensive cross-browser testing, automated unit coverage, and vulnerability audit',
        category: 'development',
        quantity: 1,
        unitRate: 2500,
        isSelected: true,
      },
      {
        id: 'p_4',
        title: 'Production Launch, Handover & Staff Training',
        description: 'Cloud environment provisioning, DNS configuration, and operational handover walkthrough',
        category: 'management',
        quantity: 1,
        unitRate: 1500,
        isSelected: true,
      },
      {
        id: 'p_5',
        title: 'Priority 90-Day Extended Support & SLA (Optional)',
        description: 'Direct communication channel, proactive dependency patches, and guaranteed 4-hour response',
        category: 'consulting',
        quantity: 1,
        unitRate: 2000,
        isOptional: true,
        isSelected: false,
      },
    ],
    taxPercent: 0,
    discountPercent: 0,
    paymentTerms: '40% advance upon contract signing, 30% at Milestone 2 approval, 30% upon final acceptance handover.',
    depositPercent: 40,
  }
}

export const defaultContentLibrary: ContentLibraryBlock[] = [
  {
    id: 'block_case_study_roi',
    title: 'Enterprise Cloud Migration & 320% ROI Case Study',
    category: 'case_study',
    description: 'Proven enterprise transformation results demonstrating infrastructure cost reduction and 99.99% uptime.',
    tags: ['ROI', 'Enterprise', 'Cloud', 'Case Study'],
    createdAt: '2026-10-15T10:00:00Z',
    format: 'text',
    content: `### Proven Track Record: Enterprise Case Study

**Client:** FinFlow Global Enterprises  
**Challenge:** Fragmented legacy monolithic architecture experiencing high operational latency, \$24,000/mo server bloat, and manual deployment outages.  
**Delivered Solution:** Full containerized microservices migration to AWS ECS with zero-downtime CI/CD deployment pipelines, Redis caching layer, and SOC2-compliant logging.

**Measurable Business Impact:**
- **320% Return on Investment (ROI)** realized within the first 9 months post-handover.
- **78% Reduction in Infrastructure Overhead:** Cloud hosting spend dropped from \$24,000/mo to \$5,280/mo.
- **99.99% Production Uptime:** Zero unscheduled outages over 12 consecutive months of peak retail traffic.
- **Deployment Velocity:** Release cycles accelerated from bi-weekly manual pushes to 14 automated daily deploys.`,
  },
  {
    id: 'block_soc2_compliance',
    title: 'Enterprise Security, SOC2 & GDPR Compliance Guarantee',
    category: 'security',
    description: 'Rigorous multi-layer security governance including AES-256 encryption, role-based access, and audit logging.',
    tags: ['Security', 'SOC2', 'GDPR', 'Compliance'],
    createdAt: '2026-10-15T10:00:00Z',
    format: 'text',
    content: `### Security, Privacy & Enterprise Compliance Framework

Our development and deployment practices adhere strictly to institutional security standards, ensuring complete data sovereignty and regulatory conformance:

1. **Cryptographic Standards:** All client data in transit is enforced using TLS 1.3 with HSTS preloading. Data at rest is encrypted using AES-256 with automated KMS key rotation.
2. **SOC2 Type II & GDPR Conformance:**
   - Strict Principle of Least Privilege (PoLP) role-based access control (RBAC).
   - Automated, immutable audit trails logging every administrative mutation.
   - Granular 'Right to Erasure' and data portability endpoints compliant with EU GDPR Article 17.
3. **Automated Vulnerability Scanning:** Every build undergoes static application security testing (SAST), software composition analysis (SCA) for third-party dependencies, and OWASP Top 10 container vulnerability scans before deployment.
4. **Disaster Recovery & Redundancy:** Continuous geo-redundant database backups with automated point-in-time recovery (PITR) ensuring an RPO < 5 minutes and RTO < 30 minutes.`,
  },
  {
    id: 'block_agile_velocity',
    title: 'Dedicated Agile Squad & Sprint Velocity Commitment',
    category: 'agency',
    description: 'Detailed explanation of sprint ceremonies, weekly stakeholder demos, and milestone visibility.',
    tags: ['Agile', 'Sprint Cadence', 'Project Management'],
    createdAt: '2026-10-15T10:00:00Z',
    format: 'text',
    content: `### Dedicated Engineering Squad & Sprint Cadence

We execute your project using a high-velocity, disciplined 2-week Agile sprint framework designed to eliminate guesswork and maintain complete transparency:

- **Dedicated Squad Assignment:** Your team consists of a Lead Solutions Architect, Senior Full-Stack Engineers, dedicated QA Automation Specialist, and a Technical Project Manager.
- **Bi-Weekly Working Demos:** At the end of every sprint cycle, we host a live, interactive product demo of functional software on a dedicated staging environment for your feedback.
- **Transparent Asynchronous Communication:** Real-time Slack/Teams channel access directly with the engineers, daily asynchronous standups, and full Jira/Linear sprint board visibility.
- **Predictable Sprint Burndown:** Deliverables are defined by measurable acceptance criteria; scope modifications are managed dynamically without derailment or hidden charges.`,
  },
  {
    id: 'block_90day_warranty',
    title: '90-Day Post-Launch Hypercare & 4-Hour SLA Guarantee',
    category: 'warranty',
    description: 'Zero-cost bug fixing warranty and rapid-response SLA covering production stability.',
    tags: ['Warranty', 'SLA', 'Support', 'Quality Guarantee'],
    createdAt: '2026-10-15T10:00:00Z',
    format: 'text',
    content: `### 90-Day Post-Launch Hypercare & SLA Guarantee

We stand firmly behind the architectural integrity and operational reliability of our work with an inclusive 90-day comprehensive warranty:

- **100% Defect-Free Guarantee:** Any bug, functional deviation from specification, or regression identified within 90 days of production launch is remediated at zero additional cost.
- **Guaranteed Response SLA:**
  - **Severity 1 (Critical Outage):** Response within 1 hour; continuous remediation until resolved.
  - **Severity 2 (Major Impairment):** Response within 4 hours; patch deployed within 24 hours.
  - **Severity 3 (Minor / Cosmetic):** Addressed in next scheduled maintenance release.
- **Production Performance Monitoring:** Active APM tracing with automated alerts covering API latency, error rate thresholds, and database connection pool health.`,
  },
  {
    id: 'block_cloud_architecture',
    title: 'High-Availability Scalable Cloud Architecture Blueprint',
    category: 'tech_stack',
    description: 'Architectural overview of modern auto-scaling, caching, and CI/CD pipeline infrastructure.',
    tags: ['Architecture', 'DevOps', 'Scalability'],
    createdAt: '2026-10-15T10:00:00Z',
    format: 'text',
    content: `### High-Availability Scalable Cloud Architecture

The technical foundation is engineered to handle 10x traffic spikes with minimal latency and automatic elasticity:

\`\`\`
[ Edge CDN / Cloudflare ] ──> [ Managed Load Balancer (ALB) ]
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
    [ App Service Cluster A ]                       [ App Service Cluster B ]
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
    [ Read-Replica DB Pool ]                        [ Primary PostgreSQL Core ]
              │                                               │
              └───────────────> [ Redis Cache ] <─────────────┘
\`\`\`

- **Stateless Application Tier:** Containerized Node.js/Go services horizontally auto-scaled based on CPU utilization and request volume.
- **Dual-Layer Caching:** Edge caching for static media assets coupled with in-memory Redis clustering for database query offloading.
- **Automated Blue/Green Deploys:** Zero-downtime rolling updates verified by health-check canary gates before routing live traffic.`,
  },
  {
    id: 'block_retainer_escrow',
    title: 'Commercial Terms, Retainer Protection & Escrow Protocol',
    category: 'terms',
    description: 'Clear milestone payment structure, scope change order governance, and IP assignment.',
    tags: ['Commercial Terms', 'Governance', 'Milestones'],
    createdAt: '2026-10-15T10:00:00Z',
    format: 'text',
    content: `### Commercial Governance & Milestone Protection

Our commercial structure is designed to be fair, milestone-gated, and risk-mitigated for both parties:

1. **Milestone-Based Disbursements:** Invoices are triggered exclusively upon mutual approval of verifiable deliverables, eliminating capital risk.
2. **Formal Change Order Process:** Any feature request outside the baseline Scope of Work is estimated transparently in writing with timeline impact before any billable work begins.
3. **Intellectual Property Assignment:** Full, unencumbered ownership of all custom source code, design assets, and database schemas transfers to the Client immediately upon final milestone settlement.
4. **No Vendor Lock-In:** All source code is delivered fully documented with standard Docker configurations, comprehensive README setup guides, and automated CI/CD scripts.`,
  },
  {
    id: 'block_nda_framework',
    title: 'Mutual Non-Disclosure Agreement (NDA) & IP Protection',
    category: 'security',
    description: 'Standard institutional confidentiality agreement protecting trade secrets and proprietary data.',
    tags: ['NDA', 'Confidentiality', 'Legal', 'IP Protection'],
    createdAt: '2026-10-15T10:00:00Z',
    format: 'text',
    content: `### Mutual Non-Disclosure & Intellectual Property Protection

1. **Confidentiality Obligation:** Both parties agree to preserve the strict confidentiality of all proprietary business data, strategic roadmap details, customer records, and trade secrets disclosed during this engagement.
2. **Non-Use Limitation:** Confidential Information shall be used exclusively for the performance of this project and shall not be published, reverse-engineered, or transferred to any third party without explicit prior written consent.
3. **Exclusion of Public Information:** Obligations do not apply to information that is publicly known through no fault of the receiving party or independently developed without reference to proprietary assets.
4. **Perpetual IP Transfer:** All deliverables, work product, documentation, and customized logic created under this agreement constitute 'work made for hire' belonging solely to the Client upon account settlement.`,
  },
  {
    id: 'block_client_testimonials',
    title: 'Verified Client Endorsements & Industry Recognition',
    category: 'agency',
    description: 'Real-world client testimonials highlighting technical execution and delivery reliability.',
    tags: ['Testimonials', 'Social Proof', 'Reputation'],
    createdAt: '2026-10-15T10:00:00Z',
    format: 'text',
    content: `### Client Endorsements & Operational Excellence

> *"Working with this team was an exceptional experience. They delivered our core platform 2 weeks ahead of schedule and the code quality was clean, robust, and effortlessly scalable."*  
> **— David Chen, CTO at Apex Mobility**

> *"Their attention to architecture, security, and milestone communication is what sets them apart from typical agencies. Our conversion rates increased by 44% in the first quarter."*  
> **— Elena Rostova, VP Product at Quantify SaaS**

**Key Recognition & Benchmarks:**
- 98.4% Client Satisfaction & Recommendation Score across 45+ enterprise deliveries.
- Average sprint velocity accuracy within ±4% of initial scoping estimates.`,
  },
]

export function createDefaultAnalytics(): ProposalAnalytics {
  return {
    totalViews: 0,
    uniqueViewers: 0,
    totalTimeSpentSeconds: 0,
    sectionsEngagement: [
      { sectionTitle: 'Scope of Work & Deliverables', timeSpentSeconds: 0, viewPercentage: 0 },
      { sectionTitle: 'Itemized Investment & Pricing', timeSpentSeconds: 0, viewPercentage: 0 },
      { sectionTitle: 'Executive Summary', timeSpentSeconds: 0, viewPercentage: 0 },
      { sectionTitle: 'Timeline & Phased Milestones', timeSpentSeconds: 0, viewPercentage: 0 },
      { sectionTitle: 'Terms, Warranties & Governance', timeSpentSeconds: 0, viewPercentage: 0 },
    ],
    timelineEvents: [
      {
        id: `event_${Date.now()}`,
        eventType: 'opened',
        description: 'Proposal drafted and initialized in workspace',
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

export function createDefaultSecurity(): ProposalSecurity {
  return {
    requirePasscode: false,
    passcode: '',
    requireNdaAgreement: false,
    ndaText: 'This proposal contains proprietary and confidential business information. By accessing this proposal, you agree not to distribute or disclose its contents without written authorization.',
    expiryNoticeDays: 7,
    watermarkConfidential: false,
  }
}

export function calculateDefaultRoi(totalBudget: number): RoiEstimation {
  const budget = Math.max(totalBudget, 5000)
  const hoursSavedPerMonth = Math.round(budget / 250)
  const hourlyRateValue = 75
  const monthlyCostSavings = hoursSavedPerMonth * hourlyRateValue
  const annualCostSavings = monthlyCostSavings * 12
  const projectedRevenueBoostPercent = Math.min(Math.round((budget / 1000) * 1.5), 35)
  const paybackMonths = Math.max(Number((budget / monthlyCostSavings).toFixed(1)), 0.8)
  const threeYearNetRoi = annualCostSavings * 3 - budget

  return {
    hoursSavedPerMonth,
    hourlyRateValue,
    monthlyCostSavings,
    annualCostSavings,
    projectedRevenueBoostPercent,
    paybackMonths,
    threeYearNetRoi,
  }
}

export function createDefaultTieredPricing(budgetTotal: number, currency: CurrencyCode = 'USD'): PricingTier[] {
  const base = Math.max(budgetTotal || 15000, 3000)
  const starterPrice = Math.round((base * 0.6) / 100) * 100
  const proPrice = base
  const enterprisePrice = Math.round((base * 1.55) / 100) * 100

  return [
    {
      id: 'tier_starter',
      name: 'Starter MVP',
      price: starterPrice,
      description: 'Essential core features, rapid delivery, ideal for immediate validation.',
      isPopular: false,
      billingPeriod: 'one-time',
      features: [
        'Core functional MVP scope & deliverables',
        'Standard responsive user experience',
        'Standard QA & unit testing coverage',
        '30-day post-launch warranty support',
        'Standard deployment & hand-off documentation',
      ],
    },
    {
      id: 'tier_pro',
      name: 'Growth & Professional',
      price: proPrice,
      description: 'Full recommended scope with priority SLA, analytics, and architecture excellence.',
      isPopular: true,
      billingPeriod: 'one-time',
      features: [
        'Everything in Starter MVP package',
        'High-performance production architecture & APIs',
        'Admin telemetry, analytics & reporting dashboard',
        'Third-party automated webhook integrations',
        '90-day extended hypercare warranty & priority SLA',
        'Dedicated project management & weekly sprint reviews',
      ],
    },
    {
      id: 'tier_enterprise',
      name: 'Enterprise Scale',
      price: enterprisePrice,
      description: 'Turnkey enterprise-grade delivery with SOC2 compliance, 180-day SLA, and team training.',
      isPopular: false,
      billingPeriod: 'one-time',
      features: [
        'Everything in Growth & Professional package',
        'Custom high-availability multi-region cloud setup',
        'SOC2 & GDPR compliance data architecture',
        'Automated CI/CD deployment with zero-downtime rollback',
        '180-day comprehensive SLA warranty & 24/7 incident response',
        'Staff technical workshops & executive documentation',
      ],
    },
  ]
}

export function createDefaultDealHealth(proposal: Partial<GeneratedProposal>): DealHealthAnalysis {
  let score = 72
  const factors: DealHealthFactor[] = []
  const strengths: string[] = []
  const dealKillers: string[] = []
  const recommendations: string[] = []

  const sectionsCount = proposal.sections?.length || 0
  if (sectionsCount >= 6) {
    score += 10
    factors.push({
      name: 'Scope & Section Completeness',
      score: 92,
      impact: 'positive',
      description: `Includes ${sectionsCount} granular proposal sections covering scope, architecture, and governance.`,
    })
    strengths.push('Comprehensive section coverage establishes trust and professionalism.')
  } else {
    score -= 10
    factors.push({
      name: 'Scope & Section Completeness',
      score: 55,
      impact: 'negative',
      description: `Proposal only contains ${sectionsCount} sections. Missing key commercial or technical details.`,
    })
    dealKillers.push('Sparse sections may cause client hesitation on technical capability.')
    recommendations.push('Add Timeline & Phased Milestones and Terms & Warranties sections.')
  }

  const deposit = proposal.pricingStructure?.depositPercent ?? 40
  if (deposit >= 40) {
    score += 8
    factors.push({
      name: 'Payment & Cash Flow Protection',
      score: 95,
      impact: 'positive',
      description: `${deposit}% advance kickoff deposit ensures healthy cashflow and client financial commitment.`,
    })
    strengths.push(`Strong commercial protection with a ${deposit}% advance payment requirement.`)
  } else if (deposit < 30) {
    score -= 12
    factors.push({
      name: 'Payment & Cash Flow Protection',
      score: 45,
      impact: 'negative',
      description: `${deposit}% deposit creates excessive front-loaded financial risk for the agency.`,
    })
    dealKillers.push('Low upfront deposit exposes team to uncompensated preliminary sprint labor.')
    recommendations.push('Increase upfront deposit to at least 40% before initiating sprint delivery.')
  } else {
    factors.push({
      name: 'Payment & Cash Flow Protection',
      score: 75,
      impact: 'neutral',
      description: `${deposit}% deposit provides standard payment security.`,
    })
  }

  const hasWarranty = proposal.sections?.some((s) => /warrant|guarantee|sla/i.test(s.content + s.title))
  if (hasWarranty) {
    score += 8
    factors.push({
      name: 'Risk Reversal & Assurance',
      score: 90,
      impact: 'positive',
      description: 'Formal post-launch warranty and SLA reverses client perceived delivery risk.',
    })
    strengths.push('Explicit warranty clauses give the buyer confidence against post-launch defects.')
  } else {
    score -= 8
    factors.push({
      name: 'Risk Reversal & Assurance',
      score: 50,
      impact: 'negative',
      description: 'No explicit warranty period or bug-fix guarantee detected in proposal terms.',
    })
    recommendations.push('Include a 60-to-90-day defect remediation warranty to close skeptical buyers.')
  }

  const finalScore = Math.max(35, Math.min(98, score))
  const winProbability = Math.max(40, Math.min(95, Math.round(finalScore * 0.95)))

  let grade: DealHealthAnalysis['grade'] = 'Moderate'
  if (finalScore >= 88) grade = 'Exceptional'
  else if (finalScore >= 75) grade = 'Strong'
  else if (finalScore < 60) grade = 'At Risk'

  if (strengths.length === 0) {
    strengths.push('Proposal presents structured technical specifications.')
  }
  if (recommendations.length === 0) {
    recommendations.push('Keep proposal validity under 30 days to incentivize rapid client signature.')
  }

  return {
    winProbability,
    overallHealthScore: finalScore,
    grade,
    factors,
    strengths,
    dealKillers,
    recommendations,
    lastAnalyzedAt: new Date().toISOString(),
  }
}

export function scanProposalContractRisks(proposal: GeneratedProposal): ContractRiskReport {
  const risks: ContractRiskItem[] = []
  const allText = (proposal.sections || []).map((s) => s.title + ' ' + s.content).join('\n')

  // 1. Scope Creep Risk
  const hasRevisionLimit = /revision limit|\d+\s*revisions|change order/i.test(allText)
  if (!hasRevisionLimit) {
    risks.push({
      id: 'risk_scope_creep',
      category: 'Scope Creep',
      severity: 'high',
      issue: 'Undefined Revision Boundaries',
      riskExplanation: 'Without a concrete cap on revision cycles, the client may request indefinite aesthetic and functional modifications without paying additional fees.',
      recommendation: 'Specify that up to 2 review cycles are included per milestone, and additional changes require a formal billable Change Request.',
      autoFixClause: '### Scope Governance & Revision Policy\nDeliverables include up to two (2) consolidated feedback cycles per sprint milestone. Any modifications exceeding agreed specifications will be scoped via a formal Change Request at our standard billable rate ($125/hr).',
      injected: false,
    })
  }

  // 2. Client Stalling Risk
  const hasClientSla = /within \d+ (?:business )?days|feedback window|deemed approved/i.test(allText)
  if (!hasClientSla) {
    risks.push({
      id: 'risk_client_stalling',
      category: 'Timeline & Stalling',
      severity: 'medium',
      issue: 'Absence of Client Review Timeframe (Stalling Risk)',
      riskExplanation: 'If the client delays feedback for weeks, your team remains blocked with allocated resources while timeline milestones drift.',
      recommendation: 'Institute a 5-business-day review window after which milestone deliverables are deemed accepted.',
      autoFixClause: '### Client Acceptance Review Window\nClient agrees to review and provide consolidated feedback on submitted deliverables within five (5) business days. In the absence of written objections within this window, deliverables are deemed formally accepted to prevent sprint blockage.',
      injected: false,
    })
  }

  // 3. IP Ownership Transfer Risk
  const hasIpTiming = /full payment|receipt of final payment|upon settlement/i.test(allText)
  if (!hasIpTiming) {
    risks.push({
      id: 'risk_ip_transfer',
      category: 'IP & Ownership',
      severity: 'high',
      issue: 'Premature Intellectual Property Transfer',
      riskExplanation: 'Transferring copyright or code ownership before receiving 100% of the project fee leaves you with zero legal leverage if the client defaults.',
      recommendation: 'Explicitly state that intellectual property and licenses transfer solely upon receipt of cleared final payment.',
      autoFixClause: '### Intellectual Property & Transfer of Rights\nAll custom source code, documentation, and digital assets developed under this agreement remain the exclusive intellectual property of the agency until full and final settlement of all invoiced fees.',
      injected: false,
    })
  }

  // 4. Third-Party Dependency Liability
  const hasThirdPartyDisclaimer = /third-party|external api|vendor downtime/i.test(allText)
  if (!hasThirdPartyDisclaimer) {
    risks.push({
      id: 'risk_third_party',
      category: 'Liability & Warranties',
      severity: 'low',
      issue: 'Third-Party API & Cloud Service Liability Exposure',
      riskExplanation: 'Client could attempt to hold your agency liable if OpenAI, AWS, Stripe, or Apple App Store experiences outages or policy shifts.',
      recommendation: 'Include a standard third-party service dependency disclaimer.',
      autoFixClause: '### Third-Party Service Dependencies\nAgency is not liable for service outages, rate limits, breaking API updates, or billing changes initiated by third-party infrastructure providers (e.g., Cloudflare, AWS, OpenAI, Stripe).',
      injected: false,
    })
  }

  const highCount = risks.filter((r) => r.severity === 'high').length
  const medCount = risks.filter((r) => r.severity === 'medium').length
  const riskIndex = Math.min(100, highCount * 30 + medCount * 15 + risks.length * 5)
  const overallRiskLevel: ContractRiskReport['overallRiskLevel'] =
    riskIndex >= 50 ? 'high' : riskIndex >= 25 ? 'moderate' : 'low'

  return {
    overallRiskLevel,
    riskIndex,
    risks,
    scannedAt: new Date().toISOString(),
  }
}

export function generateDefaultDiscoveryQuestions(formData: ProposalFormData): DiscoveryQuestion[] {
  return [
    {
      id: 'dq_1',
      question: `What are the primary KPIs or success metrics by which you will evaluate the success of ${formData?.step1?.projectName || 'this project'}?`,
      category: 'business',
      importance: 'critical',
      suggestedAnswers: [
        'User adoption & active monthly user growth',
        'Direct operational cost reduction / automation',
        'Online conversion rate boost',
        'Faster time-to-market than competitors',
      ],
    },
    {
      id: 'dq_2',
      question: 'Do you have existing APIs, databases, or third-party platforms that must be integrated during Phase 1?',
      category: 'technical',
      importance: 'critical',
      suggestedAnswers: [
        'Yes, existing REST/GraphQL APIs with available documentation',
        'Yes, legacy database requiring schema migration',
        'No, this is a greenfield build from scratch',
        'Third-party CRM / Payment provider accounts only',
      ],
    },
    {
      id: 'dq_3',
      question: 'Who on your internal team will be the designated single point of contact for sprint approvals?',
      category: 'governance',
      importance: 'critical',
      suggestedAnswers: [
        'Dedicated Product Manager / CTO',
        'Business Founder / CEO',
        'Cross-functional committee (Marketing + Engineering)',
      ],
    },
    {
      id: 'dq_4',
      question: 'What is your hard deadline or target launch date for live production deployment?',
      category: 'timeline',
      importance: 'helpful',
      suggestedAnswers: [
        'Strict deadline tied to scheduled marketing campaign / investor demo',
        'Flexible target within 6-8 weeks',
        'Phased MVP launch followed by iterative quarterly releases',
      ],
    },
    {
      id: 'dq_5',
      question: 'What compliance, data sovereignty, or security constraints apply to your user data?',
      category: 'technical',
      importance: 'helpful',
      suggestedAnswers: [
        'Standard SSL / HTTPS and password hashing',
        'Strict GDPR / CCPA data privacy compliance required',
        'HIPAA / SOC2 Type II certification required',
        'PCI-DSS compliance for payment card storage',
      ],
    },
  ]
}

export function normalizeProposal(raw: any): GeneratedProposal {
  const today = new Date().toISOString().slice(0, 10)
  const defaultValid = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  const rawFormData = raw.formData || {}
  const formData: ProposalFormData = {
    step1: {
      agencyName: rawFormData.step1?.agencyName || 'Our Agency',
      agencyTagline: rawFormData.step1?.agencyTagline || 'Full-Stack Software Agency',
      agencyEmail: rawFormData.step1?.agencyEmail || '',
      agencyWebsite: rawFormData.step1?.agencyWebsite || '',
      clientName: rawFormData.step1?.clientName || 'Valued Client',
      clientCompany: rawFormData.step1?.clientCompany || 'Client Company',
      projectName: rawFormData.step1?.projectName || raw.title?.replace('Project Proposal: ', '') || 'Project Proposal',
      projectType: rawFormData.step1?.projectType || 'Web Development',
      industry: rawFormData.step1?.industry || 'Technology',
      problemStatement: rawFormData.step1?.problemStatement || 'Implementation of custom software solution.',
    },
    step2: {
      keyFeatures: rawFormData.step2?.keyFeatures || 'Core system features and workflows',
      technicalRequirements: rawFormData.step2?.technicalRequirements || ['Responsive Web App'],
      preferredTechStack: rawFormData.step2?.preferredTechStack || 'Modern Full-Stack Architecture',
      constraints: rawFormData.step2?.constraints || 'None specified',
      targetUsers: rawFormData.step2?.targetUsers || 'General users and administrators',
    },
    step3: {
      complexity: rawFormData.step3?.complexity || 'standard',
      budgetRange: rawFormData.step3?.budgetRange || raw.totalValue || '$15,000',
      advancePercent: rawFormData.step3?.advancePercent ?? 40,
      revisions: rawFormData.step3?.revisions ?? 3,
      warrantyPeriod: rawFormData.step3?.warrantyPeriod || '3 Months',
      additionalServices: rawFormData.step3?.additionalServices || [],
      paymentMilestone: rawFormData.step3?.paymentMilestone || '40-30-30',
    },
    step4: {
      tone: rawFormData.step4?.tone || 'professional',
      language: rawFormData.step4?.language || 'English',
      includedSections: rawFormData.step4?.includedSections || includedSections,
      specialEmphasis: rawFormData.step4?.specialEmphasis || '',
    },
  }

  // Ensure sections array
  const rawSections = Array.isArray(raw.sections) ? raw.sections : []
  const sections = rawSections.map((s: any, idx: number) => ({
    id: s.id || `section_${idx + 1}`,
    title: s.title || `Section ${idx + 1}`,
    content: s.content || '',
    type: s.type || (s.content?.includes('|') ? 'table' : s.content?.includes('## Phase') ? 'phases' : 'text'),
    isEdited: Boolean(s.isEdited),
  }))

  // Ensure valid status
  const validStatuses = ['draft', 'review', 'sent', 'accepted', 'rejected', 'archived']
  const status = validStatuses.includes(raw.status) ? raw.status : 'draft'

  // Normalize pricing structure
  const pricingStructure: PricingStructure =
    raw.pricingStructure && Array.isArray(raw.pricingStructure.items)
      ? raw.pricingStructure
      : createDefaultPricingStructure(
          raw.totalValue?.includes('₹') ? 'INR' : raw.totalValue?.includes('€') ? 'EUR' : raw.totalValue?.includes('£') ? 'GBP' : 'USD',
          raw.totalValue
        )

  // Status history
  const statusHistory = Array.isArray(raw.statusHistory) && raw.statusHistory.length > 0
    ? raw.statusHistory
    : [
        {
          status,
          timestamp: raw.createdAt || new Date().toISOString(),
          note: 'Proposal initialized in workspace',
        },
      ]

  // Numeric budget value for ROI
  const numericBudget = pricingStructure.items
    .filter((i) => !i.isOptional || i.isSelected)
    .reduce((sum, item) => sum + item.quantity * item.unitRate, 0) || 15000

  // Ensure tiered pricing exists
  if (!pricingStructure.tiers || pricingStructure.tiers.length === 0) {
    pricingStructure.tiers = createDefaultTieredPricing(numericBudget, pricingStructure.currency)
  }
  if (!pricingStructure.mode) {
    pricingStructure.mode = 'itemized'
  }
  if (!pricingStructure.selectedTierId) {
    pricingStructure.selectedTierId = 'tier_pro'
  }

  const baseProp: GeneratedProposal = {
    id: raw.id || `proposal_${Date.now()}`,
    formData,
    title: raw.title || `Project Proposal: ${formData.step1.projectName}`,
    subtitle: raw.subtitle || `Prepared for ${formData.step1.clientCompany} by ${formData.step1.agencyName}`,
    generatedDate: raw.generatedDate || today,
    validUntil: raw.validUntil || defaultValid,
    sections,
    status,
    totalValue: raw.totalValue || '$15,000',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    pricingStructure,
    qualityAudit: raw.qualityAudit,
    statusHistory,
    versions: Array.isArray(raw.versions) ? raw.versions : [],
    signoff: raw.signoff,
    brandConfig: raw.brandConfig,
    analytics: raw.analytics || createDefaultAnalytics(),
    security: raw.security || createDefaultSecurity(),
    roiEstimation: raw.roiEstimation || calculateDefaultRoi(numericBudget),
    comments: Array.isArray(raw.comments) ? raw.comments : [],
    discoveryQuestions:
      Array.isArray(raw.discoveryQuestions) && raw.discoveryQuestions.length > 0
        ? raw.discoveryQuestions
        : generateDefaultDiscoveryQuestions(formData),
  }

  baseProp.dealHealth = raw.dealHealth || createDefaultDealHealth(baseProp)
  baseProp.riskReport = raw.riskReport || scanProposalContractRisks(baseProp)

  return baseProp
}

export const demoProposals: GeneratedProposal[] = [
  normalizeProposal({
    id: 'demo_stylehub',
    formData: {
      ...emptyFormData,
      step1: {
        ...emptyFormData.step1,
        agencyName: 'Aetherion Labs',
        agencyTagline: 'Full-Stack Software & AI Solutions',
        clientName: 'Rahul Verma',
        clientCompany: 'StyleHub Retail Corp',
        projectName: 'E-commerce Platform & Inventory Core',
        projectType: 'Full-Stack App',
        industry: 'E-commerce',
        problemStatement: 'StyleHub currently manages high-volume apparel sales through disconnected marketplaces, causing stockouts, manual reconciliation delays, and slow customer checkout.',
      },
      step2: {
        ...emptyFormData.step2,
        keyFeatures: '1. Multi-brand product catalog with elastic search\n2. Real-time inventory sync across 4 fulfillment hubs\n3. High-velocity checkout with automated GST invoice generation\n4. Merchant analytics dashboard tracking conversion rates and fulfillment latency',
        preferredTechStack: 'Next.js 14, Node.js, PostgreSQL, Redis, Stripe, Tailwind CSS',
      },
      step3: {
        ...emptyFormData.step3,
        budgetRange: '$18,500',
        advancePercent: 40,
        paymentMilestone: '40-30-30',
      },
    },
    title: 'Project Proposal: E-commerce Platform & Inventory Core',
    subtitle: 'Prepared for StyleHub Retail Corp by Aetherion Labs',
    generatedDate: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    status: 'accepted',
    totalValue: '$18,500',
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        type: 'text',
        content: 'This proposal details the design, engineering, and rollout roadmap for StyleHub Retail Corp\'s next-generation e-commerce and unified inventory platform.\n\nAetherion Labs will deliver an enterprise-grade digital flagship combining rapid sub-second catalog navigation with automated multi-warehouse reconciliation. By consolidating customer checkout and backend inventory workflows into a unified cloud infrastructure, StyleHub will eliminate operational stockouts, elevate customer conversion rates, and unlock automated retail scalability.',
        isEdited: false,
      },
      {
        id: 'requirements',
        title: 'Understanding of Requirements',
        type: 'text',
        content: '### Business Challenge & Objective\nBased on discovery alignment with Rahul Verma, StyleHub faces operational friction managing rapid growth across distributed fulfillment centers. Key requirements include:\n\n- Zero-lag catalog synchronization across online storefront and four physical fulfillment hubs\n- Sub-second checkout performance supporting high-volume seasonal flash campaigns\n- Clean accounting reconciliation with automated multi-tier tax and shipping rate calculation\n- Robust role-based administrative controls safeguarding customer PII and sales metrics',
        isEdited: false,
      },
      {
        id: 'scope',
        title: 'Scope of Work & Deliverables',
        type: 'list',
        content: '- **Modular E-Commerce Storefront**: High-performance responsive shopping interface with faceted search, dynamic filters, and localized currency display\n- **Inventory Synchronization Engine**: Real-time warehouse webhook integration ensuring sub-minute stock reconciliation\n- **Checkout & Payment Gateway**: Secure PCI-compliant transaction processing with automated customer receipt generation\n- **Merchant Operations Dashboard**: Granular order management, customer support timeline, and automated fulfillment tracking\n- **Production Deployment & SLA**: Provisioning on AWS containerized infrastructure with continuous health monitoring and zero-downtime deployment pipelines',
        isEdited: false,
      },
      {
        id: 'timeline',
        title: 'Timeline & Phased Milestones',
        type: 'phases',
        content: '## Phase 1: Architecture & UX Blueprint (Weeks 1-2)\n- Interactive Figma design prototype and customer journey flows\n- Database schema modeling and payment gateway sandbox configuration\n\n## Phase 2: Core Engineering & Inventory Engine (Weeks 3-5)\n- Storefront catalog integration and multi-warehouse sync microservices\n- Merchant administrative dashboard and authentication layer\n\n## Phase 3: QA, Security & User Acceptance (Week 6)\n- End-to-end checkout load testing, penetration scanning, and cross-browser validation\n- Client UAT sign-off with staff administrative training\n\n## Phase 4: Production Launch & Monitoring (Week 7)\n- Cloud DNS cutover, SSL configuration, and production launch\n- 30-day hypercare launch monitoring and operational handover',
        isEdited: false,
      },
      {
        id: 'pricing',
        title: 'Itemized Investment & Pricing',
        type: 'table',
        content: '| Project Module | Deliverables | Allocation | Investment |\n|---|---|---|---|\n| Architecture & UX Design | Wireframes, prototypes, API contract | 20% | $3,700 |\n| Full Storefront & Backend Engine | Next.js app, inventory sync, database | 50% | $9,250 |\n| Quality Assurance & Load Testing | Security audit, mobile testing, UAT | 15% | $2,775 |\n| Deployment, Handover & Hypercare | AWS IaC, staff training, 30-day support | 15% | $2,775 |\n\n**Total Project Investment: $18,500**\nPayment Schedule: 40% advance deposit ($7,400) upon signing, 30% ($5,550) upon Milestone 2 approval, 30% ($5,550) upon final acceptance.',
        isEdited: false,
      },
      {
        id: 'terms',
        title: 'Terms, Warranties & Governance',
        type: 'text',
        content: '1. **Payment Milestones**: 40% advance deposit required prior to engineering sprint commencement.\n2. **Revision Guarantee**: Includes up to 3 structured feedback and iteration rounds at each milestone checkpoint.\n3. **Post-Launch Warranty**: Aetherion Labs provides 90 days of comprehensive post-launch defect warranty covering critical bug remediation.\n4. **Intellectual Property**: Full ownership of bespoke source code, database schemas, and digital design assets transfers to StyleHub Retail Corp upon receipt of final project payment.\n5. **Confidentiality**: Strict mutual non-disclosure governing commercial data, technical schemas, and customer metrics.',
        isEdited: false,
      },
      {
        id: 'next_steps',
        title: 'Next Steps & Kickoff Schedule',
        type: 'text',
        content: 'To initiate project delivery:\n\n1. **Proposal Authorization**: Confirm agreement structure and execute digital signature below.\n2. **Kickoff Alignment**: Schedule the 45-minute technical discovery session with our engineering leads.\n3. **Deposit Processing**: Process the 40% kickoff invoice to reserve engineering sprint allocation.\n4. **Sprint Commencement**: Sprint 1 discovery and UX wireframing commences immediately.',
        isEdited: false,
      },
    ],
    pricingStructure: {
      pricingModel: 'fixed',
      currency: 'USD',
      items: [
        {
          id: 'sh_1',
          title: 'UX/UI Design & Architecture Wireframes',
          description: 'Figma prototypes, customer journey mapping, and database schema',
          category: 'design',
          quantity: 1,
          unitRate: 3700,
          isSelected: true,
        },
        {
          id: 'sh_2',
          title: 'Full E-commerce Storefront & Inventory Engine',
          description: 'React/Next.js interface, inventory sync microservice, and Stripe payment gateway',
          category: 'development',
          quantity: 1,
          unitRate: 9250,
          isSelected: true,
        },
        {
          id: 'sh_3',
          title: 'End-to-End Testing & Security Audit',
          description: 'Load stress testing, mobile validation, and penetration review',
          category: 'development',
          quantity: 1,
          unitRate: 2775,
          isSelected: true,
        },
        {
          id: 'sh_4',
          title: 'Production Deployment & Operations Handover',
          description: 'AWS ECS provisioning, DNS cutover, team training, and 30-day hypercare',
          category: 'infrastructure',
          quantity: 1,
          unitRate: 2775,
          isSelected: true,
        },
      ],
      taxPercent: 0,
      discountPercent: 0,
      paymentTerms: '40-30-30 milestone schedule with 40% advance kickoff deposit',
      depositPercent: 40,
    },
    qualityAudit: {
      overallScore: 94,
      grade: 'A',
      metrics: {
        completeness: 96,
        clarity: 92,
        pricingIntegrity: 95,
        scopeSpecificity: 94,
        riskCoverage: 90,
        actionability: 96,
      },
      strengths: [
        'Exhaustive 7-section proposal covering entire lifecycle from architecture to handover.',
        'Deterministic itemized pricing matching executive summary and budget allocation.',
        'Clear phased delivery roadmap with weekly progress visibility.',
        'Unambiguous IP transfer, warranty guarantee, and kickoff next steps.',
      ],
      actionableRecommendations: [
        'Consider offering an optional ongoing maintenance retainer add-on for post-warranty support.',
      ],
      missingCriticalItems: [],
      lastAuditedAt: new Date().toISOString(),
    },
  }),
  normalizeProposal({
    id: 'demo_medquick',
    formData: {
      ...emptyFormData,
      step1: {
        ...emptyFormData.step1,
        agencyName: 'Aetherion Labs',
        clientName: 'Dr. Sarah Jenkins',
        clientCompany: 'MedQuick Health Systems',
        projectName: 'AI Clinical Patient Triage & Routing System',
        projectType: 'AI/ML System',
        industry: 'Healthcare',
        problemStatement: 'MedQuick Health Systems experiences heavy patient inquiry volume across urgent care centers, causing administrative triage backlogs and delayed patient appointment routing.',
      },
      step3: {
        ...emptyFormData.step3,
        budgetRange: '$24,000',
        advancePercent: 40,
        paymentMilestone: '40-30-30',
      },
    },
    title: 'Project Proposal: AI Clinical Patient Triage & Routing System',
    subtitle: 'Prepared for MedQuick Health Systems by Aetherion Labs',
    generatedDate: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    status: 'review',
    totalValue: '$24,000',
    sections: [
      {
        id: 'executive_summary',
        title: 'Executive Summary',
        type: 'text',
        content: 'This proposal presents an automated clinical triage and intelligent scheduling system developed for MedQuick Health Systems.\n\nBy deploying secure conversational AI with strict clinical guardrails and EHR integration, MedQuick will automate preliminary symptom intake, streamline urgency classification, and reduce patient wait times by an estimated 45% while preserving HIPAA data sovereignty.',
        isEdited: false,
      },
      {
        id: 'scope',
        title: 'Scope of Work & Deliverables',
        type: 'list',
        content: '- **Conversational Patient Triage Assistant**: Guided symptom questionnaire with emergency escalation triggers\n- **EHR Scheduling Connector**: Real-time integration into clinical booking calendars with provider specialty mapping\n- **Clinical Review Dashboard**: Secure clinician view for approving AI-generated preliminary summaries\n- **HIPAA Security & Audit Pipeline**: End-to-end encryption, automated audit logging, and PII anonymization',
        isEdited: false,
      },
      {
        id: 'pricing',
        title: 'Itemized Investment & Pricing',
        type: 'table',
        content: '| Module | Scope | Allocation | Investment |\n|---|---|---|---|\n| HIPAA Compliance & EHR Integration | API connector, security framework | 35% | $8,400 |\n| Clinical Triage AI Workflow | Prompt guardrails, escalation triggers | 40% | $9,600 |\n| Clinician Dashboard & Testing | Review portal, usability testing | 25% | $6,000 |\n\n**Total Project Investment: $24,000**',
        isEdited: false,
      },
      {
        id: 'terms',
        title: 'Terms, Warranties & Governance',
        type: 'text',
        content: '1. **Compliance**: Solution adheres to HIPAA Security Rule and BAA commitments.\n2. **Milestones**: 40% kickoff deposit, 30% upon clinical test sign-off, 30% upon live pilot release.\n3. **Support**: Includes 60 days of hypercare support and staff clinical walkthroughs.',
        isEdited: false,
      },
      {
        id: 'next_steps',
        title: 'Next Steps & Kickoff Schedule',
        type: 'text',
        content: '1. Execute BAA and proposal agreement.\n2. Technical kickoff with EHR integration engineers.\n3. Sprint 1 clinical protocol review begins within 3 business days.',
        isEdited: false,
      },
    ],
    pricingStructure: {
      pricingModel: 'fixed',
      currency: 'USD',
      items: [
        {
          id: 'mq_1',
          title: 'HIPAA Compliance & EHR API Integration',
          description: 'Secure connector to clinical scheduling backend with BAA compliance validation',
          category: 'infrastructure',
          quantity: 1,
          unitRate: 8400,
          isSelected: true,
        },
        {
          id: 'mq_2',
          title: 'Clinical Triage AI Workflow & Guardrails',
          description: 'Conversational intake engine, urgency scoring, and clinical escalation triggers',
          category: 'development',
          quantity: 1,
          unitRate: 9600,
          isSelected: true,
        },
        {
          id: 'mq_3',
          title: 'Clinician Review Portal & Usability Verification',
          description: 'Secure staff review interface, audit logging, and clinical workflow validation',
          category: 'development',
          quantity: 1,
          unitRate: 6000,
          isSelected: true,
        },
      ],
      taxPercent: 0,
      discountPercent: 0,
      paymentTerms: '40-30-30 milestone schedule with 40% advance kickoff deposit',
      depositPercent: 40,
    },
    qualityAudit: {
      overallScore: 88,
      grade: 'A',
      metrics: {
        completeness: 88,
        clarity: 90,
        pricingIntegrity: 92,
        scopeSpecificity: 88,
        riskCoverage: 84,
        actionability: 88,
      },
      strengths: [
        'Strong compliance focus with HIPAA data sovereignty commitments.',
        'Itemized pricing tied directly to core architectural deliverables.',
      ],
      actionableRecommendations: [
        'Add explicit delivery phase durations to the timeline section for scheduling certainty.',
      ],
      missingCriticalItems: ['Timeline Phases'],
      lastAuditedAt: new Date().toISOString(),
    },
  }),
]
