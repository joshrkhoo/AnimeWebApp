import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AnimeContext } from './AnimeContext';
import _ from 'lodash';
import { formatDistanceToNow, isPast, isFuture } from 'date-fns';

const AnimeSearch = () => {
  // Get the animeTitle, setAnimeTitle, animeData, error, and fetchAnimeData from the AnimeContext
  const { animeTitle, setAnimeTitle, animeData, error, fetchAnimeData } = useContext(AnimeContext);
  const [selectedAnimes, setSelectedAnimes] = useState([]);


  // Debounce the fetchAnimeData function
    // This will prevent the fetchAnimeData function from being called too frequently when the user types quickly
        // 300ms is the delay between each call
  const debouncedFetchAnimeData = useCallback(
    _.debounce((title) => {
        console.log('Debounced fetchAnimeData called with title:', title); // Debug log
        fetchAnimeData(title);
    }, 250),
    []
  );



  const handleInputChange = (e) => {
    /*
    Handles input change for the anime title within the search bar
    called when the input field changes

    Debounces the fetchAnimeData function to prevent it from being called too frequently
    */
    const title = e.target.value;
    setAnimeTitle(title);
    console.log('Input changed:', title); // Debug log
    debouncedFetchAnimeData(title);
  };


  const handleSubmit = (e) => {
    /*
    Handles form submission
    called when the form is submitted
    */


    e.preventDefault();
    fetchAnimeData(animeTitle);
  };

  // Function to handle selecting an anime
  const handleSelectAnime = (anime) => {
    setSelectedAnimes([...selectedAnimes, anime]);
  }



  console.log('Rendering AnimeSearch component'); // Debugging log

  
  const formatTimeUntilAiring = (timeInSeconds) => {
    /* 
    This Function takes a time in seconds and returns a human-readable string
    uses the date-fns library to format the time until the anime airs
    */

    const time = new Date(Date.now() + timeInSeconds * 1000);
    if (isPast(time)) {
      return 'Already aired';
    }
    if (timeInSeconds == null){
        return 'No airing schedule available'
    }
    return formatDistanceToNow(time, { addSuffix: false });
    };


  // Log the anime data when it is updated
  useEffect(() => {
    console.log("Anime data updated:", animeData); // Debug log
  }, [animeData]);


  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter an anime title"
          value={animeTitle}
          onChange={handleInputChange}
        />
        <button type="submit">Search</button>
      </form>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {animeData && animeData.length > 0 && (
        <div>
          <h2>Anime Titles:</h2>
          {animeData.map((anime) => (
            <div key={anime.id}>
              <h3>{anime.title.romaji}</h3>
              <p><strong>English Title:</strong> {anime.title.english || 'N/A'}</p>
              <p><strong>Native Title:</strong> {anime.title.native}</p>
              <p><strong>Next Episode:</strong></p>
              <ul>
                {anime.airingSchedule.edges.map((edge, index) => (
                  <li key={index}>
                    Time until episode {edge.node.episode} airs: {formatTimeUntilAiring(edge.node.timeUntilAiring)}
                  </li>
                ))}
                <button onClick={() => handleSelectAnime(anime)} Add to Schedule> </button>

              </ul>
            </div>
          ))}
        </div>
      )} 

    </div>
  );
}




export default AnimeSearch;