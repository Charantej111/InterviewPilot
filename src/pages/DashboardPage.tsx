import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { CompetencyRadarWidget } from '../components/dashboard/CompetencyRadarWidget';
import { ScoreTrajectoryWidget } from '../components/dashboard/ScoreTrajectoryWidget';
import { COMPANY_TRACKS, CompanyTrack } from '../data/companyTracks';
import { Folder } from '../components/reactbits/Folder';
import { Component as AILoader } from '../components/ui/ai-loader';
import {
  Plus,
  Play,
  ArrowRight,
  Target,
  Flame,
  CheckCircle2,
  Award,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useInterview } from '../context/InterviewContext';
import { interviewService, RecentInterviewSummary } from '../services/supabase/interviewService';
import { InterviewSession } from '../types/interview';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const { loadSession, resetSetupDraft, updateSetupDraft } = useInterview();
  const [recentInterviews, setRecentInterviews] = useState<RecentInterviewSummary[]>([]);
  const [activeInProgressSession, setActiveInProgressSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
          const [active, list] = await Promise.all([
            interviewService.getActiveInterview(user.id).catch(() => null),
            interviewService.getRecentInterviews(user.id).catch(() => []),
          ]);

          if (isMounted) {
            if (active) setActiveInProgressSession(active);
            if (list && list.length > 0) setRecentInterviews(list);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard interviews:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  const handleStartNewInterview = () => {
    resetSetupDraft();
    navigate('/setup');
  };

  const handleLaunchCompanyTrack = (track: CompanyTrack) => {
    resetSetupDraft();
    updateSetupDraft({
      company: track.name,
      jobTitle: track.recommendedRole,
      interviewType: track.interviewType,
      difficulty: track.difficulty,
      interviewStyle: track.style,
      focusAreas: track.focusAreas,
    });
    navigate('/setup');
  };

  const handleResumeInterview = async () => {
    if (!activeInProgressSession) return;
    await loadSession(activeInProgressSession.id);
    navigate(`/interview/${activeInProgressSession.id}`);
  };

  const firstName = user.name ? user.name.split(' ')[0] : (user.email ? user.email.split('@')[0] : 'Candidate');
  const displayScore =
    user.readinessPercentage > 0
      ? user.readinessPercentage
      : recentInterviews.length > 0
      ? Math.round((recentInterviews.reduce((acc, r) => acc + r.score, 0) / recentInterviews.length) * 10)
      : 74;
  const displayCompleted = user.interviewsCompleted || recentInterviews.length || 0;
  const displayStreak = user.streakDays || (displayCompleted > 0 ? 3 : 1);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AILoader text="Synchronizing" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto py-2 text-left animate-fadeIn">
        {/* ACTIVE IN-PROGRESS RESUME BANNER */}
        {activeInProgressSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xl border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
          >
            {/* Ambient Halo */}
            <div className="absolute -right-20 -top-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 dark:text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                <Play size={20} className="fill-current" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 dark:text-purple-700 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-600 animate-ping" />
                  <span>Simulation In Progress</span>
                </div>
                <h3 className="text-lg font-extrabold truncate max-w-md">
                  {activeInProgressSession.jobTitle} · {activeInProgressSession.company}
                </h3>
                <p className="text-xs opacity-80">
                  Question {(activeInProgressSession.currentQuestionIndex || 0) + 1} of {activeInProgressSession.questions.length} · Live responses saved
                </p>
              </div>
            </div>

            <Button
              size="md"
              onClick={handleResumeInterview}
              rightIcon={<ArrowRight size={16} />}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg self-start sm:self-auto shrink-0 cursor-pointer relative z-10 px-5"
            >
              Resume Interview
            </Button>
          </motion.div>
        )}

        {/* Header Greeting Hero Bar */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <Folder
                color="#6366f1"
                size={0.95}
                items={[
                  <div key="1" className="p-1 text-[9px] font-bold text-slate-900">{firstName || 'Profile'}</div>,
                  <div key="2" className="p-1 text-[9px] font-bold text-emerald-700">{displayCompleted} Loops</div>,
                  <div key="3" className="p-1 text-[9px] font-bold text-purple-700">{displayScore}% Bar</div>,
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Welcome back, {firstName} 👋
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted max-w-xl leading-relaxed">
                Track your interview readiness, review feedback, and launch your next practice session.
              </p>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStartNewInterview}
            leftIcon={<Plus size={18} />}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/25 self-start sm:self-auto shrink-0 cursor-pointer"
          >
            Start New Mock Loop
          </Button>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Readiness */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-3 relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground-muted">
                Readiness Bar
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Award size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-4xl font-black text-foreground font-mono">{displayScore}%</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {displayScore >= 80 ? 'Lean Hire Bar' : 'Calibrating'}
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, displayScore)}%` }}
              />
            </div>
            <p className="text-[11px] text-foreground-muted">Synthesized across 6 core STAR dimensions</p>
          </div>

          {/* Card 2: Completed Loops */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-3 relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground-muted">
                Completed Loops
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-foreground font-mono">{displayCompleted}</span>
              <span className="text-xs text-foreground-muted font-medium">Sessions</span>
            </div>
            <p className="text-[11px] text-foreground-muted pt-2">Full adaptive technical & behavioral runs</p>
          </div>

          {/* Card 3: Streak */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-3 relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground-muted">
                Practice Streak
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Flame size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-foreground font-mono">{displayStreak}</span>
              <span className="text-xs text-foreground-muted font-medium">Days Active</span>
            </div>
            <p className="text-[11px] text-foreground-muted pt-2">Daily deliberate practice habit maintained</p>
          </div>

          {/* Card 4: Primary Target */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-3 relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground-muted">
                Primary Target
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Target size={16} />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-foreground truncate max-w-[190px]">
                {user.targetRole || 'Target Role'}
              </h4>
              <p className="text-xs text-foreground-muted truncate">
                {user.targetCompanies && user.targetCompanies.length > 0 ? user.targetCompanies.join(', ') : 'Top Tech Bars'}
              </p>
            </div>
            <p className="text-[11px] text-foreground-muted">
              {user.experienceLevel ? `Calibrated at ${user.experienceLevel}` : 'Configure in Profile'}
            </p>
          </div>
        </div>

        {/* Visual Analytics Row: Competency Radar & Historical Trajectory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CompetencyRadarWidget />
          <ScoreTrajectoryWidget />
        </div>

        {/* Curated Company Interview Tracks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-lg font-extrabold text-foreground">Curated Hiring Bars & Company Tracks</h3>
              <p className="text-xs text-foreground-muted">
                Pre-calibrated evaluation weights, specific leadership principles, and realistic probing loops.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPANY_TRACKS.map((track) => (
              <div
                key={track.id}
                onClick={() => handleLaunchCompanyTrack(track)}
                className="p-5 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 font-black text-sm flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-inner">
                      {track.badge}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground-muted">
                      Benchmark: {track.hiringBarBenchmark}/10
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                      {track.name}
                      <ChevronRight size={16} className="text-foreground-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </h4>
                    <p className="text-xs text-foreground-muted font-medium mt-0.5">
                      {track.recommendedRole} · {track.difficulty}
                    </p>
                  </div>

                  <p className="text-xs text-foreground-muted/90 line-clamp-2 leading-relaxed">
                    {track.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-semibold text-primary">
                  <span>Launch calibrated loop</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions Ledger */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-foreground">Recent Interview Sessions</h3>
          </div>

          {recentInterviews.length > 0 ? (
            <div className="rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentInterviews.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    if (session.status === 'in_progress') {
                      navigate(`/interview/${session.id}`);
                    } else {
                      navigate(`/interview/${session.id}/report`);
                    }
                  }}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-extrabold text-foreground">{session.role} · {session.company}</h4>
                      <p className="text-xs text-foreground-muted flex items-center gap-2">
                        <span>{session.date ? new Date(session.date).toLocaleDateString() : 'Recent'}</span>
                        <span>•</span>
                        <span className="capitalize">{session.status || 'Completed'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-sm font-black text-foreground font-mono">
                        {session.score.toFixed(1)}/10
                      </span>
                      <p className="text-[10px] text-foreground-muted font-semibold">STAR Calibrated</p>
                    </div>
                    <ChevronRight size={16} className="text-foreground-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-foreground-muted flex items-center justify-center mx-auto">
                <FileText size={20} />
              </div>
              <h4 className="text-sm font-bold text-foreground">No interview sessions recorded yet</h4>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                Complete your first mock interview simulation to populate your performance ledger and STAR scorecard.
              </p>
              <Button size="sm" onClick={handleStartNewInterview} className="mt-2">
                Start First Mock Session
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
