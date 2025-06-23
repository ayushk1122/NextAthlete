import React from 'react';

// Utility to ensure certifications is always an array
const getCertificationsArray = (certs) => {
    if (Array.isArray(certs)) return certs;
    if (typeof certs === 'string') return certs.split(',').map(c => c.trim()).filter(Boolean);
    if (!certs) return [];
    return [String(certs)];
};

export default function ProfileModal({ open, onClose, profile, role, getUserName, fallbackUser }) {
    if (!open || !profile) return null;

    // Get the appropriate profile data based on role
    const profileData = role === 'coach' ? profile.coachProfile : profile.athleteProfile;

    // Get certifications from the appropriate profile
    const certifications = getCertificationsArray(profileData?.certifications);

    // Get name using the full profile object (this fixes the name display)
    const name = getUserName ? getUserName(profile, fallbackUser) : (profile.name || fallbackUser?.name || `${profile.firstName || fallbackUser?.firstName || ''} ${profile.lastName || fallbackUser?.lastName || ''}`.trim() || (role === 'coach' ? 'Coach' : 'Athlete'));

    // Handle skills as array or object (per-sport) from the appropriate profile
    let skills = profileData?.skills;
    if (skills && typeof skills === 'object' && !Array.isArray(skills)) {
        // Flatten all skills from all sports
        skills = Object.values(skills).flat();
    }
    if (!Array.isArray(skills)) skills = [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col p-0 relative overflow-hidden">
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl font-bold focus:outline-none z-20"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                <div className="flex items-center gap-8 px-12 pt-12 pb-8 border-b border-gray-200 bg-gray-50">
                    <div className="flex-shrink-0 w-28 h-28 rounded-full bg-blue-100 flex items-center justify-center text-5xl font-bold text-blue-700 uppercase">
                        {name[0] || (role === 'coach' ? 'C' : 'A')}
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{name}</div>
                        <div className="text-lg text-blue-600 font-medium mb-1">{Array.isArray(profileData?.sports) ? profileData.sports.join(', ') : profileData?.sports || ''}</div>
                        {profileData?.location && <div className="text-gray-500">{profileData.location}</div>}
                    </div>
                </div>
                <div className="flex-1 flex flex-col md:flex-row gap-8 p-12 overflow-y-auto">
                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="font-semibold text-gray-700 mb-2">Skills</div>
                            <div className="flex flex-wrap gap-2">
                                {skills.length > 0 ? (
                                    skills.map((skill, idx) => (
                                        <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">{skill}</span>
                                    ))
                                ) : (
                                    <span className="text-gray-400">No skills listed</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="font-semibold text-gray-700 mb-2">Age Groups</div>
                            <div className="flex flex-wrap gap-2">
                                {profileData?.ageGroups && profileData.ageGroups.length > 0 ? (
                                    profileData.ageGroups.map((age, idx) => (
                                        <span key={idx} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">{age}</span>
                                    ))
                                ) : (
                                    <span className="text-gray-400">No age groups listed</span>
                                )}
                            </div>
                        </div>
                        {role === 'coach' && (
                            <div>
                                <div className="font-semibold text-gray-700 mb-2">Certifications</div>
                                <div className="flex flex-wrap gap-2">
                                    {certifications.length > 0 ? (
                                        certifications.map((cert, idx) => (
                                            <span key={idx} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm">{cert}</span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400">No certifications listed</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="font-semibold text-gray-700 mb-2">Bio</div>
                        <div className="text-gray-700 whitespace-pre-line min-h-[80px]">
                            {profileData?.bio || <span className="text-gray-400">No bio provided</span>}
                        </div>
                        {/* Room for future features: reviews, contact, etc. */}
                    </div>
                </div>
            </div>
        </div>
    );
} 