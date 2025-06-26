import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const SPORTS = [
    { label: 'Baseball', value: 'baseball', icon: '⚾' },
    { label: 'Soccer', value: 'soccer', icon: '⚽' },
];

const Leagues = () => {
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSports, setSelectedSports] = useState([]);

    useEffect(() => {
        const fetchLeagues = async () => {
            setLoading(true);
            setError('');
            try {
                const querySnapshot = await getDocs(collection(db, 'leagues'));
                const leagueList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Support both leagueProfile and flat structure
                    const league = data.leagueProfile || data;
                    return {
                        id: doc.id,
                        name: league.leagueName || league.name || '',
                        sport: league.sport || '',
                        location: league.location || '',
                        website: league.website || '',
                        description: league.description || '',
                    };
                });
                setLeagues(leagueList);
            } catch (err) {
                setError('Failed to load leagues.');
            } finally {
                setLoading(false);
            }
        };
        fetchLeagues();
    }, []);

    const handleSportChange = (e) => {
        const { value, checked } = e.target;
        setSelectedSports(prev =>
            checked ? [...prev, value] : prev.filter(s => s !== value)
        );
    };

    const filteredLeagues = selectedSports.length === 0
        ? leagues
        : leagues.filter(lg => selectedSports.includes(lg.sport.toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold mb-6 text-center">Find Local Leagues</h1>
                {/* Landing/Intro Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 shadow-sm">
                    <h2 className="text-xl font-semibold mb-2 text-blue-900">Welcome to the Recreational Leagues Directory!</h2>
                    <p className="text-gray-800 mb-2">
                        This page is designed to help athletes and parents discover local recreational sports leagues—a great starting point for first-time athletes to enjoy playing, learn the game, and gain valuable experience in a fun, supportive environment.
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 mb-2">
                        <li>Browse leagues by sport and location to find the best fit for your interests and needs.</li>
                        <li>View detailed information about each league, including a description, website, and contact options.</li>
                        <li>Use the filters to quickly find leagues for specific sports like baseball or soccer.</li>
                        <li>If you're interested, visit the league's website to register or reach out to a league representative for questions.</li>
                    </ul>
                    <p className="text-gray-700">
                        Recreational leagues are a fantastic way to get started, make friends, and build confidence on and off the field. Explore your options below!
                    </p>
                </div>

                {/* Coaches Opportunities Section */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 shadow-sm">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">For Coaches: Find League Coaching Opportunities</h3>
                    <p className="text-green-800 mb-3">
                        Coaches looking for openings or opportunities to coach in any of these leagues can use this page to reach out to league representatives.
                        Whether you're seeking a coaching position, want to volunteer, or want to network with other coaches in the league system,
                        this directory provides direct access to league contacts.
                    </p>
                    <div className="bg-green-100 border-l-4 border-green-400 p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Coaches Can:</h4>
                        <ul className="text-green-800 space-y-1">
                            <li>• Contact league representatives about coaching openings</li>
                            <li>• Inquire about volunteer coaching opportunities</li>
                            <li>• Network with other coaches in the league</li>
                            <li>• Learn about league philosophies and coaching requirements</li>
                            <li>• Explore opportunities to work with different age groups and skill levels</li>
                        </ul>
                    </div>
                </div>
                {/* Sport Filter */}
                <div className="mb-6 flex gap-6 justify-center">
                    {SPORTS.map(sport => (
                        <label key={sport.value} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                value={sport.value}
                                checked={selectedSports.includes(sport.value)}
                                onChange={handleSportChange}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span>{sport.icon} {sport.label}</span>
                        </label>
                    ))}
                </div>
                {loading ? (
                    <div className="text-center">Loading leagues...</div>
                ) : error ? (
                    <div className="text-center text-red-500">{error}</div>
                ) : filteredLeagues.length === 0 ? (
                    <div className="text-center text-gray-500">No leagues found for the selected sport(s).</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredLeagues.map(league => (
                            <div key={league.id} className="bg-white rounded-lg shadow p-6 flex flex-col gap-2">
                                <h2 className="text-xl font-semibold">{league.name}</h2>
                                <div className="flex gap-2 items-center">
                                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                        {SPORTS.find(s => s.value === league.sport.toLowerCase())?.icon} {league.sport}
                                    </span>
                                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                                        {league.location}
                                    </span>
                                </div>
                                <p className="text-gray-700 text-sm mt-1 mb-2">{league.description}</p>
                                <a
                                    href={league.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-auto inline-block text-blue-600 hover:underline font-medium"
                                >
                                    Visit Website
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leagues; 