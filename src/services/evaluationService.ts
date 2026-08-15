import { QuestionFeedback, FinalReport } from '../types/interview';
import { mockSampleFeedback } from '../data/mockQuestions';
import { sampleFinalReport } from '../data/mockReports';

export const evaluationService = {
  async evaluateAnswer(questionId: string, _answerText: string): Promise<QuestionFeedback> {
    // Simulated realistic AI evaluation time
    await new Promise((resolve) => setTimeout(resolve, 1400));
    
    return {
      ...mockSampleFeedback,
      questionId,
    };
  },

  async generateFinalReport(_sessionId: string): Promise<FinalReport> {
    // Simulated comprehensive report generation
    await new Promise((resolve) => setTimeout(resolve, 1800));
    return sampleFinalReport;
  }
};
