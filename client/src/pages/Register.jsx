import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'athlete',
        athleteProfile: {
            name: '',
            age: '',
            sports: [],
            competitiveLevel: 'beginner'
        },
        coachProfile: {
            certifications: [],
            experience: '',
            specialties: [],
            teams: [],
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
            ageGroup: '',
            level: '',
            location: '',
        }
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setCurrentUser } = useAuth();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Handle athlete fields
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
        }
        // Handle league fields
        else if (name.startsWith('league.')) {
            const leagueField = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                leagueProfile: {
                    ...prev.leagueProfile,
                    [leagueField]: value
                }
            }));
        }
        // Handle all other fields
        else {
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
                createdAt: new Date().toISOString()
            };

            // Add role-specific profile data and save to appropriate collection
            let collectionName;
            switch (formData.role) {
                case 'athlete':
                    userData.athleteProfile = formData.athleteProfile;
                    collectionName = 'athletes';
                    break;
                case 'coach':
                    userData.coachProfile = formData.coachProfile;
                    collectionName = 'coaches';
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
            case 'coach':
                return (
                    <>
                        <div>
                            <label htmlFor="coach.experience" className="sr-only">
                                Years of Experience
                            </label>
                            <input
                                id="coach.experience"
                                name="coach.experience"
                                type="number"
                                required
                                min="0"
                                value={formData.coachProfile.experience}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Years of Experience"
                            />
                        </div>
                        <div>
                            <label htmlFor="coach.specialties" className="sr-only">
                                Specialties
                            </label>
                            <input
                                id="coach.specialties"
                                name="coach.specialties"
                                type="text"
                                required
                                value={formData.coachProfile.specialties.join(', ')}
                                onChange={(e) => {
                                    const specialties = e.target.value.split(',').map(s => s.trim());
                                    setFormData(prev => ({
                                        ...prev,
                                        coachProfile: {
                                            ...prev.coachProfile,
                                            specialties
                                        }
                                    }));
                                }}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Specialties (comma-separated)"
                            />
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
                            <label htmlFor="team.teamName" className="sr-only">
                                Team Name
                            </label>
                            <input
                                id="team.teamName"
                                name="team.teamName"
                                type="text"
                                required
                                value={formData.teamProfile.teamName}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Team Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="team.sport" className="sr-only">
                                Sport
                            </label>
                            <input
                                id="team.sport"
                                name="team.sport"
                                type="text"
                                required
                                value={formData.teamProfile.sport}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Sport"
                            />
                        </div>
                        <div>
                            <label htmlFor="team.level" className="sr-only">
                                Team Level
                            </label>
                            <select
                                id="team.level"
                                name="team.level"
                                required
                                value={formData.teamProfile.level}
                                onChange={handleChange}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            >
                                <option value="">Select Team Level</option>
                                <option value="recreational">Recreational</option>
                                <option value="competitive">Competitive</option>
                                <option value="select">Select</option>
                                <option value="elite">Elite</option>
                            </select>
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
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                            >
                                <option value="athlete">Athlete</option>
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