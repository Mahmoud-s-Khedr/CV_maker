import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../lib/api';
import type { ResumeSchema } from '../types/resume';

interface ReviewComment {
    id: string;
    sectionId: string;
    text: string;
    reviewerName: string;
    createdAt: string;
    resolved: boolean;
}

export const ReviewPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [resumeTitle, setResumeTitle] = useState('');
    const [resumeContent, setResumeContent] = useState<ResumeSchema | null>(null);
    const [comments, setComments] = useState<ReviewComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviewerName, setReviewerName] = useState(() => localStorage.getItem('reviewerName') || '');
    const [commentText, setCommentText] = useState('');
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) return;
        api.getReviewByToken(token)
            .then((data) => {
                setResumeTitle(data.resumeTitle);
                setResumeContent(data.resumeContent);
                setComments(data.comments || []);
            })
            .catch((err) => {
                setError(err.response?.data?.error || 'Failed to load review session');
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleSubmitComment = async () => {
        if (!token || !activeSectionId || !commentText.trim() || !reviewerName.trim()) return;
        setSubmitting(true);
        try {
            localStorage.setItem('reviewerName', reviewerName);
            const newComment = await api.addReviewComment(token, {
                sectionId: activeSectionId,
                text: commentText.trim(),
                reviewerName: reviewerName.trim(),
            });
            setComments((prev) => [...prev, newComment]);
            setCommentText('');
            setActiveSectionId(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-gray-400">Loading review...</div>
            </div>
        );
    }

    if (error && !resumeContent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Unavailable</h1>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    if (!resumeContent) return null;

    const sectionComments = (sectionId: string) =>
        comments.filter((c) => c.sectionId === sectionId && !c.resolved);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Review: {resumeTitle}</h1>
                        <p className="text-sm text-gray-500">Leave feedback on each section</p>
                    </div>
                    {!reviewerName && (
                        <input
                            type="text"
                            placeholder="Your name"
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                        />
                    )}
                </div>
            </header>

            {error && (
                <div className="max-w-4xl mx-auto mt-4 px-6">
                    <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg">{error}</div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* Profile Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900">{resumeContent.profile.fullName}</h2>
                    <p className="text-gray-600">{resumeContent.profile.jobTitle}</p>
                    {resumeContent.profile.summary && (
                        <p className="mt-3 text-sm text-gray-600">{resumeContent.profile.summary}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        {resumeContent.profile.email && <span>{resumeContent.profile.email}</span>}
                        {resumeContent.profile.phone && <span>{resumeContent.profile.phone}</span>}
                        {resumeContent.profile.location && <span>{resumeContent.profile.location}</span>}
                    </div>
                </div>

                {/* Resume Sections */}
                {resumeContent.sections
                    .filter((s) => s.isVisible)
                    .map((section) => {
                        const sComments = sectionComments(section.id);
                        return (
                            <div key={section.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800">{section.title}</h3>
                                    <div className="flex items-center gap-2">
                                        {sComments.length > 0 && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                {sComments.length} comment{sComments.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setActiveSectionId(activeSectionId === section.id ? null : section.id)}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            + Add Feedback
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4">
                                    {section.items.map((item: any, i: number) => (
                                        <div key={item.id || i} className="mb-3 last:mb-0">
                                            <p className="text-sm font-medium text-gray-700">
                                                {item.company || item.institution || item.name || item.title || ''}
                                                {(item.position || item.degree) && (
                                                    <span className="text-gray-500 font-normal"> — {item.position || item.degree}</span>
                                                )}
                                            </p>
                                            {item.description && (
                                                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Comments for this section */}
                                {sComments.length > 0 && (
                                    <div className="border-t border-gray-100 bg-yellow-50/50 p-4 space-y-2">
                                        {sComments.map((c) => (
                                            <div key={c.id} className="text-sm">
                                                <span className="font-medium text-gray-700">{c.reviewerName}:</span>{' '}
                                                <span className="text-gray-600">{c.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Comment input */}
                                {activeSectionId === section.id && (
                                    <div className="border-t border-gray-100 p-4 bg-blue-50/30">
                                        {!reviewerName ? (
                                            <input
                                                type="text"
                                                placeholder="Enter your name first"
                                                value={reviewerName}
                                                onChange={(e) => setReviewerName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 mb-2"
                                            />
                                        ) : null}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Write your feedback..."
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                                                disabled={submitting}
                                            />
                                            <button
                                                onClick={handleSubmitComment}
                                                disabled={submitting || !commentText.trim() || !reviewerName.trim()}
                                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                {submitting ? 'Sending...' : 'Send'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};
