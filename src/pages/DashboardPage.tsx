import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { CompetencyRadarWidget } from '../components/dashboard/CompetencyRadarWidget';
import { ScoreTrajectoryWidget } from '../components/dashboard/ScoreTrajectoryWidget';
import { COMPANY_TRACKS, CompanyTrack } from '../data/companyTracks';
import { Folder } from '../components/reactbits/Folder';
import { ShiningText } from '../components/ui/ShiningText';
import {
  Plus,
  Play,
  ArrowRight,
  Briefcase,
  ChevronRight,
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

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
        try {
          const active = await interviewService.getActiveInterview(user.id);
          if (isMounted && active) {
            setActiveInProgressSession(active);
          }

          const list = await interviewService.getRecentInterviews(user.id);
          if (isMounted && list.length > 0) {
            setRecentInterviews(list);
          }
        } catch (err) {
          console.error('Error fetching dashboard interviews:', err);
        }
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
      : 0;
  const displayCompleted = user.interviewsCompleted || recentInterviews.length || 0;
  const displayStreak = user.streakDays || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto py-2 text-left animate-fadeIn">
        {/* ACTIVE IN-PROGRESS RESUME BANNER */}
        {activeInProgressSession && (
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 dark:text-purple-600 flex items-center justify-center shrink-0">
                <Play size={18} className="fill-current" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-400 dark:text-purple-600 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-600 animate-pulse" />
                  <span>Simulation In Progress</span>
                </div>
                <h3 className="text-base font-bold truncate max-w-md">
                  {activeInProgressSession.jobTitle} · {activeInProgressSession.company}
                </h3>
                <p className="text-xs opacity-75 mt-0.5">
                  Question {(activeInProgressSession.currentQuestionIndex || 0) + 1} of {activeInProgressSession.questions.length} · All responses preserved
                </p>
              </div>
            </div>

            <Button
              size="md"
              onClick={handleResumeInterview}
              rightIcon={<ArrowRight size={15} />}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Resume Interview
            </Button>
          </div>
        )}

        {/* Header Greeting Hero Bar with 3D Folder */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm text-left">
          <div className="flex items-center gap-5">
            <div className="hidden sm:block">
              <Folder
                color="#6366f1"
                size={0.9}
                items={[
                  <div key="1" className="p-1 text-[9px] font-bold text-slate-900">{firstName || 'Profile'}</div>,
                  <div key="2" className="p-1 text-[9px] font-bold text-emerald-700">{displayCompleted} Sessions</div>,
                  <div key="3" className="p-1 text-[9px] font-bold text-purple-700">{displayScore > 0 ? `${displayScore}% Ready` : 'Setup'}</div>
                ]}
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-0.5">
                <span>Workspace</span>
                <span>•</span>
                <ShiningText text="Live Simulation Engine Active" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
                Good morning, {firstName} <span className="text-xl">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted">
                Overview of your calibrated interview performance, competency growth, and practice tracks.
              </p>
            </div>
          </div>

          <Button
            size="md"
            onClick={handleStartNewInterview}
            leftIcon={<Plus size={16} />}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-sm self-start sm:self-auto cursor-pointer"
          >
            Start New Mock Interview
          </Button>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
              Readiness Alignment
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground font-mono">{displayScore}%</span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {displayScore >= 80 ? 'Lean Hire Bar' : 'Calibrating'}
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted pt-1">Across 6 core STAR dimensions</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
              Completed Loops
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground font-mono">{displayCompleted}</span>
              <span className="text-xs text-foreground-muted font-medium">Sessions</span>
            </div>
            <p className="text-[11px] text-foreground-muted pt-1">Full behavioral & tech simulations</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
              Practice Consistency
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground font-mono">{displayStreak}</span>
              <span className="text-xs text-foreground-muted font-medium">Days Streak</span>
            </div>
            <p className="text-[11px] text-foreground-muted pt-1">Daily active calibration active</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
              Primary Role Target
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-foreground truncate max-w-[170px]">
                {user.targetRole || 'Not Set'}
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted pt-1">
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
            <div>
              <h3 className="text-base font-bold text-foreground">Curated Company Hiring Tracks</h3>
              <p className="text-xs text-foreground-muted">
                Pre-calibrated hiring bars, question distributions, and company-specific leadership rubrics.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMPANY_TRACKS.map((track) => (
              <div
                key={track.id}
                onClick={() => handleLaunchCompanyTrack(track)}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary/50 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-black text-sm flex items-center justify-center text-foreground">
                      {track.badge}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground-muted">
                      Bar {track.hiringBarBenchmark}/10
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {track.name} Interview Track
                    </h4>
                    <p className="text-xs text-foreground-muted line-clamp-2 mt-0.5 leading-relaxed">
                      {track.tagline}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Launch Track</span>
                  <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Practice Sessions Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Recent Practice Sessions</h3>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            {recentInterviews.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-foreground-muted text-xs">
                <Briefcase size={20} className="mx-auto text-zinc-400" />
                <p>No recent mock interview sessions recorded yet.</p>
                <button
                  type="button"
                  onClick={handleStartNewInterview}
                  className="text-primary font-bold hover:underline cursor-pointer"
                >
                  Start your first interview session →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentInterviews.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                          {session.role}
                        </h4>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-xs font-semibold text-primary">{session.company}</span>
                      </div>
                      <p className="text-[11px] text-foreground-muted">
                        Completed {session.date} · Calibrated STAR Rubric
                      </p>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-foreground block">
                          {session.score ? session.score.toFixed(1) : '7.5'} / 10
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Evaluated
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/interview/${session.id}/report`)}
                        rightIcon={<ArrowRight size={13} />}
                        className="text-xs font-semibold"
                      >
                        View Dossier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
