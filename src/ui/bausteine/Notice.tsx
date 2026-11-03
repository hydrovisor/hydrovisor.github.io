// Baustein Notice (design-system/components/Notice.md); danger als alert, sonst status
import type { ReactNode } from 'react';
import { StatusIcon, type Ton } from './StatusIcon.tsx';

interface NoticeProps {
  tone?: Ton;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  /** einzeilig mit der Aktion rechts (Notice.md) */
  kompakt?: boolean;
}

export function Notice({ tone = 'info', title, children, action, kompakt }: NoticeProps) {
  return (
    <div
      className={`hv-notice hv-notice-${tone}${kompakt ? ' hv-notice-kompakt' : ''}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <span className="hv-notice-icon">
        <StatusIcon ton={tone} />
      </span>
      <div className="hv-notice-body">
        {title ? <p className="hv-notice-title">{title}</p> : null}
        {children ? <div className="hv-notice-text">{children}</div> : null}
        {action ? <div className="hv-notice-action">{action}</div> : null}
      </div>
    </div>
  );
}
