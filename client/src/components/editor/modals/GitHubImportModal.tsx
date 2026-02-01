import React, { useState } from 'react';
import { X, Github, Loader2, Download } from 'lucide-react';
import * as api from '../../../lib/api';
import { useResumeStore } from '../../../store/resume';
import { type ProjectItem, generateId } from '../../../types/resume';

interface GitHubImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionId: string;
}

export const GitHubImportModal: React.FC<GitHubImportModalProps> = ({ isOpen, onClose, sectionId }) => {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addSectionItem } = useResumeStore();

    if (!isOpen) return null;

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.importGitHubRepos(username);
            const projects = response.data;

            if (projects.length === 0) {
                setError('No public repositories found for this user.');
                setIsLoading(false);
                return;
            }

            // Add each project to the store
            projects.forEach((repo: any) => {
                const newProject: ProjectItem = {
                    id: generateId(),
                    name: repo.name,
                    description: repo.description,
                    url: repo.url,
                    technologies: repo.technologies,
                    highlights: repo.highlights
                };
                addSectionItem(sectionId, newProject);
            });

            onClose();
            // Reset state
            setUsername('');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to import from GitHub. Please check the username.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white">
                        <Github size={20} />
                        <h2 className="font-semibold text-lg">Import from GitHub</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 mb-6 text-sm">
                        Enter your GitHub username to automatically fetch your top repositories and add them to your Projects section.
                    </p>

                    <form onSubmit={handleImport} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                GitHub Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g. facebook"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !username.trim()}
                                className="flex items-center gap-2 px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Fetching...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Import Projects
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
