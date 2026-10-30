export type ProjectType =
  | 'Web Development'
  | 'AI/ML System'
  | 'Mobile App'
  | 'Automation'
  | 'Full-Stack App'
  | 'Custom Software'
  | 'IT Consulting & Advisory'
  | 'Digital Marketing & Growth'
  | 'UI/UX Product Design'
  | 'Cloud Architecture & DevOps'
  | 'API & Integration'

export type Industry =
  | 'E-commerce'
  | 'Healthcare'
  | 'Education'
  | 'Fintech'
  | 'SaaS'
  | 'Real Estate'
  | 'Technology'
  | 'Finance & Banking'
  | 'Media & Entertainment'
  | 'Manufacturing & Logistics'
  | 'Professional Services'
  | 'Other'

export type ProposalStatus =
  | 'draft'
  | 'review'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'archived'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD'

export interface PricingItem {
  id: string
  title: string
  description?: string
  category: 'development' | 'design' | 'management' | 'infrastructure' | 'consulting' | 'other'
  quantity: number
  unitRate: number
  isOptional?: boolean // Can be toggled by client in presentation mode
  isSelected?: boolean // Selection state
}

export interface PricingStructure {
  pricingModel: 'fixed' | 'hourly' | 'milestone' | 'retainer'
  currency: CurrencyCode
  items: PricingItem[]
  taxPercent: number
  discountPercent: number
  paymentTerms: string
  depositPercent: number
}

export interface QualityMetricBreakdown {
  completeness: number // 0 - 100
  clarity: number // 0 - 100
  pricingIntegrity: number // 0 - 100
  scopeSpecificity: number // 0 - 100
  riskCoverage: number // 0 - 100
  actionability: number // 0 - 100
}

export interface QualityAuditResult {
  overallScore: number // 0 - 100
  grade: 'A' | 'B' | 'C' | 'Needs Improvement'
  metrics: QualityMetricBreakdown
  strengths: string[]
  actionableRecommendations: string[]
  missingCriticalItems: string[]
  lastAuditedAt: string
}

export interface StatusHistoryEntry {
  status: ProposalStatus
  timestamp: string
  note?: string
}

export interface ProposalVersionSnapshot {
  id: string
  versionNumber: string
  createdAt: string
  note: string
  sectionsCount: number
  totalValue: string
  snapshot: GeneratedProposal
}

export interface ClientSignoff {
  signerName: string
  signerEmail: string
  signerTitle: string
  signedAt: string
  acceptedTotal: string
  notes?: string
}

export interface SectionEngagement {
  sectionTitle: string
  timeSpentSeconds: number
  viewPercentage: number
}

export interface EngagementEvent {
  id: string
  eventType: 'opened' | 'scrolled' | 'addon_toggled' | 'download_pdf' | 'signed'
  description: string
  timestamp: string
  clientDevice?: string
}

export interface ProposalAnalytics {
  totalViews: number
  uniqueViewers: number
  totalTimeSpentSeconds: number
  lastViewedAt?: string
  sectionsEngagement: SectionEngagement[]
  timelineEvents: EngagementEvent[]
}

export interface ContentLibraryBlock {
  id: string
  title: string
  category: 'agency' | 'case_study' | 'security' | 'warranty' | 'tech_stack' | 'terms' | 'custom'
  description: string
  content: string
  format: 'text' | 'table' | 'phases' | 'list'
  tags: string[]
  createdAt: string
}

export interface ProposalSecurity {
  requirePasscode: boolean
  passcode?: string
  requireNdaAgreement: boolean
  ndaText?: string
  expiryNoticeDays: number
  watermarkConfidential: boolean
}

export interface RoiEstimation {
  hoursSavedPerMonth: number
  hourlyRateValue: number
  monthlyCostSavings: number
  annualCostSavings: number
  projectedRevenueBoostPercent: number
  paybackMonths: number
  threeYearNetRoi: number
}

export interface BrandConfig {
  companyName: string
  tagline: string
  logoUrl?: string
  primaryColor: string
  accentColor: string
  email: string
  phone?: string
  website?: string
  address?: string
  defaultCurrency: CurrencyCode
  defaultPaymentTerms: string
}

export interface ProposalTemplate {
  id: string
  name: string
  category: string
  description: string
  iconName: string
  projectType: ProjectType
  industry: Industry
  sections: string[]
  sampleProblem: string
  sampleFeatures: string[]
  samplePricing: PricingItem[]
  defaultTone: 'professional' | 'friendly' | 'bold' | 'technical'
}

export interface FormStep1 {
  agencyName: string
  agencyTagline: string
  agencyEmail: string
  agencyWebsite: string
  clientName: string
  clientCompany: string
  projectName: string
  projectType: ProjectType
  industry: Industry
  problemStatement: string
}

export interface FormStep2 {
  keyFeatures: string
  technicalRequirements: string[]
  preferredTechStack: string
  constraints: string
  targetUsers: string
}

export interface FormStep3 {
  complexity: 'simple' | 'standard' | 'complex' | 'enterprise'
  budgetRange: string
  advancePercent: number
  revisions: number
  warrantyPeriod: string
  additionalServices: string[]
  paymentMilestone: '50-50' | '40-30-30' | '30-40-30'
  pricingStructure?: PricingStructure
}

export interface FormStep4 {
  tone: 'professional' | 'friendly' | 'bold' | 'technical'
  language: 'English' | 'Hindi' | 'Hinglish'
  includedSections: string[]
  specialEmphasis: string
}

export interface ProposalFormData {
  step1: FormStep1
  step2: FormStep2
  step3: FormStep3
  step4: FormStep4
}

export interface ProposalSection {
  id: string
  title: string
  content: string
  type: 'text' | 'table' | 'list' | 'phases'
  tableData?: {
    headers: string[]
    rows: string[][]
  }
  phases?: Array<{
    name: string
    duration: string
    tasks: string[]
  }>
  isEdited: boolean
}

export interface GeneratedProposal {
  id: string
  formData: ProposalFormData
  title: string
  subtitle: string
  generatedDate: string
  validUntil: string
  sections: ProposalSection[]
  status: ProposalStatus
  totalValue: string
  createdAt: string
  updatedAt: string
  pricingStructure?: PricingStructure
  qualityAudit?: QualityAuditResult
  statusHistory?: StatusHistoryEntry[]
  versions?: ProposalVersionSnapshot[]
  signoff?: ClientSignoff
  brandConfig?: Partial<BrandConfig>
  analytics?: ProposalAnalytics
  security?: ProposalSecurity
  roiEstimation?: RoiEstimation
}
