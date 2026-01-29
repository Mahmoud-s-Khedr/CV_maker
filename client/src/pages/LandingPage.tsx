import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Zap, Layout, CheckCircle } from 'lucide-react';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="border-b border-gray-100 sticky top-0 bg-white z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="text-blue-600 w-6 h-6" />
                        <span className="font-bold text-xl text-gray-900">CV Maker</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">Sign In</Link>
                        <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-16 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                        Build a Resume that <br />
                        <span className="text-blue-600">Beats the Bots</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        A developer-first resume builder optimized for ATS systems.
                        Import from LinkedIn, get AI feedback, and export perfectly formatted PDFs.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link to="/editor" className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            Create Free Resume
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Why CV Maker?</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Layout className="w-8 h-8 text-blue-600" />}
                            title="ATS-Friendly Templates"
                            description="Clean, semantic layouts without columns or graphics that confuse parsing bots."
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-blue-600" />}
                            title="AI Analysis"
                            description="Get instant feedback on your resume content using advanced LLMs via OpenRouter."
                        />
                        <FeatureCard
                            icon={<CheckCircle className="w-8 h-8 text-blue-600" />}
                            title="LinkedIn Import"
                            description="Save hours of typing. Import your LinkedIn Profile PDF to auto-fill your resume."
                        />
                    </div>
                </div>
            </div>

            {/* Pricing / CTA */}
            <div className="py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-blue-900 rounded-3xl p-12 text-white">
                        <h2 className="text-3xl font-bold mb-6">Ready to land your dream job?</h2>
                        <ul className="text-left max-w-md mx-auto mb-8 space-y-3">
                            <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-400" /> Unlimited PDF Downloads</li>
                            <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-400" /> Access to Professional Templates</li>
                            <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-400" /> AI Resume Review</li>
                        </ul>
                        <Link to="/register" className="inline-block px-8 py-4 bg-white text-blue-900 text-lg font-bold rounded-xl hover:bg-gray-100 transition shadow-lg">
                            Start Building Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500">
                    <p>© 2024 CV Maker. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
    </div>
);
