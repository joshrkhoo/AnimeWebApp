import React, { useState } from 'react';
import AnimeSearch from './AnimeSearch';
import { AnimeProvider } from './AnimeContext';
import './App.css';
import AnimeScheduler from './AnimeScheduler';

const App = () =>{

  const [selectedAnimes, setSelectedAnimes] = useState([]);

  const handleSelectAnime = (anime) => {
    console.log('Selected anime:', anime); // Debug log
    setSelectedAnimes((prevSelectedAnimes) => [...prevSelectedAnimes, anime]);
    console.log('Selected animes:', selectedAnimes); // Debug log
  }



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