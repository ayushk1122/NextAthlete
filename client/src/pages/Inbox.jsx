import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

function getOtherUserInfo(messages, currentUserId) {
    const msg = messages.find(m => m.senderId !== currentUserId) || messages[0];
    return {
        id: msg.senderId === currentUserId ? msg.receiverId : msg.senderId,
        role: msg.senderId === currentUserId ? msg.receiverRole : msg.senderRole,
        name: msg.senderId === currentUserId ? msg.receiverName : msg.senderName || 'User',
    };
}

export default function Inbox() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [userNames, setUserNames] = useState({});

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
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    names[userId] = userDoc.data().name || 'Unknown User';
                }
            }
            console.log('Fetched user names:', names);
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

        try {
            await addDoc(collection(db, 'messages'), {
                content: newMessage.trim(),
                senderId: currentUser.uid,
                senderRole: currentUser.role || 'athlete',
                senderName: userNames[currentUser.uid] || 'You',
                receiverId: otherUser.id,
                receiverRole: otherUser.role,
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
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv.id)}
                                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${selectedConversation === conv.id ? 'bg-gray-100' : ''
                                        }`}
                                >
                                    <div className="font-semibold">{userNames[otherUser.id] || 'User'}</div>
                                    <div className="text-sm text-gray-600 truncate">
                                        {conv.latestMessage.content}
                                    </div>
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
        </div>
    );
} 