import { runComprehensive25ScenarioTests } from './aiPipeline.test';
import { runResumeIntelligenceTests } from './resumeIntelligence.test';
import { runInterviewIntegrityAndVoiceTests } from './interviewIntegrityAndVoice.test';

console.log('====================================================');
console.log('  RUNNING INTERVIEWPILOT ENGINE REGRESSION TEST SUITE  ');
console.log('====================================================\n');

console.log('--- 1. Testing AI Pipeline & Evaluation Engine ---');
const aiPipelineResults = runComprehensive25ScenarioTests();

console.log('\n--- 2. Testing Resume Intelligence & Evidence Extraction Pipeline ---');
const resumeResults = runResumeIntelligenceTests();

console.log('\n--- 3. Testing Zero-JD Match State & Conversational Voice Architecture ---');
const voiceIntegrityResults = runInterviewIntegrityAndVoiceTests();

const totalPassed = aiPipelineResults.passed + resumeResults.passed + voiceIntegrityResults.passed;
const totalFailed = aiPipelineResults.failed + resumeResults.failed + voiceIntegrityResults.failed;

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
