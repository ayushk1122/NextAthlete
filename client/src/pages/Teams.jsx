import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const SPORTS = [
    { label: 'Baseball', value: 'baseball', icon: '⚾' },
    { label: 'Soccer', value: 'soccer', icon: '⚽' },
    { label: 'Basketball', value: 'basketball', icon: '🏀' },
    { label: 'Football', value: 'football', icon: '🏈' },
    { label: 'Softball', value: 'softball', icon: '🥎' },
    { label: 'Volleyball', value: 'volleyball', icon: '🏐' },
];

const AGE_GROUPS = [
    '9u', '10u', '11u', '12u', '13u', '14u', '15u', '16u', '17u', '18u'
];

const TEAM_TYPES = [
    { label: 'Travel Team', value: 'travel' },
    { label: 'No-Travel Team', value: 'no-travel' }
];

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter states
    const [selectedSports, setSelectedSports] = useState([]);
    const [selectedAgeGroups, setSelectedAgeGroups] = useState([]);
    const [selectedTeamTypes, setSelectedTeamTypes] = useState([]);

    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [messageLoading, setMessageLoading] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);

    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profileTeam, setProfileTeam] = useState(null);

    useEffect(() => {
        const fetchTeams = async () => {
            setLoading(true);
            setError('');
            try {
                const querySnapshot = await getDocs(collection(db, 'teams'));
                const teamList = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(team => team.teamProfile);
                setTeams(teamList);
            } catch (err) {
                console.error('Error fetching teams:', err);
                setError('Failed to load teams');
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    // Filter teams based on selected criteria
    const filteredTeams = teams.filter(team => {
        const teamProfile = team.teamProfile || {};

        // Sport filter
        if (selectedSports.length > 0 && !selectedSports.includes(teamProfile.sport)) {
            return false;
        }

        // Age group filter
        if (selectedAgeGroups.length > 0) {
            const teamAgeGroups = teamProfile.ageGroups || [];
            const hasMatchingAgeGroup = selectedAgeGroups.some(ageGroup =>
                teamAgeGroups.includes(ageGroup)
            );
            if (!hasMatchingAgeGroup) return false;
        }

        // Team type filter
        if (selectedTeamTypes.length > 0 && !selectedTeamTypes.includes(teamProfile.teamType)) {
            return false;
        }

        return true;
    });

    const openMessageModal = (team) => {
        setSelectedTeam(team);
        setMessageContent('');
        setMessageError('');
        setMessageModalOpen(true);
    };

    const closeMessageModal = () => {
        setMessageModalOpen(false);
        setSelectedTeam(null);
        setMessageContent('');
        setMessageError('');
    };

    const sendMessage = async () => {
        setMessageLoading(true);
        setMessageError('');
        try {
            const user = auth.currentUser;
            if (!user || !selectedTeam) {
                setMessageError('User not authenticated or team not selected.');
                setMessageLoading(false);
                return;
            }

            // Determine user role by checking if they have a coach profile
            let senderRole = 'athlete';
            let senderName = user.displayName || 'Athlete';

            // Check if user is a coach by looking for coach profile
            try {
                const coachDoc = await getDoc(doc(db, 'coaches', user.uid));
                if (coachDoc.exists()) {
                    const coachData = coachDoc.data();
                    senderRole = 'coach';
                    senderName = coachData.coachProfile?.name || coachData.name || user.displayName || 'Coach';
                }
            } catch (err) {
                console.log('User is not a coach, using athlete role');
            }

            const conversationId = [user.uid, selectedTeam.id].sort().join('_');
            await addDoc(collection(db, 'messages'), {
                senderId: user.uid,
                senderRole: senderRole,
                senderName: senderName,
                receiverId: selectedTeam.id,
                receiverRole: 'team',
                receiverName: selectedTeam.teamProfile.teamName || 'Team',
                content: messageContent,
                timestamp: serverTimestamp(),
                conversationId,
                participants: [user.uid, selectedTeam.id]
            });
            setMessageModalOpen(false);
        } catch (err) {
            console.error('Error sending message:', err);
            setMessageError('Failed to send message.');
        } finally {
            setMessageLoading(false);
        }
    };

    const openProfileModal = (team) => {
        setProfileTeam(team);
        setProfileModalOpen(true);
    };

    const closeProfileModal = () => {
        setProfileModalOpen(false);
        setProfileTeam(null);
    };

    // Team Profile Modal
    const renderProfileModal = () => {
        if (!profileModalOpen || !profileTeam) return null;
        const teamProfile = profileTeam.teamProfile || {};

        // Get team name using the same logic as the team card
        const getTeamName = (team) =>
            team.teamProfile?.teamName || `${team.firstName || ''} ${team.lastName || ''}`.trim() || 'Team';
        const teamName = getTeamName(profileTeam);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col p-0 relative overflow-hidden">
                    {/* Close button */}
                    <button onClick={closeProfileModal} className="absolute top-6 right-6 text-3xl text-gray-400 hover:text-gray-700 focus:outline-none">&times;</button>
                    {/* Header */}
                    <div className="flex items-center gap-6 px-10 pt-10 pb-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex-shrink-0 w-28 h-28 rounded-full bg-green-100 flex items-center justify-center text-5xl font-bold text-green-700 uppercase">
                            {teamName[0] || 'T'}
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{teamName}</div>
                            <div className="text-lg text-green-600 font-medium mb-1">{teamProfile.sport}</div>
                            {teamProfile.location && <div className="text-gray-500">{teamProfile.location}</div>}
                        </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col md:flex-row gap-8 p-10 overflow-y-auto">
                        <div className="flex-1 space-y-6">
                            <div>
                                <div className="font-semibold text-gray-700 mb-2">Age Groups</div>
                                <div className="flex flex-wrap gap-2">
                                    {teamProfile.ageGroups && teamProfile.ageGroups.length > 0 ? (
                                        teamProfile.ageGroups.map((ageGroup, idx) => (
                                            <span key={idx} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">{ageGroup}</span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400">No age groups listed</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-700 mb-2">Team Type</div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                                        {teamProfile.teamType === 'travel' ? 'Travel Team' : 'No-Travel Team'}
                                    </span>
                                </div>
                            </div>
                            {teamProfile.website && (
                                <div>
                                    <div className="font-semibold text-gray-700 mb-2">Website</div>
                                    <a
                                        href={teamProfile.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                        {teamProfile.website}
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-gray-700 mb-2">Description</div>
                            <div className="text-gray-700 whitespace-pre-line min-h-[80px]">
                                {teamProfile.description || <span className="text-gray-400">No description provided</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading teams...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Competitive Teams</h1>
                    <p className="text-lg text-gray-600 mb-6">Find the perfect competitive team for your athlete</p>

                    {/* Descriptive Header Section */}
                    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Taking the Next Step in Your Athletic Journey</h2>
                            <div className="text-gray-700 space-y-4">
                                <p>
                                    Competitive and select teams represent the bridge between recreational sports and elite competition.
                                    These teams are designed for athletes who are ready to take their skills to the next level and compete
                                    at a higher intensity with more structured training and development programs.
                                </p>
                                <p>
                                    Whether you're looking for a <strong>travel team</strong> that competes regionally and nationally,
                                    or a <strong>no-travel team</strong> that focuses on local competitive leagues, these teams provide
                                    the coaching, training, and competitive environment that helps young athletes develop their full potential.
                                </p>
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
                                    <h3 className="font-semibold text-blue-900 mb-2">What You Can Do Here:</h3>
                                    <ul className="text-blue-800 space-y-1">
                                        <li>• Browse competitive teams by sport, age group, and team type</li>
                                        <li>• Learn about each team's philosophy, achievements, and training approach</li>
                                        <li>• Contact team coaches and managers directly to ask questions</li>
                                        <li>• Find teams that match your athlete's skill level and competitive goals</li>
                                        <li>• Discover opportunities for year-round development and competition</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coaches Opportunities Section */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                        <div className="max-w-4xl mx-auto">
                            <h3 className="text-lg font-semibold text-green-900 mb-3">For Coaches: Find Coaching Opportunities</h3>
                            <p className="text-green-800 mb-3">
                                Coaches looking for openings or opportunities to coach on any of these teams can use this page to reach out to team representatives.
                                Whether you're seeking a full-time coaching position, part-time assistant role, or want to network with other coaches,
                                this directory provides direct access to team contacts.
                            </p>
                            <div className="bg-green-100 border-l-4 border-green-400 p-4">
                                <h4 className="font-semibold text-green-900 mb-2">Coaches Can:</h4>
                                <ul className="text-green-800 space-y-1">
                                    <li>• Contact team representatives about coaching openings</li>
                                    <li>• Inquire about assistant coaching opportunities</li>
                                    <li>• Network with other coaches in the area</li>
                                    <li>• Learn about team philosophies and coaching styles</li>
                                    <li>• Explore opportunities to work with different age groups and skill levels</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Sport Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                            <div className="space-y-2">
                                {SPORTS.map((sport) => (
                                    <label key={sport.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedSports.includes(sport.value)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedSports([...selectedSports, sport.value]);
                                                } else {
                                                    setSelectedSports(selectedSports.filter(s => s !== sport.value));
                                                }
                                            }}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{sport.icon} {sport.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Age Groups Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Age Groups</label>
                            <div className="grid grid-cols-2 gap-2">
                                {AGE_GROUPS.map((ageGroup) => (
                                    <label key={ageGroup} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedAgeGroups.includes(ageGroup)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedAgeGroups([...selectedAgeGroups, ageGroup]);
                                                } else {
                                                    setSelectedAgeGroups(selectedAgeGroups.filter(ag => ag !== ageGroup));
                                                }
                                            }}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{ageGroup}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Team Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Team Type</label>
                            <div className="space-y-2">
                                {TEAM_TYPES.map((type) => (
                                    <label key={type.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedTeamTypes.includes(type.value)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedTeamTypes([...selectedTeamTypes, type.value]);
                                                } else {
                                                    setSelectedTeamTypes(selectedTeamTypes.filter(t => t !== type.value));
                                                }
                                            }}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="mb-4">
                    <p className="text-gray-600">
                        Showing {filteredTeams.length} of {teams.length} teams
                    </p>
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.map((team) => {
                        const teamProfile = team.teamProfile || {};
                        const getTeamName = (team) =>
                            team.teamProfile?.teamName || `${team.firstName || ''} ${team.lastName || ''}`.trim() || 'Team';
                        const teamName = getTeamName(team);

                        return (
                            <div key={team.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl font-bold text-green-700 uppercase">
                                                {teamName[0] || 'T'}
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-lg font-semibold text-gray-900">{teamName}</h3>
                                                <p className="text-sm text-gray-600">{teamProfile.sport}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {teamProfile.ageGroups && teamProfile.ageGroups.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Age Groups</h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {teamProfile.ageGroups.map((ageGroup, index) => (
                                                        <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                            {ageGroup}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {teamProfile.teamType && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Team Type</h4>
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                                    {teamProfile.teamType === 'travel' ? 'Travel Team' : 'No-Travel Team'}
                                                </span>
                                            </div>
                                        )}

                                        {teamProfile.location && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Location</h4>
                                                <p className="text-sm text-gray-600">{teamProfile.location}</p>
                                            </div>
                                        )}

                                        {teamProfile.description && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                                                <p className="text-sm text-gray-600 line-clamp-2">{teamProfile.description}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        <button
                                            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                                            onClick={() => openMessageModal(team)}
                                        >
                                            Contact Team
                                        </button>
                                        <button
                                            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                                            onClick={() => openProfileModal(team)}
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredTeams.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No teams found matching your criteria.</p>
                    </div>
                )}
            </div>

            {/* Message Modal */}
            {messageModalOpen && selectedTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Contact {selectedTeam.teamProfile?.teamName || 'Team'}
                        </h3>
                        <textarea
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows="4"
                        />
                        {messageError && (
                            <p className="text-red-600 text-sm mt-2">{messageError}</p>
                        )}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={closeMessageModal}
                                disabled={messageLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                                onClick={sendMessage}
                                disabled={messageLoading || !messageContent.trim()}
                            >
                                {messageLoading ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {renderProfileModal()}
        </div>
    );
};

export default Teams; 