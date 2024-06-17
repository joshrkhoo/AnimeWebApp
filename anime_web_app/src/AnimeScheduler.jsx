import React, { useContext, useEffect, useContext } from 'react';
import { AnimeContext } from './AnimeContext';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AnimeScheduler = () => {
    const [schedule, setSchedule] = useState({

        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
    });

    const { animeData } = useContext(AnimeContext);

    const [selectedDay, setSelectedDay] = useState('Monday');
    
































};

export default AnimeScheduler;
