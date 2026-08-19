import { runComprehensive25ScenarioTests } from './aiPipeline.test';

const results = runComprehensive25ScenarioTests();

if (results.failed > 0) {
  console.error(`💥 ${results.failed} scenarios failed verification!`);
  process.exit(1);
} else {
  console.log(`🎉 ALL ${results.passed} AI PIPELINE SCENARIOS PASSED WITH 100% SUCCESS!`);
  process.exit(0);
}
