import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns'; // We installed this earlier
import { Clock, RotateCcw, X } from 'lucide-react';
import * as api from '../../lib/api';
import { useResumeStore } from '../../store/resume';

interface Version {
    id: string;
    createdAt: string;
    content: any;
}

interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
    const { backendId, showNotification, setSections, updateProfile, updateTemplate } = useResumeStore();
    const [versions, setVersions] = useState<Version[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchVersions = async () => {
        if (!backendId) return;
        setLoading(true);
        try {
            const data = await api.getResumeVersions(backendId);
            setVersions(data);
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to load versions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateVersion = async () => {
        if (!backendId) return;

        // We need the current state from the store.
        // Ideally we should pass it in or get it from store.
        // The store is a hook... we can't get state imperatively easily without creating a new store instance or using the hook.
        // We are inside the component so we can get it from the store hook if we select it.
        // But `useResumeStore` returns the *actions* and state.
        // Let's get the resume content.
        const resume = useResumeStore.getState().resume; // Access raw state directly if zustand allows, or just use useResumeStore().resume

        try {
            await api.saveVersion(backendId, resume);
            showNotification('success', 'Version saved');
            fetchVersions();
        } catch (error) {
            console.error(error);
            showNotification('error', 'Failed to save version');
        }
    };

    const handleRestore = (version: Version) => {
        if (!confirm('Are you sure? This will overwrite your current changes.')) return;

        const content = version.content;
        if (content.profile) {
            Object.entries(content.profile).forEach(([key, value]) => {
                updateProfile(key as any, value as string);
            });
        }
        if (content.sections) setSections(content.sections);
        if (content.meta?.templateId) updateTemplate(content.meta.templateId);

        showNotification('success', 'Restored version from ' + formatDistanceToNow(new Date(version.createdAt), { addSuffix: true }));
        onClose();
    };

    useEffect(() => {
        if (isOpen && backendId) {
            fetchVersions();
        }
    }, [isOpen, backendId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform z-50 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    History
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 border-b border-gray-100">
                <button
                    onClick={handleCreateVersion}
                    className="w-full py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-900 transition mb-2"
                >
                    Save Current Version
                </button>
                <p className="text-xs text-center text-gray-400">
                    Save a snapshot to restore later
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center text-gray-400 py-4">Loading...</div>
                ) : versions.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 text-sm">
                        No saved versions yet.
                    </div>
                ) : (
                    versions.map((version) => (
                        <div key={version.id} className="bg-gray-50 p-3 rounded-md border border-gray-200 hover:border-blue-300 transition group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <button
                                onClick={() => handleRestore(version)}
                                className="w-full py-1.5 bg-white border border-gray-300 text-gray-700 text-xs rounded hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition flex items-center justify-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Restore
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
