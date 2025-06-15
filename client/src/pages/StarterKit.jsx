import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const sports = [
    { id: 'soccer', name: 'Soccer', icon: '⚽' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'baseball', name: 'Baseball', icon: '⚾' },
    { id: 'football', name: 'Football', icon: '🏈' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'swimming', name: 'Swimming', icon: '🏊' },
];

const ageGroups = [
    { id: '5-8', name: '5-8 years' },
    { id: '9-12', name: '9-12 years' },
    { id: '13-15', name: '13-15 years' },
    { id: '16-18', name: '16-18 years' },
];

export default function StarterKit() {
    const [selectedSport, setSelectedSport] = useState('');
    const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
    const [kits, setKits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKits = async () => {
            try {
                const kitsRef = collection(db, 'starterKits');
                const snapshot = await getDocs(kitsRef);
                const kitsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setKits(kitsData);
            } catch (error) {
                console.error('Error fetching kits:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchKits();
    }, []);

    const filteredKits = kits.filter(kit => {
        if (selectedSport && kit.sport !== selectedSport) return false;
        if (selectedAgeGroup && kit.ageGroup !== selectedAgeGroup) return false;
        return true;
    });

    return (
        <div className="bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Find Your Perfect Starter Kit
                    </h1>
                    <p className="mt-4 text-lg text-gray-500">
                        Get personalized equipment recommendations based on your sport and age group.
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
                        <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">
                            Select Age Group
                        </label>
                        <select
                            id="ageGroup"
                            name="ageGroup"
                            value={selectedAgeGroup}
                            onChange={(e) => setSelectedAgeGroup(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="">All Ages</option>
                            {ageGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Kits Grid */}
                {loading ? (
                    <div className="mt-12 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
                        <p className="mt-2 text-gray-500">Loading starter kits...</p>
                    </div>
                ) : filteredKits.length > 0 ? (
                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredKits.map((kit) => (
                            <div
                                key={kit.id}
                                className="group relative rounded-lg border border-gray-200 p-6 hover:border-primary-500 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">{kit.name}</h3>
                                    <span className="text-2xl">{sports.find(s => s.id === kit.sport)?.icon}</span>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">{kit.description}</p>
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-900">Includes:</h4>
                                    <ul className="mt-2 list-disc list-inside text-sm text-gray-500">
                                        {kit.items?.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-lg font-bold text-primary-600">${kit.price}</span>
                                    <button className="btn btn-primary">View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-12 text-center">
                        <p className="text-gray-500">No starter kits found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 