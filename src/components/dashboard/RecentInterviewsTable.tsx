import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface InterviewRecord {
  id: string;
  role: string;
  company: string;
  score: number;
  date: string;
}

export interface RecentInterviewsTableProps {
  interviews?: InterviewRecord[];
}

export const RecentInterviewsTable: React.FC<RecentInterviewsTableProps> = ({
  interviews = [],
}) => {
  const navigate = useNavigate();

  return (
    <div className="glow-card p-6 sm:p-7 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-foreground-muted">
            Recent interviews
          </h3>
          {interviews.length > 0 && (
            <button
              onClick={() => navigate('/setup')}
              className="text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              View all
            </button>
          )}
        </div>

        {interviews.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <p className="text-xs text-foreground-muted">
              No interviews completed yet. Complete your first interview to unlock competency analytics.
            </p>
            <button
              onClick={() => navigate('/setup')}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm cursor-pointer inline-block"
            >
              Start Your First Interview
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-foreground-subtle">
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {interviews.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/interview/${item.id}/report`)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-semibold text-white">{item.role}</td>
                    <td className="py-3 text-foreground-muted">{item.company}</td>
                    <td className="py-3 font-mono font-bold text-white">
                      <span className="bg-white/[0.06] px-2 py-0.5 rounded border border-white/10">
                        {item.score > 0 ? item.score.toFixed(1) : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 text-foreground-subtle text-right">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
