import React from 'react';
import { Briefcase, Building2, MapPin, DollarSign, Clock, Users, ExternalLink, RefreshCw, User } from 'lucide-react';

/**
 * Compact header card that summarizes the actual remote role being verified.
 * Sits between the live investigation board and the final verdict so the user
 * always has context for what the verdict applies to.
 *
 * All fields are optional — if `jobData` is null or a field is missing, that
 * row is skipped instead of showing a blank "Unknown" placeholder.
 */
export default function JobInfoCard({ jobData, url, applicantCountText }) {
  if (!jobData && !url) return null;

  const title = jobData?.jobTitle?.trim() || 'Untitled remote role';
  const company = jobData?.companyName?.trim();
  const country = jobData?.country?.trim();
  const salaryText = jobData?.salaryText?.trim();
  const salaryBand = jobData?.salaryRangeDisclosed ? (jobData?.salaryRangeText || salaryText) : null;
  const daysOld = typeof jobData?.daysOld === 'number' ? jobData.daysOld : null;
  const isRepost = !!jobData?.isRepost;
  const applicants = applicantCountText || jobData?.applicantCountText;
  const poster = jobData?.jobPoster;

  let host = null;
  try { host = url ? new URL(url).hostname.replace(/^www\./, '') : null; } catch { host = null; }

  const postedLabel = daysOld === null
    ? null
    : daysOld === 0
      ? 'Posted today'
      : daysOld === 1
        ? 'Posted yesterday'
        : daysOld < 30
          ? `Posted ${daysOld} days ago`
          : daysOld < 365
            ? `Posted ~${Math.round(daysOld / 30)} months ago`
            : `Posted >1 year ago`;

  return (
    <div className="job-info-card glass-panel animate-slide-up">
      <div className="job-info-head">
        <div className="job-info-title-row">
          <Briefcase size={20} className="job-info-title-icon" />
          <div className="job-info-title-text">
            <h2 className="job-info-title font-display">{title}</h2>
            {company && (
              <div className="job-info-subtitle">
                <Building2 size={14} />
                <span>{company}</span>
                {country && (
                  <>
                    <span className="job-info-dot">·</span>
                    <MapPin size={14} />
                    <span>{country}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="job-info-source-link"
            title={url}
          >
            <ExternalLink size={14} />
            <span>{host || 'Source'}</span>
          </a>
        )}
      </div>

      {/* Compact fact strip */}
      <div className="job-info-facts">
        {salaryBand && (
          <span className="job-info-fact">
            <DollarSign size={14} />
            <span className="job-info-fact-text">{salaryBand}</span>
          </span>
        )}
        {!salaryBand && salaryText && (
          <span className="job-info-fact">
            <DollarSign size={14} />
            <span className="job-info-fact-text">{salaryText}</span>
          </span>
        )}
        {postedLabel && (
          <span className="job-info-fact">
            <Clock size={14} />
            <span className="job-info-fact-text">{postedLabel}{isRepost ? ' · reposted' : ''}</span>
          </span>
        )}
        {applicants && (
          <span className="job-info-fact">
            <Users size={14} />
            <span className="job-info-fact-text">{applicants}</span>
          </span>
        )}
        {typeof jobData?.requiredSkillsCount === 'number' && jobData.requiredSkillsCount > 0 && (
          <span className="job-info-fact">
            <span className="job-info-fact-text">
              {jobData.requiredSkillsCount} required skill{jobData.requiredSkillsCount === 1 ? '' : 's'}
              {typeof jobData?.niceToHaveSkillsCount === 'number' && jobData.niceToHaveSkillsCount > 0
                ? ` · ${jobData.niceToHaveSkillsCount} nice-to-have`
                : ''}
            </span>
          </span>
        )}
        {jobData?.wfhStipendMentioned && (
          <span className="job-info-fact job-info-fact-success">
            <RefreshCw size={14} />
            <span className="job-info-fact-text">WFH stipend mentioned</span>
          </span>
        )}
      </div>

      {/* Poster (LinkedIn) */}
      {poster && (poster.name || poster.headline) && (
        <div className="job-info-poster">
          <User size={14} />
          <span className="job-info-poster-text">
            <strong>{poster.name || 'Unknown poster'}</strong>
            {poster.headline ? ` — ${poster.headline}` : ''}
          </span>
          {poster.profileUrl && (
            <a
              href={poster.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="job-info-poster-link"
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}

      {/* Condensed description (truncated) */}
      {jobData?.condensedDescription && (
        <p className="job-info-description">{jobData.condensedDescription}</p>
      )}
    </div>
  );
}
