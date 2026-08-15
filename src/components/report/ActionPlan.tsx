import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Target, ArrowRight } from 'lucide-react';

export interface ActionPlanProps {
  practiceItems: {
    title: string;
    description: string;
    actionableTask: string;
  }[];
}

export const ActionPlan: React.FC<ActionPlanProps> = ({ practiceItems }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border shadow-subtle space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Target className="w-4 h-4" />
            <h3>Recommended Practice Drills</h3>
          </div>
          <p className="text-xs text-foreground-muted">
            Targeted drills generated specifically to fix your weakest dimensions before your next loop.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {practiceItems.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-surface-subtle/60 border border-border/80 flex flex-col justify-between space-y-4 hover:border-foreground/20 transition-colors"
          >
            <div className="space-y-2">
              <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                Drill 0{idx + 1}
              </span>
              <h4 className="text-xs font-bold text-foreground">
                {item.title}
              </h4>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-3 border-t border-border/60">
              <span className="text-[10px] uppercase font-semibold text-foreground-subtle block mb-2">
                Action Task:
              </span>
              <p className="text-xs text-foreground font-medium mb-3">
                {item.actionableTask}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => navigate('/setup')}
                rightIcon={<ArrowRight className="w-3 h-3" />}
              >
                Launch Drill
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
