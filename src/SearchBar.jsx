import React, { useEffect, useRef, useState } from 'react';
import { api } from './api';
import { BookmarkIcon, CheckIcon, CloseIcon, PlusIcon, SearchIcon } from './Icons';
import { airingDate, formatDay, formatTime, isUpcoming, premiereLabel, showTitle } from './time';

const SEARCH_DELAY_MS = 300;
const CLOSE_AFTER_ADD_MS = 700;

function nextEpisodeLabel(show) {
  if (show.status === 'NOT_YET_RELEASED') return premiereLabel(show);
  const date = airingDate(show);
  if (!date) return 'Next episode date TBA';
  return `Ep ${show.nextAiringEpisode.episode} · ${formatDay(date)}, ${formatTime(date)}`;
}

function AddButton({ list, upcoming, onClick }) {
  if (list) {
    return (
      <span key={list} className="btn btn-sm btn-added pop">
        <CheckIcon size={14} /> {list === 'wishlist' ? 'Wishlisted' : 'Added'}
      </span>
    );
  }
  return upcoming ? (
    <button type="button" className="btn btn-sm btn-secondary" onClick={onClick}>
      <BookmarkIcon size={14} /> Wishlist
    </button>
  ) : (
    <button type="button" className="btn btn-sm btn-primary" onClick={onClick}>
      <PlusIcon size={14} /> Add
    </button>
  );
}

const SearchBar = ({ listOf, now, onAdd }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const text = query.trim();

  // Debounced search; a newer query aborts the older request
  useEffect(() => {
    if (!text) {
      setResults([]);
      setLoading(false);
      setError('');
      return undefined;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .search(text, controller.signal)
        .then((shows) => {
          setResults(shows);
          setError('');
          setLoading(false);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          setError(err.message);
          setLoading(false);
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text]);

  // Close the dropdown when clicking or tapping anywhere outside it
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (e) => {
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const clear = () => {
    setQuery('');
    setOpen(false);
    inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current.blur();
    }
  };

  // Leave the dropdown up briefly so the "Added" state is visible, then get out of the way
  const closeTimer = useRef();
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  const handleAdd = (show) => {
    onAdd(show);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_AFTER_ADD_MS);
  };

  return (
    <div className="search" ref={containerRef}>
      <div className="search-field">
        <SearchIcon />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search airing anime…"
          aria-label="Search airing anime"
          autoComplete="off"
          spellCheck="false"
        />
        {query && (
          <button type="button" className="icon-btn search-clear" onClick={clear} aria-label="Clear search">
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      {open && text && (
        <div className="search-results">
          {loading && results.length === 0 && <p className="search-status">Searching…</p>}
          {error && <p className="search-status error">{error}</p>}
          {!loading && !error && results.length === 0 && (
            <p className="search-status">No airing shows match “{text}”.</p>
          )}
          {results.length > 0 && (
            <ul>
              {results.map((show) => {
                const list = listOf.get(show.id);
                return (
                  <li key={show.id} className="search-result">
                    <img src={show.coverImage.large} alt="" loading="lazy" />
                    <div className="search-result-text">
                      <span className="search-result-title">{showTitle(show)}</span>
                      <span className="muted small">{nextEpisodeLabel(show)}</span>
                    </div>
                    <AddButton list={list} upcoming={isUpcoming(show, now)} onClick={() => handleAdd(show)} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
