import type { Interview, InterviewPreferences } from '../types'
export interface ResumeService { upload(file: File): Promise<{ name: string; size: number; status: 'completed' }> }
export interface JobDescriptionService { analyse(text: string): Promise<{ title: string; company: string }> }
export interface InterviewService { build(input: InterviewPreferences): Promise<Interview>; get(id: string): Promise<Interview> }
export interface EvaluationService { evaluate(answer: string): Promise<{ score: number; feedback: string }> }
