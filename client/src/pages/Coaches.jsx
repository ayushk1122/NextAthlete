import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

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

    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [messageLoading, setMessageLoading] = useState(false);
    const [messageError, setMessageError] = useState('');
    const [selectedCoach, setSelectedCoach] = useState(null);

    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profileCoach, setProfileCoach] = useState(null);

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

    const openMessageModal = (coach) => {
        setSelectedCoach(coach);
        setMessageContent('');
        setMessageError('');
        setMessageModalOpen(true);
    };

    const closeMessageModal = () => {
        setMessageModalOpen(false);
        setSelectedCoach(null);
        setMessageContent('');
        setMessageError('');
    };

    const sendMessage = async () => {
        setMessageLoading(true);
        setMessageError('');
        try {
            const user = auth.currentUser;
            if (!user || !selectedCoach) {
                setMessageError('User not authenticated or coach not selected.');
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
                console.log('User is not a coach, checking if parent...');
            }

            // Check if user is a parent by looking for parent profile
            if (senderRole === 'athlete') {
                try {
                    const parentDoc = await getDoc(doc(db, 'parents', user.uid));
                    if (parentDoc.exists()) {
                        const parentData = parentDoc.data();
                        senderRole = 'parent';
                        senderName = parentData.name || user.displayName || 'Parent';
                    }
                } catch (err) {
                    console.log('User is not a parent, using athlete role');
                }
            }

            const conversationId = [user.uid, selectedCoach.id].sort().join('_');
            await addDoc(collection(db, 'messages'), {
                senderId: user.uid,
                senderRole: senderRole,
                senderName: senderName,
                receiverId: selectedCoach.id,
                receiverRole: 'coach',
                receiverName: selectedCoach.coachProfile.name || 'Coach',
                content: messageContent,
                timestamp: serverTimestamp(),
                conversationId,
                participants: [user.uid, selectedCoach.id]
            });
            setMessageModalOpen(false);
        } catch (err) {
            console.error('Error sending message:', err);
            setMessageError('Failed to send message.');
        } finally {
            setMessageLoading(false);
        }
    };

    const openProfileModal = (coach) => {
        setProfileCoach(coach);
        setProfileModalOpen(true);
    };

    const closeProfileModal = () => {
        setProfileModalOpen(false);
        setProfileCoach(null);
    };

    // Coach Profile Modal (modern, large, rectangular)
    const renderProfileModal = () => {
        if (!profileModalOpen || !profileCoach) return null;
        const coachProfile = profileCoach.coachProfile || {};
        // Ensure certifications is always an array
        let certifications = coachProfile.certifications;
        if (!Array.isArray(certifications)) {
            if (typeof certifications === 'string') {
                certifications = certifications.split(',').map(c => c.trim()).filter(Boolean);
            } else if (!certifications) {
                certifications = [];
            } else {
                certifications = [String(certifications)];
            }
        }
        // Ensure skills is always an object
        const skills = coachProfile.skills || {};
        // Ensure ageGroups is always an array
        let ageGroups = coachProfile.ageGroups;
        if (!Array.isArray(ageGroups)) {
            if (typeof ageGroups === 'string') {
                ageGroups = ageGroups.split(',').map(a => a.trim()).filter(Boolean);
            } else if (!ageGroups) {
                ageGroups = [];
            } else {
                ageGroups = [String(ageGroups)];
            }
        }
        // Get coach name using the same logic as the coach card
        const getCoachName = (coach) =>
            coach.name || coach.coachProfile?.name || `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || 'Coach';
        const coachName = getCoachName(profileCoach);
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col p-0 relative overflow-hidden">
                    {/* Close button */}
                    <button onClick={closeProfileModal} className="absolute top-6 right-6 text-3xl text-gray-400 hover:text-gray-700 focus:outline-none">&times;</button>
                    {/* Header */}
                    <div className="flex items-center gap-6 px-10 pt-10 pb-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex-shrink-0 w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center text-5xl font-bold text-blue-700 uppercase">
                            {coachName[0] || 'C'}
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{coachName}</div>
                            <div className="text-lg text-blue-600 font-medium mb-1">{Array.isArray(coachProfile.sports) ? coachProfile.sports.join(', ') : coachProfile.sports || ''}</div>
                            {coachProfile.location && <div className="text-gray-500">{coachProfile.location}</div>}
                        </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-10 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left column: Skills, Age Groups, Certifications */}
                        <div>
                            <div className="mb-6">
                                <div className="font-semibold text-gray-700 mb-2">Skills</div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(skills).length === 0 && <span className="text-gray-400">No skills listed</span>}
                                    {Object.entries(skills).map(([sport, skillArr]) => (
                                        <div key={sport} className="flex flex-wrap gap-2">
                                            {Array.isArray(skillArr) ? skillArr.map((skill, idx) => (
                                                <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">{sport}: {skill}</span>
                                            )) : (
                                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">{sport}: {skillArr}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6">
                                <div className="font-semibold text-gray-700 mb-2">Age Groups</div>
                                <div className="flex flex-wrap gap-2">
                                    {ageGroups.length === 0 && <span className="text-gray-400">No age groups listed</span>}
                                    {ageGroups.map((age, idx) => (
                                        <span key={idx} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">{age}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-700 mb-2">Certifications</div>
                                <div className="flex flex-wrap gap-2">
                                    {certifications.length === 0 && <span className="text-gray-400">No certifications listed</span>}
                                    {certifications.map((cert, idx) => (
                                        <span key={idx} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">{cert}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Right column: Bio and future features */}
                        <div>
                            <div className="font-semibold text-gray-700 mb-2">Bio</div>
                            <div className="bg-gray-100 rounded-lg p-4 text-gray-800 min-h-[100px]">
                                {coachProfile.bio || <span className="text-gray-400">No bio provided</span>}
                            </div>
                            {/* Placeholder for future features (reviews, contact, etc.) */}
                            <div className="mt-8">
                                <div className="text-gray-400 italic text-sm">More features coming soon...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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

            {/* Coaches Networking Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 shadow-sm">
                <h3 className="text-lg font-semibold text-green-900 mb-3">For Coaches: Network with Other Coaches</h3>
                <p className="text-green-800 mb-3">
                    Coaches looking for opportunities to work with other coaches or seeking collaborative partnerships can use this page to reach out to fellow coaches.
                    Whether you're looking to share knowledge, collaborate on training programs, or explore joint coaching opportunities,
                    this directory provides direct access to connect with other experienced coaches in your area.
                </p>
                <div className="bg-green-100 border-l-4 border-green-400 p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Coaches Can:</h4>
                    <ul className="text-green-800 space-y-1">
                        <li>• Connect with other coaches for collaboration opportunities</li>
                        <li>• Share training methodologies and best practices</li>
                        <li>• Explore joint coaching programs or camps</li>
                        <li>• Network with coaches who specialize in different skills</li>
                        <li>• Find mentors or mentees in the coaching community</li>
                    </ul>
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
                        <div className="mt-6 flex gap-2">
                            <button
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                onClick={() => openMessageModal(coach)}
                            >
                                Contact Coach
                            </button>
                            <button
                                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                                onClick={() => openProfileModal(coach)}
                            >
                                View Profile
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

            {/* Message Modal */}
            {messageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
                            onClick={closeMessageModal}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <h2 className="text-xl font-semibold mb-4">Message {selectedCoach?.coachProfile?.name || selectedCoach?.firstName || 'Coach'}</h2>
                        <textarea
                            className="w-full border border-gray-300 rounded p-2 mb-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type your message..."
                            value={messageContent}
                            onChange={e => setMessageContent(e.target.value)}
                            disabled={messageLoading}
                        />
                        {messageError && <div className="text-red-600 mb-2">{messageError}</div>}
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={closeMessageModal}
                                disabled={messageLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
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

export default Coaches; 