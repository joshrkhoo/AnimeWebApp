import React from 'react';
import { CloseIcon, TvIcon } from './Icons';
import { airingDate, buildWeek, countdown, formatDay, formatTime, showTitle } from './time';

// Big banner for the soonest upcoming episode
export const UpNext = ({ shows, now, onBrowse, onOpen }) => {
  const next = shows
    .filter((s) => s.nextAiringEpisode && airingDate(s) > now)
    .sort((a, b) => a.nextAiringEpisode.airingAt - b.nextAiringEpisode.airingAt)[0];

  if (!next) {
    return (
      <section className="hero hero-empty">
        <div className="hero-content">
          <span className="eyebrow">Your schedule</span>
          <h2>{shows.length ? 'Nothing with an air date yet' : 'Build your weekly schedule'}</h2>
          <p className="muted">Search for a show above, or pick from what's airing this season.</p>
          <button className="btn btn-primary" onClick={onBrowse}>
            <TvIcon size={16} /> Browse airing now
          </button>
        </div>
      </section>
    );
  }

  const date = airingDate(next);
  return (
    <section className="hero">
      <img className="hero-bg" src={next.bannerImage || next.coverImage.extraLarge} alt="" />
      <div className="hero-content">
        <span className="eyebrow">Up next</span>
        <h2>{showTitle(next)}</h2>
        <p className="hero-meta">
          Episode {next.nextAiringEpisode.episode} · {formatDay(date)}, {formatTime(date)}
        </p>
        <div className="hero-row">
          <span className="pill pill-accent">in {countdown(date, now)}</span>
          {next.genres.slice(0, 3).map((g) => (
            <span key={g} className="pill">{g}</span>
          ))}
        </div>
        <button className="btn btn-secondary hero-btn" onClick={() => onOpen(next)}>
          Details & where to watch
        </button>
      </div>
    </section>
  );
};

const ShowCard = ({ show, now, onRemove, onOpen, showDate }) => {
  const date = airingDate(show);
  const remaining = date && countdown(date, now);
  return (
    <li className="show-card">
      <button className="show-card-open" onClick={() => onOpen(show)} aria-label={`Details for ${showTitle(show)}`}>
        <img src={show.coverImage.large} alt="" loading="lazy" />
      </button>
      <div className="show-card-text">
        <button className="show-card-title" onClick={() => onOpen(show)}>
          {showTitle(show)}
        </button>
        {date ? (
          <>
            <span className="small">
              Ep {show.nextAiringEpisode.episode} · {showDate ? `${formatDay(date)}, ` : ''}{formatTime(date)}
            </span>
            <span className={`small ${remaining ? 'muted' : 'accent'}`}>
              {remaining ? `in ${remaining}` : 'Just aired'}
            </span>
          </>
        ) : (
          <span className="small muted">Date TBA</span>
        )}
      </div>
      <button
        className="icon-btn show-card-remove"
        onClick={() => onRemove(show)}
        aria-label={`Remove ${showTitle(show)}`}
        title="Remove from schedule"
      >
        <CloseIcon size={14} />
      </button>
    </li>
  );
};

export const WeekView = ({ shows, now, onRemove, onOpen }) => {
  const { days, later, tba } = buildWeek(shows, now);
  const extra = [...later, ...tba];

  return (
    <section>
      <div className="section-head">
        <h3>This week</h3>
        <span className="muted small">Times in your timezone</span>
      </div>
      <div className="week">
        {days.map((day, i) => (
          <div key={day.label} className={`day ${i === 0 ? 'day-today' : ''} ${day.shows.length ? '' : 'day-empty'}`}>
            <div className="day-head">
              <span className="day-name">{day.label}</span>
              <span className="day-date">{day.date.toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
            </div>
            {day.shows.length ? (
              <ul>
                {day.shows.map((show) => (
                  <ShowCard key={show.id} show={show} now={now} onRemove={onRemove} onOpen={onOpen} />
                ))}
              </ul>
            ) : (
              <p className="day-none">Nothing airing</p>
            )}
          </div>
        ))}
      </div>

      {extra.length > 0 && (
        <>
          <div className="section-head">
            <h3>Coming later</h3>
            <span className="muted small">Next episode is more than a week away, or not announced</span>
          </div>
          <ul className="later">
            {extra.map((show) => (
              <ShowCard key={show.id} show={show} now={now} onRemove={onRemove} onOpen={onOpen} showDate />
            ))}
          </ul>
        </>
      )}
    </section>
  );
};
