import React, { createContext, useState } from 'react';
import { API_URL } from './config';

export const AnimeContext = createContext();

export const AnimeProvider = ({ children }) => {
    const [animeTitle, setAnimeTitle] = useState('');
    const [animeData, setAnimeData] = useState(null);
    const [error, setError] = useState('');

    const fetchAnimeData = async (title) => {
        console.log("Fetching data for:", {title});

        try {
            const response = await fetch(`${API_URL}/api`, {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                },

                // Send the title as JSON data
                body: JSON.stringify({ title }),
            });

            const data = await response.json(); 

            console.log(data); // Debug log

            if (response.ok) {
                setAnimeData(data.data.Page.media);
                setError(null);
            } else {
                setError(data.error);
                setAnimeData(null);
            }

        } catch (err) {
            setError('An error occurred while fetching data');
            setAnimeData(null);
        }
    };

    return (
        <AnimeContext.Provider value={
            { 
                animeTitle, 
                setAnimeTitle, 
                animeData, 
                error, 
                fetchAnimeData }
                
                }>
            
            {children}
        
        
        </AnimeContext.Provider>
    );
};
