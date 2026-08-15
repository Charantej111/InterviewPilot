export interface ParsedJobDescription {
  title: string;
  company: string;
  level: string;
  keyResponsibilities: string[];
  requiredSkills: string[];
  interviewFocusAreas: string[];
}

export const jobDescriptionService = {
  async parseJobDescription(_text: string, title?: string, company?: string): Promise<ParsedJobDescription> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return {
      title: title || 'Product Manager Intern',
      company: company || 'Acme Corp',
      level: 'Entry / Intern',
      keyResponsibilities: [
        'Drive product discovery through qualitative interviews and quantitative funnel analysis',
        'Partner with engineering & design leads on weekly sprint priorities and PRD specifications',
        'Define experiment goals, hypothesis frameworks, and monitor key launch metrics'
      ],
      requiredSkills: [
        'Product Strategy & User Empathy',
        'Data Analysis & SQL',
        'A/B Experimentation Design',
        'Cross-functional Communication'
      ],
      interviewFocusAreas: [
        'Product Thinking & Problem Decomposition',
        'Analytical Reasoning & Guardrail Metrics',
        'Cross-Functional Conflict & Leadership',
        'Resume Deep Dive on Prior Deliverables'
      ]
    };
  }
};
