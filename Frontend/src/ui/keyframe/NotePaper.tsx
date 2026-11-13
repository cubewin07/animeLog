import React from 'react';
import './NotePaper.css';

export interface NotePaperProps {
  /** Short facts shown in the paper's corner box, such as the episode and date. */
  slate: string[];
  children: React.ReactNode;
}

/** Animator's key-frame paper: peg holes on top, pencil-blue rules, and a corner box for the facts. */
export const NotePaper: React.FC<NotePaperProps> = ({ slate, children }) => (
  <article className="kf-paper">
    <div className="kf-paper-pegs" aria-hidden="true">
      <span className="is-slot" />
      <span className="is-round" />
      <span className="is-slot" />
    </div>
    <ul className="kf-paper-slate" role="list" aria-label="Note details">
      {[...new Set(slate)].map((fact) => (
        <li key={fact}>{fact}</li>
      ))}
    </ul>
    <div className="kf-paper-body">{children}</div>
  </article>
);
