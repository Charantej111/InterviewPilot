import {
  detectSections,
  detectProjectBoundaries,
  detectExperienceBoundaries,
  detectEducationBoundaries,
  detectAchievementBoundaries,
  detectSemanticBlocks,
  extractHyperlink,
  normalizeText,
} from '../src/services/ai/documentExtractor';
import {
  validateEvidence,
  validateEntityStructure,
  isValidProjectTitle,
  isValidWorkExperience,
  isValidEducationRecord,
  validateCandidateEvidenceModel,
} from '../src/services/ai/evidenceValidator';
import {
  parseResumeTextDeterministically,
  parseResumeEvidenceDeterministically,
} from '../src/services/ai/resumeTextParser';
import {
  CURRENT_PM_RESUME_TEXT,
  NARENDRA_RESUME_TEXT,
  SINGLE_COLUMN_FRESHER_RESUME_TEXT,
  MULTI_PAGE_RESUME_WITH_ARTIFACTS_TEXT,
} from './fixtures/structuralResumes';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runStructuralParsingTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
    } catch (err: any) {
      failed++;
      console.error(`❌ Structural Test Failed: ${name} ->`, err.message);
    }
  }

  // ─── 1. Hyperlink & Text Normalization ─────────────────────────────────────
  test('Hyperlink extraction parses (Link) cleanTitle and link', () => {
    const res = extractHyperlink('PM Operating System (Link)');
    assert(res.cleanTitle === 'PM Operating System', `Expected clean title 'PM Operating System', got '${res.cleanTitle}'`);
    assert(res.link === 'Link', `Expected link 'Link', got '${res.link}'`);
  });

  test('Hyperlink extraction parses full URL from title line', () => {
    const res = extractHyperlink('Distributed Rate Limiter (https://github.com/narendra/rate-limiter)');
    assert(res.cleanTitle === 'Distributed Rate Limiter', `Expected clean title, got '${res.cleanTitle}'`);
    assert(res.link === 'https://github.com/narendra/rate-limiter', `Expected url, got '${res.link}'`);
  });

  test('Text normalizer removes [PAGE X] tokens and preserves lines', () => {
    const text = 'Line 1\n[PAGE 1]\nLine 2\n[PAGE 21]\nLine 3';
    const normalized = normalizeText(text);
    assert(!normalized.includes('[PAGE 1]'), 'Should not contain [PAGE 1]');
    assert(!normalized.includes('[PAGE 21]'), 'Should not contain [PAGE 21]');
    assert(normalized.includes('Line 1') && normalized.includes('Line 2') && normalized.includes('Line 3'), 'Preserves content lines');
  });

  // ─── 2. Structural Entity Validators ───────────────────────────────────────
  test('isValidProjectTitle rejects action verb sentences', () => {
    assert(!isValidProjectTitle('Developed payment orchestration engine').valid, 'Should reject "Developed..."');
    assert(!isValidProjectTitle('Built a full-stack e-commerce web application').valid, 'Should reject "Built..."');
    assert(!isValidProjectTitle('Designed responsive client showcase').valid, 'Should reject "Designed..."');
    assert(!isValidProjectTitle('Engineered automated submission scrapers').valid, 'Should reject "Engineered..."');
  });

  test('isValidProjectTitle rejects sentences ending with period or colon', () => {
    assert(!isValidProjectTitle('interface design.').valid, 'Should reject "interface design."');
    assert(!isValidProjectTitle('Coding analytics platform.').valid, 'Should reject "Coding analytics platform."');
  });

  test('isValidProjectTitle rejects continuation fragments and clause markers', () => {
    assert(!isValidProjectTitle('documentation, and Agile product workflows...').valid, 'Should reject documentation fragment');
    assert(!isValidProjectTitle('platforms').valid, 'Should reject single word "platforms"');
    assert(!isValidProjectTitle('sprint tracking').valid, 'Should reject "sprint tracking"');
    assert(!isValidProjectTitle('backlog prioritization').valid, 'Should reject "backlog prioritization"');
    assert(!isValidProjectTitle('using React, TypeScript, and Supabase').valid, 'Should reject "using React..."');
  });

  test('isValidProjectTitle rejects page markers', () => {
    assert(!isValidProjectTitle('[PAGE 21]').valid, 'Should reject [PAGE 21]');
    assert(!isValidProjectTitle('Page 1').valid, 'Should reject Page 1');
    assert(!isValidProjectTitle('21').valid, 'Should reject 21');
  });

  test('isValidProjectTitle rejects single generic technology names', () => {
    assert(!isValidProjectTitle('React').valid, 'Should reject React');
    assert(!isValidProjectTitle('Python').valid, 'Should reject Python');
    assert(!isValidProjectTitle('Node.js').valid, 'Should reject Node.js');
  });

  test('isValidProjectTitle accepts legitimate project names', () => {
    assert(isValidProjectTitle('PM Operating System').valid, 'Should accept PM Operating System');
    assert(isValidProjectTitle('Coding Platform Tracker').valid, 'Should accept Coding Platform Tracker');
    assert(isValidProjectTitle('ApplyQ').valid, 'Should accept ApplyQ');
    assert(isValidProjectTitle('Distributed Rate Limiter').valid, 'Should accept Distributed Rate Limiter');
    assert(isValidProjectTitle('AI Mock Interviewer Platform').valid, 'Should accept AI Mock Interviewer Platform');
  });

  test('isValidWorkExperience rejects synthetic placeholder companies', () => {
    assert(!isValidWorkExperience('Organization', 'Developer').valid, 'Should reject Organization');
    assert(!isValidWorkExperience('Previous Organization', 'Intern').valid, 'Should reject Previous Organization');
    assert(!isValidWorkExperience('Company', 'Engineer').valid, 'Should reject Company');
    assert(!isValidWorkExperience('Employer', 'Lead').valid, 'Should reject Employer');
    assert(!isValidWorkExperience('[PAGE 21]', 'Intern').valid, 'Should reject [PAGE 21]');
    assert(!isValidWorkExperience('interface design.', 'Designer').valid, 'Should reject interface design.');
  });

  test('isValidEducationRecord rejects isolated CGPA, percentage, or page numbers', () => {
    assert(!isValidEducationRecord('8.57', '').valid, 'Should reject 8.57');
    assert(!isValidEducationRecord('CGPA: 8.57', '').valid, 'Should reject CGPA: 8.57');
    assert(!isValidEducationRecord('Percentage: 88%', '').valid, 'Should reject Percentage: 88%');
    assert(!isValidEducationRecord('10.0', '10.0').valid, 'Should reject 10.0');
    assert(!isValidEducationRecord('[PAGE 21]', 'Aditya').valid, 'Should reject [PAGE 21]');
  });

  test('isValidEducationRecord accepts valid degree and institution records', () => {
    assert(isValidEducationRecord('Bachelor of Technology', 'Aditya University').valid, 'Should accept BTech');
    assert(isValidEducationRecord('Higher Secondary', 'Aditya Junior College').valid, 'Should accept Class XII');
    assert(isValidEducationRecord('Secondary School Certificate', 'Bhashyam Public School').valid, 'Should accept Class X');
  });

  // ─── 3. Evidence Grounding Validator (validateEvidence) ────────────────────
  test('validateEvidence validates exact and partial token coverage phrases', () => {
    const sourceText = 'Charan Tej built PM Operating System using React and TypeScript.';
    assert(validateEvidence('PM Operating System', sourceText), 'Exact phrase match should pass');
    assert(validateEvidence('React', sourceText), 'Single word match should pass');
    assert(validateEvidence('TypeScript', sourceText), 'Single word match should pass');
    assert(!validateEvidence('Kubernetes Cluster Orchestrator', sourceText), 'Unrelated phrase should fail');
  });

  // ─── 4. Current PM Resume Parsing & Anti-Fragmentation Tests ───────────────
  test('PM Resume extracts exactly 4 legitimate projects with zero fragments', () => {
    const profile = parseResumeTextDeterministically('charan_pm_resume.pdf', CURRENT_PM_RESUME_TEXT);
    assert(profile.projects.length === 4, `Expected exactly 4 projects, got ${profile.projects.length} (${profile.projects.map(p => p.name).join(', ')})`);

    const names = profile.projects.map(p => p.name);
    assert(names.includes('PM Operating System'), 'Missing PM Operating System');
    assert(names.includes('Coding Platform Tracker'), 'Missing Coding Platform Tracker');
    assert(names.includes('ApplyQ'), 'Missing ApplyQ');
    assert(names.includes('Ofzen'), 'Missing Ofzen');

    for (const p of profile.projects) {
      assert(!/documentation/i.test(p.name), `Project name contains documentation fragment: ${p.name}`);
      assert(!/platforms/i.test(p.name), `Project name contains platforms fragment: ${p.name}`);
      assert(!/interface design/i.test(p.name), `Project name contains interface design fragment: ${p.name}`);
      assert(!/sprint tracking/i.test(p.name), `Project name contains sprint tracking fragment: ${p.name}`);
      assert(!/backlog prioritization/i.test(p.name), `Project name contains backlog prioritization fragment: ${p.name}`);
      assert(!/\[PAGE/i.test(p.name), `Project name contains page artifact: ${p.name}`);
      assert(!/\.$/.test(p.name), `Project name ends in period: ${p.name}`);
    }
  });

  test('PM Resume unifies wrapped multi-line descriptions into single description', () => {
    const profile = parseResumeTextDeterministically('charan_pm_resume.pdf', CURRENT_PM_RESUME_TEXT);
    const pmOS = profile.projects.find((p) => p.name === 'PM Operating System');
    assert(!!pmOS, 'PM Operating System project must exist');
    assert(pmOS!.description.includes('roadmap planning'), 'Description should contain roadmap planning');
    assert(pmOS!.description.includes('sprint tracking'), 'Description should contain sprint tracking');
    assert(pmOS!.description.includes('backlog prioritization'), 'Description should contain backlog prioritization');
    assert(pmOS!.description.includes('documentation'), 'Description should contain documentation');
  });

  test('PM Resume extracts exactly 3 experience entities with verified employers', () => {
    const profile = parseResumeTextDeterministically('charan_pm_resume.pdf', CURRENT_PM_RESUME_TEXT);
    assert(profile.experience.length === 3, `Expected exactly 3 experiences, got ${profile.experience.length} (${profile.experience.map(e => e.company).join(', ')})`);

    const companies = profile.experience.map(e => e.company.toLowerCase());
    assert(companies.includes('ofzen'), 'Missing Ofzen experience');
    assert(companies.includes('labmentix'), 'Missing LabMentix experience');
    assert(companies.includes('aditya university'), 'Missing Aditya University experience');

    for (const exp of profile.experience) {
      assert(!/^(organization|previous organization|company|employer|\[page)/i.test(exp.company), `Invalid company name: ${exp.company}`);
    }
  });

  test('PM Resume attaches separate-line dates and locations to nearest experience block', () => {
    const sections = detectSections(CURRENT_PM_RESUME_TEXT);
    const expSection = sections.find((s) => s.normalizedName === 'experience');
    assert(!!expSection, 'Experience section must exist');

    const expBlocks = detectExperienceBoundaries(expSection!.text);
    assert(expBlocks.length === 3, `Expected 3 experience blocks, got ${expBlocks.length}`);

    const ofzen = expBlocks.find((e) => e.company?.toLowerCase() === 'ofzen');
    assert(ofzen?.startDate === 'Mar 2025' && ofzen?.endDate === 'Present', `Ofzen dates incorrect: ${ofzen?.startDate} - ${ofzen?.endDate}`);
    assert(ofzen?.location === 'Remote', `Ofzen location incorrect: ${ofzen?.location}`);

    const labmentix = expBlocks.find((e) => e.company?.toLowerCase() === 'labmentix');
    assert(labmentix?.startDate === 'May 2025' && labmentix?.endDate === 'Jun 2025', `LabMentix dates incorrect: ${labmentix?.startDate} - ${labmentix?.endDate}`);
  });

  test('PM Resume groups degree, institution, and percentage into exactly 3 education entities', () => {
    const profile = parseResumeTextDeterministically('charan_pm_resume.pdf', CURRENT_PM_RESUME_TEXT);
    assert(profile.education.length === 3, `Expected exactly 3 education entities, got ${profile.education.length}`);

    const btech = profile.education.find((e) => e.degree.toLowerCase().includes('bachelor'));
    assert(!!btech && btech.institution.includes('Aditya University'), 'BTech institution incorrect');

    const class12 = profile.education.find((e) => e.degree.toLowerCase().includes('higher secondary') || e.degree.toLowerCase().includes('class xii'));
    assert(!!class12 && class12.institution.includes('Aditya Junior College'), 'Class XII institution incorrect');

    const class10 = profile.education.find((e) => /\bclass\s*x\b/i.test(e.degree) || e.degree.toLowerCase().includes('certificate') || e.degree.toLowerCase().includes('10th'));
    assert(!!class10 && class10.institution.includes('Bhashyam Public School'), `Class X institution incorrect, got '${class10?.institution}' for degree '${class10?.degree}'`);
  });

  test('PM Resume extracts exactly 4 achievements', () => {
    const profile = parseResumeTextDeterministically('charan_pm_resume.pdf', CURRENT_PM_RESUME_TEXT);
    assert(profile.achievements.length === 4, `Expected 4 achievements, got ${profile.achievements.length}`);
    assert(profile.achievements[0].includes('National Product Incubator 2025'), 'First achievement text incorrect');
  });

  // ─── 5. Narendra SWE Resume Tests ──────────────────────────────────────────
  test('Narendra SWE Resume extracts 2 experiences, 2 projects, 1 education', () => {
    const profile = parseResumeTextDeterministically('narendra_swe.pdf', NARENDRA_RESUME_TEXT);
    assert(profile.experience.length === 2, `Expected 2 experiences, got ${profile.experience.length}`);
    assert(profile.experience.map(e => e.company).includes('Razorpay'), 'Missing Razorpay');
    assert(profile.experience.map(e => e.company).includes('Swiggy'), 'Missing Swiggy');

    assert(profile.projects.length === 2, `Expected 2 projects, got ${profile.projects.length}`);
    assert(profile.projects.map(p => p.name).includes('Distributed Rate Limiter'), 'Missing Distributed Rate Limiter');
    assert(profile.projects.map(p => p.name).includes('Kafka Stream Processor'), 'Missing Kafka Stream Processor');

    assert(profile.education.length === 1, `Expected 1 education, got ${profile.education.length}`);
    assert(profile.education[0].institution.includes('NIT'), 'Expected NIT Warangal');
  });

  // ─── 6. Fresher Resume Tests (Zero Work Experience) ────────────────────────
  test('Fresher Resume extracts 0 work experiences and does not fabricate placeholder organizations', () => {
    const profile = parseResumeTextDeterministically('ananya_fresher.pdf', SINGLE_COLUMN_FRESHER_RESUME_TEXT);
    assert(profile.experience.length === 0, `Expected 0 experiences for fresher, got ${profile.experience.length}`);
    assert(profile.projects.length === 3, `Expected 3 academic projects, got ${profile.projects.length}`);
    assert(profile.education.length === 2, `Expected 2 education records, got ${profile.education.length}`);
  });

  // ─── 7. Multi-Page Artifacts & Page Markers Stripping Tests ────────────────
  test('Multi-Page Resume strips and rejects [PAGE 1], [PAGE 2], Page 2 of 2, 21, 22', () => {
    const profile = parseResumeTextDeterministically('vikram_multipage.pdf', MULTI_PAGE_RESUME_WITH_ARTIFACTS_TEXT);
    assert(profile.experience.length === 2, `Expected 2 experiences, got ${profile.experience.length}`);
    assert(profile.projects.length === 2, `Expected 2 projects, got ${profile.projects.length}`);
    assert(profile.education.length === 2, `Expected 2 educations, got ${profile.education.length}`);

    for (const p of profile.projects) {
      assert(!/^(\[PAGE|\d+|Page \d+)/i.test(p.name), `Project name matches page marker: ${p.name}`);
    }
    for (const e of profile.experience) {
      assert(!/^(\[PAGE|\d+|Page \d+)/i.test(e.company), `Company matches page marker: ${e.company}`);
      assert(!/^(\[PAGE|\d+|Page \d+)/i.test(e.role), `Role matches page marker: ${e.role}`);
    }
  });

  // ─── 8. Semantic Block Detector (1:1 Invariant) ────────────────────────────
  test('detectSemanticBlocks maps sections to structured ResumeSemanticBlock entities', () => {
    const sections = detectSections(CURRENT_PM_RESUME_TEXT);
    const blocks = detectSemanticBlocks(sections);
    assert(blocks.length >= 10, `Expected at least 10 semantic blocks, got ${blocks.length}`);

    const projBlocks = blocks.filter((b) => b.section === 'projects');
    assert(projBlocks.length === 4, `Expected 4 project blocks, got ${projBlocks.length}`);

    const expBlocks = blocks.filter((b) => b.section === 'experience');
    assert(expBlocks.length === 3, `Expected 3 experience blocks, got ${expBlocks.length}`);

    const eduBlocks = blocks.filter((b) => b.section === 'education');
    assert(eduBlocks.length === 3, `Expected 3 education blocks, got ${eduBlocks.length}`);

    for (const b of blocks) {
      assert(!!b.id, 'Block must have an ID');
      assert(b.structuralConfidence >= 0.8, `Confidence too low: ${b.structuralConfidence}`);
      assert(b.startLine >= 1, `Start line invalid: ${b.startLine}`);
      assert(b.endLine >= b.startLine, `End line invalid: ${b.endLine}`);
      assert(b.blockText.length > 0, 'Block text empty');
    }
  });

  // ─── 9. Full Candidate Evidence Model Grounding & Validation Pipeline ──────
  test('Candidate Evidence Model passes dual validator with zero critical errors', () => {
    const evidenceModel = parseResumeEvidenceDeterministically('charan_pm.pdf', CURRENT_PM_RESUME_TEXT);
    const validation = validateCandidateEvidenceModel(evidenceModel, CURRENT_PM_RESUME_TEXT);

    assert(validation.isValid === true, 'Validation result should be valid');
    assert(validation.rejectedItems.length === 0, `Expected 0 rejected items, got ${validation.rejectedItems.length} (${validation.rejectedItems.map(r => r.value).join(', ')})`);
    assert(evidenceModel.projects.length === 4, `Expected 4 projects in evidence model, got ${evidenceModel.projects.length}`);
    assert(evidenceModel.workExperience.length === 3, `Expected 3 experiences in evidence model, got ${evidenceModel.workExperience.length}`);
    assert(evidenceModel.education.length === 3, `Expected 3 educations in evidence model, got ${evidenceModel.education.length}`);
  });

  return { passed, failed };
}
