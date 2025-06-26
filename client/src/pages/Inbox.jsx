import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import ProfileModal from '../components/ProfileModal';

function getOtherUserInfo(messages, currentUserId) {
    // Use the participants array from the first message
    const participants = messages[0]?.participants || [];
    const otherUserId = participants.find(id => id !== currentUserId);
    return {
        id: otherUserId
    };
}

// Utility to get the user's display name (same as Coaches directory)
const getDisplayName = (user) => {
    if (!user) return 'Unknown User';
    return user.name || user.coachProfile?.name || user.athleteProfile?.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
};

// Utility to fetch full user profile (coach or athlete)
const fetchFullProfile = async (userId, role) => {
    if (role === 'coach') {
        const coachDoc = await getDoc(doc(db, 'coaches', userId));
        if (coachDoc.exists()) return { ...coachDoc.data(), id: userId, role: 'coach' };
    }
    // fallback to users
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) return { ...userDoc.data(), id: userId };
    return null;
};

export default function Inbox() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [userNames, setUserNames] = useState({});
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [optionModalOpen, setOptionModalOpen] = useState(false);
    const [pendingConversation, setPendingConversation] = useState(null);

    const [currentUser, userLoading] = useAuthState(auth);

    useEffect(() => {
        if (userLoading || !currentUser) return;

        console.log('Setting up messages listener for user:', currentUser.uid);

        // Query for all messages where user is either sender or receiver
        const q = query(
            collection(db, 'messages'),
            where('participants', 'array-contains', currentUser.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            console.log('Messages snapshot received:', snapshot.docs.length, 'documents');
            const conversationsMap = new Map();

            for (const doc of snapshot.docs) {
                const message = { id: doc.id, ...doc.data() };
                console.log('Processing message:', message);
                const conversationId = message.conversationId;

                if (!conversationsMap.has(conversationId)) {
                    conversationsMap.set(conversationId, []);
                }
                conversationsMap.get(conversationId).push(message);
            }

            // Convert to array and sort by latest message
            const conversationsArray = Array.from(conversationsMap.entries()).map(([id, messages]) => ({
                id,
                messages: messages.sort((a, b) => {
                    const aTime = a.timestamp?.toMillis?.() || 0;
                    const bTime = b.timestamp?.toMillis?.() || 0;
                    return aTime - bTime;
                }),
                latestMessage: messages[messages.length - 1]
            })).sort((a, b) => {
                const aTime = a.latestMessage.timestamp?.toMillis?.() || 0;
                const bTime = b.latestMessage.timestamp?.toMillis?.() || 0;
                return bTime - aTime;
            });

            console.log('Final conversations array:', conversationsArray);
            setConversations(conversationsArray);
            setLoading(false);

            // Fetch user names for all participants
            const userIds = new Set();
            conversationsArray.forEach(conv => {
                conv.messages.forEach(msg => {
                    userIds.add(msg.senderId);
                    userIds.add(msg.receiverId);
                });
            });

            console.log('Fetching names for users:', Array.from(userIds));
            const names = {};
            for (const userId of userIds) {
                console.log('Fetching userId:', userId);
                const userDoc = await getDoc(doc(db, 'users', userId));
                console.log('userDoc.exists():', userDoc.exists());
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log('Fetched userData for', userId, ':', userData);
                    names[userId] = getDisplayName(userData);
                } else {
                    console.log('No userDoc found for', userId);
                }
            }
            console.log('Final userNames object:', names);
            setUserNames(names);
        });

        return () => unsubscribe();
    }, [currentUser, userLoading]);

    useEffect(() => {
        if (!selectedConversation) return;

        // Update messages when selected conversation changes
        const conversation = conversations.find(c => c.id === selectedConversation);
        if (conversation) {
            setMessages(conversation.messages);
        }
    }, [selectedConversation, conversations]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        const conversation = conversations.find(c => c.id === selectedConversation);
        if (!conversation) return;

        const otherUser = getOtherUserInfo(conversation.messages, currentUser.uid);

        // Get roles from the existing messages
        const existingMessage = conversation.messages.find(msg =>
            msg.senderId === currentUser.uid || msg.receiverId === currentUser.uid
        );

        let senderRole = 'athlete'; // default
        let receiverRole = 'athlete'; // default

        if (existingMessage) {
            if (existingMessage.senderId === currentUser.uid) {
                senderRole = existingMessage.senderRole;
                receiverRole = existingMessage.receiverRole;
            } else {
                senderRole = existingMessage.receiverRole;
                receiverRole = existingMessage.senderRole;
            }
        }

        try {
            await addDoc(collection(db, 'messages'), {
                content: newMessage.trim(),
                senderId: currentUser.uid,
                senderRole: senderRole,
                senderName: userNames[currentUser.uid] || 'You',
                receiverId: otherUser.id,
                receiverRole: receiverRole,
                receiverName: userNames[otherUser.id] || 'User',
                conversationId: selectedConversation,
                participants: [currentUser.uid, otherUser.id],
                timestamp: serverTimestamp()
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Fetch and show profile modal
    const openProfileModal = async (userId, role) => {
        setProfileLoading(true);
        setProfileError('');
        setProfileModalOpen(true);
        try {
            const profile = await fetchFullProfile(userId, role);
            if (profile) {
                setProfileUser(profile);
            } else {
                setProfileError('Profile not found.');
            }
        } catch (err) {
            setProfileError('Failed to load profile.');
        } finally {
            setProfileLoading(false);
        }
    };
    const closeProfileModal = () => {
        setProfileModalOpen(false);
        setProfileUser(null);
        setProfileError('');
    };

    // Utility to ensure certifications is always an array
    const getCertificationsArray = (certs) => {
        if (Array.isArray(certs)) return certs;
        if (typeof certs === 'string') return certs.split(',').map(c => c.trim()).filter(Boolean);
        if (!certs) return [];
        return [String(certs)];
    };

    const renderConversationCard = (conversation) => {
        const otherUser = getOtherUserInfo(conversation.messages, currentUser.uid);
        const userNameFromMap = otherUser?.id ? userNames[otherUser.id] : undefined;
        let displayName = userNameFromMap;
        if (!displayName) {
            displayName = otherUser?.name || ((otherUser?.firstName || '') + ' ' + (otherUser?.lastName || '')).trim() || 'Unknown User';
        }

        // Get the role of the other user from the messages
        const otherUserRole = conversation.messages.find(msg =>
            msg.senderId === otherUser?.id || msg.receiverId === otherUser?.id
        );
        const role = otherUserRole?.senderId === otherUser?.id ? otherUserRole.senderRole : otherUserRole?.receiverRole;

        // Format role for display
        const getRoleDisplay = (role) => {
            switch (role) {
                case 'coach': return 'Coach';
                case 'team': return 'Team Rep';
                case 'athlete': return 'Athlete';
                case 'parent': return 'Parent';
                default: return '';
            }
        };

        const roleDisplay = getRoleDisplay(role);

        console.log('Conversation data:', {
            conversation,
            otherUser,
            currentUser,
            participants: conversation.participants,
            userNames,
            otherUserId: otherUser?.id,
            userNameFromMap,
            displayName,
            role,
            roleDisplay
        });

        return (
            <div
                key={conversation.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-100 relative ${selectedConversation === conversation.id ? 'bg-gray-50' : ''}`}
                onClick={() => {
                    setPendingConversation(conversation);
                    setOptionModalOpen(true);
                }}
            >
                <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-gray-900">{displayName}</div>
                    {roleDisplay && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${role === 'coach' ? 'bg-blue-100 text-blue-800' :
                                role === 'team' ? 'bg-green-100 text-green-800' :
                                    role === 'athlete' ? 'bg-purple-100 text-purple-800' :
                                        role === 'parent' ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-800'
                            }`}>
                            {roleDisplay}
                        </span>
                    )}
                </div>
                <div className="text-gray-600 text-sm truncate">{conversation.messages[0]?.content || ''}</div>
            </div>
        );
    };

    if (loading || userLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-2xl font-bold mb-6">Messages</h1>

            <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No conversations yet
                        </div>
                    ) : (
                        conversations.map(conv => {
                            const otherUser = getOtherUserInfo(conv.messages, currentUser.uid);
                            const displayName = userNames[otherUser.id] || getDisplayName(otherUser);

                            // Get the role of the other user from the messages
                            const otherUserRole = conv.messages.find(msg =>
                                msg.senderId === otherUser?.id || msg.receiverId === otherUser?.id
                            );
                            const role = otherUserRole?.senderId === otherUser?.id ? otherUserRole.senderRole : otherUserRole?.receiverRole;

                            // Format role for display
                            const getRoleDisplay = (role) => {
                                switch (role) {
                                    case 'coach': return 'Coach';
                                    case 'team': return 'Team Rep';
                                    case 'athlete': return 'Athlete';
                                    case 'parent': return 'Parent';
                                    default: return '';
                                }
                            };

                            const roleDisplay = getRoleDisplay(role);

                            return (
                                <div
                                    key={conv.id}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-100 relative ${selectedConversation === conv.id ? 'bg-gray-50' : ''}`}
                                    onClick={() => {
                                        setPendingConversation(conv);
                                        setOptionModalOpen(true);
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-semibold text-gray-900">{displayName}</div>
                                        {roleDisplay && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${role === 'coach' ? 'bg-blue-100 text-blue-800' :
                                                    role === 'team' ? 'bg-green-100 text-green-800' :
                                                        role === 'athlete' ? 'bg-purple-100 text-purple-800' :
                                                            role === 'parent' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-gray-100 text-gray-800'
                                                }`}>
                                                {roleDisplay}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-gray-600 text-sm truncate">{conv.messages[0]?.content || ''}</div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Chat View */}
                <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            <div className="flex-1 p-4 overflow-y-auto">
                                {messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={`mb-4 ${message.senderId === currentUser.uid
                                            ? 'text-right'
                                            : 'text-left'
                                            }`}
                                    >
                                        <div
                                            className={`inline-block p-3 rounded-lg ${message.senderId === currentUser.uid
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-100'
                                                }`}
                                        >
                                            <div className="text-sm font-semibold mb-1">
                                                {message.senderId === currentUser.uid ? 'You' : userNames[message.senderId] || 'User'}
                                            </div>
                                            <div>{message.content}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600"
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            Select a conversation to start chatting
                        </div>
                    )}
                </div>
            </div>
            <ProfileModal
                open={profileModalOpen}
                onClose={closeProfileModal}
                profile={profileUser}
                role={profileUser?.role || (profileUser?.coachProfile ? 'coach' : 'athlete')}
                getUserName={getDisplayName}
                fallbackUser={profileUser}
            />
            {/* Option Modal */}
            {optionModalOpen && pendingConversation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col gap-4 min-w-[300px] max-w-xs">
                        <div className="text-lg font-semibold mb-2">What would you like to do?</div>
                        <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 font-medium"
                            onClick={async () => {
                                setOptionModalOpen(false);
                                const otherUser = getOtherUserInfo(pendingConversation.messages, currentUser.uid);
                                await openProfileModal(otherUser.id, otherUser.role);
                            }}
                        >
                            View Profile
                        </button>
                        <button
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 rounded px-4 py-2 font-medium"
                            onClick={() => {
                                setOptionModalOpen(false);
                                setSelectedConversation(pendingConversation.id);
                            }}
                        >
                            View Conversation
                        </button>
                        <button
                            className="w-full text-gray-400 hover:text-gray-600 mt-2 text-sm"
                            onClick={() => setOptionModalOpen(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 