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

            await updateDoc(doc(db, 'users', user.uid), {
                firstName: formData.firstName,
                lastName: formData.lastName,
                athleteProfile: formData.athleteProfile
            });

            setProfile({
                ...profile,
                firstName: formData.firstName,
                lastName: formData.lastName,
                athleteProfile: formData.athleteProfile
            });
            setEditMode(false);
        } catch (err) {
            setError('Failed to update profile');
            console.error('Error updating profile:', err);
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
                                Athlete Profile
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
                                        <p className="text-sm text-gray-500">
                                            {profile?.athleteProfile?.name}
                                        </p>
                                    </div>
                                </div>

                                <dl className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
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