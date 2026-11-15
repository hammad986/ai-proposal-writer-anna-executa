import { useState } from 'react'
import {
  LayoutTemplate,
  Sparkles,
  ArrowRight,
  Code,
  Brain,
  Briefcase,
  TrendingUp,
  Globe,
  Rocket,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProposalTemplate, GeneratedProposal, ProposalFormData } from '@/types'
import { emptyFormData, normalizeProposal } from '@/defaults'
import { formatLocalDate, addDaysToIso, calculatePricingTotals, formatCurrency } from '@/utils'

interface TemplateGalleryViewProps {
  onProposalCreated: (proposal: GeneratedProposal) => void
  onNavigateToStudio: (proposalId: string) => void
  toast: {
    success: (msg: string) => void
    error: (msg: string) => void
  }
}

const TEMPLATES: Array<{
  id: string
  name: string
  category: string
  icon: any
  tagline: string
  typicalBudget: string
  typicalTimeline: string
  sections: string[]
  sampleProblem: string
  sampleFeatures: string[]
}> = [
  {
    id: 'tpl_web_dev',
    name: 'Modern Web Application & Portal',
    category: 'Web Development',
    icon: Globe,
    tagline: 'High-performance React/Next.js portal with cloud backend and authentication.',
    typicalBudget: '$18,000 – $28,000',
    typicalTimeline: '6–8 weeks',
    sections: ['Executive Summary', 'Technical Architecture', 'Scope of Deliverables', 'Timeline & Milestones', 'Investment & Pricing', 'Terms & Conditions'],
    sampleProblem: 'Client requires a modern, responsive web application to replace legacy manual workflows and scale customer self-service.',
    sampleFeatures: ['Responsive Next.js Frontend', 'Node.js / PostgreSQL Backend', 'Role-Based Authentication (RBAC)', 'Stripe Payment Gateway'],
  },
  {
    id: 'tpl_ai_ml',
    name: 'AI Agent & LLM Intelligence System',
    category: 'AI / Machine Learning',
    icon: Brain,
    tagline: 'Custom autonomous agents, RAG document search, and workflow automation.',
    typicalBudget: '$25,000 – $45,000',
    typicalTimeline: '8–10 weeks',
    sections: ['Executive Summary', 'AI Architecture & Model Strategy', 'Data Pipeline & RAG Search', 'Security & Guardrails', 'Implementation Roadmap', 'Commercial Investment', 'SLA & Warranty'],
    sampleProblem: 'Enterprise operations require AI agents to automate knowledge retrieval, customer inquiry deflection, and document analysis.',
    sampleFeatures: ['Multi-turn Conversational Agent', 'Vector Semantic Search over Knowledge Base', 'Model Evaluation & Guardrails', 'SOC2 / HIPAA Compliance Controls'],
  },
  {
    id: 'tpl_consulting',
    name: 'Strategic IT & Digital Advisory',
    category: 'Consulting',
    icon: Briefcase,
    tagline: 'Executive advisory, cloud architecture audit, and digital transformation roadmap.',
    typicalBudget: '$15,000 – $35,000',
    typicalTimeline: '4–6 weeks',
    sections: ['Engagement Objectives', 'Current State Assessment', 'Strategic Roadmap', 'Resource Allocation', 'Commercial Retainer', 'Terms of Engagement'],
    sampleProblem: 'Client leadership needs an independent architectural audit and technology modernization roadmap to support global market expansion.',
    sampleFeatures: ['Architecture & Infrastructure Audit', 'Cloud Cost Optimization Plan', 'Team Skill Matrix & Hiring Advisory', 'Vendor Selection Analysis'],
  },
  {
    id: 'tpl_growth',
    name: 'Digital Marketing & Growth Retainer',
    category: 'Marketing & SEO',
    icon: TrendingUp,
    tagline: 'Full-funnel customer acquisition, technical SEO, and conversion rate optimization.',
    typicalBudget: '$8,000 – $15,000/mo',
    typicalTimeline: '3–6 month retainer',
    sections: ['Executive Summary', 'Market Analysis & Positioning', 'Growth Sprints & Channels', 'Deliverables & KPIs', 'Monthly Investment', 'Terms of Service'],
    sampleProblem: 'Customer acquisition cost is escalating and organic lead velocity has stalled across primary digital funnels.',
    sampleFeatures: ['Technical SEO & Core Web Vitals Audit', 'Paid Acquisition Campaign Management', 'Landing Page A/B Testing Engine', 'Bi-Weekly Executive Reporting'],
  },
  {
    id: 'tpl_freelance',
    name: 'Freelance Full-Stack Sprint',
    category: 'Freelance & Contracting',
    icon: Code,
    tagline: 'Agile MVP development sprint for fast-moving startups and product teams.',
    typicalBudget: '$6,000 – $12,000',
    typicalTimeline: '3–4 weeks',
    sections: ['Project Overview', 'Sprint Deliverables', 'Tech Stack & Setup', 'Weekly Milestones', 'Fixed-Price Quotation', 'Handover & Warranty'],
    sampleProblem: 'Startup founder needs a working MVP launched within 4 weeks to validate traction with angel investors.',
    sampleFeatures: ['Full-Stack MVP Development', 'Mobile-First Responsive UI', 'Third-Party Webhooks & Integrations', 'Clean Source Code & GitHub Handover'],
  },
  {
    id: 'tpl_rfp_enterprise',
    name: 'Enterprise RFP & Government Solicitation Response',
    category: 'Enterprise / RFP',
    icon: ShieldCheck,
    tagline: 'Formal, compliant solicitation response with strict requirement tracing and matrices.',
    typicalBudget: '$50,000 – $150,000',
    typicalTimeline: '12–16 weeks',
    sections: ['Executive Overview', 'Understanding of Solicitation Scope', 'Compliance Matrix & Traceability', 'Technical Methodology', 'Project Governance & Risk Plan', 'Pricing & Milestone Schedule', 'Quality Assurance & SLAs'],
    sampleProblem: 'Formal procurement RFP mandates verifiable compliance clauses, SLA guarantees, and strict audit traceability.',
    sampleFeatures: ['2-Way RFP Compliance Matrix', 'Security & Governance Controls', 'Phased Delivery with Formal UAT Gates', 'Post-Handover SLA & Support Plan'],
  },
]

