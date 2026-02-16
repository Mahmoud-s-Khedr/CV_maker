import React, { useState } from 'react';
import { useResumeStore } from '../../store/resume';
import { useAuthStore } from '../../store/auth';
import { analyzeResume, analyzeJobFit } from '../../lib/api';
import { UpgradeModal } from '../UpgradeModal';

export const AnalysisPanel: React.FC = () => {
    const { resume } = useResumeStore();
    const { user } = useAuthStore();
    const [analysis, setAnalysis] = useState<any>(null);
    const [jobDescription, setJobDescription] = useState<string>('');
    const [mode, setMode] = useState<'general' | 'jobFit'>('general');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUpgrade, setShowUpgrade] = useState(false);

    const handleAnalyze = async () => {
        if (!user?.isPremium) {
            setShowUpgrade(true);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (mode === 'jobFit' && jobDescription.trim()) {
                const result = await analyzeJobFit(resume, jobDescription);
                setAnalysis({ ...result, type: 'jobFit' });
            } else {
                const result = await analyzeResume(resume);
                setAnalysis({ ...result, type: 'general' });
            }
        } catch (err) {
            console.error(err);
            setError('Failed to analyze. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!analysis && !loading && !error) {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 mb-6">
                <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} feature="AI Resume Analysis" />
                <div>
                    <h2 className="text-lg font-bold text-gray-800">AI Resume Analysis</h2>
                    <p className="text-sm text-gray-600 mt-1 mb-4">
                        Get instant, AI-powered feedback to improve your resume's impact.
                    </p>

                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => setMode('general')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${mode === 'general' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            General Critique
                        </button>
                        <button
                            onClick={() => setMode('jobFit')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${mode === 'jobFit' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            Job Fit Analysis
                        </button>
                    </div>

                    {mode === 'jobFit' && (
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the Job Description here..."
                            className="w-full h-32 p-3 text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-4"
                        />
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={mode === 'jobFit' && !jobDescription.trim()}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mode === 'jobFit' ? 'Analyze Job Fit' : 'Analyze Resume'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold flex justify-between items-center mb-4">
                {analysis.type === 'jobFit' ? 'Job Fit Report' : 'Analysis Results'}
                {analysis && (
                    <span className={`text-sm px-2 py-1 rounded-full ${analysis.score >= 80 ? 'bg-green-100 text-green-800' :
                        analysis.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        Score: {analysis.score}/100
                    </span>
                )}
            </h2>

            {loading && <div className="text-blue-600 animate-pulse mb-4">Analyzing...</div>}
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

            {analysis && (
                <div className="flex flex-col gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-md">
                        <h3 className="font-semibold text-gray-700 mb-1">Summary</h3>
                        <p className="text-gray-600">{analysis.summary}</p>
                    </div>

                    {analysis.type === 'jobFit' ? (
                        <>
                            <div>
                                <h3 className="font-semibold text-green-700 mb-1">Matching Keywords</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.matchingKeywords?.map((k: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">{k}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-700 mb-1">Missing Keywords</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.missingKeywords?.map((k: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs">{k}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-700 mb-1">Recommended Focus</h3>
                                <p className="text-gray-600 bg-blue-50 p-2 rounded-md border border-blue-100">{analysis.recommendedFocus}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <h3 className="font-semibold text-green-700 mb-1">Strengths</h3>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                    {analysis.strengths?.map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-700 mb-1">Weaknesses</h3>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                    {analysis.weaknesses?.map((w: string, i: number) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-700 mb-1">Suggestions</h3>
                                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                                    {analysis.suggestions?.map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}

                    <button
                        onClick={() => {
                            setAnalysis(null);
                            setLoading(false);
                            setError(null);
                        }}
                        className="mt-4 text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                        Start New Analysis
                    </button>
                </div>
            )}
        </div>
    );
};

