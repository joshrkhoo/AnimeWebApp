import React, { useState, useEffect } from 'react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AnimeScheduler = ({ selectedAnimes = [] }) => {
    const [schedule, setSchedule] = useState({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: []
    });

    useEffect(() => {
        console.log('Selected animes in AnimeScheduler:', selectedAnimes);

        const newSchedule = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: []
        };
        

        selectedAnimes.forEach(anime => {
            console.log('Anime object:', anime); // Log the entire anime object

            // Check if the anime has an airing schedule
            if (anime.airingSchedule && anime.airingSchedule.edges) {

                // Iterate over the airing schedule
                anime.airingSchedule.edges.forEach(edge => {

                    // Get the airing time and time until airing
                        // multiply by 1000 to convert seconds to milliseconds for the Date object
                            // Date object converts milliseconds to a human-readable date
                    const airingTime = edge.node.airingAt ? new Date(edge.node.airingAt * 1000) : null;

                    // Convert the time until airing from seconds to milliseconds
                    const timeUntilAiring = edge.node.timeUntilAiring;
                    
                    // Check if the airing time is valid
                        // If the airing time is not valid, log a warning and return
                    if (!airingTime || timeUntilAiring < 0) {
                        console.warn(`Episode ${edge.node.episode} of ${anime.title.romaji} has already aired or has invalid airing time.`);
                        return;
                    }
                    
                    console.log('Airing time:', airingTime);
                    
                    // Get the airing date
                    const airingDay = airingTime.toLocaleDateString('en-US', { weekday: 'long' });
                    console.log('Airing day:', airingDay);
                    
                    // Add the anime to the schedule
                    if (newSchedule[airingDay]) {
                        newSchedule[airingDay].push({
                            ...anime,
                            airing_time: airingTime,
                            episode: edge.node.episode
                        });

                        // Sort the anime by airing time in ascending order
                        newSchedule[airingDay].sort((a, b) => a.airing_time - b.airing_time);
                    }
                });
            }
        });

        console.log('New schedule:', newSchedule);

        // Update the schedule state
        setSchedule(newSchedule);
    }, [selectedAnimes]);

    return (
        <div className="schedule-container">
            {daysOfWeek.map(day => (
                <div key={day} className="day-schedule">
                    <h3>{day}</h3>
                    <ul>
                        {schedule[day].map(anime => (
                            <li key={`${anime.id}-${anime.episode}`}>
                                <strong>{anime.title.romaji}</strong> - Episode {anime.episode} - {anime.airing_time ? anime.airing_time.toLocaleDateString() + ', ' + anime.airing_time.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : 'Aired'}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default AnimeScheduler;
