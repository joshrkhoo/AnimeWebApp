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



  return(
      <div>
          <AnimeProvider>
            <AnimeSearch onSelectAnime={handleSelectAnime}/>
            <AnimeScheduler selectedAnimes={selectedAnimes}/>
          </AnimeProvider>
      </div>
  )
}

export default App;