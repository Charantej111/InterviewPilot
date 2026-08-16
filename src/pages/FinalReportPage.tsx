import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { RibbonWave } from '../components/ui/RibbonWave';
import { Folder } from '../components/reactbits/Folder';
import { Button } from '../components/ui/Button';
import confetti from 'canvas-confetti';
import { Check, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { useInterview } from '../context/InterviewContext';
import { sampleFinalReport } from '../data/mockReports';
import { FinalReport } from '../types/interview';

export const FinalReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { finalReport, getReport } = useInterview();
  const [report, setReport] = useState<FinalReport>(finalReport || sampleFinalReport);

  useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.55 },
    });

    const fetchReport = async () => {
      try {
        const rep = await getReport(id);
        if (rep) setReport(rep);
      } catch (err) {
        console.error('Error fetching final report:', err);
      }
    };
    fetchReport();
  }, [id]);

  const dimensionColors = [
    'text-emerald-500',
    'text-purple-500',
    'text-cyan-500',
    'text-pink-500',
    'text-indigo-500',
  ];

  return (
    <DashboardLayout>
      <div className="relative space-y-10 max-w-4xl mx-auto overflow-hidden">
        {/* Luminous Wave Background */}
        <RibbonWave className="opacity-75" />

        {/* Header & Overall Score */}
        <div className="relative z-10 text-center space-y-4 pt-6">
          <div>
            <span className="eyebrow mb-1 block">Session Summary</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Interview complete
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Here is your candidate performance dossier and action plan for {report.jobTitle || 'Target Role'}.
            </p>
          </div>

          {/* Big Score Indicator with 3D Folder Report */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="mb-4">
              <Folder
                color="#635BFF"
                size={1.15}
                items={[
                  <div key="1" className="p-1 text-[9px] font-bold text-slate-900">Score {report.overallScore.toFixed(1)}</div>,
                  <div key="2" className="p-1 text-[9px] font-bold text-emerald-700">STAR Rubric</div>,
                  <div key="3" className="p-1 text-[9px] font-bold text-purple-700">Action Plan</div>
                ]}
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl sm:text-7xl font-extrabold text-foreground font-mono tracking-tight">
                {report.overallScore.toFixed(1)}
              </span>
              <span className="text-xl sm:text-2xl text-foreground-muted font-medium">/ 10</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary mt-1">
              Overall readiness score ({report.readinessPercentage}% Bar)
            </span>
          </div>

          {/* Metric Dimension Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {(report.dimensions || []).map((d, idx) => (
              <div
                key={d.name}
                className="p-4 rounded-2xl bg-surface/80 backdrop-blur-xl border border-border/80 text-center flex flex-col justify-between shadow-xs"
              >
                <span className="text-[11px] text-foreground-muted block mb-2 font-semibold truncate">
                  {d.name}
                </span>
                <span className={`text-2xl font-black font-mono ${dimensionColors[idx % dimensionColors.length]}`}>
                  {d.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3-Column Breakdown Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Top Strengths */}
          <div className="p-6 rounded-3xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-500" />
              <span>Top strengths</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-foreground-muted">
              {(report.topStrengths || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas to Improve */}
          <div className="p-6 rounded-3xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-amber-500" />
              <span>Areas to improve</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-foreground-muted">
              {(report.priorityImprovements || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Practice */}
          <div className="p-6 rounded-3xl bg-surface/80 backdrop-blur-xl border border-border/80 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Recommended next steps
            </h3>
            <ol className="space-y-2.5 text-xs text-foreground-muted list-decimal list-inside">
              {(report.recommendedPractice || []).map((item, idx) => (
                <li key={idx}>
                  <strong>{item.title}</strong>: {item.actionableTask}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            variant="glass-primary"
            size="lg"
            onClick={() => navigate(`/interview/${id || report.sessionId}/feedback`)}
            className="w-full sm:w-auto shadow-md"
            rightIcon={<ArrowRight size={15} />}
          >
            Review question breakdown
          </Button>

          <Button
            variant="glass-secondary"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto"
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FinalReportPage;
