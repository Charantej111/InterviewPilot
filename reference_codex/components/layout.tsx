import { Menu, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Button, Logo, ThemeToggle } from './ui'

export function MarketingNav() { const [open, setOpen] = useState(false); return <header className="marketing-nav"><Logo/><nav className={open ? 'open' : ''}><a href="#how">How it works</a><a href="#features">Features</a><a href="#pricing">Pricing</a><NavLink to="/login">Sign in</NavLink><NavLink to="/setup"><Button>Start practicing</Button></NavLink></nav><div className="nav-tools"><ThemeToggle/><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Open menu">{open ? <X/> : <Menu/>}</button></div></header> }
const nav = [['/dashboard', 'Overview'], ['/setup', 'New interview'], ['/settings', 'Settings']]
export function AppShell({ children }: { children: ReactNode }) { return <div className="app-shell"><aside><Logo/><div className="side-nav">{nav.map(([path, text]) => <NavLink key={path} to={path}>{text}</NavLink>)}</div><div className="aside-bottom"><ThemeToggle/><span>© 2026 InterviewPilot</span></div></aside><div className="workspace"><header className="workspace-mobile"><Logo compact/><ThemeToggle/></header>{children}</div></div> }
