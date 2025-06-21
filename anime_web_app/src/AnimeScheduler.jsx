import React, { useState, useEffect, useRef } from 'react';
import './AnimeScheduler.css';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AnimeScheduler = ({ selectedAnimes = [], onScheduleLoaded }) => {
    const [schedule, setSchedule] = useState({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: []
    });

    // Track if this is the initial load
    const isInitialLoad = useRef(true);

    const parseScheduleDates = (schedule) => {
        /*
        Parse schedule to ensure dates are Date objects
        
        We need to convert the dates from strings to Date objects so we can sort them otherwise they will be sorted as strings which will cause an error
        */

        const newSchedule = {};
        // Iterate over each day in the schedule
        for (const day in schedule) {
            newSchedule[day] = schedule[day].map(anime => ({
                ...anime,
                airing_time: new Date(anime.airing_time)
            }));
        }
        return newSchedule;
    };

    const loadSchedule = async () => {
        try{
            const response = await fetch('http://127.0.0.1:5000/loadSchedule');
            const data = await response.json();
            const parsedData = parseScheduleDates(data);
            console.log('Loading saved schedule: ', parsedData);
            setSchedule(parsedData);
            if (onScheduleLoaded) {
                onScheduleLoaded(parsedData);
            }
        }catch(err){
            console.error('An error occurred while fetching the schedule:', err);
        }
    
    };

    const saveSchedule = async (newSchedule) => {
        try{
            await fetch('http://127.0.0.1:5000/saveSchedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(schedule),
            });
        }catch(err){
            console.error('An error occurred while saving the schedule:', err);
        }

    };
    

    useEffect(() => {
        loadSchedule();
    }, []);

    useEffect(() => {
        if (Object.keys(schedule).length > 0){
            saveSchedule(schedule);
        }
    }, [schedule]);

    useEffect(() => {
        // Skip the first run (initial load)
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }
        // Only rebuild and save schedule after initial load
        const newSchedule = { ...schedule };
        selectedAnimes.forEach(anime => {
            if (anime.airingSchedule && anime.airingSchedule.edges) {
                const upcomingEpisodes = anime.airingSchedule.edges
                    .map(edge => {
                        return {
                            ...anime,
                            airing_time: edge.node.airingAt ? new Date(edge.node.airingAt * 1000) : null,
                            episode: edge.node.episode,
                            timeUntilAiring: edge.node.timeUntilAiring
                        };
                    })
                    .filter(ep => ep.airing_time && ep.timeUntilAiring >= 0)
                    .sort((a, b) => a.airing_time - b.airing_time);

                if (upcomingEpisodes.length > 0) {
                    const nextEpisode = upcomingEpisodes[0];
                    const airingDay = nextEpisode.airing_time.toLocaleDateString('en-US', { weekday: 'long' });

                    if (newSchedule[airingDay]) {
                        newSchedule[airingDay].push(nextEpisode);
                        newSchedule[airingDay].sort((a, b) => a.airing_time - b.airing_time);
                    }
                }
            }
        });
        setSchedule(newSchedule);
        saveSchedule(newSchedule);
    }, [selectedAnimes]);

    return (
        <div className="schedule-container">
            {/* Check if there are any animes scheduled */}
            {daysOfWeek.map(day => (
                schedule[day].length > 0 && (
                    <div key={day} className="day-schedule">
                        <h3>{day}</h3>
                        <ul>
                            {/* Iterate over each anime scheduled for the day */}
                            {schedule[day].map(anime => (
                                <li key={`${anime.id}-${anime.episode}`}>
                                    <strong>{anime.title.romaji}</strong> - Episode {anime.episode} - {anime.airing_time ? `${anime.airing_time.toLocaleDateString()}, ${anime.airing_time.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}` : 'Aired'}
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            ))}
        </div>
    );
};

export default AnimeScheduler;
