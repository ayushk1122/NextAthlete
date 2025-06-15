import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const sports = [
    { id: 'soccer', name: 'Soccer', icon: '⚽' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'baseball', name: 'Baseball', icon: '⚾' },
    { id: 'football', name: 'Football', icon: '🏈' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'swimming', name: 'Swimming', icon: '🏊' },
];

const experienceLevels = [
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' },
];

export default function Coaches() {
    const [selectedSport, setSelectedSport] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoaches = async () => {
            try {
                const coachesRef = collection(db, 'coaches');
                const snapshot = await getDocs(coachesRef);
                const coachesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCoaches(coachesData);
            } catch (error) {
                console.error('Error fetching coaches:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCoaches();
    }, []);

    const filteredCoaches = coaches.filter(coach => {
        if (selectedSport && !coach.sports.includes(selectedSport)) return false;
        if (selectedLevel && coach.experienceLevel !== selectedLevel) return false;
        return true;
    });

    return (
        <div className="bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Find Your Perfect Coach
                    </h1>
                    <p className="mt-4 text-lg text-gray-500">
                        Connect with experienced coaches who can help you achieve your athletic goals.
                    </p>
                </div>

                {/* Filters */}
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="sport" className="block text-sm font-medium text-gray-700">
                            Select Sport
                        </label>
                        <select
                            id="sport"
                            name="sport"
                            value={selectedSport}
                            onChange={(e) => setSelectedSport(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">All Sports</option>
                            {sports.map((sport) => (
                                <option key={sport.id} value={sport.id}>
                                    {sport.icon} {sport.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                            Experience Level
                        </label>
                        <select
                            id="level"
                            name="level"
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">All Levels</option>
                            {experienceLevels.map((level) => (
                                <option key={level.id} value={level.id}>
                                    {level.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Coaches Grid */}
                {loading ? (
                    <div className="mt-12 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                        <p className="mt-2 text-gray-500">Loading coaches...</p>
                    </div>
                ) : filteredCoaches.length > 0 ? (
                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCoaches.map((coach) => (
                            <div
                                key={coach.id}
                                className="group relative rounded-lg border border-gray-200 p-6 hover:border-primary-500 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden">
                                        {coach.photoURL ? (
                                            <img
                                                src={coach.photoURL}
                                                alt={coach.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-primary-100 text-primary-600 text-2xl">
                                                {coach.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{coach.name}</h3>
                                        <p className="text-sm text-gray-500">{coach.title}</p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-gray-500">{coach.bio}</p>
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-900">Specialties:</h4>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {coach.sports?.map((sport) => (
                                            <span
                                                key={sport}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                                            >
                                                {sports.find(s => s.id === sport)?.icon} {sports.find(s => s.id === sport)?.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-500">Rating: </span>
                                        <div className="ml-2 flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <svg
                                                    key={i}
                                                    className={`h-4 w-4 ${i < (coach.rating || 0)
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300'
                                                        }`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <button className="btn btn-primary">Contact Coach</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-12 text-center">
                        <p className="text-gray-500">No coaches found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 