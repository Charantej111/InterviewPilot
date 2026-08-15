import { ResumeData } from '../types/resume';

export const sampleResume: ResumeData = {
  fileName: 'Charan_Tej_PM_Resume_2026.pdf',
  fileSize: '428 KB',
  uploadDate: '2026-08-15',
  parsingStatus: 'completed',
  extractedInfo: {
    name: 'Charan Tej',
    email: 'charan@example.com',
    education: [
      'B.Tech in Computer Science & Engineering, Expected 2026',
      'Relevant Coursework: Human-Computer Interaction, Data Structures, Software Engineering'
    ],
    skills: [
      'Product Strategy',
      'User Research & Discovery',
      'Data Analytics (SQL, Amplitude)',
      'Agile / Scrum Sprint Management',
      'Wireframing (Figma)',
      'A/B Testing & Hypothesis Testing',
      'API Integration Basics'
    ],
    experience: [
      {
        role: 'Associate Product Manager Intern',
        company: 'Pulse Mobility',
        duration: 'Jun 2025 – Aug 2025',
        highlights: [
          'Redesigned the driver onboarding funnel, identifying 3 key friction points through 18 user interviews and funnel drop-off analytics.',
          'Spearheaded A/B test on self-service document verification, reducing verification drop-off by 19% and increasing 7-day driver activation by 12%.',
          'Authored 4 comprehensive PRDs and collaborated with 6 engineers and 2 UX designers across bi-weekly sprints.'
        ]
      },
      {
        role: 'Product Operations Intern',
        company: 'HyperScale Labs',
        duration: 'Jan 2025 – Apr 2025',
        highlights: [
          'Built internal automated reporting dashboard using SQL and Metabase, saving 8 engineering hours per week.',
          'Analyzed customer churn patterns across 1,200 active enterprise accounts and created tiered retention recommendations.'
        ]
      }
    ],
    projects: [
      {
        name: 'UniRide — Campus Carpool Network',
        description: 'Conceived and launched peer-to-peer campus ride sharing web app reaching 2,400 active student users.',
        metrics: '62% monthly retention rate and 4.8/5 satisfaction rating'
      },
      {
        name: 'FeedbackPulse — AI Sentiment Aggregator',
        description: 'Built prototype that categorizes App Store feedback and maps recurring feature requests to Jira tickets.',
        metrics: 'Processed 5,000+ app store reviews with 91% topic classification accuracy'
      }
    ]
  }
};
