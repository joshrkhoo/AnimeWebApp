import React from 'react';
import { BookmarkIcon, CheckIcon, PlusIcon } from './Icons';
import { airingDate, countdown, isUpcoming, premiereLabel, showTitle } from './time';

function caption(show, now) {
  if (show.status === 'NOT_YET_RELEASED') return premiereLabel(show);
  const date = airingDate(show);
  if (!date) return 'Next episode TBA';
  const remaining = countdown(date, now);
  return `Ep ${show.nextAiringEpisode.episode}${remaining ? ` in ${remaining}` : ''}`;
}

const SAVED = {
  schedule: { label: 'In schedule', icon: <CheckIcon size={16} /> },
  wishlist: { label: 'On wishlist', icon: <BookmarkIcon size={16} filled /> },
};

/**
 * Poster cards. Clicking a poster adds it; the corner button adds or removes.
 * `listOf` maps show id -> 'schedule' | 'wishlist' for saved shows.
 */
export const PosterGrid = ({ shows, now, listOf, onAdd, onRemove }) => (
  <ul className="poster-grid">
    {shows.map((show) => {
      const list = listOf.get(show.id);
      const upcoming = isUpcoming(show, now);
      const title = showTitle(show);
      const addLabel = upcoming ? `Add ${title} to wishlist` : `Add ${title} to schedule`;
      return (
        <li key={show.id} className={`poster ${list ? `is-saved is-${list}` : ''}`}>
          <div className="poster-img" style={{ '--poster-color': show.coverImage.color || '#222' }}>
            {/* Mouse/touch shortcut; keyboard users use the corner button */}
            <button
              className="poster-cover"
              onClick={() => !list && onAdd(show)}
              tabIndex={-1}
              aria-hidden="true"
            >
              <img src={show.coverImage.extraLarge} alt="" loading="lazy" />
            </button>
            {list && (
              <span key={list} className="poster-badge pop">
                {SAVED[list].icon} {SAVED[list].label}
              </span>
            )}
            <button
              className="poster-btn"
              onClick={() => (list ? onRemove(show) : onAdd(show))}
              aria-label={list ? `Remove ${title} from ${list}` : addLabel}
              title={list ? `Remove from ${list}` : upcoming ? 'Add to wishlist' : 'Add to schedule'}
            >
              <span key={list || 'none'} className="pop">
                {list ? SAVED[list].icon : upcoming ? <BookmarkIcon size={16} /> : <PlusIcon size={16} />}
              </span>
            </button>
          </div>
          <span className="poster-title">{title}</span>
          <span className="small muted">{caption(show, now)}</span>
        </li>
      );
    })}
  </ul>
);

const TABS = [
  { id: 'airing', label: 'Airing now', note: 'The most popular shows airing this season' },
  { id: 'upcoming', label: 'Upcoming', note: 'Wishlist a show and it joins your schedule when it starts airing' },
];

export const BrowseView = ({ tab, onTab, lists, errors, onRetry, ...gridProps }) => {
  const active = TABS.find((t) => t.id === tab);
  return (
    <section>
      <div className="section-head">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tab}
              className={`tab ${t.id === tab ? 'is-active' : ''}`}
              onClick={() => onTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="muted small">{active.note}</span>
      </div>

      {errors[tab] && (
        <div className="notice">
          {errors[tab]} <button className="link" onClick={() => onRetry(tab)}>Try again</button>
        </div>
      )}
      {!lists[tab] && !errors[tab] && <p className="muted">Loading…</p>}
      {lists[tab] && <PosterGrid shows={lists[tab]} {...gridProps} />}
    </section>
  );
};

export const WishlistView = ({ shows, onBrowseUpcoming, ...gridProps }) => (
  <section>
    <div className="section-head">
      <h3>Wishlist</h3>
      <span className="muted small">Shows move to your schedule automatically when they start airing</span>
    </div>
    {shows.length ? (
      <PosterGrid shows={shows} {...gridProps} />
    ) : (
      <div className="empty">
        <BookmarkIcon size={28} />
        <p>Nothing on your wishlist yet.</p>
        <p className="muted small">Save shows that haven't started yet, and they'll appear on your schedule once they air.</p>
        <button className="btn btn-primary" onClick={onBrowseUpcoming}>Browse upcoming shows</button>
      </div>
    )}
  </section>
);
