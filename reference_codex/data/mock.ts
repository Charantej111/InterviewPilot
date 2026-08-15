import type { Interview } from '../types'
export const interviews: Interview[] = [
  { id: 'pm-acme', role: 'Product Manager Intern', company: 'Acme', score: 7.4, date: 'Today', status: 'Completed' },
  { id: 'ba-xyz', role: 'Business Analyst', company: 'Nova', score: 6.8, date: 'Yesterday', status: 'Completed' },
  { id: 'product-techcorp', role: 'Associate Product Manager', company: 'TechCorp', score: 7.1, date: 'Aug 10', status: 'Completed' },
]
export const metrics = [{ label: 'Relevance', score: 8 }, { label: 'Structure', score: 6.5 }, { label: 'Clarity', score: 8 }, { label: 'Depth', score: 6 }, { label: 'Evidence', score: 5.5 }, { label: 'Role alignment', score: 7.5 }]
