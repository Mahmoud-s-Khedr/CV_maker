import React, { useState } from 'react';
import * as api from '../lib/api';


interface ResumePreview {
    id: string;
    shareKey: string;
    title: string;
    fullName: string;
    jobTitle: string;
    location: string;
    summary: string;
    userEmail: string;
    updatedAt: string;
}

export const RecruiterDashboard: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ResumePreview[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            const data = await api.searchResumes(query);
            setResults(data.resumes);
        } catch (error) {
            console.error(error);
            alert('Failed to search resumes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Find Top Talent</h1>
                    <p className="text-lg text-gray-600">Search through our database of public resumes.</p>
                </div>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-12">
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <input
                            type="text"
                            className="w-full px-6 py-4 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg shadow-sm transition"
                            placeholder="Job title, skills, or keywords..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute right-2 bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-700 transition"
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="space-y-6">
                    {searched && results.length === 0 && !loading && (
                        <div className="text-center py-10 text-gray-500">
                            No resumes found matching "{query}".
                        </div>
                    )}

                    {results.map((resume) => (
                        <div key={resume.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{resume.fullName}</h3>
                                    <p className="text-blue-600 font-medium mb-2">{resume.jobTitle}</p>
                                    <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                        <span>📍 {resume.location || 'Remote'}</span>
                                        <span>•</span>
                                        <span>Updated {new Date(resume.updatedAt).toLocaleDateString()}</span>
                                    </p>
                                    <p className="text-gray-600 leading-relaxed max-w-3xl">
                                        {resume.summary || 'No summary provided.'}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => window.open(`/cv/${resume.shareKey}`, '_blank')}
                                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                                    >
                                        View Resume
                                    </button>
                                    <a
                                        href={`mailto:${resume.userEmail}`}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition text-center"
                                    >
                                        Contact
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
