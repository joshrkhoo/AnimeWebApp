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
    let upcomingEpisodes = [];
    
    // First, try to get episodes from airingSchedule
    const edges = anime?.airingSchedule?.edges;
    if (edges && edges.length > 0) {
      upcomingEpisodes = edges
        .map((edge) => ({
          // Keep all anime properties
          ...anime,

          // Convert to Date object for consistency (airingAt is in seconds)
          airing_time: edge.node.airingAt ? new Date(edge.node.airingAt * 1000) : null,
          episode: edge.node.episode,
          timeUntilAiring: edge.node.timeUntilAiring,
        }))
        // filter out episodes without airing_time or already aired
        .filter(
          (ep) => ep.airing_time && ep.timeUntilAiring >= 0
        )
        // sort by airing_time
        .sort((a, b) => a.airing_time - b.airing_time);
    }
    
    // If no episodes from airingSchedule, fall back to nextAiringEpisode
    // This handles cases like One Piece where airingSchedule might be empty
    if (upcomingEpisodes.length === 0 && anime?.nextAiringEpisode) {
      const nextEp = anime.nextAiringEpisode;
      if (nextEp.airingAt && nextEp.timeUntilAiring >= 0) {
        upcomingEpisodes = [{
          ...anime,
          // Convert to Date object for consistency (airingAt is in seconds)
          airing_time: new Date(nextEp.airingAt * 1000),
          episode: nextEp.episode,
          timeUntilAiring: nextEp.timeUntilAiring,
        }];
      }
    }

    // Add the next upcoming episode to the schedule
    if (upcomingEpisodes.length > 0) {
      // get the next episode
      const nextEpisode = upcomingEpisodes[0];
      
      // Check if anime already exists in the database
      const checkAndAddAnime = async () => {
        try {
          const response = await fetch(`${API_URL}/checkAnimeExists/${nextEpisode.id}`);
          const data = await response.json();
          
          if (data.exists) {
            console.log(`Anime ${nextEpisode.id} already exists in database, skipping add`);
            return; // Don't add if already in database
          }
          
          // Check if already in schedule state (across all days)
          setSchedule((prevSchedule) => {
            // Check all days for duplicates
            const isDuplicate = Object.values(prevSchedule).some(dayList =>
              dayList.some(a => a.id === nextEpisode.id)
            );
            
            if (isDuplicate) {
              console.log(`Anime ${nextEpisode.id} already in schedule, skipping add`);
              return prevSchedule; // Don't modify if duplicate
            }
            
            // determine the day of the week it airs on
            const airingDay = dayOfWeek(nextEpisode.airing_time);
            
            // Get existing animes for that day or initialize empty array
            const updatedDay = prevSchedule[airingDay]
              ? [...prevSchedule[airingDay]]
              : [];

            updatedDay.push(nextEpisode);
            updatedDay.sort((a, b) => {
              // Handle both Date objects and numbers for sorting
              const timeA = a.airing_time instanceof Date ? a.airing_time.getTime() : a.airing_time;
              const timeB = b.airing_time instanceof Date ? b.airing_time.getTime() : b.airing_time;
              return timeA - timeB;
            });
            
            return {
              ...prevSchedule,
              [airingDay]: updatedDay,
            };
          });
        } catch (err) {
          console.error('Error checking if anime exists:', err);
          // If check fails, still try to add (fail gracefully)
          setSchedule((prevSchedule) => {
            const isDuplicate = Object.values(prevSchedule).some(dayList =>
              dayList.some(a => a.id === nextEpisode.id)
            );
            
            if (isDuplicate) {
              return prevSchedule;
            }
            
            const airingDay = dayOfWeek(nextEpisode.airing_time);
            const updatedDay = prevSchedule[airingDay]
              ? [...prevSchedule[airingDay]]
              : [];

            updatedDay.push(nextEpisode);
            updatedDay.sort((a, b) => {
              const timeA = a.airing_time instanceof Date ? a.airing_time.getTime() : a.airing_time;
              const timeB = b.airing_time instanceof Date ? b.airing_time.getTime() : b.airing_time;
              return timeA - timeB;
            });
            
            return {
              ...prevSchedule,
              [airingDay]: updatedDay,
            };
          });
        }
      };
      
      checkAndAddAnime();
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
        if (anime && anime.id && !animeIds.includes(anime.id)) {
          animeIds.push(anime.id);
        }
      });
    });
    
    // If no anime IDs found, just set empty schedule and mark as loaded
    if (animeIds.length === 0) {
      console.log('No anime in schedule, setting empty schedule');
      setSchedule(updatedSchedule);
      setHasLoaded(true);
      return;
    }
    
    // Fetch latest data for all anime in one batch
    const animeDataList = await fetchAnimeByIds(animeIds);
    if (!Array.isArray(animeDataList)) {
      console.error(
        "Expected array from /fetchAnimeByIds, got:",
        animeDataList
      );
      // Still set the schedule even if fetch fails
      setSchedule(updatedSchedule);
      setHasLoaded(true);
      return;
    }
    animeDataList.forEach((anime) => {
      let upcomingEpisodes = [];
      
      // First, try to get episodes from airingSchedule
      if (anime && anime.airingSchedule && anime.airingSchedule.edges) {
        upcomingEpisodes = anime.airingSchedule.edges
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
      }
      
      // If no episodes from airingSchedule, fall back to nextAiringEpisode
      // This handles cases like One Piece where airingSchedule might be empty
      if (upcomingEpisodes.length === 0 && anime?.nextAiringEpisode) {
        const nextEp = anime.nextAiringEpisode;
        if (nextEp.airingAt && nextEp.timeUntilAiring >= 0) {
          upcomingEpisodes = [{
            ...anime,
            airing_time: new Date(nextEp.airingAt * 1000),
            episode: nextEp.episode,
            timeUntilAiring: nextEp.timeUntilAiring,
          }];
        }
      }
      
      if (upcomingEpisodes.length > 0) {
        const nextEpisode = upcomingEpisodes[0];
        // dayOfWeek expects seconds, so convert Date to seconds if needed
        const airingTimeSeconds = nextEpisode.airing_time instanceof Date
          ? Math.floor(nextEpisode.airing_time.getTime() / 1000)
          : nextEpisode.airing_time;
        const airingDay = dayOfWeek(airingTimeSeconds);
        updatedSchedule[airingDay].push(nextEpisode);
      }
    });
    setSchedule(updatedSchedule);
    setHasLoaded(true);
  };

  // Handler to update schedule from AnimeScheduler
  const handleScheduleChange = (newSchedule) => {
    setSchedule(newSchedule);
  };

  // Handler to delete an anime from the schedule
  const handleDeleteAnime = async (animeId, episode) => {
    try {
      // Ensure animeId is a number (the API expects an integer)
      // Handle various cases: string, number, or string with colon (e.g., "153800:1")
      let id;
      if (typeof animeId === 'string') {
        // If it contains a colon, extract the part before it
        const idPart = animeId.split(':')[0];
        id = parseInt(idPart, 10);
      } else {
        id = Number(animeId);
      }
      
      if (isNaN(id) || id <= 0) {
        console.error('Invalid anime ID:', animeId, 'episode:', episode, 'parsed ID:', id);
        return;
      }

      console.log(`Deleting anime with ID: ${id} (original: ${animeId}, episode: ${episode})`);
      
      // Call the delete API (removes all episodes for this anime ID)
      const url = `${API_URL}/removeAnime/${id}`;
      console.log('DELETE request to:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        // Remove all episodes of this anime from the UI state
        // (API deletes all episodes, so we remove all from UI too)
        setSchedule((prevSchedule) => {
          const updatedSchedule = { ...prevSchedule };
          // Find and remove all episodes of this anime from all days
          Object.keys(updatedSchedule).forEach((day) => {
            updatedSchedule[day] = updatedSchedule[day].filter(
              (anime) => anime.id !== id
            );
          });
          return updatedSchedule;
        });
        console.log(`Anime ${id} deleted successfully`, data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to delete anime:', response.status, errorData);
      }
    } catch (err) {
      console.error('An error occurred while deleting the anime:', err);
    }
  };

  return (
    <div className="main-content">
      <AnimeProvider>
        <h1 className="app-title">Anime Schedule</h1>
        <AnimeSearch onSelectAnime={handleSelectAnime} />
        <AnimeScheduler
          schedule={schedule}
          onScheduleLoaded={handleScheduleLoaded}
          onScheduleChange={handleScheduleChange}
          onDeleteAnime={handleDeleteAnime}
          hasLoaded={hasLoaded}
        />
      </AnimeProvider>
    </div>
  );
};

export default App;
