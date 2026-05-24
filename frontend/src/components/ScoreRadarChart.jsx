import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const RISK_AGENTS = [
  { key: 'linguistic', label: 'Linguistic' },
  { key: 'company', label: 'Company' },
  { key: 'opportunity', label: 'Opportunity' },
  { key: 'footprint', label: 'Footprint' },
  { key: 'pattern', label: 'Pattern' },
  { key: 'activity', label: 'Activity' },
];

const QUALITY_AGENTS = [
  { key: 'company', label: 'Company' },
  { key: 'opportunity', label: 'Opportunity' },
  { key: 'activity', label: 'Activity' },
  { key: 'linguistic', label: 'Linguistic' },
];

function contributionMap(contributions) {
  const map = {};
  (contributions || []).forEach((c) => {
    if (c.key && c.key !== 'adversarial') map[c.key] = c;
  });
  return map;
}

function buildSeries(agents, byKey) {
  return agents.map(({ key, label }) => ({
    key,
    label,
    score: typeof byKey[key]?.rawScore === 'number' ? byKey[key].rawScore : 0,
  }));
}

function RadarAxisTick({ x, y, payload, textAnchor, cx, cy }) {
  const dx = x - cx;
  const dy = y - cy;
  const pad = Math.sqrt(dx * dx + dy * dy) > 0 ? 10 : 0;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return (
    <text
      x={x + (dx / len) * pad}
      y={y + (dy / len) * pad}
      textAnchor={textAnchor}
      fill="rgba(255, 255, 255, 0.92)"
      fontSize={12}
      fontWeight={600}
      fontFamily="'Space Grotesk', sans-serif"
    >
      {payload.value}
    </text>
  );
}

function RadarPanel({ title, caption, data, color, fillId }) {
  return (
    <div className="radar-panel">
      <div className="radar-panel-head">
        <h4 className="radar-panel-title">{title}</h4>
        <p className="radar-panel-caption">{caption}</p>
      </div>
      <div className="radar-panel-chart">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="68%" data={data} margin={{ top: 28, right: 36, bottom: 28, left: 36 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.55} />
                <stop offset="100%" stopColor={color} stopOpacity={0.12} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="rgba(255, 255, 255, 0.22)" radialLines={false} />
            <PolarAngleAxis dataKey="label" tick={RadarAxisTick} tickLine={false} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: 'rgba(255, 255, 255, 0.45)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Radar
              name={title}
              dataKey="score"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${fillId})`}
              fillOpacity={1}
              dot={{ r: 4, fill: color, stroke: '#0a0a0c', strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            <Tooltip
              formatter={(value) => [`${value}/100`, title]}
              labelFormatter={(label) => label}
              contentStyle={{
                backgroundColor: 'rgba(10, 10, 12, 0.96)',
                borderColor: 'var(--border-light)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              itemStyle={{ color, fontSize: '0.9rem', fontWeight: 600 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ScoreRadarChart({ trustContributions, qualityContributions }) {
  if ((!trustContributions || trustContributions.length === 0) && (!qualityContributions || qualityContributions.length === 0)) {
    return null;
  }

  const riskByKey = contributionMap(trustContributions);
  const qualityByKey = contributionMap(qualityContributions);
  const riskData = buildSeries(RISK_AGENTS, riskByKey);
  const qualityData = buildSeries(QUALITY_AGENTS, qualityByKey);
  const adversarial = (trustContributions || []).find((c) => c.key === 'adversarial');

  return (
    <div className="radar-container">
      <div className="radar-header">
        <h3 className="radar-title font-display">Remote-Role Signal Radar</h3>
        <p className="radar-subtitle">
          Each agent&apos;s raw 0–100 score. Higher scam risk pushes Legitimacy down; higher quality raises Remote Quality.
        </p>
      </div>

      <div className="radar-dual-grid">
        <RadarPanel
          title="Scam risk by agent"
          caption="0 = clean · 100 = maximum suspicion"
          data={riskData}
          color="#ef4444"
          fillId="radar-risk-fill"
        />
        <RadarPanel
          title="Remote quality by agent"
          caption="0 = weak signals · 100 = strong remote role"
          data={qualityData}
          color="#3b82f6"
          fillId="radar-quality-fill"
        />
      </div>

      {adversarial && (
        <p className="radar-adversarial-note">
          Adversarial review adjustment:{' '}
          <strong className={adversarial.pointsContributed >= 0 ? 'tone-negative' : 'tone-positive'}>
            {adversarial.pointsContributed >= 0 ? '+' : ''}
            {adversarial.pointsContributed} scam-risk pts
          </strong>
          {' '}(shown in ledger, not on radar — not a 0–100 agent score)
        </p>
      )}
    </div>
  );
}
