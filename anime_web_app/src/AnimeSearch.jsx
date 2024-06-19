import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AnimeContext } from './AnimeContext';
import _ from 'lodash';
import { formatDistanceToNow, isPast, isFuture } from 'date-fns';
import './AnimeSearch.css';

const AnimeSearch = ({onSelectAnime}) => {
  // Get the animeTitle, setAnimeTitle, animeData, error, and fetchAnimeData from the AnimeContext
  const { animeTitle, setAnimeTitle, animeData, error, fetchAnimeData } = useContext(AnimeContext);


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


  // Function to handle selecting an anime
  const handleSelectAnime = (anime) => {
    console.log('Selected anime:', anime); // Debug log
    onSelectAnime(anime);
  };



  console.log('Rendering AnimeSearch component'); // Debugging log

  
  const formatTimeUntilAiring = (timeInSeconds) => {
    /* 
    This Function takes a time in seconds and returns a human-readable string
    uses the date-fns library to format the time until the anime airs
    */

    const time = new Date(Date.now() + timeInSeconds * 1000);
    if (isPast(time)) {
      return 'Already aired';
    }else if (isFuture(time)) {
      return formatDistanceToNow(time, { addSuffix: true });
    }
    return 'NA'

    };


  return (
    <div className="search-container">
        <form onSubmit={(e) => e.preventDefault()}>
            <input
                type="text"
                placeholder="Enter an anime title"
                value={animeTitle}
                onChange={handleInputChange}
                className="search-input"
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {animeData && animeData.length > 0 && (
                <ul className="search-dropdown">
                    {animeData.map((anime) => (
                        <li key={anime.id} onClick={() => handleSelectAnime(anime)}>
                            <strong>{anime.title.romaji}</strong> ({anime.title.english || 'N/A'})
                        </li>
                    ))}
                </ul>
            )}
        </form>
    </div>
);
};




export default AnimeSearch;