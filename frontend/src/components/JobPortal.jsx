import React, { useEffect, useState, useMemo } from 'react';
import { ShieldCheck, MapPin, ExternalLink, Activity, Filter, Globe } from 'lucide-react';

export default function JobPortal() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [filterCountry, setFilterCountry] = useState('All');

  useEffect(() => {
    fetch('/api/v1/jobs')
      .then(res => res.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch jobs', err);
        setLoading(false);
      });
  }, []);

  // Compute unique countries from jobs for the dropdown
  const uniqueCountries = useMemo(() => {
    const countries = new Set(jobs.map(j => j.country).filter(Boolean));
    return ['All', ...Array.from(countries).sort()];
  }, [jobs]);

  // Apply filters
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filterCountry !== 'All' && job.country !== filterCountry) return false;
      return true;
    });
  }, [jobs, filterCountry]);

  if (loading) {
    return (
      <div className="portal-loading">
        <Activity className="spin" size={32} />
        <p>Loading verified remote roles...</p>
      </div>
    );
  }

  return (
    <div className="job-portal animate-slide-up">
      <div className="portal-header" style={{ marginBottom: '2rem' }}>
        <h2 className="font-display" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck color="var(--status-success)" />
          Verified <span className="text-gradient">Remote Roles</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Remote roles that passed all six forensic agents. Only listings with Legitimacy ≥ 80 and Remote Quality ≥ 60 appear here — meaning the company is verified, the role is genuinely remote, and the hiring process is professional.</p>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Filter size={16} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Filters:</span>
        </div>
        
        <div className="portal-filter-country">
          <Globe size={14} aria-hidden="true" />
          <select
            className="portal-country-select"
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            aria-label="Filter by country"
          >
            {uniqueCountries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        <div className="portal-filter-count">
          Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
        </div>
      </div>

      {/* Job Grid */}
      <div className="job-grid" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {filteredJobs.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No remote roles match your filters. Try widening your criteria.</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="job-card glass-panel border-success" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 className="font-display" style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{job.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {job.company}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Globe size={14} /> {job.country || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {job.is_remote ? (
                  <span className="badge-success" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(34, 197, 94, 0.1)', color: 'var(--status-success)' }}>
                    100% Remote
                  </span>
                ) : (
                  <span className="badge-warning" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)' }}>
                    In-Office / Hybrid
                  </span>
                )}
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.condensed_description || 'No description available.'}
              </p>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, background: 'rgba(34, 197, 94, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Legitimacy</div>
                  <div className="font-display" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{job.trust_score}<span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/100</span></div>
                </div>
                <div style={{ flex: 1, background: 'rgba(59, 130, 246, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Remote Quality</div>
                  <div className="font-display" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{job.quality_score}<span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/100</span></div>
                </div>
              </div>

              <a 
                href={job.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-primary"
                style={{ width: '100%', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                View Remote Listing <ExternalLink size={16} />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
