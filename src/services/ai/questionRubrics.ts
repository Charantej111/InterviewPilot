import { QuestionType } from '../../types/interview';

export interface QuestionTypeRubricConfig {
  type: QuestionType;
  primaryEvaluationCriteria: string[];
  mandatoryStructure: string;
  expectedCharacteristicsGuidelines: string[];
  inapplicablePenalties: string[];
}

export const QUESTION_RUBRIC_REGISTRY: Record<QuestionType, QuestionTypeRubricConfig> = {
  behavioral: {
    type: 'behavioral',
    primaryEvaluationCriteria: [
      'Specific past context & business stakes',
      'Individual ownership vs team contribution',
      'Action taken and decision-making logic',
      'Measurable outcome & impact',
      'Reflection or learning',
    ],
    mandatoryStructure: 'STAR (Situation → Task → Action → Result) or CAR (Context → Action → Result)',
    expectedCharacteristicsGuidelines: [
      'Describes specific historical situation with stakes',
      'Clarifies candidate own personal decisions and actions',
      'States concrete numerical or business outcome',
      'Highlights lessons learned or team impact',
    ],
    inapplicablePenalties: [],
  },
  product_sense: {
    type: 'product_sense',
    primaryEvaluationCriteria: [
      'Problem definition & user empathy',
      'User segmentation & needs hierarchy',
      'Prioritization framework & criteria',
      'Solution alternatives & trade-off analysis',
      'Recommendation & success metric guardrails',
    ],
    mandatoryStructure: 'Problem Framing → User Needs → Solution Space → Trade-offs → Recommendation & Metrics',
    expectedCharacteristicsGuidelines: [
      'Identifies target user segment and acute pain point',
      'Articulates clear decision criteria (e.g. impact vs effort vs risk)',
      'Compares at least 2 distinct strategic alternatives',
      'Explicitly discusses trade-offs and mitigation',
      'Defines measurable North Star and guardrail metrics',
    ],
    inapplicablePenalties: ['Do NOT penalize for not using past personal STAR storytelling.'],
  },
  execution: {
    type: 'execution',
    primaryEvaluationCriteria: [
      'Goal clarity & alignment',
      'Sprint planning & milestone sequencing',
      'Cross-functional stakeholder management',
      'Risk identification & blocker mitigation',
      'Metric tracking & retrospective delivery',
    ],
    mandatoryStructure: 'Goal → Constraints → Milestone Plan → Stakeholder Alignment → Monitoring & Delivery',
    expectedCharacteristicsGuidelines: [
      'Establishes explicit delivery goal and timeline constraints',
      'Explains prioritization when engineering capacity or scope changes',
      'Demonstrates proactive alignment with engineering, design, and ops',
      'Identifies launch risks and rollback or contingency plans',
    ],
    inapplicablePenalties: ['Do NOT require historical retrospective narrative if formulated as a case.'],
  },
  analytical: {
    type: 'analytical',
    primaryEvaluationCriteria: [
      'Problem decomposition & scoping',
      'Explicit assumption stating',
      'Data interpretation & calculation logic',
      'Counter-metrics & guardrail derivation',
      'Actionable business conclusion',
    ],
    mandatoryStructure: 'Decomposition → Assumptions → Quantitative Framework → Trade-off Analysis → Decision',
    expectedCharacteristicsGuidelines: [
      'Decomposes high-level metric into input components (e.g. DAU * Retention * Funnel Conversion)',
      'States baseline assumptions before formulating hypothesis',
      'Identifies secondary guardrail counter-metrics',
      'Synthesizes calculations into actionable recommendation',
    ],
    inapplicablePenalties: ['Do NOT require STAR storytelling.'],
  },
  system_design: {
    type: 'system_design',
    primaryEvaluationCriteria: [
      'Functional & non-functional requirements (scale, latency, availability)',
      'High-level component architecture & APIs',
      'Data flow, storage schema & caching strategy',
      'Scalability bottlenecks & partition strategies',
      'Failure modes, resilience & monitoring',
    ],
    mandatoryStructure: 'Requirements → Architecture Diagram/Components → Data Flow → Scalability Bottlenecks → Failure Resiliency',
    expectedCharacteristicsGuidelines: [
      'Clarifies QPS, throughput, latency, and consistency requirements',
      'Defines clean component boundaries, queues, and database choices',
      'Explains data partitioning, replication, or caching tiers',
      'Addresses single points of failure and degraded mode behavior',
    ],
    inapplicablePenalties: ['Do NOT penalize for not using behavioral STAR storytelling.'],
  },
  resume_deep_dive: {
    type: 'resume_deep_dive',
    primaryEvaluationCriteria: [
      'Authenticity of candidate personal ownership',
      'Depth of technical/product decisions made',
      'Challenges overcome during implementation',
      'Quantitative baseline vs final outcome metrics',
    ],
    mandatoryStructure: 'Project Context → Personal Ownership → Hard Technical/Product Decision → Verified Outcome',
    expectedCharacteristicsGuidelines: [
      'References specific deliverable noted on resume',
      'Clarifies exact personal contribution vs squad contribution',
      'Explains the technical or strategic rationale behind key decisions',
      'Cites verified metric impact (e.g. latency, conversion, churn reduction)',
    ],
    inapplicablePenalties: [],
  },
  technical: {
    type: 'technical',
    primaryEvaluationCriteria: [
      'Conceptual correctness & domain precision',
      'Technical trade-offs & complexity awareness',
      'Implementation specifics & tooling familiarity',
      'Edge case handling & fault tolerance',
    ],
    mandatoryStructure: 'Technical Concept → Trade-off Rationale → Implementation Paradigm → Edge Cases',
    expectedCharacteristicsGuidelines: [
      'Demonstrates accurate domain terminology and mechanism understanding',
      'Compares performance or security trade-offs between approaches',
      'Identifies potential failure modes or resource limits',
    ],
    inapplicablePenalties: ['Do NOT require personal story format.'],
  },
  case: {
    type: 'case',
    primaryEvaluationCriteria: [
      'Structured scoping & clarifying questions',
      'Systematic problem exploration',
      'Hypothesis-driven solutions',
      'Pragmatic prioritization & rollout strategy',
    ],
    mandatoryStructure: 'Clarification → Structure → Solution Hypotheses → Evaluation → Execution Plan',
    expectedCharacteristicsGuidelines: [
      'Clarifies scope and constraints before jumping to solutions',
      'Applies a structured breakdown framework',
      'Evaluates alternatives systematically',
      'Provides concrete next steps or launch plan',
    ],
    inapplicablePenalties: [],
  },
  company_specific: {
    type: 'company_specific',
    primaryEvaluationCriteria: [
      'Company product & market context understanding',
      'Strategic challenge or business model awareness',
      'Tailoring solution to company specific constraints',
    ],
    mandatoryStructure: 'Company Context → Strategic Challenge → Tailored Proposal → Business Impact',
    expectedCharacteristicsGuidelines: [
      'References verified company products, users, or business constraints',
      'Aligns proposed initiatives with company strategy',
    ],
    inapplicablePenalties: [],
  },
  clarification: {
    type: 'clarification',
    primaryEvaluationCriteria: [
      'Clarity of clarification intent',
      'Constructive communication tone',
    ],
    mandatoryStructure: 'Clarification Request',
    expectedCharacteristicsGuidelines: [
      'Seeks constructive bounds or missing context',
    ],
    inapplicablePenalties: [],
  },
  closing: {
    type: 'closing',
    primaryEvaluationCriteria: [
      'Professional synthesis',
      'Gracious wrap-up',
    ],
    mandatoryStructure: 'Interview Closing and Synthesis',
    expectedCharacteristicsGuidelines: [
      'Interview closing acknowledgment',
    ],
    inapplicablePenalties: [],
  },
};
