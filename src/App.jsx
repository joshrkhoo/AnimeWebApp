import React, { useState } from "react";
import AnimeSearch from "./AnimeSearch";
import { AnimeProvider } from "./AnimeContext";
import "./AnimeStyle/App.css";
import AnimeScheduler from "./AnimeScheduler";
import { API_URL } from "./config";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TZ = "Australia/Melbourne";

// Helpers
const emptySchedule = () =>
  WEEKDAYS.reduce((acc, d) => ((acc[d] = []), acc), {});

const dayOfWeek = (secs, timeZone = TZ) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone }).format(
    new Date(secs * 1000)
  );

const byAirTime = (a, b) => a.airing_time - b.airing_time;

// Helper: fetch anime details by multiple IDs from backend proxy
async function fetchAnimeByIds(ids) {
  const response = await fetch(`${API_URL}/fetchAnimeByIds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  const data = await response.json();
  return data;
}

const App = () => {
  // Track if the schedule has been loaded from the backend
  const [hasLoaded, setHasLoaded] = useState(false);
  const [schedule, setSchedule] = useState(emptySchedule());

  // Add anime to the correct day in the schedule
  const handleSelectAnime = (anime) => {
    const edges = anime?.airingSchedule?.edges;
    if (!edges) return;

    const upcomingEpisodes = edges
      .map((edge) => ({
        // Keep all anime properties
        ...anime,

        // Keep epoch seconds, not date object
        airing_time: edge.node.airingAt ?? null,
        episode: edge.node.episode,
        timeUntilAiring: edge.node.timeUntilAiring,
      }))
      // filter out episodes without airing_time or already aired
      .filter(
        (ep) => Number.isFinite(ep.airing_time) && ep.timeUntilAiring >= 0
      )
      // sort by airing_time
      .sort(byAirTime);

    // Add the next upcoming episode to the schedule
    if (upcomingEpisodes.length > 0) {
      // get the next episode
      const nextEpisode = upcomingEpisodes[0];
      // determine the day of the week it airs on
      const airingDay = dayOfWeek(nextEpisode.airing_time);

      // Update the schedule state
      setSchedule((prevSchedule) => {
        // Get existing animes for that day or initialize empty array
        const updatedDay = prevSchedule[airingDay]
          ? [...prevSchedule[airingDay]]
          : [];

        // Prevent duplicates
        if (
          !updatedDay.some(
            (a) => a.id === nextEpisode.id && a.episode === nextEpisode.episode
          )
        ) {
          updatedDay.push(nextEpisode);
          updatedDay.sort((a, b) => a.airing_time - b.airing_time);
        }
        return {
          ...prevSchedule,
          [airingDay]: updatedDay,
        };
      });
    }
  };

  // Handler to update schedule when loaded from backend
  const handleScheduleLoaded = async (loadedSchedule) => {
    // For each anime in the loaded schedule, fetch latest data and get the next episode
    const updatedSchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };
    const animeIds = [];
    Object.values(loadedSchedule).forEach((dayList) => {
      dayList.forEach((anime) => {
        if (!animeIds.includes(anime.id)) animeIds.push(anime.id);
      });
    });
    // Fetch latest data for all anime in one batch
    const animeDataList = await fetchAnimeByIds(animeIds);
    if (!Array.isArray(animeDataList)) {
      console.error(
        "Expected array from /fetchAnimeByIds, got:",
        animeDataList
      );
      return;
    }
    animeDataList.forEach((anime) => {
      if (anime && anime.airingSchedule && anime.airingSchedule.edges) {
        const upcomingEpisodes = anime.airingSchedule.edges
          .map((edge) => {
            return {
              ...anime,
              airing_time: edge.node.airingAt
                ? new Date(edge.node.airingAt * 1000)
                : null,
              episode: edge.node.episode,
              timeUntilAiring: edge.node.timeUntilAiring,
            };
          })
          .filter((ep) => ep.airing_time && ep.timeUntilAiring >= 0)
          .sort((a, b) => a.airing_time - b.airing_time);
        if (upcomingEpisodes.length > 0) {
          const nextEpisode = upcomingEpisodes[0];
          const airingDay = dayOfWeek(nextEpisode.airing_time);
          updatedSchedule[airingDay].push(nextEpisode);
        }
      }
    });
    setSchedule(updatedSchedule);
    setHasLoaded(true);
  };

  // Handler to update schedule from AnimeScheduler
  const handleScheduleChange = (newSchedule) => {
    setSchedule(newSchedule);
  };

  return (
    <div className="main-content">
      <AnimeProvider>
        <AnimeSearch onSelectAnime={handleSelectAnime} />
        <AnimeScheduler
          schedule={schedule}
          onScheduleLoaded={handleScheduleLoaded}
          onScheduleChange={handleScheduleChange}
          hasLoaded={hasLoaded}
        />
      </AnimeProvider>
    </div>
  );
};

export default App;
