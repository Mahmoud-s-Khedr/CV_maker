import React, { useState } from 'react';
import { useResumeStore } from '../../store/resume';
import { analyzeResume } from '../../lib/api';

export const AnalysisPanel: React.FC = () => {
    const { resume } = useResumeStore();
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyzeResume(resume);
            setAnalysis(result);
        } catch (err) {
            console.error(err);
            setError('Failed to analyze resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!analysis && !loading && !error) {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">AI Resume Analysis</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Get instant, AI-powered feedback to improve your resume's impact.
                        </p>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                    >
                        Analyze Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-lg font-bold flex justify-between items-center">
                Analysis Results
                {analysis && (
                    <span className={`text-sm px-2 py-1 rounded-full ${analysis.score >= 80 ? 'bg-green-100 text-green-800' :
                        analysis.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        Score: {analysis.score}/100
                    </span>
                )}
            </h2>

            {loading && <div className="text-blue-600 animate-pulse">Analyzing your resume...</div>}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            {analysis && (
                <div className="flex flex-col gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-md">
                        <h3 className="font-semibold text-gray-700 mb-1">Summary</h3>
                        <p className="text-gray-600">{analysis.summary}</p>
                    </div>

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

                    <button
                        onClick={handleAnalyze}
                        className="mt-4 text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                        Re-analyze
                    </button>
                </div>
            )}
        </div>
    );
};
