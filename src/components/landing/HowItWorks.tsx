import React from 'react';
import { Folder } from '../reactbits/Folder';

export const HowItWorks: React.FC = () => {
  return (
    <section id="how" className="how">
      <div className="section-heading">
        <span className="eyebrow">How it works</span>
        <h2>Preparation that starts with context.</h2>
      </div>

      <div className="steps grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {/* Step 1 */}
        <div className="step p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-primary block mb-2">01</span>
            <h3 className="text-lg font-bold text-foreground mb-2">Upload your resume</h3>
            <p className="text-xs text-foreground-muted mb-6">
              We map your experience, key metrics, and projects into a structured candidate profile.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Folder
              color="#5A55DF"
              size={0.9}
              items={[
                <div key="1" className="p-1 text-[9px] font-bold text-foreground">Projects</div>,
                <div key="2" className="p-1 text-[9px] font-bold text-foreground">+42% Growth</div>,
                <div key="3" className="p-1 text-[9px] font-bold text-foreground">Core Skills</div>
              ]}
            />
          </div>
        </div>

        {/* Step 2 */}
        <div className="step p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-primary block mb-2">02</span>
            <h3 className="text-lg font-bold text-foreground mb-2">Add the job description</h3>
            <p className="text-xs text-foreground-muted mb-6">
              We extract the specific competencies, rubric criteria, and domain expectations for the role.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Folder
              color="#3B82F6"
              size={0.9}
              items={[
                <div key="1" className="p-1 text-[9px] font-bold text-foreground">Role Scope</div>,
                <div key="2" className="p-1 text-[9px] font-bold text-foreground">Tech Stack</div>,
                <div key="3" className="p-1 text-[9px] font-bold text-foreground">Rubric</div>
              ]}
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="step p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-primary block mb-2">03</span>
            <h3 className="text-lg font-bold text-foreground mb-2">Practice personalized mock</h3>
            <p className="text-xs text-foreground-muted mb-6">
              Answer real-time voice prompts, face adaptive follow-ups, and receive actionable STAR feedback.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Folder
              color="#10B981"
              size={0.9}
              items={[
                <div key="1" className="p-1 text-[9px] font-bold text-foreground">Score 8.5</div>,
                <div key="2" className="p-1 text-[9px] font-bold text-foreground">STAR Rubric</div>,
                <div key="3" className="p-1 text-[9px] font-bold text-foreground">Action Items</div>
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