export function TemplateGalleryView({
  onProposalCreated,
  onNavigateToStudio,
  toast,
}: TemplateGalleryViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', 'Web Development', 'AI / Machine Learning', 'Consulting', 'Marketing & SEO', 'Freelance & Contracting', 'Enterprise / RFP']

  const filteredTemplates = TEMPLATES.filter(
    (t) => selectedCategory === 'All' || t.category === selectedCategory
  )

  const handleUseTemplate = (tpl: typeof TEMPLATES[0]) => {
    const todayStr = formatLocalDate(new Date())
    const validUntilStr = addDaysToIso(todayStr, 30)

    const formData: ProposalFormData = {
      step1: {
        ...emptyFormData.step1,
        projectName: tpl.name,
        projectType: tpl.category as any,
        problemStatement: tpl.sampleProblem,
      },
      step2: {
        ...emptyFormData.step2,
        keyFeatures: tpl.sampleFeatures.join('\n'),
      },
      step3: {
        ...emptyFormData.step3,
        budgetRange: tpl.typicalBudget,
      },
      step4: {
        ...emptyFormData.step4,
        includedSections: tpl.sections,
      },
    }

    const proposal: GeneratedProposal = normalizeProposal({
      id: `prop_${Date.now()}`,
      title: `${tpl.name} Proposal`,
      subtitle: `Prepared for Client Partner &mdash; ${tpl.category}`,
      generatedDate: todayStr,
      validUntil: validUntilStr,
      totalValue: tpl.typicalBudget,
      status: 'draft',
      formData,
      sections: tpl.sections.map((secTitle, idx) => ({
        id: `sec_${idx + 1}`,
        title: secTitle,
        content: `### ${secTitle}\nStructured deliverable specifications and commitments tailored for ${tpl.name}.\n\n- Deliverable alignment with industry standards.\n- Production quality assurance and SLA commitments.\n- Complete documentation and handover guarantees.`,
        type: 'text',
        isEdited: false,
      })),
    })

    onProposalCreated(proposal)
    onNavigateToStudio(proposal.id)
    toast.success(`Created proposal from '${tpl.name}'!`)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b pb-6 space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            Proposal Studio 3.0
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            8+ Battle-Tested Blueprints
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-foreground">
          Professional Template Gallery
        </h2>
        <p className="text-sm text-muted-foreground">
          Select an industry-tailored proposal architecture. Each blueprint features pre-engineered section structures, pricing frameworks, and delivery milestones.
        </p>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-xl px-3 py-1.5 font-semibold transition cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => {
          const Icon = tpl.icon
          return (
            <Card
              key={tpl.id}
              className="group flex flex-col justify-between border bg-card hover:border-primary/50 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {tpl.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {tpl.tagline}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Typical Budget</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{tpl.typicalBudget}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Delivery</span>
                    <span className="font-semibold text-foreground">{tpl.typicalTimeline}</span>
                  </div>
                </div>

                {/* Section count */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  <span>{tpl.sections.length} Pre-Structured Sections Included</span>
                </div>
              </div>

              <div className="p-4 bg-muted/20 border-t flex justify-end">
                <Button
                  onClick={() => handleUseTemplate(tpl)}
                  size="sm"
                  className="w-full text-xs font-bold gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground group-hover:shadow-md transition"
                >
                  <span>Use This Blueprint</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
