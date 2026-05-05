import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GlassPanel({ children, className = '' }: Props) {
  return (
    <div className={`bg-[#16213e]/80 backdrop-blur-sm border border-[#1e3a5f]/60 rounded-xl ${className}`}>
      {children}
    </div>
  );
}
