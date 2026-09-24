export type ProjectType =
  | 'Web Development'
  | 'AI/ML System'
  | 'Mobile App'
  | 'Automation'
  | 'Full-Stack App'
  | 'Custom Software'

export type Industry =
  | 'E-commerce'
  | 'Healthcare'
  | 'Education'
  | 'Fintech'
  | 'SaaS'
  | 'Real Estate'
  | 'Other'

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
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  totalValue: string
  createdAt: string
  updatedAt: string
}
