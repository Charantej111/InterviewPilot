import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ReadinessScoreWidget } from '../components/dashboard/ReadinessScoreWidget';
import { RecentInterviewsTable, InterviewRecord } from '../components/dashboard/RecentInterviewsTable';
import { Folder } from '../components/reactbits/Folder';
import { Button } from '../components/ui/Button';
import { ShiningText } from '../components/ui/ShiningText';
import { Plus, Flame } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { interviewService } from '../services/supabase/interviewService';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const [recentInterviews, setRecentInterviews] = useState<InterviewRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadInterviews = async () => {
      if (isAuthenticated && user?.id && !user.id.startsWith('mock_')) {
        try {
          const list = await interviewService.getRecentInterviews(user.id);
          if (isMounted && list.length > 0) {
            setRecentInterviews(list);
          }
        } catch (err) {
          console.error('Error fetching dashboard interviews:', err);
        }
      }
    };
    loadInterviews();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  const improvementAreas = [
    { label: 'Structure (STAR Framework)', status: 'Needs work', variant: 'warning' },
    { label: 'Metric Evidence & Impact', status: 'Needs work', variant: 'warning' },
    { label: 'Communication & Tone', status: 'Strong', variant: 'success' },
  ];

  const weekDays = [
    { day: 'M', active: true },
    { day: 'T', active: true },
    { day: 'W', active: true },
    { day: 'T', active: true },
    { day: 'F', active: true },
    { day: 'S', active: true },
    { day: 'S', active: false },
  ];

  const firstName = user.name ? user.name.split(' ')[0] : 'Candidate';
  const displayScore = user.readinessPercentage > 0 ? Math.round(user.readinessPercentage * 0.1 * 10) / 10 : 7.4;
  const displayDelta = user.readinessDelta || 8;
  const displayStreak = user.streakDays || 1;
  const displayCompleted = user.interviewsCompleted || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header Greeting Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <Folder
                color="#18181b"
                size={0.9}
                items={[
                  <div key="1" className="p-1 text-[9px] font-bold text-slate-900">{firstName}.pdf</div>,
                  <div key="2" className="p-1 text-[9px] font-bold text-emerald-700">{displayCompleted} Mocks</div>,
                  <div key="3" className="p-1 text-[9px] font-bold text-purple-700">{user.readinessPercentage || 74}% Ready</div>
                ]}
              />
            </div>
            <div className="text-left">
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-1">
                <span>Workspace</span>
                <span>•</span>
                <ShiningText text="Live Simulation Ready" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
                Good morning, {firstName} <span className="text-xl">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
                Ready for another personalized mock interview round?
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate('/setup')}
            size="md"
            className="self-start sm:self-auto shadow-sm"
            leftIcon={<Plus size={16} />}
          >
            New Interview
          </Button>
        </div>

        {/* Top Widgets Grid (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <ReadinessScoreWidget score={displayScore} delta={displayDelta} />
          </div>
          <div className="lg:col-span-8">
            <RecentInterviewsTable
              interviews={recentInterviews.length > 0 ? recentInterviews : undefined}
            />
          </div>
        </div>

        {/* Bottom Widgets Grid (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Improvement Areas Card */}
          <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs text-left">
            <h3 className="text-xs font-bold text-foreground-muted mb-4 uppercase tracking-wider">
              Improvement focus areas
            </h3>

            <div className="space-y-3">
              {improvementAreas.map((area) => (
                <div
                  key={area.label}
                  className="flex items-center justify-between py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 last:border-0"
                >
                  <span className="text-sm font-semibold text-foreground">{area.label}</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${
                      area.variant === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {area.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Streak Card */}
          <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs text-left flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
                Practice streak
              </h3>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Flame size={18} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-extrabold text-foreground font-mono">{displayStreak}</span>
              <span className="text-xs text-foreground-muted font-semibold">days in a row</span>
            </div>

            {/* Weekly Activity Dot Grid */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              {weekDays.map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-foreground-subtle">{item.day}</span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      item.active
                        ? 'bg-zinc-900 dark:bg-white'
                        : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
