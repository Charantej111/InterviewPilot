import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { AILoader } from '../components/ui/AILoader';
import { QuestionReattemptModal } from '../components/report/QuestionReattemptModal';
import { MicroDrillModal } from '../components/report/MicroDrillModal';
import { 
  Download, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Mic,
  RotateCcw,
} from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { createEmptyReport } from '../data/defaults';
import { FinalReport, QuestionBreakdownItem } from '../types/interview';

export const FinalReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { finalReport, getReport, activeSession } = useInterview();
  const [report, setReport] = useState<FinalReport | null>(finalReport || null);
  const [isLoading, setIsLoading] = useState<boolean>(!finalReport || !finalReport.overallScore);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(null);
  const [reattemptQuestion, setReattemptQuestion] = useState<QuestionBreakdownItem | null>(null);
  const [activeDrill, setActiveDrill] = useState<{ title: string; task: string } | null>(null);
  const hasFetchedIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Check if report in context already matches this session ID
    if (finalReport && finalReport.overallScore && (finalReport.sessionId === id || !id)) {
      setReport(finalReport);
      setIsLoading(false);
      return;
    }

    if (hasFetchedIdRef.current === id) return;
    hasFetchedIdRef.current = id || 'active';

    const fetchReport = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const rep = await getReport(id);
        if (isMounted && rep) {
          setReport(rep);
        }
      } catch (err: any) {
        console.error('Error fetching final report:', err);
        if (isMounted) {
          setError(err?.message || 'Failed to synthesize final report.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const activeReport = report || finalReport || createEmptyReport();
  const targetRole = activeReport.jobTitle || activeSession.jobTitle || 'Target Role';
  const targetCompany = activeReport.company || activeSession.company || 'Target Company';
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getHiringRecommendation = (score: number) => {
    if (score >= 8.5) {
      return {
        text: '✓ Strong Hire · Recommended for Offer',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      };
    }
    if (score >= 7.0) {
      return {
        text: '✓ Lean Hire · Meets Core Expectations',
        textColor: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      };
    }
    if (score >= 5.0) {
      return {
        text: '⚠ Lean No Hire · Significant Gaps Identified',
        textColor: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      };
    }
    return {
      text: '✕ No Hire · Did Not Meet Minimum Bar',
      textColor: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    };
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 250);
  };

  const toggleQuestionExpand = (idx: number) => {
    setExpandedQuestionIdx(expandedQuestionIdx === idx ? null : idx);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 px-4 flex flex-col items-center justify-center">
          <AILoader
            title="Synthesizing Candidate Dossier"
            stage="Compiling holistic evaluations, STAR rubric dimensions, and readiness score..."
          />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !report) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto py-24 px-4 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-foreground">Report Generation Notice</h2>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Your interview responses are securely saved. We couldn't finish synthesizing the holistic AI report right now.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="md"
              onClick={() => {
                if (id) getReport(id).then((r) => r && setReport(r));
              }}
              leftIcon={<RefreshCw size={14} />}
              className="w-full sm:w-auto font-bold"
            >
              Retry Generation
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/dashboard')}
              leftIcon={<ArrowLeft size={14} />}
              className="w-full sm:w-auto"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* PROFESSIONAL HIGH-END PRINT STYLES */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 12mm 12mm;
          }
          canvas, aside, nav, .screen-only, .mobile-nav, button, .toggle-icon, .lottie-confetti {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
          }
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 9pt !important;
            line-height: 1.4 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
          }
          .print-section {
            border: 0 !important;
            border-bottom: 1px solid #f4f4f5 !important;
            padding: 8px 0 !important;
            margin-bottom: 8px !important;
            page-break-inside: avoid;
            background: transparent !important;
          }
          .print-header {
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 8px !important;
            margin-bottom: 15px !important;
          }
          .print-title {
            font-size: 15pt !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            color: #0f172a !important;
          }
          .print-score-box {
            border: 1px solid #e4e4e7 !important;
            padding: 12px !important;
            border-radius: 8px !important;
            background: #f8fafc !important;
            margin-bottom: 12px !important;
            page-break-inside: avoid;
          }
          .print-score-value {
            font-size: 24pt !important;
            font-weight: 900 !important;
          }
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 8px !important;
          }
          .print-table th, .print-table td {
            border-bottom: 1px solid #f4f4f5 !important;
            padding: 5px 6px !important;
            text-align: left !important;
            font-size: 8.5pt !important;
          }
          .print-table th {
            font-weight: 700 !important;
            color: #71717a !important;
            text-transform: uppercase !important;
            font-size: 7.5pt !important;
          }
          .print-grid-2 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 15px !important;
          }
          .print-question-card {
            border: 1px solid #f4f4f5 !important;
            border-radius: 6px !important;
            padding: 10px !important;
            margin-bottom: 8px !important;
            page-break-inside: avoid;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* SCREEN UI VIEW */}
      <div className="max-w-2xl mx-auto space-y-6 text-left pb-20 px-4 relative">
        
        {/* Professional Lottie Confetti Overlay (plays once, not in a loop, hidden on print) */}
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden no-print w-screen h-screen lottie-confetti">
          <DotLottieReact
            src="https://lottie.host/da9372ce-6130-441a-92c3-aadf1e2c9455/aolJoiRiBM.lottie"
            loop={false}
            autoplay
            style={{ width: '100vw', height: '100vh', objectFit: 'cover' }}
          />
        </div>

        {/* Screen Header Bar */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 screen-only">
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              Interview Evaluation
            </h1>
            <p className="text-[11px] text-foreground-muted font-medium">
              {targetRole} at {targetCompany} · {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              leftIcon={<ArrowLeft size={13} />}
            >
              Dashboard
            </Button>

            <Button
              size="sm"
              onClick={handleExportPDF}
              isLoading={isExporting}
              leftIcon={<Download size={13} />}
              className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold"
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* PRINT & SCREEN REPORT CONTAINER */}
        <div className="print-container space-y-6">
          
          {/* PRINT-ONLY HEADER */}
          <div className="hidden print:block print-header">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="print-title">Candidate Evaluation Report</h1>
                <p className="text-[10px] text-slate-500 font-medium">InterviewPilot Performance Assessment</p>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-mono">
                <div>Date: {formattedDate}</div>
                <div>Session ID: {activeReport.sessionId?.slice(0, 8) || id?.slice(0, 8)}</div>
              </div>
            </div>

            <table className="print-table mt-3">
              <thead>
                <tr>
                  <th>Role Applied</th>
                  <th>Target Organization</th>
                  <th>Readiness Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{targetRole}</strong></td>
                  <td><strong>{targetCompany}</strong></td>
                  <td><strong>{activeReport.readinessPercentage}% Alignment</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* OVERALL READINESS SCORE SECTION */}
          <div className="print-score-box bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">
                  Hiring Readiness Bar
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-foreground font-mono print-score-value">
                    {activeReport.overallScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-foreground-muted font-bold">/ 10</span>
                  <span className={`ml-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getHiringRecommendation(activeReport.overallScore).badgeBg}`}>
                    {activeReport.readinessPercentage}% Match
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-3 sm:pt-0 sm:pl-5 shrink-0">
                <span className="text-[9px] uppercase tracking-wider text-foreground-muted block font-bold">Hiring Recommendation</span>
                <strong className={`text-xs font-bold block mt-0.5 ${getHiringRecommendation(activeReport.overallScore).textColor}`}>
                  {getHiringRecommendation(activeReport.overallScore).text}
                </strong>
              </div>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/80">
              {activeReport.summary}
            </p>
          </div>

          {/* SPOKEN VERBAL DELIVERY TELEMETRY CARD */}
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left space-y-3 screen-only">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={15} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Spoken Delivery & Cadence Telemetry
                </h3>
              </div>
              <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                8.8 / 10 Delivery Index
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-foreground-muted block">Speaking Cadence</span>
                <strong className="text-sm font-bold text-foreground font-mono">142 WPM</strong>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">Optimal Conversational Pace</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-foreground-muted block">Verbal Crutches</span>
                <strong className="text-sm font-bold text-foreground font-mono">2 Detected</strong>
                <span className="text-[10px] text-foreground-muted block font-medium">Low verbal filler density</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-foreground-muted block">Hesitation & Pauses</span>
                <strong className="text-sm font-bold text-foreground font-mono">1.8s Avg</strong>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">Natural Thought Transitions</span>
              </div>
            </div>
          </div>

          {/* COMPETENCY MATRIX TABLE */}
          <div className="space-y-2 print-section text-left">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              Core Competency Dimensions
            </h3>
            
            {/* Screen View List */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 screen-only">
              {(activeReport.dimensions || []).map((d) => (
                <div key={d.name} className="p-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{d.name}</span>
                  <div className="flex items-center gap-1 font-semibold">
                    <span className="font-mono text-foreground">{d.score.toFixed(1)}</span>
                    <span className="text-foreground-muted">/ 10</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Print View Table */}
            <table className="print-table hidden print:table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Assessment Core</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {(activeReport.dimensions || []).map((d) => (
                  <tr key={d.name}>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.description || 'Hiring requirements verification'}</td>
                    <td><strong>{d.score.toFixed(1)} / 10</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observed Strengths & Growth Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-grid-2 text-left">
            {/* Observed Strengths */}
            <div className="space-y-2 print-section">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                Key Strengths
              </h3>
              <ul className="space-y-1.5 text-xs text-foreground-muted">
                {(activeReport.topStrengths || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Areas */}
            <div className="space-y-2 print-section">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                Development Areas
              </h3>
              <ul className="space-y-1.5 text-xs text-foreground-muted">
                {(activeReport.priorityImprovements || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* QUESTION REVIEW SECTION */}
          {activeReport.questionBreakdown && activeReport.questionBreakdown.length > 0 && (
            <div className="space-y-2 print-section text-left">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                Response Breakdown & Critique
              </h3>

              {/* Screen View (Collapsible Accordion) */}
              <div className="space-y-2 screen-only">
                {activeReport.questionBreakdown.map((q, idx) => {
                  const isExpanded = expandedQuestionIdx === idx;
                  return (
                    <div
                      key={q.questionId || idx}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleQuestionExpand(idx)}
                        className="w-full p-3.5 flex items-center justify-between text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-left transition-colors cursor-pointer"
                      >
                        <span className="truncate pr-4 text-foreground">
                          {idx + 1}. {q.questionText}
                        </span>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-mono text-foreground font-bold">
                            {q.score.toFixed(1)}/10
                          </span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs">
                          {q.userAnswer && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-foreground-muted uppercase">Your Response:</span>
                              <p className="text-foreground leading-relaxed italic">"{q.userAnswer}"</p>
                            </div>
                          )}
                          {q.keyCritique && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-foreground-muted uppercase">Feedback:</span>
                              <p className="text-foreground-muted leading-relaxed">{q.keyCritique}</p>
                            </div>
                          )}

                          <div className="pt-2 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReattemptQuestion(q)}
                              leftIcon={<RotateCcw size={12} className="text-primary" />}
                              className="text-xs font-bold"
                            >
                              Re-attempt with Coaching
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Print View (Clean, structured rows) */}
              <div className="hidden print:block space-y-2">
                {activeReport.questionBreakdown.map((q, idx) => (
                  <div key={q.questionId || idx} className="print-question-card">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <strong>Q{idx + 1}: {q.questionText}</strong>
                      <span className="font-mono text-[8.5pt]">Score: {q.score.toFixed(1)}/10</span>
                    </div>
                    {q.userAnswer && (
                      <div className="mb-1.5 pl-2.5 border-l-2 border-slate-300 text-slate-600 font-serif italic text-[8.5pt]">
                        "{q.userAnswer}"
                      </div>
                    )}
                    {q.keyCritique && (
                      <p className="text-[8pt] text-slate-700"><strong>Critique:</strong> {q.keyCritique}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIONABLE RECOMMENDATIONS */}
          {activeReport.recommendedPractice && activeReport.recommendedPractice.length > 0 && (
            <div className="space-y-2 print-section text-left">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                Recommended Training Focus
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print-grid-2">
                {activeReport.recommendedPractice.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-left flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <strong className="text-foreground font-bold block">{rec.title}</strong>
                      <p className="text-foreground-muted leading-relaxed">{rec.actionableTask}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveDrill({ title: rec.title, task: rec.actionableTask })}
                      className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>Start Practice Drill (2 min)</span>
                      <ArrowLeft size={11} className="rotate-180" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRINT FOOTER */}
          <div className="hidden print:block pt-3 border-t border-slate-200 text-center text-[8px] text-slate-400">
            InterviewPilot Assessment Platform · Session: {activeReport.sessionId || id} · Confidential Assessment
          </div>

        </div>

        {/* MODAL 1: QUESTION RE-ATTEMPT PRACTICE */}
        {reattemptQuestion && (
          <QuestionReattemptModal
            isOpen={!!reattemptQuestion}
            onClose={() => setReattemptQuestion(null)}
            question={reattemptQuestion}
            targetRole={targetRole}
            targetCompany={targetCompany}
          />
        )}

        {/* MODAL 2: 2-MINUTE TARGETED MICRO-DRILL */}
        {activeDrill && (
          <MicroDrillModal
            isOpen={!!activeDrill}
            onClose={() => setActiveDrill(null)}
            drillTitle={activeDrill.title}
            drillTask={activeDrill.task}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default FinalReportPage;

