import React from 'react';
import AnimeSearch from './AnimeSearch';
import { AnimeProvider } from './AnimeContext';
import './App.css';

const App = () =>{
  return(
      <div>
          <AnimeProvider>
            <AnimeSearch/>
          </AnimeProvider>
      </div>
  )
}

export default App;