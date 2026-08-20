import { InterviewDifficulty, InterviewStyle, InterviewType } from '../types/interview';

export interface CompanyTrack {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  recommendedRole: string;
  interviewType: InterviewType;
  difficulty: InterviewDifficulty;
  style: InterviewStyle;
  focusAreas: string[];
  hiringBarBenchmark: number; // e.g. 8.2 / 10
  principles: string[];
  description: string;
}

export const COMPANY_TRACKS: CompanyTrack[] = [
  {
    id: 'google',
    name: 'Google',
    badge: 'G',
    tagline: 'First-principles decomposition, distributed scale & Googlyness',
    recommendedRole: 'Software Engineer (L5/L6) or Product Manager',
    interviewType: 'mixed',
    difficulty: 'advanced',
    style: 'interviewer_led',
    focusAreas: [
      'First-Principles Problem Decomposition',
      'System Architecture & Massive Scale Tradeoffs',
      'Analytical Rigor & Googlyness',
    ],
    hiringBarBenchmark: 8.2,
    principles: ['Focus on the user', '10x Thinking', 'Data-driven Decision Making', 'Intellectual Humility'],
    description:
      'Rigorous evaluation testing edge cases, algorithmic tradeoffs, large-scale systems reasoning, and open-ended technical leadership.',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    badge: 'A',
    tagline: '16 Leadership Principles & deep STAR dive',
    recommendedRole: 'Software Dev Engineer (SDE II/III) or Technical Program Manager',
    interviewType: 'behavioral',
    difficulty: 'intermediate',
    style: 'realistic',
    focusAreas: [
      'Customer Obsession & Ownership',
      'Dive Deep & Frugality',
      'Bias for Action & Delivering Quantified Results',
    ],
    hiringBarBenchmark: 7.8,
    principles: ['Customer Obsession', 'Ownership', 'Invent & Simplify', 'Are Right, A Lot', 'Deliver Results'],
    description:
      'Deep forensic probing into your past projects. Every response must demonstrate strict STAR format and quantifiable business impact.',
  },
  {
    id: 'meta',
    name: 'Meta',
    badge: 'M',
    tagline: 'Speed of execution, product sense & scalable impact',
    recommendedRole: 'Full Stack Engineer (E5) or Product Manager',
    interviewType: 'mixed',
    difficulty: 'advanced',
    style: 'rapid_fire',
    focusAreas: [
      'Product Intuition & Counter-Metrics',
      'Execution Speed & Pragmatic Tradeoffs',
      'Cross-functional Engineering Influence',
    ],
    hiringBarBenchmark: 8.0,
    principles: ['Move Fast', 'Focus on Long-Term Impact', 'Build Awesome Things', 'Live in the Future'],
    description:
      'Fast-paced simulation evaluating ability to build under ambiguity, define success metrics, and balance technical perfection vs. shipment speed.',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    badge: 'S',
    tagline: 'Obsessive technical craft, developer empathy & API rigor',
    recommendedRole: 'Backend Engineer (L3/L4) or Infrastructure Specialist',
    interviewType: 'technical',
    difficulty: 'expert',
    style: 'realistic',
    focusAreas: [
      'Extreme Communication Clarity & Written Rigor',
      'Clean API Contract & Failure Mode Design',
      'User Empathy & Debugging Under Pressure',
    ],
    hiringBarBenchmark: 8.5,
    principles: ['Users First', 'Move with Urgency', 'Obsessive Craftsmanship', 'Macro Optimism, Micro Skepticism'],
    description:
      'High hiring bar assessing clear mental models, clean system boundaries, fault tolerance, and clear articulate explanations.',
  },
  {
    id: 'apple',
    name: 'Apple',
    badge: '',
    tagline: 'Uncompromising craft, hardware-software integration & focus',
    recommendedRole: 'Systems Software Engineer or Core OS Specialist',
    interviewType: 'mixed',
    difficulty: 'advanced',
    style: 'interviewer_led',
    focusAreas: [
      'Attention to Detail & Deep Domain Mastery',
      'Cross-Functional Collaboration Under Secrecy',
      'Simplicity & Elegant User Experience',
    ],
    hiringBarBenchmark: 8.1,
    principles: ['Simplicity is the Ultimate Sophistication', 'Deep Collaboration', 'Zero Tolerance for Mediocrity'],
    description:
      'Evaluates obsessive attention to detail, end-to-end ownership, and deep technical mastery of foundational concepts.',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    badge: 'N',
    tagline: 'Culture of Freedom & Responsibility, high candor & context',
    recommendedRole: 'Senior Software Engineer (L5+)',
    interviewType: 'behavioral',
    difficulty: 'advanced',
    style: 'conversational',
    focusAreas: [
      'Context Over Control',
      'High Candor & Direct Disagreement',
      'Stunning Colleagues & High Performance Ownership',
    ],
    hiringBarBenchmark: 8.3,
    principles: ['Judgment Over Rules', 'High Performance Culture', 'Highly Aligned, Loosely Coupled'],
    description:
      'Deep assessment of decision-making judgment, emotional maturity, accountability, and the ability to thrive in autonomous environments.',
  },
];
