// Baustein Card (design-system/components/Card.md)
import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  meta?: string;
  tone?: 'brand';
  footer?: ReactNode;
  children?: ReactNode;
}

export function Card({ title, meta, tone, footer, children }: CardProps) {
  return (
    <section className={tone === 'brand' ? 'hv-card hv-card-brand' : 'hv-card'}>
      {title || meta ? (
        <header className="hv-card-head">
          {title ? <h3 className="hv-card-title">{title}</h3> : null}
          {meta ? <span className="hv-card-meta">{meta}</span> : null}
        </header>
      ) : null}
      {children}
      {footer ? <footer className="hv-card-foot">{footer}</footer> : null}
    </section>
  );
}
