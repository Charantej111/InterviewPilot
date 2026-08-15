import React, { useState } from 'react';
import './Folder.css';
import { FileText, TrendingUp, Sparkles } from 'lucide-react';

const darkenColor = (hex: string, percent: number) => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(color.slice(0, 6), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export interface FolderProps {
  color?: string;
  size?: number;
  items?: (React.ReactNode | string)[];
  className?: string;
  onToggle?: (isOpen: boolean) => void;
}

export const Folder: React.FC<FolderProps> = ({
  color = '#635BFF',
  size = 1,
  items = [],
  className = '',
  onToggle,
}) => {
  const maxItems = 3;
  const papers = items.slice(0, maxItems);
  while (papers.length < maxItems) {
    papers.push(null);
  }

  const [open, setOpen] = useState(false);

  const folderBackColor = darkenColor(color, 0.15);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !open;
    setOpen(nextState);
    if (onToggle) onToggle(nextState);
  };

  const folderStyle = {
    '--folder-color': color,
    '--folder-back-color': folderBackColor,
  } as React.CSSProperties;

  const folderClassName = `folder ${open ? 'open' : ''}`.trim();
  const scaleStyle = { transform: `scale(${size})` };

  const defaultCards = [
    <div key="1" className="w-full h-full flex flex-col items-center justify-between p-1">
      <div className="w-full h-1 rounded-full bg-indigo-500 mb-1" />
      <FileText className="w-4 h-4 text-indigo-600 mb-0.5" />
      <span className="text-[9px] font-bold text-slate-900 leading-tight">PM Experience</span>
      <span className="text-[8px] font-medium text-slate-500">Stripe Onboarding</span>
    </div>,
    <div key="2" className="w-full h-full flex flex-col items-center justify-between p-1">
      <div className="w-full h-1 rounded-full bg-emerald-500 mb-1" />
      <TrendingUp className="w-4 h-4 text-emerald-600 mb-0.5" />
      <span className="text-[9px] font-extrabold text-emerald-700 leading-tight">+42% Growth</span>
      <span className="text-[8px] font-medium text-slate-500">Conversion Metric</span>
    </div>,
    <div key="3" className="w-full h-full flex flex-col items-center justify-between p-1">
      <div className="w-full h-1 rounded-full bg-purple-500 mb-1" />
      <Sparkles className="w-4 h-4 text-purple-600 mb-0.5" />
      <span className="text-[9px] font-bold text-purple-700 leading-tight">Key Skills</span>
      <span className="text-[8px] font-medium text-slate-500">React · Strategy</span>
    </div>,
  ];

  return (
    <div style={scaleStyle} className={`folder-wrapper ${className}`.trim()}>
      <div
        className={folderClassName}
        style={folderStyle}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        aria-label={open ? 'Close folder' : 'Open folder'}
      >
        <div className="folder__back">
          {papers.map((item, i) => (
            <div key={i} className={`paper paper-${i + 1}`}>
              {item || defaultCards[i]}
            </div>
          ))}
          <div className="folder__front"></div>
        </div>
      </div>
    </div>
  );
};

export default Folder;
