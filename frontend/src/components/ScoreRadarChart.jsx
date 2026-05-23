import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ScoreRadarChart({ trustContributions, qualityContributions, provenanceFlags, trustScore, qualityScore }) {
  if ((!trustContributions || trustContributions.length === 0) && (!qualityContributions || qualityContributions.length === 0)) return null;

  const axesMap = {};
  
  // Map risk deductions (magnitude)
  (trustContributions || []).forEach(c => {
    if (!axesMap[c.agent]) axesMap[c.agent] = { agent: c.agent, 'Risk Deductions': 0, 'Quality Additions': 0 };
    axesMap[c.agent]['Risk Deductions'] = Math.abs(c.pointsContributed);
  });

  // Map quality additions
  (qualityContributions || []).forEach(c => {
    if (!axesMap[c.agent]) axesMap[c.agent] = { agent: c.agent, 'Risk Deductions': 0, 'Quality Additions': 0 };
    axesMap[c.agent]['Quality Additions'] = Math.abs(c.pointsContributed);
  });

  const data = Object.values(axesMap);

  return (
    <div className="radar-container" style={{ width: '100%', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
      <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Dimensional Analysis</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Visualizing the magnitude of risks and strengths</p>

      <div style={{ height: 350, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.15)" />
            <PolarAngleAxis dataKey="agent" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
            
            <Radar name="Risk Deductions" dataKey="Risk Deductions" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
            <Radar name="Quality Additions" dataKey="Quality Additions" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
            
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(10, 10, 12, 0.95)', borderColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
              itemStyle={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}
            />
            <Legend wrapperStyle={{ fontSize: '0.875rem', paddingTop: '1rem' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
