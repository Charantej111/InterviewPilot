import { runComprehensive25ScenarioTests } from './aiPipeline.test';
import { runResumeIntelligenceTests } from './resumeIntelligence.test';
import { runInterviewIntegrityAndVoiceTests } from './interviewIntegrityAndVoice.test';
import { runInterviewBrainTests } from './interviewBrain.test';
import { runAnswerIntelligenceTests } from './answerIntelligence.test';
import { runStructuralParsingTests } from './resumeStructure.test';

console.log('====================================================');
console.log('  RUNNING INTERVIEWPILOT ENGINE REGRESSION TEST SUITE  ');
console.log('====================================================\n');

console.log('--- 1. Testing AI Pipeline & Evaluation Engine ---');
const aiPipelineResults = runComprehensive25ScenarioTests();

console.log('\n--- 2. Testing Resume Intelligence & Evidence Extraction Pipeline ---');
const resumeResults = runResumeIntelligenceTests();
if (resumeResults.results) {
  for (const r of resumeResults.results) {
    if (!r.success) console.error(`  ❌ ResumeIntel Fail: ${r.name} -> ${r.details}`);
  }
}

console.log('\n--- 3. Testing General Resume Structural Parsing & Grounding Engine ---');
const structuralResults = runStructuralParsingTests();

console.log('\n--- 4. Testing Zero-JD Match State & Conversational Voice Architecture ---');
const voiceIntegrityResults = runInterviewIntegrityAndVoiceTests();

console.log('\n--- 5. Testing Phase 3: Interview Brain, Contract & Competency Map Engine ---');
const brainResults = runInterviewBrainTests();

console.log('\n--- 6. Testing Phase 4: Answer Intelligence & Deterministic Scoring Engine ---');
const answerIntelligenceCount = runAnswerIntelligenceTests();

const totalPassed = aiPipelineResults.passed + resumeResults.passed + structuralResults.passed + voiceIntegrityResults.passed + brainResults.passed + answerIntelligenceCount;
const totalFailed = aiPipelineResults.failed + resumeResults.failed + structuralResults.failed + voiceIntegrityResults.failed + brainResults.failed;

console.log('\n====================================================');
console.log(`TOTAL PASSED: ${totalPassed} | TOTAL FAILED: ${totalFailed}`);
console.log('====================================================');

if (totalFailed > 0) {
  console.error(`💥 ${totalFailed} tests failed!`);
  process.exit(1);
} else {
  console.log(`🎉 ALL ${totalPassed} TESTS & REGRESSION SCENARIOS PASSED WITH 100% SUCCESS!`);
  process.exit(0);
}
