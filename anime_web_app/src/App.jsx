import React, { useState } from 'react';
import AnimeSearch from './AnimeSearch';
import { AnimeProvider } from './AnimeContext';
import './App.css';
import AnimeScheduler from './AnimeScheduler';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const App = () => {
  // Use schedule as the main state
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  });
  // Track if the schedule has been loaded from the backend
  const [hasLoaded, setHasLoaded] = useState(false);

  // Add anime to the correct day in the schedule
  const handleSelectAnime = (anime) => {
    if (anime.airingSchedule && anime.airingSchedule.edges) {
      const upcomingEpisodes = anime.airingSchedule.edges
        .map(edge => {
          return {
            ...anime,
            airing_time: edge.node.airingAt ? new Date(edge.node.airingAt * 1000) : null,
            episode: edge.node.episode,
            timeUntilAiring: edge.node.timeUntilAiring
          };
        })
        .filter(ep => ep.airing_time && ep.timeUntilAiring >= 0)
        .sort((a, b) => a.airing_time - b.airing_time);

      if (upcomingEpisodes.length > 0) {
        const nextEpisode = upcomingEpisodes[0];
        const airingDay = nextEpisode.airing_time.toLocaleDateString('en-US', { weekday: 'long' });
        setSchedule(prevSchedule => {
          const updatedDay = prevSchedule[airingDay] ? [...prevSchedule[airingDay]] : [];
          // Prevent duplicates
          if (!updatedDay.some(a => a.id === nextEpisode.id && a.episode === nextEpisode.episode)) {
            updatedDay.push(nextEpisode);
            updatedDay.sort((a, b) => a.airing_time - b.airing_time);
          }
          return {
            ...prevSchedule,
            [airingDay]: updatedDay
          };
        });
      }
    }
  };

  // Handler to update schedule when loaded from backend
  const handleScheduleLoaded = (loadedSchedule) => {
    setSchedule(loadedSchedule);
    setHasLoaded(true);
  };

  // Handler to update schedule from AnimeScheduler
  const handleScheduleChange = (newSchedule) => {
    setSchedule(newSchedule);
  };

  return (
    <div>
      <AnimeProvider>
        <AnimeSearch onSelectAnime={handleSelectAnime} />
        <AnimeScheduler schedule={schedule} onScheduleLoaded={handleScheduleLoaded} onScheduleChange={handleScheduleChange} hasLoaded={hasLoaded} />
      </AnimeProvider>
    </div>
  );
};

export default App;