import React, { useCallback, useContext, useEffect } from 'react';
import { AnimeContext } from './AnimeContext';
import _ from 'lodash';

const AnimeSearch = () => {
  const { animeTitle, setAnimeTitle, animeData, error, fetchAnimeData } = useContext(AnimeContext);


  // Debounce the fetchAnimeData function
    // This will prevent the fetchAnimeData function from being called too frequently when the user types quickly
        // 300ms is the delay between each call
  const debouncedFetchAnimeData = useCallback(
    _.debounce((title) => {
        fetchAnimeData(title);
    }, 500),
    []
  );


// Handle input change
  // This function will be called every time the input field changes
  const handleInputChange = (e) => {
    const title = e.target.value;
    setAnimeTitle(title);
    debouncedFetchAnimeData(title);
  };

// Handle form submission
    // This function will be called when the form is submitted
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAnimeData(animeTitle);
  };

  console.log('Rendering AnimeSearch component'); // Debugging log


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

    </div>
  );
}




export default AnimeSearch;