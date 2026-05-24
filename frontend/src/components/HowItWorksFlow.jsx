import React from 'react';
import {
  ShieldCheck,
  Link2,
  Microscope,
  ListChecks,
  Users,
  ArrowRight,
} from 'lucide-react';

const STEPS = [
  {
    icon: ShieldCheck,
    title: 'Browse vetted jobs',
    body: 'The job portal lists remote roles that already passed Wadjet. Legitimacy and quality were checked before they were added.',
    accent: 'success',
  },
  {
    icon: Link2,
    title: 'Paste a new listing',
    body: 'Found a job elsewhere? Paste the URL above (or use the Chrome extension on LinkedIn). Wadjet runs a fresh investigation on that posting.',
    accent: 'gold',
  },
  {
    icon: Microscope,
    title: 'Get a transparent analysis',
    body: 'Six AI agents verify the company, remote status, pay, and hiring process. You see every score, guardrail, and calculation step.',
    accent: 'blue',
  },
  {
    icon: ListChecks,
    title: 'Quality jobs join the portal',
    body: 'Listings with Legitimacy ≥ 80 and Remote Quality ≥ 60 are saved to the verified job portal for everyone to browse.',
    accent: 'success',
  },
  {
    icon: Users,
    title: 'Help others apply smarter',
    body: 'When you verify a strong role, you are not just protecting yourself. You add another trusted option for the community.',
    accent: 'purple',
  },
];

const SUMMARY_POINTS = [
  {
    label: 'Start here',
    text: 'Browse the job portal for roles other people already verified.',
  },
  {
    label: 'Go deeper',
    text: 'Paste a new URL when you want a full investigation with transparent scores.',
  },
  {
    label: 'Pay it forward',
    text: 'Strong listings are added to the portal so the next person starts ahead.',
  },
];

export default function HowItWorksFlow({ onOpenPortal }) {
  return (
    <section className="how-it-works" aria-labelledby="how-it-works-title">
      <div className="how-it-works-header">
        <h2 id="how-it-works-title" className="how-it-works-title font-display">
          How Wadjet works
        </h2>
        <p className="how-it-works-lead">
          A shared pool of verified remote jobs, plus deep analysis whenever you find something new.
        </p>
      </div>

      <div className="how-it-works-flow">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === STEPS.length - 1;
          return (
            <React.Fragment key={step.title}>
              <article className={`how-step how-step-${step.accent}`}>
                <div className="how-step-icon-wrap">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <span className="how-step-num">Step {index + 1}</span>
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-body">{step.body}</p>
                {index === 0 && onOpenPortal && (
                  <button type="button" className="how-step-link" onClick={onOpenPortal}>
                    Open job portal
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </article>
              {!isLast && (
                <div className="how-step-connector" aria-hidden="true">
                  <ArrowRight className="how-connector-arrow how-connector-horizontal" size={20} />
                  <ArrowRight className="how-connector-arrow how-connector-vertical" size={20} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="how-it-works-summary glass-panel">
        <p className="how-summary-eyebrow">In short</p>
        <ul className="how-summary-list">
          {SUMMARY_POINTS.map((point) => (
            <li key={point.label} className="how-summary-list-item">
              <strong>{point.label}.</strong> {point.text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
