import { ResumeData } from '../types/resume';

export const sampleResume: ResumeData = {
  fileName: 'Charan_Tej_PM_Resume_2026.pdf',
  fileSize: '428 KB',
  uploadDate: '2026-08-15',
  parsingStatus: 'completed',
  extractedInfo: {
    name: 'Charan Tej',
    summary: 'Associate Product Manager with track record across user onboarding optimization, quantitative A/B testing, and cross-functional sprint delivery.',
    education: [
      {
        degree: 'B.Tech in Computer Science & Engineering',
        institution: 'Top Technology University',
        year: '2026',
      },
    ],
    skills: [
      'Product Strategy',
      'User Research & Discovery',
      'Data Analytics (SQL, Amplitude)',
      'Agile / Scrum Sprint Management',
      'Wireframing (Figma)',
      'A/B Testing & Hypothesis Testing',
      'API Integration Basics',
    ],
    experience: [
      {
        role: 'Associate Product Manager Intern',
        company: 'Pulse Mobility',
        duration: 'Jun 2025 – Aug 2025',
        highlights: [
          'Redesigned driver onboarding funnel, identifying 3 friction points through 18 user interviews.',
          'Spearheaded A/B test on self-service document verification, reducing drop-off by 19%.',
          'Authored 4 PRDs and collaborated with 6 engineers and 2 UX designers.',
        ],
      },
      {
        role: 'Product Operations Intern',
        company: 'HyperScale Labs',
        duration: 'Jan 2025 – Apr 2025',
        highlights: [
          'Built automated reporting dashboard using SQL and Metabase, saving 8 hours weekly.',
          'Analyzed customer churn patterns across 1,200 active enterprise accounts.',
        ],
      },
    ],
    projects: [
      {
        name: 'UniRide — Campus Carpool Network',
        description: 'Conceived and launched peer-to-peer campus ride sharing web app reaching 2,400 active student users.',
        metrics: '62% monthly retention rate and 4.8/5 satisfaction rating',
      },
      {
        name: 'FeedbackPulse — AI Sentiment Aggregator',
        description: 'Built prototype that categorizes App Store feedback and maps recurring feature requests to Jira tickets.',
        metrics: 'Processed 5,000+ app store reviews with 91% topic classification accuracy',
      },
    ],
    strengths: [
      'Strong quantitative and analytical problem decomposition',
      'Direct hands-on experience running A/B tests and funnel analytics',
    ],
    potentialGaps: [
      'Enterprise sales compliance and complex stakeholder negotiation',
    ],
  },
};
