import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Moon, Sun, UploadCloud } from 'lucide-react'
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

export function cx(...classes: (string | false | undefined)[]) { return classes.filter(Boolean).join(' ') }
export function Button({ children, variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet'; className?: string }) {
  return <button className={cx('button', `button-${variant}`, className)} {...props}>{children}</button>
}
export function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.theme ? localStorage.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.theme = dark ? 'dark' : 'light' }, [dark])
  return <button className="icon-button" aria-label="Toggle colour theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={17}/> : <Moon size={17}/>}</button>
}
export function Logo({ compact = false }: { compact?: boolean }) { return <a className="logo" href="/"><span className="logo-mark">IP</span>{!compact && <span>InterviewPilot</span>}</a> }
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) { return <motion.main initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }} className={className}>{children}</motion.main> }
export function MetricBar({ label, score, detail }: { label: string; score: number; detail?: string }) { return <div className="metric"><div className="metric-head"><span>{label}</span><strong>{detail || `${score.toFixed(1)} / 10`}</strong></div><div className="meter"><motion.i initial={{ width: 0 }} animate={{ width: `${score * 10}%` }} transition={{ duration: .55 }} /></div></div> }
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label> }
export function Select({ children }: { children: ReactNode }) { return <span className="select-wrap"><select>{children}</select><ChevronDown size={15}/></span> }
export function UploadZone({ completed, onUpload }: { completed?: string | boolean; onUpload?: (name: string) => void }) {
  const [dragging, setDragging] = useState(false)
  return <label className={cx('upload-zone', dragging && 'dragging', completed && 'complete')} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) onUpload?.(e.dataTransfer.files[0].name) }}>
    <input type="file" accept=".pdf,.doc,.docx" onChange={e => e.target.files?.[0] && onUpload?.(e.target.files[0].name)} />
    {completed ? <><span className="done-icon"><Check size={17}/></span><div><strong>{completed}</strong><p>Resume parsed · Ready to personalize</p></div></> : <><UploadCloud size={22}/><div><strong>Drop your resume here, or browse</strong><p>PDF or DOCX · up to 10 MB</p></div></>}
  </label>
}
export function Toast({ message }: { message?: string }) { return <AnimatePresence>{message && <motion.div className="toast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{message}</motion.div>}</AnimatePresence> }
