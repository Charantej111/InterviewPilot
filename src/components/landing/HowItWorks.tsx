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
              color="#635BFF"
              size={0.9}
              items={[
                <div key="1" className="p-1 text-[9px] font-bold text-slate-900">Projects</div>,
                <div key="2" className="p-1 text-[9px] font-bold text-purple-700">+42% Impact</div>,
                <div key="3" className="p-1 text-[9px] font-bold text-slate-800">Core Skills</div>
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
              color="#0284C7"
              size={0.9}
              items={[
                <div key="1" className="p-1 text-[9px] font-bold text-slate-900">Role Scope</div>,
                <div key="2" className="p-1 text-[9px] font-bold text-sky-700">Tech Stack</div>,
                <div key="3" className="p-1 text-[9px] font-bold text-slate-800">Hiring Bar</div>
              ]}
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="step p-6 rounded-2xl border border-border bg-surface flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-primary block mb-2">03</span>
            <h3 className="text-lg font-bold text-foreground mb-2">Practice live mock loop</h3>
            <p className="text-xs text-foreground-muted mb-6">
              Answer real-time prompts, face adaptive follow-ups, and receive deterministic STAR rubric scores.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Folder
              color="#059669"
              size={0.9}
              items={[
                <div key="1" className="p-1 text-[9px] font-bold text-emerald-800">Score 8.5</div>,
                <div key="2" className="p-1 text-[9px] font-bold text-slate-900">STAR Rubric</div>,
                <div key="3" className="p-1 text-[9px] font-bold text-purple-700">Action Plan</div>
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
