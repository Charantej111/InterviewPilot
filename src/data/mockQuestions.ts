import { Question, QuestionFeedback } from '../types/interview';

export const mockQuestions: Question[] = [
  {
    id: 'q_01',
    order: 1,
    type: 'initial',
    category: 'Product Thinking',
    text: 'Your resume mentions that you improved onboarding at Pulse Mobility and reduced drop-off by 19%. How did you identify the biggest friction point in that funnel?',
    contextExplanation: 'Evaluates your discovery methodology, qualitative vs quantitative synthesis, and practical analytical approach.',
    recommendedDurationSeconds: 180,
    expectedKeyPoints: [
      'Funnel drop-off step identification via analytics',
      'Qualitative user interviews to uncover the root cause',
      'Prioritization framework used to choose which friction point to solve first',
      'Collaboration with design & engineering teams'
    ]
  },
  {
    id: 'q_02',
    order: 2,
    type: 'follow_up',
    parentQuestionId: 'q_01',
    category: 'Analytical Reasoning',
    text: 'You mentioned that driver activation increased after the document verification redesign. What specific metrics did you track to ensure this change didn\'t increase fraud or bad actor acceptance?',
    contextExplanation: 'Tests counter-metrics, risk management, and systems thinking.',
    recommendedDurationSeconds: 120,
    expectedKeyPoints: [
      'Primary vs Secondary guardrail metrics',
      'Fraud rate / false positive rate tracking',
      'Support ticket escalation volume',
      'Review cycle duration'
    ]
  },
  {
    id: 'q_03',
    order: 3,
    type: 'initial',
    category: 'Behavioral',
    text: 'Tell me about a time when you had a strong disagreement with an engineer or designer regarding a product feature timeline. How did you resolve it?',
    contextExplanation: 'Evaluates conflict resolution, empathy, data-driven negotiation, and cross-functional leadership without authority.',
    recommendedDurationSeconds: 180,
    expectedKeyPoints: [
      'Clear context on the trade-off (scope vs quality vs timeline)',
      'Listening to technical or design constraints',
      'Data or user-first decision framework',
      'Outcome and relationship preservation'
    ]
  },
  {
    id: 'q_04',
    order: 4,
    type: 'initial',
    category: 'Product Thinking',
    text: 'Imagine Acme is launching an AI-powered automated scheduling feature for enterprise clients. How would you determine what MVP features to include and how would you measure success?',
    contextExplanation: 'Case study measuring structured thinking, customer segmentation, scope scoping, and North Star metric definition.',
    recommendedDurationSeconds: 240,
    expectedKeyPoints: [
      'Target user persona & problem statement',
      'Core user journey / minimal lovable product scope',
      'Primary North Star metric & adoption rate',
      'Potential failure modes and mitigation'
    ]
  },
  {
    id: 'q_05',
    order: 5,
    type: 'follow_up',
    parentQuestionId: 'q_04',
    category: 'Resume Deep Dive',
    text: 'Building on your FeedbackPulse project: how would you handle noisy or conflicting user feedback when determining the product roadmap?',
    contextExplanation: 'Assesses product judgment, synthesis capability, and qualitative prioritization.',
    recommendedDurationSeconds: 150,
    expectedKeyPoints: [
      'Volume vs Impact weighting',
      'User tier segmentation (ICP vs non-ICP)',
      'Validating feedback against behavioral logs',
      'Strategic roadmap alignment'
    ]
  }
];

export const mockSampleFeedback: QuestionFeedback = {
  questionId: 'q_01',
  overallScore: 7.4,
  breakdown: {
    relevance: 8.0,
    structure: 6.5,
    clarity: 8.0,
    depth: 6.0,
    evidence: 5.5,
    roleAlignment: 7.5,
  },
  whatWorked: [
    'Clearly articulated the quantitative drop-off data in the document upload step.',
    'Effectively connected the problem back to the candidate experience at Pulse Mobility.',
    'Demonstrated strong empathy for both driver personas and operations reviewers.'
  ],
  whatHeldYouBack: [
    'The individual contribution was slightly blurred with the wider 6-person engineering squad.',
    'Lacked explicit mention of counter-metrics or how edge cases (e.g. blurry photos) were handled during the initial rollout.'
  ],
  tryThisNextTime: {
    framework: 'STAR (Situation → Task → Action → Result) with Metric Guardrails',
    suggestion: 'Explicitly state your personal hypothesis before the experiment and state the baseline metric alongside the final result.',
    examplePhrasing: '"My hypothesis was that OCR auto-cropping would remove 70% of manual retries. I owned the PRD and partner selection, which moved our 7-day activation from 52% to 64% while maintaining our 99.4% fraud filter threshold."'
  }
};
