import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { BookmarkIcon, CheckIcon, CloseIcon, PlayIcon, PlusIcon } from './Icons';
import { airingDate, countdown, formatDay, formatTime, isUpcoming, premiereLabel, showTitle } from './time';

const FORMATS = { TV: 'TV', TV_SHORT: 'TV short', MOVIE: 'Movie', SPECIAL: 'Special', OVA: 'OVA', ONA: 'ONA', MUSIC: 'Music' };
const STATUSES = {
  RELEASING: 'Airing',
  NOT_YET_RELEASED: 'Not yet aired',
  FINISHED: 'Finished',
  CANCELLED: 'Cancelled',
  HIATUS: 'On hiatus',
};
const titleCase = (value) =>
  value ? value.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : null;

function NextEpisode({ show, now }) {
  const date = airingDate(show);
  if (!date) {
    return <p className="details-next">{show.status === 'NOT_YET_RELEASED' ? premiereLabel(show) : 'Next episode date not announced'}</p>;
  }
  const remaining = countdown(date, now);
  return (
    <p className="details-next">
      <strong>
        {show.nextAiringEpisode.episode === 1 ? 'Premieres' : `Episode ${show.nextAiringEpisode.episode}`}
      </strong>{' '}
      {formatDay(date)}, {formatTime(date)}
      {remaining && <span className="pill pill-accent">in {remaining}</span>}
    </p>
  );
}

function ActionButton({ show, list, now, onAdd, onRemove }) {
  if (list) {
    return (
      <button className="btn btn-secondary" onClick={() => onRemove(show)}>
        <CheckIcon size={16} /> {list === 'wishlist' ? 'On your wishlist' : 'In your schedule'}
        <span className="muted small">· Remove</span>
      </button>
    );
  }
  return isUpcoming(show, now) ? (
    <button className="btn btn-primary" onClick={() => onAdd(show)}>
      <BookmarkIcon size={16} /> Add to wishlist
    </button>
  ) : (
    <button className="btn btn-primary" onClick={() => onAdd(show)}>
      <PlusIcon size={16} /> Add to schedule
    </button>
  );
}

function Synopsis({ text }) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = text.split('\n\n');
  const long = text.length > 420;
  const shown = long && !expanded ? paragraphs.slice(0, 1) : paragraphs;
  return (
    <div className={`details-synopsis ${long && !expanded ? 'is-clamped' : ''}`}>
      {shown.map((p, i) => <p key={i}>{p}</p>)}
      {long && (
        <button className="link" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

/**
 * Side panel with everything about one show. `preview` is the show object the user
 * clicked, rendered straight away while the full details load.
 */
const Details = ({ preview, list, now, onAdd, onRemove, onClose }) => {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const closeRef = useRef(null);
  const show = details || preview;

  useEffect(() => {
    let cancelled = false;
    setDetails(null);
    setError('');
    api
      .details(preview.id)
      .then((d) => !cancelled && setDetails(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [preview.id]);

  // Escape closes; focus moves into the panel and back out when it closes
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const facts = details && [
    ['Format', FORMATS[details.format] || details.format],
    ['Episodes', details.episodes],
    ['Length', details.duration && `${details.duration} min`],
    ['Status', STATUSES[details.status] || titleCase(details.status)],
    ['Season', details.season && `${titleCase(details.season)} ${details.seasonYear}`],
    ['Studio', details.studios.join(', ')],
    ['Source', titleCase(details.source)],
    ['Score', details.averageScore && `${details.averageScore}%`],
  ].filter(([, value]) => value);

  return (
    <div className="details-layer">
      <div className="details-backdrop" onClick={onClose} />
      <aside className="details" role="dialog" aria-modal="true" aria-label={showTitle(show)}>
        <div className="details-banner">
          {(show.bannerImage || show.coverImage.extraLarge) && (
            <img src={show.bannerImage || show.coverImage.extraLarge} alt="" />
          )}
          <button ref={closeRef} className="icon-btn details-close" onClick={onClose} aria-label="Close details">
            <CloseIcon />
          </button>
        </div>

        <div className="details-body">
          <div className="details-head">
            <img className="details-cover" src={show.coverImage.extraLarge} alt="" />
            <div className="details-titles">
              <h2>{showTitle(show)}</h2>
              {show.title.english && show.title.romaji !== show.title.english && (
                <p className="muted">{show.title.romaji}</p>
              )}
            </div>
          </div>

          <NextEpisode show={show} now={now} />

          <div className="details-actions">
            <ActionButton show={show} list={list} now={now} onAdd={onAdd} onRemove={onRemove} />
            {details?.trailerUrl && (
              <a className="btn btn-secondary" href={details.trailerUrl} target="_blank" rel="noreferrer">
                <PlayIcon size={16} /> Trailer
              </a>
            )}
            <a className="btn btn-secondary" href={show.siteUrl} target="_blank" rel="noreferrer">AniList</a>
          </div>

          {error && <p className="notice">{error}</p>}

          <section className="details-section">
            <h3>Where to watch</h3>
            {!details && !error && <div className="skeleton skeleton-row" />}
            {details && details.streaming.length === 0 && (
              <p className="muted small">AniList doesn't list any streaming sites for this show yet.</p>
            )}
            {details && details.streaming.length > 0 && (
              <>
                <ul className="streams">
                  {details.streaming.map((link) => (
                    <li key={link.url}>
                      <a
                        className="stream"
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ '--stream-color': link.color || '#3a3f4b' }}
                      >
                        {link.icon && <img src={link.icon} alt="" />}
                        <span>{link.site}</span>
                        {(link.language || link.notes) && (
                          <span className="stream-note">{link.notes || link.language}</span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="muted small">Availability depends on your region.</p>
              </>
            )}
          </section>

          {show.genres?.length > 0 && (
            <div className="details-genres">
              {show.genres.map((g) => <span key={g} className="pill">{g}</span>)}
            </div>
          )}

          {details?.description && (
            <section className="details-section">
              <h3>Synopsis</h3>
              <Synopsis text={details.description} />
            </section>
          )}

          <section className="details-section">
            <h3>Info</h3>
            {facts ? (
              <dl className="facts">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              !error && <div className="skeleton skeleton-block" />
            )}
          </section>
        </div>
      </aside>
    </div>
  );
};

export default Details;
