import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does InterviewPilot generate role-specific questions?',
      a: 'We parse your uploaded resume and the target job description to build a custom interview graph. The AI identifies key skill gaps, prior project metrics, and role requirements to simulate realistic interviewer prompts and behavioral challenges.',
    },
    {
      q: 'How do the adaptive follow-up questions work?',
      a: 'Just like in an actual hiring round, if your answer mentions an interesting metric or glosses over a technical decision, the interviewer dynamically probes that point before moving to the next broad topic.',
    },
    {
      q: 'Is my resume and audio data kept private?',
      a: 'Yes. We adhere to strict data isolation standards. Your resumes, job descriptions, audio recordings, and evaluation metrics are never used to train public models.',
    },
    {
      q: 'Can I practice both voice and text answers?',
      a: 'Yes. You can speak naturally using your microphone to simulate a live video/phone screen, or type structured text if you want to practice asynchronous written assessments.',
    },
    {
      q: 'What roles does InterviewPilot support?',
      a: 'InterviewPilot supports Product Management, Software Engineering, Data Science, System Design, UX Design, Business Operations, Product Marketing, and General Behavioral loops across all seniority levels.',
    },
  ];

  return (
    <section className="py-20 border-t border-border/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Everything you need to know.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-border/80 bg-surface overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-medium text-sm text-foreground hover:text-primary transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-foreground-subtle transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-4 pb-4 pt-1 text-xs text-foreground-muted leading-relaxed border-t border-border/40">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
