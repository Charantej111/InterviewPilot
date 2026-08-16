import React from 'react';
import { Button } from '../ui/Button';
import { ShiningText } from '../ui/ShiningText';
import { LetterLoader } from '../ui/LetterLoader';
import { CompanyResearchData } from '../../types/companyResearch';
import { 
  Building2, 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

export interface CompanyResearchStepProps {
  companyName: string;
  role: string;
  researchData: CompanyResearchData | null;
  isResearching: boolean;
  onRefreshResearch: () => Promise<void>;
  onContinue: () => void;
  onBack: () => void;
}

export const CompanyResearchStep: React.FC<CompanyResearchStepProps> = ({
  companyName,
  role,
  researchData,
  isResearching,
  onRefreshResearch,
  onContinue,
  onBack,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Section Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
          <Building2 size={13} className="text-zinc-500" />
          <span>Stage 3 of 6 • Company Intelligence & Context</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          <ShiningText text={`Live Intelligence: ${companyName}`} />
        </h2>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Researched using authoritative company platforms, engineering blogs, and verified news. Clearly partitions verified facts from strategic role inferences.
        </p>
      </div>

      {/* Researching State */}
      {isResearching && (
        <div className="p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-xs animate-fadeIn">
          <LetterLoader text={`Researching ${companyName}`} size="md" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground text-xs font-semibold border border-zinc-200 dark:border-zinc-700">
            <Globe size={13} className="text-blue-500 animate-spin" />
            <span>Retrieving authoritative sources, business models, and interview signals...</span>
          </div>
        </div>
      )}

      {/* Research Data Dossier */}
      {researchData && !isResearching && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header Status Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground truncate max-w-[280px]">
                    {researchData.companyName} Intelligence Brief
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold uppercase">
                    Verified Sources
                  </span>
                </div>
                <p className="text-[11px] text-foreground-muted font-medium">
                  Researched at {new Date(researchData.researchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {researchData.sources.length} Verified Sources
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onRefreshResearch}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground-muted hover:text-foreground transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw size={13} />
              <span>Re-run Intelligence</span>
            </button>
          </div>

          {/* Dossier Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
            {/* Overview & Business Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-500" />
                  <span>Company Overview</span>
                </h4>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {researchData.overview}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span>Business Model & Revenue</span>
                </h4>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {researchData.businessModel}
                </p>
              </div>
            </div>

            {/* Core Product Lines */}
            {researchData.products && researchData.products.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Layers size={14} className="text-zinc-500" />
                  <span>Main Products & Platforms</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {researchData.products.map((prod, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700"
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Facts vs Strategic Inferences */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {/* Verified Facts */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>Verified Facts ({researchData.verifiedFacts.length})</span>
                </h4>
                <div className="space-y-2">
                  {researchData.verifiedFacts.map((vf, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1"
                    >
                      <p className="text-foreground font-medium">{vf.fact}</p>
                      <a
                        href={vf.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <span>Official Source Link</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Role Inferences */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-500" />
                  <span>Strategic Inferences for {role}</span>
                </h4>
                <div className="space-y-2">
                  {researchData.strategicInferences.map((inf, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 text-xs space-y-1"
                    >
                      <p className="text-foreground font-semibold">{inf.inference}</p>
                      <p className="text-[11px] text-foreground-muted">{inf.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Unavailable Information Banner (Zero Hallucination Guardrail) */}
            {researchData.unavailableInformation && researchData.unavailableInformation.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 text-[11px] uppercase tracking-wide">
                  <AlertTriangle size={13} />
                  <span>Unavailable Information (Not Fabricated)</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-foreground-muted text-[11px]">
                  {researchData.unavailableInformation.map((unavail, i) => (
                    <li key={i}>{unavail}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Citations & Sources */}
            {researchData.sources && researchData.sources.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <Globe size={13} />
                  <span>Authoritative Sources</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {researchData.sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-medium text-foreground transition-colors border border-zinc-200 dark:border-zinc-700"
                    >
                      <span className="truncate max-w-[200px]">{src.title}</span>
                      <ExternalLink size={11} className="text-foreground-muted shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" size="md" onClick={onBack} leftIcon={<ArrowLeft size={15} />}>
              Back to Job Description
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={onContinue}
              rightIcon={<ArrowRight size={16} />}
              className="w-full sm:w-auto"
            >
              Continue to Gap Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyResearchStep;
