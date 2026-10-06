import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthScreen from './AuthScreen';
import Details from './Details';
import { BrowseView, WishlistView } from './Posters';
import SearchBar from './SearchBar';
import { UpNext, WeekView } from './Schedule';
import { api, loadSession, saveSession, setUnauthorizedHandler } from './api';
import { BookmarkIcon, CalendarIcon, LogoutIcon, TvIcon } from './Icons';
import { airingDate, formatDay, formatTime, isUpcoming, premiereLabel, showTitle } from './time';

const REFRESH_MS = 10 * 60 * 1000;
const CLOCK_TICK_MS = 30 * 1000;
const TOAST_MS = 4500;
const EMPTY_LIBRARY = { schedule: [], wishlist: [] };

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

// toast: { title, detail?, image?, kind?, action?: { label, onClick } }
function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);
  const show = useCallback((next) => {
    clearTimeout(timer.current);
    setToast({ kind: 'info', ...next, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast, show, dismiss];
}

const Toast = ({ toast, onDismiss }) => (
  <div key={toast.id} className={`toast toast-${toast.kind}`} role="status">
    {toast.image && <img src={toast.image} alt="" />}
    <div className="toast-text">
      <strong>{toast.title}</strong>
      {toast.detail && <span>{toast.detail}</span>}
    </div>
    {toast.action && (
      <button
        className="toast-action"
        onClick={() => {
          toast.action.onClick();
          onDismiss();
        }}
      >
        {toast.action.label}
      </button>
    )}
  </div>
);

function addedDetail(show, list) {
  if (list === 'wishlist') return `${premiereLabel(show)} · joins your schedule when it airs`;
  const date = airingDate(show);
  if (!date) return 'Next episode date TBA';
  return `Ep ${show.nextAiringEpisode.episode} · ${formatDay(date)}, ${formatTime(date)}`;
}

const without = (library, id) => ({
  schedule: library.schedule.filter((s) => s.id !== id),
  wishlist: library.wishlist.filter((s) => s.id !== id),
});

const Dashboard = ({ user, onLogout }) => {
  const [view, setView] = useState('schedule');
  const [browseTab, setBrowseTab] = useState('airing');
  const [library, setLibrary] = useState(null);
  const [libraryError, setLibraryError] = useState('');
  const [browseLists, setBrowseLists] = useState({});
  const [browseErrors, setBrowseErrors] = useState({});
  const [toast, showToast, dismissToast] = useToast();
  const [detailsShow, setDetailsShow] = useState(null);
  const closeDetails = useCallback(() => setDetailsShow(null), []);
  const pendingAdds = useRef(new Map());
  const now = useNow();

  const loadLibrary = useCallback(() => {
    api
      .library()
      .then(({ schedule, wishlist, promoted }) => {
        setLibrary({ schedule, wishlist });
        setLibraryError('');
        if (promoted.length === 1) {
          showToast({
            kind: 'success',
            title: `${showTitle(promoted[0])} started airing`,
            detail: 'Moved from your wishlist to your schedule',
            image: promoted[0].coverImage.large,
          });
        } else if (promoted.length > 1) {
          showToast({
            kind: 'success',
            title: `${promoted.length} wishlist shows started airing`,
            detail: 'They’ve been moved to your schedule',
          });
        }
      })
      .catch((err) => setLibraryError(err.message));
  }, [showToast]);

  const loadBrowse = useCallback((kind) => {
    setBrowseErrors((prev) => ({ ...prev, [kind]: '' }));
    api
      .browse(kind)
      .then((shows) => setBrowseLists((prev) => ({ ...prev, [kind]: shows })))
      .catch((err) => setBrowseErrors((prev) => ({ ...prev, [kind]: err.message })));
  }, []);

  // Air times move every week, so refresh periodically and when the tab regains focus
  useEffect(() => {
    loadLibrary();
    const timer = setInterval(loadLibrary, REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && loadLibrary();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadLibrary]);

  useEffect(() => {
    if (view === 'browse' && !browseLists[browseTab]) loadBrowse(browseTab);
  }, [view, browseTab, browseLists, loadBrowse]);

  // show id -> 'schedule' | 'wishlist'
  const listOf = useMemo(() => {
    const map = new Map();
    const lib = library || EMPTY_LIBRARY;
    lib.schedule.forEach((s) => map.set(s.id, 'schedule'));
    lib.wishlist.forEach((s) => map.set(s.id, 'wishlist'));
    return map;
  }, [library]);

  const removeShow = async (show, { quiet = false } = {}) => {
    setLibrary((prev) => without(prev || EMPTY_LIBRARY, show.id));
    try {
      // If the add is still in flight, let it land first so the delete isn't overtaken
      await pendingAdds.current.get(show.id)?.catch(() => {});
      await api.removeFromLibrary(show.id);
      if (!quiet) showToast({ title: `Removed ${showTitle(show)}`, image: show.coverImage.large });
    } catch (err) {
      showToast({ kind: 'error', title: err.message });
      loadLibrary();
    }
  };

  // Optimistic: the show appears immediately; the server confirms in the background
  const addShow = async (show) => {
    if (listOf.has(show.id)) return;
    const list = isUpcoming(show, new Date()) ? 'wishlist' : 'schedule';
    setLibrary((prev) => {
      const lib = prev || EMPTY_LIBRARY;
      return { ...lib, [list]: [...lib[list], show] };
    });
    showToast({
      kind: 'success',
      title: list === 'wishlist' ? 'Added to your wishlist' : 'Added to your schedule',
      detail: `${showTitle(show)} · ${addedDetail(show, list)}`,
      image: show.coverImage.large,
      action: { label: 'Undo', onClick: () => removeShow(show, { quiet: true }) },
    });

    const request = api.addToLibrary(show.id);
    pendingAdds.current.set(show.id, request);
    try {
      const { show: saved, list: savedList } = await request;
      setLibrary((prev) => {
        const lib = prev || EMPTY_LIBRARY;
        // Undone while saving: don't bring it back
        if (![...lib.schedule, ...lib.wishlist].some((s) => s.id === show.id)) return lib;
        const rest = without(lib, show.id);
        return { ...rest, [savedList]: [...rest[savedList], saved] };
      });
    } catch (err) {
      setLibrary((prev) => without(prev || EMPTY_LIBRARY, show.id));
      showToast({ kind: 'error', title: `Couldn't add ${showTitle(show)}`, detail: err.message });
    } finally {
      pendingAdds.current.delete(show.id);
    }
  };

  const browseUpcoming = () => {
    setBrowseTab('upcoming');
    setView('browse');
  };

  const counts = { schedule: library?.schedule.length, wishlist: library?.wishlist.length };
  const navItems = [
    { id: 'schedule', label: 'My schedule', icon: <CalendarIcon /> },
    { id: 'wishlist', label: 'Wishlist', icon: <BookmarkIcon /> },
    { id: 'browse', label: 'Browse', icon: <TvIcon /> },
  ];
  const gridProps = { now, listOf, onAdd: addShow, onRemove: removeShow, onOpen: setDetailsShow };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><TvIcon /></span>
          <span className="brand-name">Anime Schedule</span>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'is-active' : ''}`}
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
              {counts[item.id] > 0 && (
                <span key={counts[item.id]} className="nav-count pop">{counts[item.id]}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="user">
          <span className="avatar" aria-hidden="true">{user.username[0].toUpperCase()}</span>
          <span className="user-name">{user.username}</span>
          <button className="icon-btn" onClick={onLogout} aria-label="Log out" title="Log out">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <SearchBar listOf={listOf} now={now} onAdd={addShow} onOpen={setDetailsShow} />
        </header>

        {libraryError && view !== 'browse' && (
          <div className="notice">
            {libraryError} <button className="link" onClick={loadLibrary}>Try again</button>
          </div>
        )}
        {!library && !libraryError && view !== 'browse' && <p className="muted">Loading your shows…</p>}

        {view === 'schedule' && library && (
          <>
            <UpNext shows={library.schedule} now={now} onBrowse={() => setView('browse')} onOpen={setDetailsShow} />
            {library.schedule.length > 0 && (
              <WeekView shows={library.schedule} now={now} onRemove={removeShow} onOpen={setDetailsShow} />
            )}
          </>
        )}

        {view === 'wishlist' && library && (
          <WishlistView shows={library.wishlist} onBrowseUpcoming={browseUpcoming} {...gridProps} />
        )}

        {view === 'browse' && (
          <BrowseView
            tab={browseTab}
            onTab={setBrowseTab}
            lists={browseLists}
            errors={browseErrors}
            onRetry={loadBrowse}
            {...gridProps}
          />
        )}
      </main>

      {detailsShow && (
        <Details
          preview={detailsShow}
          list={listOf.get(detailsShow.id)}
          now={now}
          onAdd={addShow}
          onRemove={removeShow}
          onClose={closeDetails}
        />
      )}

      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </div>
  );
};

const App = () => {
  const [session, setSession] = useState(loadSession);

  const signOut = useCallback(() => {
    saveSession(null);
    setSession(null);
  }, []);

  // Any 401 from the API means the session expired or was revoked
  useEffect(() => {
    setUnauthorizedHandler(signOut);
  }, [signOut]);

  // Confirm a stored session is still valid
  useEffect(() => {
    if (session) api.me().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthenticated = (newSession) => {
    saveSession(newSession);
    setSession(newSession);
  };

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    signOut();
  };

  if (!session) return <AuthScreen onAuthenticated={handleAuthenticated} />;
  return <Dashboard key={session.user.id} user={session.user} onLogout={handleLogout} />;
};

export default App;
