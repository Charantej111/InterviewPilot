import React from 'react';
import { motion } from 'framer-motion';
import { Folder } from '../reactbits/Folder';
import { FileText, Target, Award, ArrowUpRight } from 'lucide-react';
import type { Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: 'easeOut',
    },
  },
};

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Upload your resume',
      description: 'We deconstruct and map your career evidence, verified metrics, and flagship deliverables into a structured candidate profile.',
      icon: FileText,
      folderColor: '#6366f1',
      stepColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      glowColor: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
      folderItems: [
        <div key="1" className="p-1 text-[9px] font-bold text-slate-900">Architecture</div>,
        <div key="2" className="p-1 text-[9px] font-bold text-indigo-700">+42% Latency</div>,
        <div key="3" className="p-1 text-[9px] font-bold text-slate-800">Verified Skills</div>,
      ],
      highlights: ['2-Column Spatial Parsing', 'Zero Hallucination Filter', 'Career Fact Vault'],
    },
    {
      step: '02',
      title: 'Add the target JD',
      description: 'Our engine extracts precise competency bars, technical requirements, and company-specific leadership rubrics for calibration.',
      icon: Target,
      folderColor: '#0284c7',
      stepColor: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20',
      glowColor: 'bg-sky-500/10 group-hover:bg-sky-500/20',
      folderItems: [
        <div key="1" className="p-1 text-[9px] font-bold text-slate-900">Hiring Bar</div>,
        <div key="2" className="p-1 text-[9px] font-bold text-sky-700">Target Gaps</div>,
        <div key="3" className="p-1 text-[9px] font-bold text-slate-800">Rubric Criteria</div>,
      ],
      highlights: ['Domain Evidence Model', 'Actionable Gap Mapping', 'Company Research Synthesis'],
    },
    {
      step: '03',
      title: 'Practice live simulation',
      description: 'Face realistic anchor questions, dynamic adaptive follow-up probes, and receive mathematically calibrated STAR scoring reports.',
      icon: Award,
      folderColor: '#10b981',
      stepColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      glowColor: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
      folderItems: [
        <div key="1" className="p-1 text-[9px] font-bold text-emerald-800">STAR Score 8.6</div>,
        <div key="2" className="p-1 text-[9px] font-bold text-slate-900">Probing Depth</div>,
        <div key="3" className="p-1 text-[9px] font-bold text-emerald-700">Action Plan</div>,
      ],
      highlights: ['Adaptive Probing Engine', '6-Dimension STAR Scores', 'Detailed Actionable Coaching'],
    },
  ];

  return (
    <section id="how" className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Clean, High-Impact Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
            Targeted interview preparation built around your exact experience and job requirements.
          </p>
        </div>

        {/* Premium Bento Cards Grid with Animated Borders & Soft Dotted Pattern */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
                className="bento-card-wrapper shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="bento-card-content relative overflow-hidden p-6 sm:p-7 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl flex flex-col justify-between h-full group">
                  {/* Soft Dotted Grid Pattern with Radial Mask */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-35 [mask-image:radial-gradient(ellipse_at_top_left,white_60%,transparent_100%)]"
                    style={{
                      backgroundImage: `radial-gradient(currentColor 1.2px, transparent 1.2px)`,
                      backgroundSize: '16px 16px',
                      color: 'rgb(148 163 184 / 0.35)',
                    }}
                  />

                  {/* Corner Ambient Glow */}
                  <div className={`absolute -top-14 -right-14 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-all duration-500 ${item.glowColor}`} />

                  {/* Top Step Number & Icon */}
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black tracking-wider ${item.stepColor}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        <span>STEP {item.step}</span>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 text-foreground-muted group-hover:text-primary flex items-center justify-center transition-colors shadow-xs">
                        <Icon size={17} />
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2 text-left">
                      <h3 className="text-xl font-extrabold text-foreground tracking-tight group-hover:text-primary transition-colors flex items-center gap-1.5">
                        {item.title}
                        <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </h3>
                      <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Signal Feature Pills */}
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {item.highlights.map((h, hIdx) => (
                        <span
                          key={hIdx}
                          className="px-2 py-0.5 rounded-md bg-zinc-100/90 dark:bg-zinc-800/90 text-[11px] font-medium text-foreground-muted border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 3D Interactive Folder Element */}
                  <div className="flex justify-center pt-8 pb-2 relative z-10">
                    <div className="transform transition-transform duration-300 group-hover:scale-105">
                      <Folder
                        color={item.folderColor}
                        size={0.92}
                        items={item.folderItems}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
