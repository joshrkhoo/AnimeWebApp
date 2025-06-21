import React, { useEffect } from 'react';
import './AnimeScheduler.css';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AnimeScheduler = ({ schedule, onScheduleLoaded, onScheduleChange, hasLoaded }) => {
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
        try {
            const response = await fetch('http://127.0.0.1:5000/loadSchedule');
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
            await fetch('http://127.0.0.1:5000/saveSchedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newSchedule),
            });
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
        <div className="schedule-container">
            {/* Check if there are any animes scheduled */}
            {daysOfWeek.map(day => (
                schedule[day] && schedule[day].length > 0 && (
                    <div key={day} className="day-schedule">
                        <h3>{day}</h3>
                        <ul>
                            {/* Iterate over each anime scheduled for the day */}
                            {schedule[day].map(anime => (
                                <li key={`${anime.id}-${anime.episode}`}>
                                    <strong>{anime.title.romaji}</strong> - Episode {anime.episode} - {anime.airing_time ? `${new Date(anime.airing_time).toLocaleDateString()}, ${new Date(anime.airing_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}` : 'Aired'}
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
