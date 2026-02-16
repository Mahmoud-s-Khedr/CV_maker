import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Trash2, MessageSquare } from 'lucide-react';
import { useResumeStore } from '../../store/resume';
import * as api from '../../lib/api';

interface ReviewSession {
    id: string;
    token: string;
    expiresAt: string;
    createdAt: string;
    commentCount: number;
    unresolvedCount: number;
    isExpired: boolean;
}

export const ReviewPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { backendId } = useResumeStore();
    const [sessions, setSessions] = useState<ReviewSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && backendId) {
            setLoading(true);
            api.getReviewSessions(backendId)
                .then(setSessions)
                .catch(() => {})
                .finally(() => setLoading(false));
        }
    }, [isOpen, backendId]);

    const handleCreate = async () => {
        if (!backendId) return;
        setCreating(true);
        try {
            const session = await api.createReviewSession(backendId);
            setSessions((prev) => [
                { ...session, commentCount: 0, unresolvedCount: 0, isExpired: false, createdAt: new Date().toISOString() },
                ...prev,
            ]);
        } catch {
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (sessionId: string) => {
        try {
            await api.deleteReviewSession(sessionId);
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        } catch {
        }
    };

    const copyLink = (token: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/review/${token}`);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Review Sessions
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="p-4">
                <button
                    onClick={handleCreate}
                    disabled={creating || !backendId}
                    className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {creating ? 'Creating...' : 'Generate Review Link'}
                </button>
                {!backendId && (
                    <p className="mt-2 text-xs text-gray-400">Save the resume first to create review links.</p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No review sessions yet. Generate a link to get feedback.
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`border rounded-lg p-3 ${session.isExpired ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    session.isExpired
                                        ? 'bg-gray-100 text-gray-500'
                                        : 'bg-green-50 text-green-700'
                                }`}>
                                    {session.isExpired ? 'Expired' : 'Active'}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => copyLink(session.token)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="Copy link"
                                    >
                                        {copiedToken === session.token ? (
                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(session.id)}
                                        className="p-1 hover:bg-red-50 rounded"
                                        title="Delete session"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                                <p>Expires: {new Date(session.expiresAt).toLocaleDateString()}</p>
                                {session.commentCount > 0 && (
                                    <p className="text-yellow-600">
                                        {session.unresolvedCount} unresolved / {session.commentCount} total comments
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
