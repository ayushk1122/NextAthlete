import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const SPORTS = [
    { label: 'Baseball', value: 'baseball', icon: '⚾' },
    { label: 'Soccer', value: 'soccer', icon: '⚽' },
];

const BASEBALL_SKILLS = [
    'hitting',
    'pitching',
    'infield',
    'outfield',
    'baserunning'
];

const SOCCER_SKILLS = [
    'shooting',
    'ball handling',
    'speed',
    'goalkeeping',
    'defense'
];

const AGE_GROUPS = [
    '3-9',
    '10-13',
    '14-18',
    '18+'
];

const Coaches = () => {
    const [coaches, setCoaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [selectedSports, setSelectedSports] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);

    useEffect(() => {
        const fetchCoaches = async () => {
            setLoading(true);
            setError('');
            try {
                const querySnapshot = await getDocs(collection(db, 'coaches'));
                const coachList = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(coach => coach.coachProfile);

                console.log('Fetched coaches:', coachList); // Debug log
                setCoaches(coachList);
            } catch (err) {
                console.error('Error fetching coaches:', err);
                setError('Failed to fetch coaches. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchCoaches();
    }, []);

    const handleSportChange = (sport) => {
        setSelectedSports(prev =>
            prev.includes(sport)
                ? prev.filter(s => s !== sport)
                : [...prev, sport]
        );
    };

    const handleSkillChange = (skill) => {
        setSelectedSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const handleAgeGroupChange = (ageGroup) => {
        setSelectedAgeGroups(prev =>
            prev.includes(ageGroup)
                ? prev.filter(age => age !== ageGroup)
                : [...prev, ageGroup]
        );
    };

    const filteredCoaches = coaches.filter(coach => {
        const { sports, skills, ageGroups } = coach.coachProfile;

        // Filter by sports
        if (selectedSports.length > 0 && !selectedSports.some(sport => sports.includes(sport))) {
            return false;
        }

        // Filter by skills
        if (selectedSkills.length > 0) {
            const hasSelectedSkill = selectedSkills.some(skill => {
                return Object.values(skills).some(sportSkills => sportSkills.includes(skill));
            });
            if (!hasSelectedSkill) return false;
        }

        // Filter by age groups
        if (selectedAgeGroups.length > 0 && !selectedAgeGroups.some(age => ageGroups.includes(age))) {
            return false;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6 text-center">Find Your Perfect Coach</h1>

            {/* Landing/Intro Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-2 text-blue-900">Welcome to Our Coach Directory!</h2>
                <p className="text-gray-800 mb-4">
                    Whether you're looking to improve your skills, learn the fundamentals, or take your game to the next level,
                    our experienced coaches are here to help. Browse through our directory to find coaches who specialize in
                    your sport, age group, and specific skills you want to develop.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-2">Find by Sport</h3>
                        <p>Filter coaches by baseball or soccer to find the right match for your sport.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-2">Match by Skills</h3>
                        <p>Search for coaches who specialize in specific skills you want to develop.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="font-semibold mb-2">Age-Appropriate</h3>
                        <p>Find coaches who work with your age group, from beginners to advanced players.</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Filter Coaches</h2>

                {/* Sports Filter */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Sports</h3>
                    <div className="flex flex-wrap gap-2">
                        {SPORTS.map(sport => (
                            <button
                                key={sport.value}
                                onClick={() => handleSportChange(sport.value)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedSports.includes(sport.value)
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                            >
                                {sport.icon} {sport.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Skills Filter */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                        {(
                            selectedSports.length === 0
                                ? [...BASEBALL_SKILLS, ...SOCCER_SKILLS]
                                : selectedSports.flatMap(sport =>
                                    sport === 'baseball' ? BASEBALL_SKILLS : SOCCER_SKILLS
                                )
                        ).map(skill => (
                            <button
                                key={skill}
                                onClick={() => handleSkillChange(skill)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedSkills.includes(skill)
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Age Groups Filter */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Age Groups</h3>
                    <div className="flex flex-wrap gap-2">
                        {AGE_GROUPS.map(ageGroup => (
                            <button
                                key={ageGroup}
                                onClick={() => handleAgeGroupChange(ageGroup)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedAgeGroups.includes(ageGroup)
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                    }`}
                            >
                                {ageGroup}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Coaches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCoaches.map(coach => (
                    <div key={coach.id} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-semibold">{
                                    coach.name || coach.coachProfile?.name || `${coach.firstName || ''} ${coach.lastName || ''}`.trim()
                                }</h3>
                                <p className="text-gray-600">{coach.coachProfile.location}</p>
                            </div>
                            <div className="flex gap-2">
                                {coach.coachProfile.sports.map(sport => (
                                    <span key={sport} className="text-2xl">
                                        {SPORTS.find(s => s.value === sport)?.icon}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <p className="text-gray-700 mb-4">{coach.coachProfile.bio}</p>

                        <div className="space-y-3">
                            {/* Skills */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(coach.coachProfile.skills || {}).flatMap(([sport, skills]) => {
                                        let skillArr = [];
                                        if (Array.isArray(skills)) {
                                            skillArr = skills;
                                        } else if (typeof skills === 'string') {
                                            skillArr = skills.split(',').map(s => s.trim()).filter(Boolean);
                                        }
                                        return skillArr.map(skill => (
                                            <span
                                                key={`${sport}-${skill}`}
                                                className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                                            >
                                                {skill}
                                            </span>
                                        ));
                                    })}
                                </div>
                            </div>

                            {/* Age Groups */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Age Groups</h4>
                                <div className="flex flex-wrap gap-2">
                                    {coach.coachProfile.ageGroups.map(ageGroup => (
                                        <span
                                            key={ageGroup}
                                            className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                                        >
                                            {ageGroup}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Experience & Certifications */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Experience</h4>
                                <p className="text-gray-600">{coach.coachProfile.experience} years</p>
                            </div>

                            {coach.coachProfile.certifications && coach.coachProfile.certifications.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-1">Certifications</h4>
                                    <ul className="list-disc list-inside text-gray-600">
                                        {(typeof coach.coachProfile.certifications === 'string'
                                            ? coach.coachProfile.certifications.split(',').map(cert => cert.trim()).filter(Boolean)
                                            : coach.coachProfile.certifications
                                        ).map((cert, index) => (
                                            <li key={index}>{cert}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => {/* TODO: Implement contact functionality */ }}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Contact Coach
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCoaches.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-600">No coaches found matching your criteria.</p>
                    <button
                        onClick={() => {
                            setSelectedSports([]);
                            setSelectedSkills([]);
                            setSelectedAgeGroups([]);
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                    >
                        Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default Coaches; 