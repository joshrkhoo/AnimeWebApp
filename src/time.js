// Times are shown in the viewer's own timezone.

const DAY_MS = 24 * 60 * 60 * 1000;

// Matches the backend: upcoming shows stay on the wishlist until they're a week out
const WISHLIST_WINDOW_MS = 7 * DAY_MS;

export const showTitle = (show) => show.title.english || show.title.romaji;

export const airingDate = (show) =>
  show.nextAiringEpisode ? new Date(show.nextAiringEpisode.airingAt * 1000) : null;

export function formatTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDay(date) {
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

// "3d 4h", "5h 20m", "12m", or null once it has aired
export function countdown(date, now) {
  const minutes = Math.floor((date - now) / 60000);
  if (minutes < 0) return null;
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${Math.max(minutes, 1)}m`;
}

export function isUpcoming(show, now) {
  if (show.status !== 'NOT_YET_RELEASED') return false;
  const date = airingDate(show);
  return !date || date - now > WISHLIST_WINDOW_MS;
}

// "Premieres Tue, 20 Oct", "Premieres Jan 2027", "Premieres 2027" or "Premiere date TBA"
export function premiereLabel(show) {
  const date = airingDate(show);
  if (date && show.nextAiringEpisode.episode === 1) return `Premieres ${formatDay(date)}`;
  if (date) return `Ep ${show.nextAiringEpisode.episode} · ${formatDay(date)}`;
  const { year, month, day } = show.startDate || {};
  if (year && month && day) return `Premieres ${formatDay(new Date(year, month - 1, day))}`;
  if (year && month) {
    return `Premieres ${new Date(year, month - 1).toLocaleDateString([], { month: 'short', year: 'numeric' })}`;
  }
  if (year) return `Premieres ${year}`;
  return 'Premiere date TBA';
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Groups shows into the 7 days starting today, plus `later` (airs after this week)
 * and `tba` (no announced date). Each day's shows are sorted by airing time.
 */
export function buildWeek(shows, now) {
  const today = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    let label = date.toLocaleDateString([], { weekday: 'long' });
    if (i === 0) label = 'Today';
    if (i === 1) label = 'Tomorrow';
    return { date, label, shows: [] };
  });
  const later = [];
  const tba = [];

  for (const show of shows) {
    const date = airingDate(show);
    if (!date) {
      tba.push(show);
      continue;
    }
    // AniList can lag a little after an episode airs; keep those on today
    const offset = Math.max(0, Math.round((startOfDay(date) - today) / DAY_MS));
    if (offset < 7) days[offset].shows.push(show);
    else later.push(show);
  }

  const byTime = (a, b) => a.nextAiringEpisode.airingAt - b.nextAiringEpisode.airingAt;
  days.forEach((day) => day.shows.sort(byTime));
  later.sort(byTime);
  return { days, later, tba };
}
