import { FinalReport } from '../types/interview';

export const sampleFinalReport: FinalReport = {
  id: 'rep_acme_pm_01',
  sessionId: 'sess_acme_pm_01',
  createdAt: 'Today, 2:45 PM',
  jobTitle: 'Product Manager Intern',
  company: 'Acme Corp',
  overallScore: 7.2,
  readinessPercentage: 74,
  summary: 'Strong structured thinking and product empathy. Your answers demonstrated good domain awareness and user discovery depth. The key improvement opportunity is sharper quantitative impact attribution and proactive risk framing.',
  dimensions: [
    {
      name: 'Communication',
      score: 8.1,
      maxScore: 10,
      description: 'Articulate delivery, concise transitions, and effective storytelling flow.'
    },
    {
      name: 'Product Thinking',
      score: 6.8,
      maxScore: 10,
      description: 'Solid persona segmentation, though MVP scope could be more aggressively prioritized.'
    },
    {
      name: 'Structure',
      score: 7.0,
      maxScore: 10,
      description: 'Used framework principles well; keep concluding takeaways crisp.'
    },
    {
      name: 'Evidence & Metrics',
      score: 5.9,
      maxScore: 10,
      description: 'Need more concrete baseline-to-target numbers and guardrail counter-metrics.'
    },
    {
      name: 'Role Alignment',
      score: 7.5,
      maxScore: 10,
      description: 'Directly tailored examples to Acme\'s collaborative, iterative product culture.'
    }
  ],
  topStrengths: [
    'User-centric intuition: consistently anchored decisions in real user pain points and driver feedback.',
    'Clear narrative pacing and composure when addressing complex trade-off scenarios.',
    'Effective cross-functional communication examples when aligning engineering and design priorities.'
  ],
  priorityImprovements: [
    'Include explicit numerical baselines (e.g. "reduced from 4.2 mins to 1.8 mins" vs "made it faster").',
    'Clarify your exact individual contribution versus the general squad output.',
    'Always address secondary/guardrail metrics (e.g., fraud rates, latency, operational support load).'
  ],
  recommendedPractice: [
    {
      title: 'Practice Structured Metric Derivation',
      description: 'Work on answering "How would you measure success for X?" with North Star, Primary, and Guardrail metrics.',
      actionableTask: 'Complete a 15-minute case drill focusing on enterprise collaboration KPIs.'
    },
    {
      title: 'STAR Story Hardening',
      description: 'Refine your Pulse Mobility onboarding story to lead with the business stakes before the technical solution.',
      actionableTask: 'Record a 2-minute timed response focusing strictly on your personal decision-making actions.'
    },
    {
      title: 'Prioritization Framework Drills',
      description: 'Practice RICE or Value vs Effort matrix trade-offs when facing tight quarterly engineering capacity.',
      actionableTask: 'Try an Advanced Product Case interview on Feature Scope Cuts.'
    }
  ],
  questionBreakdown: [
    {
      questionId: 'q_01',
      questionText: 'Your resume mentions that you improved onboarding at Pulse Mobility. How did you identify the biggest friction point?',
      category: 'Product Thinking',
      score: 7.4,
      userAnswer: 'I started by analyzing the drop-off analytics in our onboarding funnel. We found a 42% abandonment rate at the vehicle registration document step. I then ran 18 user interviews with drivers who dropped off to discover that poor camera lighting was causing blurry image rejections. We introduced automated edge detection and guided capture, reducing drop-offs significantly.',
      keyCritique: 'Strong qualitative discovery process. To reach 9+, quantify the baseline vs final retention metrics and cite team bandwidth.'
    },
    {
      questionId: 'q_02',
      questionText: 'What specific metrics did you track to ensure this change didn\'t increase fraud or bad actor acceptance?',
      category: 'Analytical Reasoning',
      score: 6.8,
      userAnswer: 'We tracked the manual review escalation queue and worked with our Trust & Safety team. We also looked at driver fraud flags over the subsequent 30 days.',
      keyCritique: 'Good instinct to consult Trust & Safety. State the exact rejection threshold tolerance and false positive rate.'
    },
    {
      questionId: 'q_03',
      questionText: 'Tell me about a time when you had a strong disagreement with an engineer regarding a timeline. How did you resolve it?',
      category: 'Behavioral',
      score: 7.6,
      userAnswer: 'During the document verification sprint, the tech lead was concerned that adding real-time client-side cropping would delay the sprint by 2 weeks. I proposed a phased rollout where we launched an unguided helper tooltip in v1 while building client-side cropping for v1.1. This unblocked engineering while capturing 60% of the friction reduction immediately.',
      keyCritique: 'Excellent compromise proposal demonstrating pragmatism and respect for engineering capacity.'
    }
  ]
};
