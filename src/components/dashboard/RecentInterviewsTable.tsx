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
  interviews = [
    { id: '1', role: 'Product Manager Intern', company: 'Acme', score: 7.4, date: 'Today' },
    { id: '2', role: 'Business Analyst', company: 'Nova', score: 6.8, date: 'Yesterday' },
    { id: '3', role: 'Associate PM', company: 'TechCorp', score: 7.1, date: '2 days ago' },
  ],
}) => {
  const navigate = useNavigate();

  return (
    <div className="glow-card p-6 sm:p-7 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-foreground-muted">
            Recent interviews
          </h3>
          <button
            onClick={() => navigate('/setup')}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </button>
        </div>

        {/* Table */}
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
                      {item.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 text-foreground-subtle text-right">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
