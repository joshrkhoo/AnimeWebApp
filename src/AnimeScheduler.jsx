import React, { useEffect } from 'react';
import './AnimeStyle/AnimeScheduler.css';
import { API_URL } from './config';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AnimeScheduler = ({ schedule, onScheduleLoaded, onScheduleChange, onDeleteAnime, hasLoaded }) => {

    const parseScheduleDates = (schedule) => {
        /*
        Parse schedule to ensure dates are Date objects
        
        We need to convert the dates from strings to Date objects so we can sort them otherwise they will be sorted as strings which will cause an error
        
        Backend returns airing_time as Unix timestamp in SECONDS, but JavaScript Date expects MILLISECONDS
        */

        const newSchedule = {};
        // Iterate over each day in the schedule
        for (const day in schedule) {
            newSchedule[day] = schedule[day].map(anime => ({
                ...anime,
                // Convert seconds to milliseconds by multiplying by 1000
                airing_time: typeof anime.airing_time === 'number' 
                    ? new Date(anime.airing_time * 1000) 
                    : new Date(anime.airing_time)
            }));
        }
        return newSchedule;
    };

    const loadSchedule = async () => {
        try {
            const response = await fetch(`${API_URL}/loadSchedule`);
            const data = await response.json();
            const parsedData = parseScheduleDates(data);
            console.log('Loading saved schedule: ', parsedData);
            if (onScheduleLoaded) {
                onScheduleLoaded(parsedData);
            }
        } catch (err) {
            console.error('An error occurred while fetching the schedule:', err);
        }
    };

    const saveSchedule = async (newSchedule) => {
        try {
            // Convert Date objects to epoch seconds (numbers) before sending
            const scheduleToSave = {};
            for (const day in newSchedule) {
                scheduleToSave[day] = newSchedule[day].map(anime => {
                    const animeCopy = { ...anime };
                    // Convert airing_time from Date object to epoch seconds if needed
                    if (animeCopy.airing_time instanceof Date) {
                        animeCopy.airing_time = Math.floor(animeCopy.airing_time.getTime() / 1000);
                    } else if (typeof animeCopy.airing_time === 'string') {
                        // If it's already a string (ISO format), convert to epoch
                        animeCopy.airing_time = Math.floor(new Date(animeCopy.airing_time).getTime() / 1000);
                    }
                    // Ensure airing_time is a number
                    if (typeof animeCopy.airing_time === 'number') {
                        animeCopy.airing_time = Math.floor(animeCopy.airing_time);
                    }
                    return animeCopy;
                });
            }
            
            console.log('Saving schedule:', scheduleToSave);
            
            const response = await fetch(`${API_URL}/saveSchedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(scheduleToSave),
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('Schedule saved successfully:', result);
            } else {
                const error = await response.json().catch(() => ({ message: 'Unknown error' }));
                console.error('Failed to save schedule:', response.status, error);
            }
        } catch (err) {
            console.error('An error occurred while saving the schedule:', err);
        }
    };

    useEffect(() => {
        loadSchedule();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        if (hasLoaded && schedule && Object.keys(schedule).length > 0) {
            saveSchedule(schedule);
        }
        // eslint-disable-next-line
    }, [schedule, hasLoaded]);

    return (
        <div className="schedule-week-container">
            {daysOfWeek.filter(day => schedule[day] && schedule[day].length > 0).map(day => (
                <div key={day} className="day-schedule">
                    <div className="day-label">{day}</div>
                    <ul>
                        {schedule[day] && schedule[day].map(anime => (
                            <li key={`${anime.id}-${anime.episode}`} className="anime-schedule-item">
                                {anime.coverImage && (
                                    <img
                                        src={anime.coverImage.medium || anime.coverImage.large || anime.coverImage.extraLarge}
                                        alt={anime.title.romaji}
                                        className="anime-schedule-img"
                                    />
                                )}
                                <div className="anime-schedule-info">
                                    <div className="anime-title">{anime.title.romaji}</div>
                                    <div className="anime-date">
                                        {anime.airing_time
                                            ? (() => {
                                                // Handle both Date objects and Unix timestamps (seconds)
                                                const date = anime.airing_time instanceof Date
                                                    ? anime.airing_time
                                                    : typeof anime.airing_time === 'number'
                                                        ? new Date(anime.airing_time * 1000) // Convert seconds to milliseconds
                                                        : new Date(anime.airing_time);
                                                return `${date.toLocaleDateString()}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
                                            })()
                                            : 'Aired'}
                                    </div>
                                </div>
                                {onDeleteAnime && (
                                    <button
                                        className="delete-anime-btn"
                                        onClick={() => onDeleteAnime(anime.id, anime.episode)}
                                        aria-label={`Delete ${anime.title.romaji}`}
                                        title="Delete anime"
                                    >
                                        x
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

export default AnimeScheduler;
