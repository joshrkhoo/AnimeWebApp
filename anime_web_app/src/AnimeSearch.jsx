import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AnimeContext } from './AnimeContext';
import _ from 'lodash';
import { formatDistanceToNow, isPast, isFuture } from 'date-fns';
import './AnimeSearch.css';

const AnimeSearch = ({onSelectAnime}) => {
  // Get the animeTitle, setAnimeTitle, animeData, error, and fetchAnimeData from the AnimeContext
  const { animeTitle, setAnimeTitle, animeData, error, fetchAnimeData } = useContext(AnimeContext);

  // Add state for notification message
  const [notification, setNotification] = useState('');

  // Hide notification after 0.7 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 700);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
    // Check if the anime has any future episodes
    let hasFutureEpisode = false;
    if (anime.airingSchedule && anime.airingSchedule.edges && anime.airingSchedule.edges.length > 0) {
      hasFutureEpisode = anime.airingSchedule.edges.some(edge => edge.node.timeUntilAiring >= 0);
    }
    if (!hasFutureEpisode) {
      setNotification('This anime has already aired.');
      return;
    } else {
      setNotification(''); // Clear any previous notification
      onSelectAnime(anime);
    }
  };



  console.log('Rendering AnimeSearch component'); // Debugging log


  return (
    <div className="search-container">
        <form onSubmit={(e) => e.preventDefault()} className="search-form-row">
            <input
                type="text"
                placeholder="Enter an anime title"
                value={animeTitle}
                onChange={handleInputChange}
                className="search-input"
            />
            {notification && <div className="notification-message">{notification}</div>}
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