import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        athleteProfile: {
            name: '',
            age: '',
            sports: [],
            competitiveLevel: ''
        },
        coachProfile: {
            bio: '',
            location: '',
            sports: [],
            skills: {},
            ageGroups: [],
            certifications: []
        },
        parentProfile: {
            numberOfAthletes: 1,
            athletes: [
                {
                    name: '',
                    age: '',
                    sports: [],
                    competitiveLevel: 'beginner'
                }
            ]
        },
        teamProfile: {
            teamName: '',
            sport: '',
            ageGroups: [],
            teamType: '',
            location: '',
            website: '',
            description: ''
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    navigate('/login');
                    return;
                }

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setProfile(userData);
                    setFormData({
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        athleteProfile: userData.athleteProfile || {
                            name: '',
                            age: '',
                            sports: [],
                            competitiveLevel: 'beginner'
                        },
                        coachProfile: userData.coachProfile || {
                            bio: '',
                            location: '',
                            sports: [],
                            skills: {},
                            ageGroups: [],
                            certifications: []
                        },
                        parentProfile: userData.parentProfile || {
                            numberOfAthletes: 1,
                            athletes: [
                                {
                                    name: '',
                                    age: '',
                                    sports: [],
                                    competitiveLevel: 'beginner'
                                }
                            ]
                        },
                        teamProfile: userData.teamProfile || {
                            teamName: '',
                            sport: '',
                            ageGroups: [],
                            teamType: '',
                            location: '',
                            website: '',
                            description: ''
                        }
                    });
                }
            } catch (err) {
                setError('Failed to load profile');
                console.error('Error loading profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Handle parent profile changes
        if (name.startsWith('parentProfile.')) {
            const field = name.split('.')[1];
            if (field === 'numberOfAthletes') {
                const numAthletes = parseInt(value);
                setFormData(prev => {
                    const currentAthletes = prev.parentProfile.athletes;
                    let newAthletes = [...currentAthletes];

                    // Add or remove athletes based on the new number
                    if (numAthletes > currentAthletes.length) {
                        // Add new athletes
                        for (let i = currentAthletes.length; i < numAthletes; i++) {
                            newAthletes.push({
                                name: '',
                                age: '',
                                sports: [],
                                competitiveLevel: 'beginner'
                            });
                        }
                    } else if (numAthletes < currentAthletes.length) {
                        // Remove excess athletes
                        newAthletes = newAthletes.slice(0, numAthletes);
                    }

                    return {
                        ...prev,
                        parentProfile: {
                            ...prev.parentProfile,
                            numberOfAthletes: numAthletes,
                            athletes: newAthletes
                        }
                    };
                });
            }
            return;
        }

        // Handle individual athlete fields within parent profile
        if (name.startsWith('parentAthlete.')) {
            const parts = name.split('.');
            const athleteIndex = parseInt(parts[1]);
            const field = parts[2];

            if (field === 'sports') {
                const sport = value;
                setFormData(prev => ({
                    ...prev,
                    parentProfile: {
                        ...prev.parentProfile,
                        athletes: prev.parentProfile.athletes.map((athlete, index) =>
                            index === athleteIndex
                                ? {
                                    ...athlete,
                                    sports: checked
                                        ? [...athlete.sports, sport]
                                        : athlete.sports.filter(s => s !== sport)
                                }
                                : athlete
                        )
                    }
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    parentProfile: {
                        ...prev.parentProfile,
                        athletes: prev.parentProfile.athletes.map((athlete, index) =>
                            index === athleteIndex
                                ? { ...athlete, [field]: value }
                                : athlete
                        )
                    }
                }));
            }
            return;
        }

        if (name.startsWith('athlete.')) {
            const athleteField = name.split('.')[1];
            if (athleteField === 'sports') {
                const sport = value;
                setFormData(prev => ({
                    ...prev,
                    athleteProfile: {
                        ...prev.athleteProfile,
                        sports: checked
                            ? [...prev.athleteProfile.sports, sport]
                            : prev.athleteProfile.sports.filter(s => s !== sport)
                    }
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    athleteProfile: {
                        ...prev.athleteProfile,
                        [athleteField]: value
                    }
                }));
            }
        } else if (name.startsWith('coach.')) {
            const coachField = name.split('.')[1];
            if (coachField === 'sports') {
                const sport = value;
                setFormData(prev => ({
                    ...prev,
                    coachProfile: {
                        ...prev.coachProfile,
                        sports: checked
                            ? [...prev.coachProfile.sports, sport]
                            : prev.coachProfile.sports.filter(s => s !== sport)
                    }
                }));
            } else if (coachField === 'skills') {
                const [sport, skill] = value.split('.');
                setFormData(prev => {
                    const prevSkills = prev.coachProfile.skills || {};
                    let newSkillsArr = checked
                        ? Array.from(new Set([...(prevSkills[sport] || []), skill]))
                        : (prevSkills[sport] || []).filter(s => s !== skill);
                    // Remove the sport key if array is empty
                    let newSkillsObj = { ...prevSkills };
                    if (newSkillsArr.length === 0) {
                        delete newSkillsObj[sport];
                    } else {
                        newSkillsObj[sport] = newSkillsArr;
                    }
                    return {
                        ...prev,
                        coachProfile: {
                            ...prev.coachProfile,
                            skills: newSkillsObj
                        }
                    };
                });
            } else if (coachField === 'ageGroups') {
                const ageGroup = value;
                setFormData(prev => ({
                    ...prev,
                    coachProfile: {
                        ...prev.coachProfile,
                        ageGroups: checked
                            ? [...prev.coachProfile.ageGroups, ageGroup]
                            : prev.coachProfile.ageGroups.filter(ag => ag !== ageGroup)
                    }
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    coachProfile: {
                        ...prev.coachProfile,
                        [coachField]: value
                    }
                }));
            }
        } else if (name.startsWith('team.')) {
            const teamField = name.split('.')[1];
            if (teamField === 'ageGroups') {
                const ageGroup = value;
                setFormData(prev => ({
                    ...prev,
                    teamProfile: {
                        ...prev.teamProfile,
                        ageGroups: checked
                            ? [...prev.teamProfile.ageGroups, ageGroup]
                            : prev.teamProfile.ageGroups.filter(ag => ag !== ageGroup)
                    }
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    teamProfile: {
                        ...prev.teamProfile,
                        [teamField]: value
                    }
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                navigate('/login');
                return;
            }

            if (!profile || !profile.role) {
                setError('Profile role is missing. Please reload and try again.');
                setLoading(false);
                return;
            }

            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName
            };
            if (profile.role === 'athlete') {
                updateData.athleteProfile = formData.athleteProfile;
            } else if (profile.role === 'coach') {
                // Clean up skills: remove empty arrays
                const cleanedSkills = Object.fromEntries(
                    Object.entries(formData.coachProfile.skills || {}).filter(([_, arr]) => Array.isArray(arr) && arr.length > 0)
                );
                updateData.coachProfile = {
                    ...formData.coachProfile,
                    skills: cleanedSkills
                };
            } else if (profile.role === 'team') {
                updateData.teamProfile = formData.teamProfile;
            } else if (profile.role === 'parent') {
                updateData.parentProfile = formData.parentProfile;
            }

            // Log for debugging
            console.log('User UID:', user.uid);
            console.log('Firestore docRef path: users/' + user.uid);
            console.log('Updating Firestore with:', updateData);

            // Update users collection
            await updateDoc(doc(db, 'users', user.uid), updateData);
            console.log('Firestore updateDoc (users): SUCCESS');

            // Also update coaches or athletes collection
            if (profile.role === 'coach') {
                await updateDoc(doc(db, 'coaches', user.uid), updateData);
                console.log('Firestore updateDoc (coaches): SUCCESS');
            } else if (profile.role === 'athlete') {
                await updateDoc(doc(db, 'athletes', user.uid), updateData);
                console.log('Firestore updateDoc (athletes): SUCCESS');
            } else if (profile.role === 'team') {
                await updateDoc(doc(db, 'teams', user.uid), updateData);
                console.log('Firestore updateDoc (teams): SUCCESS');
            } else if (profile.role === 'parent') {
                await updateDoc(doc(db, 'parents', user.uid), updateData);
                console.log('Firestore updateDoc (parents): SUCCESS');
            }

            setEditMode(false);
            setProfile({ ...profile, ...updateData });
        } catch (err) {
            console.error('Firestore updateDoc: ERROR', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {profile.role === 'coach' ? 'Coach Profile' :
                                    profile.role === 'team' ? 'Team Profile' :
                                        profile.role === 'parent' ? 'Parent Profile' :
                                            'Athlete Profile'}
                            </h3>
                            {!editMode && (
                                <button
                                    type="button"
                                    onClick={() => setEditMode(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        {editMode ? (
                            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {profile.role === 'athlete' ? (
                                    <>
                                        <div>
                                            <label htmlFor="athlete.name" className="block text-sm font-medium text-gray-700">
                                                Athlete Name
                                            </label>
                                            <input
                                                type="text"
                                                name="athlete.name"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.athleteProfile.name}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="athlete.age" className="block text-sm font-medium text-gray-700">
                                                Athlete Age
                                            </label>
                                            <input
                                                type="number"
                                                name="athlete.age"
                                                required
                                                min="4"
                                                max="18"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.athleteProfile.age}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Sports Interests
                                            </label>
                                            <div className="mt-2 space-y-2">
                                                <div className="flex items-center">
                                                    <input
                                                        id="sport-baseball"
                                                        name="athlete.sports"
                                                        type="checkbox"
                                                        value="baseball"
                                                        checked={formData.athleteProfile.sports.includes('baseball')}
                                                        onChange={handleChange}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="sport-baseball" className="ml-2 block text-sm text-gray-900">
                                                        ⚾ Baseball
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        id="sport-soccer"
                                                        name="athlete.sports"
                                                        type="checkbox"
                                                        value="soccer"
                                                        checked={formData.athleteProfile.sports.includes('soccer')}
                                                        onChange={handleChange}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="sport-soccer" className="ml-2 block text-sm text-gray-900">
                                                        ⚽ Soccer
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="athlete.competitiveLevel" className="block text-sm font-medium text-gray-700">
                                                Competitive Level
                                            </label>
                                            <select
                                                name="athlete.competitiveLevel"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.athleteProfile.competitiveLevel}
                                                onChange={handleChange}
                                            >
                                                <option value="beginner">Beginner</option>
                                                <option value="intermediate">Intermediate</option>
                                                <option value="advanced">Advanced</option>
                                                <option value="elite">Elite</option>
                                            </select>
                                        </div>
                                    </>
                                ) : profile.role === 'parent' ? (
                                    <>
                                        <div>
                                            <label htmlFor="parentProfile.numberOfAthletes" className="block text-sm font-medium text-gray-700">
                                                Number of Athletes
                                            </label>
                                            <select
                                                id="parentProfile.numberOfAthletes"
                                                name="parentProfile.numberOfAthletes"
                                                required
                                                value={formData.parentProfile.numberOfAthletes}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                            >
                                                <option value={1}>1 Athlete</option>
                                                <option value={2}>2 Athletes</option>
                                                <option value={3}>3 Athletes</option>
                                                <option value={4}>4 Athletes</option>
                                                <option value={5}>5 Athletes</option>
                                            </select>
                                        </div>

                                        {/* Athletes Information */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-medium text-gray-900">Athletes Information</h3>
                                                <div className="flex space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newAthletes = [...formData.parentProfile.athletes, {
                                                                name: '',
                                                                age: '',
                                                                sports: [],
                                                                competitiveLevel: 'beginner'
                                                            }];
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                parentProfile: {
                                                                    ...prev.parentProfile,
                                                                    numberOfAthletes: newAthletes.length,
                                                                    athletes: newAthletes
                                                                }
                                                            }));
                                                        }}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                                    >
                                                        + Add Athlete
                                                    </button>
                                                </div>
                                            </div>
                                            {formData.parentProfile.athletes.map((athlete, index) => (
                                                <div key={index} className="bg-gray-50 p-4 rounded-lg border relative">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900">Athlete {index + 1}</h4>
                                                        {formData.parentProfile.athletes.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newAthletes = formData.parentProfile.athletes.filter((_, i) => i !== index);
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        parentProfile: {
                                                                            ...prev.parentProfile,
                                                                            numberOfAthletes: newAthletes.length,
                                                                            athletes: newAthletes
                                                                        }
                                                                    }));
                                                                }}
                                                                className="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor={`parentAthlete.${index}.name`} className="block text-sm font-medium text-gray-700">
                                                                Name
                                                            </label>
                                                            <input
                                                                id={`parentAthlete.${index}.name`}
                                                                name={`parentAthlete.${index}.name`}
                                                                type="text"
                                                                required
                                                                value={athlete.name}
                                                                onChange={handleChange}
                                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                                                placeholder="Athlete Name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label htmlFor={`parentAthlete.${index}.age`} className="block text-sm font-medium text-gray-700">
                                                                Age
                                                            </label>
                                                            <input
                                                                id={`parentAthlete.${index}.age`}
                                                                name={`parentAthlete.${index}.age`}
                                                                type="number"
                                                                required
                                                                min="4"
                                                                max="18"
                                                                value={athlete.age}
                                                                onChange={handleChange}
                                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                                                placeholder="Age"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Sports Interests
                                                            </label>
                                                            <div className="flex flex-wrap gap-3">
                                                                <label className="inline-flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        name={`parentAthlete.${index}.sports`}
                                                                        value="baseball"
                                                                        checked={athlete.sports.includes('baseball')}
                                                                        onChange={handleChange}
                                                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                                    />
                                                                    <span className="ml-2 text-sm">⚾ Baseball</span>
                                                                </label>
                                                                <label className="inline-flex items-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        name={`parentAthlete.${index}.sports`}
                                                                        value="soccer"
                                                                        checked={athlete.sports.includes('soccer')}
                                                                        onChange={handleChange}
                                                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                                    />
                                                                    <span className="ml-2 text-sm">⚽ Soccer</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label htmlFor={`parentAthlete.${index}.competitiveLevel`} className="block text-sm font-medium text-gray-700">
                                                                Competitive Level
                                                            </label>
                                                            <select
                                                                id={`parentAthlete.${index}.competitiveLevel`}
                                                                name={`parentAthlete.${index}.competitiveLevel`}
                                                                required
                                                                value={athlete.competitiveLevel}
                                                                onChange={handleChange}
                                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                                            >
                                                                <option value="beginner">Beginner</option>
                                                                <option value="intermediate">Intermediate</option>
                                                                <option value="advanced">Advanced</option>
                                                                <option value="elite">Elite</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : profile.role === 'team' ? (
                                    <>
                                        <div>
                                            <label htmlFor="team.teamName" className="block text-sm font-medium text-gray-700">
                                                Team Name
                                            </label>
                                            <input
                                                type="text"
                                                name="team.teamName"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.teamProfile.teamName}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="team.sport" className="block text-sm font-medium text-gray-700">
                                                Sport
                                            </label>
                                            <input
                                                type="text"
                                                name="team.sport"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.teamProfile.sport}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Age Groups Supported
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['9u', '10u', '11u', '12u', '13u', '14u', '15u', '16u', '17u', '18u'].map(ageGroup => (
                                                    <label key={ageGroup} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            name="team.ageGroups"
                                                            value={ageGroup}
                                                            checked={Array.isArray(formData.teamProfile.ageGroups) && formData.teamProfile.ageGroups.includes(ageGroup)}
                                                            onChange={handleChange}
                                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">{ageGroup}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="team.teamType" className="block text-sm font-medium text-gray-700">
                                                Team Type
                                            </label>
                                            <input
                                                type="text"
                                                name="team.teamType"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.teamProfile.teamType}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="team.location" className="block text-sm font-medium text-gray-700">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                name="team.location"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.teamProfile.location}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="team.website" className="block text-sm font-medium text-gray-700">
                                                Website
                                            </label>
                                            <input
                                                type="text"
                                                name="team.website"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.teamProfile.website}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="team.description" className="block text-sm font-medium text-gray-700">
                                                Description
                                            </label>
                                            <textarea
                                                id="team.description"
                                                name="team.description"
                                                rows={4}
                                                value={formData.teamProfile.description}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Tell us about your team..."
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label htmlFor="coach.bio" className="block text-sm font-medium text-gray-700">
                                                Bio
                                            </label>
                                            <textarea
                                                id="coach.bio"
                                                name="coach.bio"
                                                rows={4}
                                                value={formData.coachProfile.bio}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Tell us about your coaching experience and philosophy..."
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="coach.location" className="block text-sm font-medium text-gray-700">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                id="coach.location"
                                                name="coach.location"
                                                value={formData.coachProfile.location}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="City, State"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Sports
                                            </label>
                                            <div className="mt-2 space-y-2">
                                                <div className="flex items-center">
                                                    <input
                                                        id="coach-sport-baseball"
                                                        name="coach.sports"
                                                        type="checkbox"
                                                        value="baseball"
                                                        checked={formData.coachProfile.sports.includes('baseball')}
                                                        onChange={handleChange}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="coach-sport-baseball" className="ml-2 block text-sm text-gray-900">
                                                        ⚾ Baseball
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        id="coach-sport-soccer"
                                                        name="coach.sports"
                                                        type="checkbox"
                                                        value="soccer"
                                                        checked={formData.coachProfile.sports.includes('soccer')}
                                                        onChange={handleChange}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="coach-sport-soccer" className="ml-2 block text-sm text-gray-900">
                                                        ⚽ Soccer
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Skills
                                            </label>
                                            <div className="mt-2 space-y-2">
                                                {formData.coachProfile.sports.map(sport => (
                                                    <div key={sport}>
                                                        <h4 className="text-sm font-medium text-gray-700">{sport.charAt(0).toUpperCase() + sport.slice(1)}</h4>
                                                        <div className="mt-1 space-y-1">
                                                            {sport === 'baseball' ? (
                                                                ['hitting', 'pitching', 'infield', 'outfield', 'baserunning'].map(skill => (
                                                                    <div key={skill} className="flex items-center">
                                                                        <input
                                                                            id={`coach-skill-${sport}-${skill}`}
                                                                            name="coach.skills"
                                                                            type="checkbox"
                                                                            value={`${sport}.${skill}`}
                                                                            checked={(formData.coachProfile.skills[sport] || []).includes(skill)}
                                                                            onChange={handleChange}
                                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                                        />
                                                                        <label htmlFor={`coach-skill-${sport}-${skill}`} className="ml-2 block text-sm text-gray-900">
                                                                            {skill.charAt(0).toUpperCase() + skill.slice(1)}
                                                                        </label>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                ['shooting', 'ball handling', 'speed', 'goalkeeping', 'defense'].map(skill => (
                                                                    <div key={skill} className="flex items-center">
                                                                        <input
                                                                            id={`coach-skill-${sport}-${skill}`}
                                                                            name="coach.skills"
                                                                            type="checkbox"
                                                                            value={`${sport}.${skill}`}
                                                                            checked={(formData.coachProfile.skills[sport] || []).includes(skill)}
                                                                            onChange={handleChange}
                                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                                        />
                                                                        <label htmlFor={`coach-skill-${sport}-${skill}`} className="ml-2 block text-sm text-gray-900">
                                                                            {skill.charAt(0).toUpperCase() + skill.slice(1)}
                                                                        </label>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Age Groups
                                            </label>
                                            <div className="mt-2 space-y-2">
                                                {['3-9', '10-13', '14-18', '18+'].map(ageGroup => (
                                                    <div key={ageGroup} className="flex items-center">
                                                        <input
                                                            id={`coach-ageGroup-${ageGroup}`}
                                                            name="coach.ageGroups"
                                                            type="checkbox"
                                                            value={ageGroup}
                                                            checked={formData.coachProfile.ageGroups.includes(ageGroup)}
                                                            onChange={handleChange}
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`coach-ageGroup-${ageGroup}`} className="ml-2 block text-sm text-gray-900">
                                                            {ageGroup}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditMode(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="mt-6">
                                <div className="flex items-center space-x-4">
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900">
                                            {profile?.firstName} {profile?.lastName}
                                        </h4>
                                        {profile.role === 'athlete' && (
                                            <p className="text-sm text-gray-500">
                                                {profile?.athleteProfile?.name}
                                            </p>
                                        )}
                                        {profile.role === 'parent' && (
                                            <p className="text-sm text-gray-500">
                                                Parent of {profile?.parentProfile?.athletes?.length || 0} athlete(s)
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <dl className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    {profile.role === 'athlete' ? (
                                        <>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Age</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.athleteProfile?.age}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Competitive Level</dt>
                                                <dd className="mt-1 text-sm text-gray-900 capitalize">
                                                    {profile?.athleteProfile?.competitiveLevel}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Sports Interests</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.athleteProfile?.sports?.length > 0 ? (
                                                        <div className="flex space-x-2">
                                                            {profile.athleteProfile.sports.map(sport => (
                                                                <span
                                                                    key={sport}
                                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                                >
                                                                    {sport === 'baseball' ? '⚾' : '⚽'} {sport.charAt(0).toUpperCase() + sport.slice(1)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">No sports selected</span>
                                                    )}
                                                </dd>
                                            </div>
                                        </>
                                    ) : profile.role === 'team' ? (
                                        <>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Team Name</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.teamProfile?.teamName}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Sport</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.teamProfile?.sport}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Age Groups</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.teamProfile?.ageGroups?.length > 0 ? (
                                                        <div className="flex space-x-2">
                                                            {profile.teamProfile.ageGroups.map(ageGroup => (
                                                                <span
                                                                    key={ageGroup}
                                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                                >
                                                                    {ageGroup}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">No age groups selected</span>
                                                    )}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Team Type</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.teamProfile?.teamType}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Location</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.teamProfile?.location}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Website</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.teamProfile?.website}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Description</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.teamProfile?.description}
                                                </dd>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Bio</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.coachProfile?.bio || 'No bio provided'}
                                                </dd>
                                            </div>

                                            <div>
                                                <dt className="text-sm font-medium text-gray-500">Location</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.coachProfile?.location || 'No location provided'}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Sports</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.coachProfile?.sports?.length > 0 ? (
                                                        <div className="flex space-x-2">
                                                            {profile.coachProfile.sports.map(sport => (
                                                                <span
                                                                    key={sport}
                                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                                >
                                                                    {sport === 'baseball' ? '⚾' : '⚽'} {sport.charAt(0).toUpperCase() + sport.slice(1)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">No sports selected</span>
                                                    )}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Skills</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {Object.entries(profile?.coachProfile?.skills || {}).map(([sport, skills]) => (
                                                        <div key={sport} className="mb-2">
                                                            <h5 className="font-medium">{sport.charAt(0).toUpperCase() + sport.slice(1)}</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {skills.map(skill => (
                                                                    <span
                                                                        key={skill}
                                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                                    >
                                                                        {skill.charAt(0).toUpperCase() + skill.slice(1)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Age Groups</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.coachProfile?.ageGroups?.length > 0 ? (
                                                        <div className="flex space-x-2">
                                                            {profile.coachProfile.ageGroups.map(ageGroup => (
                                                                <span
                                                                    key={ageGroup}
                                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                                                >
                                                                    {ageGroup}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">No age groups selected</span>
                                                    )}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Number of Athletes</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.parentProfile?.numberOfAthletes || 0}
                                                </dd>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500">Athletes</dt>
                                                <dd className="mt-1 text-sm text-gray-900">
                                                    {profile?.parentProfile?.athletes?.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {profile.parentProfile.athletes.map((athlete, index) => (
                                                                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                                                                    <h4 className="font-medium text-gray-900 mb-2">Athlete {index + 1}: {athlete.name}</h4>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        <div>
                                                                            <span className="text-xs font-medium text-gray-500">Age:</span>
                                                                            <span className="ml-2 text-sm text-gray-900">{athlete.age}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-xs font-medium text-gray-500">Level:</span>
                                                                            <span className="ml-2 text-sm text-gray-900 capitalize">{athlete.competitiveLevel}</span>
                                                                        </div>
                                                                        <div className="sm:col-span-2">
                                                                            <span className="text-xs font-medium text-gray-500">Sports:</span>
                                                                            <div className="mt-1 flex space-x-2">
                                                                                {athlete.sports?.length > 0 ? (
                                                                                    athlete.sports.map(sport => (
                                                                                        <span
                                                                                            key={sport}
                                                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                                                                        >
                                                                                            {sport === 'baseball' ? '⚾' : '⚽'} {sport.charAt(0).toUpperCase() + sport.slice(1)}
                                                                                        </span>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-gray-500">No sports selected</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">No athletes registered</span>
                                                    )}
                                                </dd>
                                            </div>
                                        </>
                                    )}
                                </dl>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile; 