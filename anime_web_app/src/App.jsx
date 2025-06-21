import React, { useState } from 'react';
import AnimeSearch from './AnimeSearch';
import { AnimeProvider } from './AnimeContext';
import './App.css';
import AnimeScheduler from './AnimeScheduler';

const App = () =>{

  const [selectedAnimes, setSelectedAnimes] = useState([]);

  const handleSelectAnime = (anime) => {
    const isAlreadySelected = selectedAnimes.some(selectedAnime => selectedAnime.id === anime.id);

    // If the anime is not already selected, add it to the list of selected animes
    if (!isAlreadySelected) {
      setSelectedAnimes([...selectedAnimes, anime]);
    } else {
      console.log(`Anime with ID ${anime.id} is already selected.`);
    }
  };

  // Handler to update selectedAnimes when schedule is loaded
  const handleScheduleLoaded = (loadedSchedule) => {
    // Flatten the schedule into a list of animes
    const animes = [];
    Object.values(loadedSchedule).forEach(dayList => {
      dayList.forEach(anime => {
        animes.push(anime);
      });
    });
    setSelectedAnimes(animes);
  };

  return(
      <div>
          <AnimeProvider>
            <AnimeSearch onSelectAnime={handleSelectAnime}/>
            <AnimeScheduler selectedAnimes={selectedAnimes} onScheduleLoaded={handleScheduleLoaded}/>
          </AnimeProvider>
      </div>
  )
}

export default App;