import {
  normalizeText,
  detectSections,
  classifyDocument,
  detectProjectBoundaries,
  detectEducationBoundaries,
  reconstructLinesFromItems,
  shouldInsertWordSpace,
  PDFTextItem,
} from '../src/services/ai/documentExtractor';
import {
  parseResumeTextDeterministically,
  parseResumeEvidenceDeterministically,
} from '../src/services/ai/resumeTextParser';
import { validateCandidateEvidenceModel } from '../src/services/ai/evidenceValidator';
import { resumeService } from '../src/services/supabase/resumeService';
import type { CandidateEvidenceModel, EvidenceItem } from '../src/types/resume';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runResumeIntelligenceTests(): { passed: number; failed: number; results: { name: string; success: boolean; details?: string }[] } {
  const results: { name: string; success: boolean; details?: string }[] = [];
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      results.push({ name, success: true });
    } catch (err: any) {
      failed++;
      results.push({ name, success: false, details: err.message });
      console.error(`❌ Test Failed: ${name} ->`, err.message);
    }
  }

  // ─── 1. REAL NARENDRA RESUME GOLDEN TEST ──────────────────────────────────
  const NARENDRA_RESUME_TEXT = `
NARENDRA REDDY
narendra.reddy@example.com | +91 9876543210
linkedin.com/in/narendra-reddy | github.com/narendra-reddy

EDUCATION
• B.Tech (Artificial Intelligence and Machine Learning) | Aditya Engineering College | CGPA: 8.57 | 2020 - 2024
• Intermediate (MPC) | A.P. Model School & Junior College | CGPA: 7.84 | 2018 - 2020
• SSC (10th) | A.P. Model School | CGPA: 9.83 | 2018

SKILLS
• Languages: Python, SQL, C++, HTML, CSS
• Libraries & Frameworks: Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn
• Developer Tools: Git, GitHub, VS Code, Jupyter Notebook

PROJECTS
Credit Card Fraud Transactions Detection System (CFTDS)
• Developed a machine learning model to classify fraudulent and legitimate credit card transactions using Random Forest and Logistic Regression.
• Handled severe class imbalance using SMOTE and achieved 94.2% precision on test data.
• Implemented data preprocessing, feature engineering, and exploratory data analysis using Pandas, NumPy, and Matplotlib.

Bike Sharing Demand Prediction
• Engineered an end-to-end regression pipeline to forecast hourly bike rental demand using XGBoost and Random Forest algorithms.
• Evaluated model performance using Root Mean Squared Error (RMSE) and R-squared metrics.
• Analyzed seasonal trends, weather factors, and hourly patterns using Pandas and Seaborn.

ACHIEVEMENTS
• Solved 60+ problems on LeetCode, showcasing strong coding skills and problem-solving expertise.
• Global rank top 5% in HackerRank Python programming assessment.
• Finalist in National Level College ML Hackathon 2023.
`;

  test('Narendra Resume: Work Experience is exactly 0 (No synthetic roles)', () => {
    const rawModel = parseResumeEvidenceDeterministically('Narendra_Resume.pdf', NARENDRA_RESUME_TEXT);
    const validated = validateCandidateEvidenceModel(rawModel, NARENDRA_RESUME_TEXT);
    assert(validated.model.workExperience.length === 0, `Expected 0 work experience roles, got ${validated.model.workExperience.length}`);
  });

  test('Narendra Resume: Projects is exactly 2 distinct projects (No fragmentation)', () => {
    const rawModel = parseResumeEvidenceDeterministically('Narendra_Resume.pdf', NARENDRA_RESUME_TEXT);
    const validated = validateCandidateEvidenceModel(rawModel, NARENDRA_RESUME_TEXT);
    assert(validated.model.projects.length === 2, `Expected exactly 2 projects, got ${validated.model.projects.length}`);

    const p1 = validated.model.projects[0].name.value;
    const p2 = validated.model.projects[1].name.value;

    assert(p1.includes('Credit Card Fraud') || p1.includes('CFTDS'), `Project 1 title mismatch: ${p1}`);
    assert(p2.includes('Bike Sharing'), `Project 2 title mismatch: ${p2}`);
    assert(p1 !== p2, 'Projects must not be identical');
  });

  test('Narendra Resume: Education is exactly 3 unified records (No CGPA fragmentation)', () => {
    const rawModel = parseResumeEvidenceDeterministically('Narendra_Resume.pdf', NARENDRA_RESUME_TEXT);
    const validated = validateCandidateEvidenceModel(rawModel, NARENDRA_RESUME_TEXT);
    assert(validated.model.education.length === 3, `Expected exactly 3 education records, got ${validated.model.education.length}`);

    const edu1 = validated.model.education[0];
    assert(edu1.degree?.value.includes('B.Tech') || edu1.degree?.value.includes('Artificial Intelligence'), `Degree mismatch: ${edu1.degree?.value}`);
    assert(edu1.institution?.value.includes('Aditya Engineering College'), `Institution mismatch: ${edu1.institution?.value}`);
  });

  test('Narendra Resume: Zero Fabricated Entities in derived profile', () => {
    const rawModel = parseResumeEvidenceDeterministically('Narendra_Resume.pdf', NARENDRA_RESUME_TEXT);
    const validated = validateCandidateEvidenceModel(rawModel, NARENDRA_RESUME_TEXT);
    const derived = resumeService.deriveProfileFromEvidence(validated.model);

    const jsonStr = JSON.stringify(derived).toLowerCase();
    assert(!jsonStr.includes('technical professional'), 'Contained fabricated Technical Professional');
    assert(!jsonStr.includes('previous organization'), 'Contained fabricated Previous Organization');
    assert(!jsonStr.includes('fastapi'), 'Contained unsupported FastAPI');
    assert(!jsonStr.includes('faiss'), 'Contained unsupported FAISS');
    assert(!jsonStr.includes('agentic ai'), 'Contained unsupported Agentic AI');
  });

  // ─── 2. EXPERIENCED STAFF SOFTWARE ENGINEER RESUME ─────────────────────────
  const EXPERIENCED_SE_RESUME = `
SARAH CHEN
sarah.chen@example.com | San Francisco, CA | github.com/sarahchen

SUMMARY
Staff Backend Systems Engineer with 8+ years experience designing high-throughput distributed payment pipelines.

EXPERIENCE
Stripe | Staff Software Engineer | 2021 - Present
• Architected multi-region ledger replication processing $4B daily volume with 99.999% uptime.
• Reduced p99 payment processing latency from 320ms to 45ms using Go and Redis clustering.
• Mentored 12 senior and mid-level engineers across payments infrastructure teams.

Google | Senior Software Engineer | 2017 - 2021
• Built Spanner transaction logging framework supporting 50k QPS.
• Designed automated failure detection and mitigation system in C++ and Python.

PROJECTS
Distributed Raft Consensus Engine
• Implemented complete Raft consensus protocol in Go with leader election, log replication, and dynamic cluster membership changes.
• Verified linearizability and partition fault tolerance using Jepsen testing framework.

Real-Time CDC Event Bus
• Built distributed Change Data Capture engine using Kafka, Debezium, and PostgreSQL.

SKILLS
• Languages: Go, C++, Python, Java, SQL
• Infrastructure: Kubernetes, Docker, Kafka, Redis, PostgreSQL, AWS, GCP
• Systems: Distributed Systems, Concurrency, High Availability, System Design

EDUCATION
• Bachelor of Science in Computer Science | Stanford University | 2013 - 2017
`;

  test('Experienced SE Resume: Preserves 2 Experience Roles & 2 Projects', () => {
    const rawModel = parseResumeEvidenceDeterministically('Sarah_Chen_Resume.pdf', EXPERIENCED_SE_RESUME);
    const validated = validateCandidateEvidenceModel(rawModel, EXPERIENCED_SE_RESUME);

    assert(validated.model.workExperience.length === 2, `Expected 2 work experience roles, got ${validated.model.workExperience.length}`);
    assert(validated.model.projects.length === 2, `Expected 2 projects, got ${validated.model.projects.length}`);
    assert(validated.model.education.length === 1, `Expected 1 education entry, got ${validated.model.education.length}`);
    assert(validated.model.skills.technical.length >= 5, 'Expected at least 5 verified technical skills');
  });

  // ─── 3. PRODUCT MANAGER RESUME (NO PROJECTS SECTION) ───────────────────────
  const PM_RESUME_NO_PROJECTS = `
ALEX RIVERA
alex.rivera@example.com | New York, NY

SUMMARY
Lead Product Manager with 7 years driving consumer growth and mobile monetization strategies.

WORK EXPERIENCE
Uber | Group Product Manager | 2022 - Present
• Led Rider Engagement team of 24 engineers, designers, and data scientists.
• Launched dynamic surge-pricing transparency feature, boosting rider retention by 8.4%.

Airbnb | Senior Product Manager | 2018 - 2022
• Owned host onboarding conversion funnel, driving $65M incremental booking revenue.
• Spearheaded 40+ A/B experiments optimizing localized checkout experiences across 18 countries.

EDUCATION
• Master of Business Administration (MBA) | Harvard Business School | 2016 - 2018
• Bachelor of Arts in Economics | UC Berkeley | 2012 - 2016

SKILLS
• Product Strategy, Growth Hacking, A/B Testing, User Research, SQL, Agile, Scrum
`;

  test('PM Resume: Missing Projects section remains cleanly empty ([])', () => {
    const rawModel = parseResumeEvidenceDeterministically('Alex_Rivera_PM.pdf', PM_RESUME_NO_PROJECTS);
    const validated = validateCandidateEvidenceModel(rawModel, PM_RESUME_NO_PROJECTS);

    assert(validated.model.workExperience.length === 2, `Expected 2 work experience roles, got ${validated.model.workExperience.length}`);
    assert(validated.model.projects.length === 0, `Expected 0 projects for PM resume without projects section, got ${validated.model.projects.length}`);
    assert(validated.model.education.length === 2, `Expected 2 education entries (MBA + BA), got ${validated.model.education.length}`);
  });

  // ─── 4. UI/UX DESIGNER RESUME (NO WORK EXPERIENCE) ─────────────────────────
  const DESIGNER_RESUME_NO_EXPERIENCE = `
MAYA PATEL
maya.patel@design.io | Portfolio: mayapatel.design

EDUCATION
• Bachelor of Design (B.Des) in Interaction Design | National Institute of Design | 2019 - 2023 | 8.8 CGPA

PROJECTS
Fintech Micro-Investing Mobile App
• Conducted 25 generative user interviews to map mental models of first-time Gen-Z investors.
• Designed complete high-fidelity Figma prototype and interactive micro-animations.
• Achieved 92% usability task completion score across 4 rounds of usability testing.

Telehealth Doctor-Patient Portal
• Designed accessible WCAG AAA compliant web platform connecting rural patients with specialists.
• Built comprehensive scalable design system with 60+ responsive components.

SKILLS
• Figma, Design Systems, Wireframing, User Research, Usability Testing, Prototyping, HTML, CSS
`;

  test('Designer Resume: Missing Work Experience remains cleanly empty ([])', () => {
    const rawModel = parseResumeEvidenceDeterministically('Maya_Patel_Design.pdf', DESIGNER_RESUME_NO_EXPERIENCE);
    const validated = validateCandidateEvidenceModel(rawModel, DESIGNER_RESUME_NO_EXPERIENCE);

    assert(validated.model.workExperience.length === 0, `Expected 0 work experience, got ${validated.model.workExperience.length}`);
    assert(validated.model.projects.length === 2, `Expected 2 design projects, got ${validated.model.projects.length}`);
    assert(validated.model.education.length === 1, `Expected 1 education entry, got ${validated.model.education.length}`);
  });

  // ─── 5. DATA SCIENTIST RESUME (3 PROJECTS WITH METRICS) ───────────────────
  const DATA_SCIENTIST_RESUME = `
PRIYA SHARMA
priya.sharma@example.com | linkedin.com/in/priyasharma

WORK EXPERIENCE
Microsoft | Data Scientist | 2021 - Present
• Built churn prediction pipeline with LightGBM reducing customer churn by 4.2%.

PROJECTS
Autonomous Driving Object Detection System
• Fine-tuned YOLOv8 model on custom edge dataset achieving 88.4% mAP score.
• Optimized inference pipeline with ONNX Runtime to achieve 45 FPS on edge devices.

Customer Churn Forecasting Engine
• Engineered end-to-end feature store and gradient boosting model for 2M subscribers.

LLM Knowledge Retrieval Agent
• Implemented dense vector retrieval using FAISS and LangChain for automated support ticket answering.

SKILLS
• Python, PyTorch, Scikit-learn, Pandas, NumPy, SQL, Docker, Git

EDUCATION
• Master of Science in Data Science | Columbia University | 2019 - 2021
• Bachelor of Technology in CS | IIT Delhi | 2015 - 2019
`;

  test('Data Scientist Resume: Preserves 3 Projects, 1 Experience, 2 Education', () => {
    const rawModel = parseResumeEvidenceDeterministically('Priya_Sharma_DS.pdf', DATA_SCIENTIST_RESUME);
    const validated = validateCandidateEvidenceModel(rawModel, DATA_SCIENTIST_RESUME);

    assert(validated.model.workExperience.length === 1, `Expected 1 experience role, got ${validated.model.workExperience.length}`);
    assert(validated.model.projects.length === 3, `Expected 3 projects, got ${validated.model.projects.length}`);
    assert(validated.model.education.length === 2, `Expected 2 education records, got ${validated.model.education.length}`);
  });

  // ─── 6. CONTEXTUAL WORD BOUNDARY SPACING TESTS ─────────────────────────────
  test('PDF Reconstruction: Natural word boundaries preserved across tokens', () => {
    const t1: PDFTextItem = { str: 'Developed', x: 50, y: 700, width: 55, height: 12, hasEOL: false };
    const t2: PDFTextItem = { str: 'a', x: 108, y: 700, width: 8, height: 12, hasEOL: false };
    const t3: PDFTextItem = { str: 'machine', x: 119, y: 700, width: 45, height: 12, hasEOL: false };
    const t4: PDFTextItem = { str: 'learning', x: 167, y: 700, width: 48, height: 12, hasEOL: false };
    const t5: PDFTextItem = { str: 'model.', x: 218, y: 700, width: 38, height: 12, hasEOL: true };

    const lines = reconstructLinesFromItems([t1, t2, t3, t4, t5]);
    assert(lines.length === 1, 'Expected 1 line');
    assert(lines[0].text === 'Developed a machine learning model.', `Incorrect spacing: "${lines[0].text}"`);
  });

  test('PDF Reconstruction: Technical identifiers and hyphenated terms intact', () => {
    // C++
    const cp1: PDFTextItem = { str: 'C', x: 50, y: 600, width: 8, height: 12, hasEOL: false };
    const cp2: PDFTextItem = { str: '+', x: 58, y: 600, width: 6, height: 12, hasEOL: false };
    const cp3: PDFTextItem = { str: '+', x: 64, y: 600, width: 6, height: 12, hasEOL: false };

    // Scikit-learn
    const sk1: PDFTextItem = { str: 'Scikit-', x: 80, y: 600, width: 35, height: 12, hasEOL: false };
    const sk2: PDFTextItem = { str: 'learn', x: 115, y: 600, width: 28, height: 12, hasEOL: false };

    // Node.js
    const nd1: PDFTextItem = { str: 'Node.', x: 155, y: 600, width: 30, height: 12, hasEOL: false };
    const nd2: PDFTextItem = { str: 'js', x: 185, y: 600, width: 12, height: 12, hasEOL: true };

    const lines = reconstructLinesFromItems([cp1, cp2, cp3, sk1, sk2, nd1, nd2]);
    assert(lines.length === 1, 'Expected 1 line');
    assert(lines[0].text.includes('C++'), `C++ corrupted: ${lines[0].text}`);
    assert(lines[0].text.includes('Scikit-learn'), `Scikit-learn corrupted: ${lines[0].text}`);
    assert(lines[0].text.includes('Node.js'), `Node.js corrupted: ${lines[0].text}`);
  });

  test('PDF Reconstruction: Period abbreviations and numbers (B.Tech & CGPA: 8.57)', () => {
    const b1: PDFTextItem = { str: 'B.', x: 50, y: 500, width: 12, height: 12, hasEOL: false };
    const b2: PDFTextItem = { str: 'Tech', x: 62, y: 500, width: 26, height: 12, hasEOL: false };
    const g1: PDFTextItem = { str: 'CGPA', x: 100, y: 500, width: 32, height: 12, hasEOL: false };
    const g2: PDFTextItem = { str: ':', x: 132, y: 500, width: 4, height: 12, hasEOL: false };
    const g3: PDFTextItem = { str: '8.57', x: 140, y: 500, width: 24, height: 12, hasEOL: true };

    const lines = reconstructLinesFromItems([b1, b2, g1, g2, g3]);
    assert(lines[0].text.includes('B.Tech'), `B.Tech corrupted: ${lines[0].text}`);
    assert(lines[0].text.includes('CGPA: 8.57'), `CGPA corrupted: ${lines[0].text}`);
  });

  // ─── 7. SEMANTIC VALIDATOR REJECTION TESTS ────────────────────────────────
  test('Evidence Validator: Rejects sentence fragments claiming to be Project titles', () => {
    const invalidProjectModel: CandidateEvidenceModel = {
      identity: {},
      education: [],
      workExperience: [],
      projects: [
        {
          name: { value: 'supervised learning algorithms.', sourceText: 'supervised learning algorithms.', sourceLocation: { section: 'PROJECTS' }, confidence: 'high' },
          technologies: [],
          outcomes: [],
        },
        {
          name: { value: 'accuracy and reduce false positives.', sourceText: 'accuracy and reduce false positives.', sourceLocation: { section: 'PROJECTS' }, confidence: 'high' },
          technologies: [],
          outcomes: [],
        },
        {
          name: { value: 'Developed a machine learning model to classify transactions', sourceText: 'Developed a machine learning model to classify transactions', sourceLocation: { section: 'PROJECTS' }, confidence: 'high' },
          technologies: [],
          outcomes: [],
        },
      ],
      skills: { technical: [], product: [], domain: [] },
      certifications: [],
      achievements: [],
      unclear: [],
    };

    const validated = validateCandidateEvidenceModel(invalidProjectModel, NARENDRA_RESUME_TEXT);
    assert(validated.model.projects.length === 0, `All sentence fragment projects must be rejected, got ${validated.model.projects.length}`);
    assert(validated.rejectedItems.length === 3, `Expected 3 rejected items, got ${validated.rejectedItems.length}`);
  });

  test('Evidence Validator: Rejects isolated CGPA claiming to be Education entity', () => {
    const invalidEduModel: CandidateEvidenceModel = {
      identity: {},
      education: [
        {
          degree: { value: 'CGPA: 8.57', sourceText: 'CGPA: 8.57', sourceLocation: { section: 'EDUCATION' }, confidence: 'high' },
          institution: undefined,
        },
        {
          degree: { value: 'B', sourceText: 'B', sourceLocation: { section: 'EDUCATION' }, confidence: 'high' },
          institution: undefined,
        },
      ],
      workExperience: [],
      projects: [],
      skills: { technical: [], product: [], domain: [] },
      certifications: [],
      achievements: [],
      unclear: [],
    };

    const validated = validateCandidateEvidenceModel(invalidEduModel, NARENDRA_RESUME_TEXT);
    assert(validated.model.education.length === 0, `Isolated CGPA/fragment education must be rejected, got ${validated.model.education.length}`);
  });

  test('Evidence Validator: Rejects fabricated experience role without employer', () => {
    const invalidExpModel: CandidateEvidenceModel = {
      identity: {},
      education: [],
      workExperience: [
        {
          company: { value: 'Previous Organization', sourceText: 'Previous Organization', sourceLocation: { section: 'EXPERIENCE' }, confidence: 'high' },
          role: { value: 'Technical Professional', sourceText: 'Technical Professional', sourceLocation: { section: 'EXPERIENCE' }, confidence: 'high' },
          bullets: [],
        },
      ],
      projects: [],
      skills: { technical: [], product: [], domain: [] },
      certifications: [],
      achievements: [],
      unclear: [],
    };

    const validated = validateCandidateEvidenceModel(invalidExpModel, NARENDRA_RESUME_TEXT);
    assert(validated.model.workExperience.length === 0, 'Fabricated work experience role must be rejected');
  });

  // ─── 8. DOCUMENT CLASSIFICATION GATE TESTS ────────────────────────────────
  test('Classification Gate: Marks Sheet is rejected with explanation', () => {
    const transcriptText = `
JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY
CONSOLIDATED GRADE CARD / MARKS SHEET
Hall Ticket No: 20071A0589
Semester I: Subject Code CS101 Credit Points: 4 Grade: A+
Semester II: Subject Code CS102 Credit Points: 4 Grade: O
Grade Point Average (GPA): 8.75
Controller of Examinations
`;
    const sections = detectSections(transcriptText);
    const classification = classifyDocument(sections, transcriptText.length, transcriptText);
    assert(classification.canProceed === false, 'Marks sheet should be rejected');
    assert(classification.documentType === 'academic_document', `Expected academic_document, got ${classification.documentType}`);
  });

  test('Classification Gate: Certificate is rejected with explanation', () => {
    const certText = `
CERTIFICATE OF PARTICIPATION
This is to certify that candidate has participated in Machine Learning Workshop.
Authorized Signatory
`;
    const sections = detectSections(certText);
    const classification = classifyDocument(sections, certText.length, certText);
    assert(classification.canProceed === false, 'Certificate should be rejected');
    assert(classification.documentType === 'certificate', `Expected certificate, got ${classification.documentType}`);
  });

  return { passed, failed, results };
}
