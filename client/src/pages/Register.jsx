import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

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

const TEAM_AGE_GROUPS = [
    '9u', '10u', '11u', '12u', '13u', '14u', '15u', '16u', '17u', '18u'
];

const SPORTS = [
    { label: 'Baseball', value: 'baseball', icon: '⚾' },
    { label: 'Soccer', value: 'soccer', icon: '⚽' },
    { label: 'Basketball', value: 'basketball', icon: '🏀' },
    { label: 'Football', value: 'football', icon: '🏈' },
    { label: 'Softball', value: 'softball', icon: '🥎' },
    { label: 'Volleyball', value: 'volleyball', icon: '🏐' },
];

const TEAM_TYPES = [
    { label: 'Travel Team', value: 'travel' },
    { label: 'No-Travel Team', value: 'no-travel' }
];

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'athlete',
        athleteProfile: {
            name: '',
            age: '',
            sports: [],
            competitiveLevel: 'beginner'
        },
        coachProfile: {
            sports: [],
            skills: {
                baseball: [],
                soccer: []
            },
            ageGroups: [],
            bio: '',
            location: '',
            experience: '',
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
        merchantProfile: {
            businessName: '',
            businessType: '',
            products: [],
            location: '',
        },
        leagueProfile: {
            leagueName: '',
            sport: '',
            ageGroups: [],
            location: '',
            season: '',
            website: '',
            description: ''
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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setCurrentUser } = useAuth();

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

        // Handle coach skills FIRST
        if (name.startsWith('coachProfile.skills.')) {
            const sport = name.split('.')[2];
            const skill = value;
            setFormData(prev => ({
                ...prev,
                coachProfile: {
                    ...prev.coachProfile,
                    skills: {
                        ...prev.coachProfile.skills,
                        [sport]: checked
                            ? Array.from(new Set([...(Array.isArray(prev.coachProfile.skills[sport]) ? prev.coachProfile.skills[sport] : []), skill]))
                            : (Array.isArray(prev.coachProfile.skills[sport]) ? prev.coachProfile.skills[sport] : []).filter(s => s !== skill)
                    }
                }
            }));
        }
        // Handle athlete fields
        else if (name.startsWith('athlete.')) {
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
        }
        // Handle coach fields (other than skills)
        else if (name.startsWith('coachProfile.')) {
            const field = name.split('.')[1];

            // Handle sports selection
            if (field === 'sports') {
                setFormData(prev => ({
                    ...prev,
                    coachProfile: {
                        ...prev.coachProfile,
                        sports: checked
                            ? [...(Array.isArray(prev.coachProfile.sports) ? prev.coachProfile.sports : []), value]
                            : (Array.isArray(prev.coachProfile.sports) ? prev.coachProfile.sports : []).filter(sport => sport !== value)
                    }
                }));
            }
            // Handle age groups selection
            else if (field === 'ageGroups') {
                setFormData(prev => ({
                    ...prev,
                    coachProfile: {
                        ...prev.coachProfile,
                        ageGroups: checked
                            ? [...(Array.isArray(prev.coachProfile.ageGroups) ? prev.coachProfile.ageGroups : []), value]
                            : (Array.isArray(prev.coachProfile.ageGroups) ? prev.coachProfile.ageGroups : []).filter(age => age !== value)
                    }
                }));
            }
            // Handle other coach fields
            else {
                setFormData(prev => ({
                    ...prev,
                    coachProfile: {
                        ...prev.coachProfile,
                        [field]: value
                    }
                }));
            }
        }
        // Handle team fields
        else if (name.startsWith('teamProfile.')) {
            const field = name.split('.')[1];

            // Handle age groups selection
            if (field === 'ageGroups') {
                setFormData(prev => ({
                    ...prev,
                    teamProfile: {
                        ...prev.teamProfile,
                        ageGroups: checked
                            ? [...(Array.isArray(prev.teamProfile.ageGroups) ? prev.teamProfile.ageGroups : []), value]
                            : (Array.isArray(prev.teamProfile.ageGroups) ? prev.teamProfile.ageGroups : []).filter(age => age !== value)
                    }
                }));
            }
            // Handle other team fields
            else {
                setFormData(prev => ({
                    ...prev,
                    teamProfile: {
                        ...prev.teamProfile,
                        [field]: value
                    }
                }));
            }
        }
        // Handle all other fields
        else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // Update user profile
            await updateProfile(userCredential.user, {
                displayName: `${formData.firstName} ${formData.lastName}`
            });

            // Create user document in Firestore
            const userData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: formData.role,
                name: `${formData.firstName} ${formData.lastName}`,
                createdAt: new Date().toISOString()
            };

            // Add role-specific profile data
            if (formData.role === 'coach') {
                userData.coachProfile = {
                    ...formData.coachProfile,
                    sports: formData.coachProfile.sports || [],
                    skills: formData.coachProfile.skills || {},
                    ageGroups: formData.coachProfile.ageGroups || [],
                    certifications: formData.coachProfile.certifications || []
                };
            }

            // Add role-specific profile data and save to appropriate collection
            let collectionName;
            switch (formData.role) {
                case 'athlete':
                    userData.athleteProfile = formData.athleteProfile;
                    collectionName = 'athletes';
                    break;
                case 'coach':
                    collectionName = 'coaches';
                    break;
                case 'parent':
                    userData.parentProfile = formData.parentProfile;
                    collectionName = 'parents';
                    break;
                case 'merchant':
                    userData.merchantProfile = formData.merchantProfile;
                    collectionName = 'merchants';
                    break;
                case 'league':
                    userData.leagueProfile = formData.leagueProfile;
                    collectionName = 'leagues';
                    break;
                case 'team':
                    userData.teamProfile = formData.teamProfile;
                    collectionName = 'teams';
                    break;
            }

            // Save to both users collection and role-specific collection
            await setDoc(doc(db, 'users', userCredential.user.uid), userData);
            if (collectionName) {
                await setDoc(doc(db, collectionName, userCredential.user.uid), userData);
            }

            setCurrentUser(userCredential.user);
            navigate('/profile');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderRoleSpecificFields = () => {
        switch (formData.role) {
            case 'athlete':
                return (
                    <>
                        <div>
                            <label htmlFor="athlete.name" className="sr-only">
                                Athlete Name
                            </label>
                            <input
                                id="athlete.name"
                                name="athlete.name"
                                type="text"
                                required
                                value={formData.athleteProfile.name}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Athlete Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="athlete.age" className="sr-only">
                                Athlete Age
                            </label>
                            <input
                                id="athlete.age"
                                name="athlete.age"
                                type="number"
                                required
                                min="4"
                                max="18"
                                value={formData.athleteProfile.age}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Athlete Age"
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
                            <label htmlFor="athlete.competitiveLevel" className="sr-only">
                                Competitive Level
                            </label>
                            <select
                                id="athlete.competitiveLevel"
                                name="athlete.competitiveLevel"
                                required
                                value={formData.athleteProfile.competitiveLevel}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="elite">Elite</option>
                            </select>
                        </div>
                    </>
                );
            case 'parent':
                return (
                    <>
                        <div className="space-y-6">
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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
                                <h3 className="text-lg font-medium text-gray-900">Athletes Information</h3>
                                {formData.parentProfile.athletes.map((athlete, index) => (
                                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                                        <h4 className="font-medium text-gray-900 mb-3">Athlete {index + 1}</h4>
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
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
                        </div>
                    </>
                );
            case 'coach':
                return (
                    <>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Sports & Skills</h3>
                                <div className="space-y-4">
                                    {/* Sports Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Sports</label>
                                        <div className="flex flex-wrap gap-2">
                                            {SPORTS.map(sport => (
                                                <label key={sport.value} className="inline-flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name="coachProfile.sports"
                                                        value={sport.value}
                                                        checked={Array.isArray(formData.coachProfile.sports) && formData.coachProfile.sports.includes(sport.value)}
                                                        onChange={handleChange}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2">{sport.icon} {sport.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Skills Selection */}
                                    {Array.isArray(formData.coachProfile.sports) && formData.coachProfile.sports.map(sport => (
                                        <div key={sport}>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {SPORTS.find(s => s.value === sport)?.label} Skills
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {(sport === 'baseball' ? BASEBALL_SKILLS : SOCCER_SKILLS).map(skill => (
                                                    <label key={skill} className="inline-flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            name={`coachProfile.skills.${sport}`}
                                                            value={skill}
                                                            checked={formData.coachProfile.skills[sport]?.includes(skill)}
                                                            onChange={handleChange}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <span className="ml-2">{skill}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Age Groups */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Age Groups You Coach</label>
                                <div className="flex flex-wrap gap-2">
                                    {AGE_GROUPS.map(ageGroup => (
                                        <label key={ageGroup} className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                name="coachProfile.ageGroups"
                                                value={ageGroup}
                                                checked={formData.coachProfile.ageGroups.includes(ageGroup)}
                                                onChange={handleChange}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2">{ageGroup}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label htmlFor="coachProfile.bio" className="block text-sm font-medium text-gray-700">
                                    Bio
                                </label>
                                <textarea
                                    id="coachProfile.bio"
                                    name="coachProfile.bio"
                                    rows={4}
                                    value={formData.coachProfile.bio}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Tell us about your coaching experience and philosophy..."
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label htmlFor="coachProfile.location" className="block text-sm font-medium text-gray-700">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    id="coachProfile.location"
                                    name="coachProfile.location"
                                    value={formData.coachProfile.location}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="City, State"
                                />
                            </div>

                            {/* Experience */}
                            <div>
                                <label htmlFor="coachProfile.experience" className="block text-sm font-medium text-gray-700">
                                    Years of Experience
                                </label>
                                <input
                                    type="number"
                                    id="coachProfile.experience"
                                    name="coachProfile.experience"
                                    value={formData.coachProfile.experience}
                                    onChange={handleChange}
                                    min="0"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            {/* Certifications */}
                            <div>
                                <label htmlFor="coachProfile.certifications" className="block text-sm font-medium text-gray-700">
                                    Certifications (separated by commas)
                                </label>
                                <textarea
                                    id="coachProfile.certifications"
                                    name="coachProfile.certifications"
                                    rows={3}
                                    value={formData.coachProfile.certifications}
                                    onChange={(e) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            coachProfile: {
                                                ...prev.coachProfile,
                                                certifications: e.target.value
                                            }
                                        }));
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="Enter your certifications, separated by commas"
                                />
                            </div>
                        </div>
                    </>
                );
            case 'merchant':
                return (
                    <>
                        <div>
                            <label htmlFor="merchant.businessName" className="sr-only">
                                Business Name
                            </label>
                            <input
                                id="merchant.businessName"
                                name="merchant.businessName"
                                type="text"
                                required
                                value={formData.merchantProfile.businessName}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Business Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="merchant.businessType" className="sr-only">
                                Business Type
                            </label>
                            <select
                                id="merchant.businessType"
                                name="merchant.businessType"
                                required
                                value={formData.merchantProfile.businessType}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            >
                                <option value="">Select Business Type</option>
                                <option value="retail">Retail Store</option>
                                <option value="online">Online Store</option>
                                <option value="both">Both Retail and Online</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="merchant.location" className="sr-only">
                                Location
                            </label>
                            <input
                                id="merchant.location"
                                name="merchant.location"
                                type="text"
                                required
                                value={formData.merchantProfile.location}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Business Location"
                            />
                        </div>
                    </>
                );
            case 'league':
                return (
                    <>
                        <div>
                            <label htmlFor="league.leagueName" className="sr-only">
                                League Name
                            </label>
                            <input
                                id="league.leagueName"
                                name="league.leagueName"
                                type="text"
                                required
                                value={formData.leagueProfile.leagueName}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="League Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="league.sport" className="sr-only">
                                Sport
                            </label>
                            <input
                                id="league.sport"
                                name="league.sport"
                                type="text"
                                required
                                value={formData.leagueProfile.sport}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Sport"
                            />
                        </div>
                        <div>
                            <label htmlFor="league.location" className="sr-only">
                                Location
                            </label>
                            <input
                                id="league.location"
                                name="league.location"
                                type="text"
                                required
                                value={formData.leagueProfile.location}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="League Location"
                            />
                        </div>
                        <div>
                            <label htmlFor="league.website" className="sr-only">
                                Website
                            </label>
                            <input
                                id="league.website"
                                name="league.website"
                                type="url"
                                required
                                value={formData.leagueProfile.website}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="League Website (https://...)"
                            />
                        </div>
                        <div>
                            <label htmlFor="league.description" className="sr-only">
                                Description
                            </label>
                            <textarea
                                id="league.description"
                                name="league.description"
                                required
                                value={formData.leagueProfile.description}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Short description about the league"
                                rows={3}
                            />
                        </div>
                    </>
                );
            case 'team':
                return (
                    <>
                        <div>
                            <label htmlFor="teamProfile.teamName" className="block text-sm font-medium text-gray-700">
                                Team Name
                            </label>
                            <input
                                id="teamProfile.teamName"
                                name="teamProfile.teamName"
                                type="text"
                                required
                                value={formData.teamProfile.teamName}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                placeholder="Enter your team name"
                            />
                        </div>
                        <div>
                            <label htmlFor="teamProfile.sport" className="block text-sm font-medium text-gray-700">
                                Sport
                            </label>
                            <select
                                id="teamProfile.sport"
                                name="teamProfile.sport"
                                required
                                value={formData.teamProfile.sport}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                                <option value="">Select a sport</option>
                                {SPORTS.map(sport => (
                                    <option key={sport.value} value={sport.value}>
                                        {sport.icon} {sport.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Age Groups Supported
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {TEAM_AGE_GROUPS.map(ageGroup => (
                                    <label key={ageGroup} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="teamProfile.ageGroups"
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
                            <label htmlFor="teamProfile.teamType" className="block text-sm font-medium text-gray-700">
                                Team Type
                            </label>
                            <select
                                id="teamProfile.teamType"
                                name="teamProfile.teamType"
                                required
                                value={formData.teamProfile.teamType}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            >
                                <option value="">Select team type</option>
                                {TEAM_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="teamProfile.location" className="block text-sm font-medium text-gray-700">
                                Location
                            </label>
                            <input
                                id="teamProfile.location"
                                name="teamProfile.location"
                                type="text"
                                required
                                value={formData.teamProfile.location}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                placeholder="City, State"
                            />
                        </div>
                        <div>
                            <label htmlFor="teamProfile.website" className="block text-sm font-medium text-gray-700">
                                Team Website (Optional)
                            </label>
                            <input
                                id="teamProfile.website"
                                name="teamProfile.website"
                                type="url"
                                value={formData.teamProfile.website}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                placeholder="https://yourteam.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="teamProfile.description" className="block text-sm font-medium text-gray-700">
                                Team Description
                            </label>
                            <textarea
                                id="teamProfile.description"
                                name="teamProfile.description"
                                rows={4}
                                value={formData.teamProfile.description}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                                placeholder="Tell us about your team, philosophy, achievements, etc."
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            sign in to your existing account
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="role" className="sr-only">
                                Account Type
                            </label>
                            <select
                                id="role"
                                name="role"
                                required
                                value={formData.role}
                                onChange={handleChange}
                                className="appearance-only rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            >
                                <option value="athlete">Athlete</option>
                                <option value="parent">Parent</option>
                                <option value="coach">Coach</option>
                                <option value="merchant">Equipment Merchant</option>
                                <option value="league">Rec League</option>
                                <option value="team">Competitive/Select Team</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="firstName" className="sr-only">
                                First Name
                            </label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="First Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="sr-only">
                                Last Name
                            </label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Last Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Confirm Password"
                            />
                        </div>
                        {renderRoleSpecificFields()}
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register; 