import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../lib/api';
import type { ResumeSchema } from '../types/resume';
import {
    Mail, Globe, MapPin,
    ExternalLink, Calendar, Award, BookOpen, Code
} from 'lucide-react';

export const Portfolio = () => {
    const { shareKey } = useParams<{ shareKey: string }>();
    const [resume, setResume] = useState<ResumeSchema | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResume = async () => {
            try {
                if (!shareKey) return;
                const data = await api.getPublicResume(shareKey);
                setResume(data.content as ResumeSchema);
            } catch (err: any) {
                console.error(err);
                setError(' Portfolio not found.');
            } finally {
                setLoading(false);
            }
        };
        fetchResume();
    }, [shareKey]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (error || !resume) return <div className="min-h-screen flex items-center justify-center bg-white text-gray-500">{error || 'Portfolio not found'}</div>;

    const { profile, sections } = resume;

    // Helper to get sections by type
    const getSections = (type: string) => sections.filter(s => s.type === type && s.isVisible);
    const experience = getSections('experience');
    const education = getSections('education');
    const projects = getSections('projects');
    const skills = getSections('skills');

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Hero Section */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 py-20 md:py-32">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gray-900">
                            {profile.fullName}
                        </h1>
                        <p className="text-2xl md:text-3xl text-gray-500 font-light mb-8 leading-relaxed">
                            {profile.jobTitle}
                        </p>

                        <div className="flex flex-wrap gap-4 md:gap-8 text-gray-600 mb-10">
                            {profile.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} />
                                    <span>{profile.location}</span>
                                </div>
                            )}
                            {profile.email && (
                                <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                                    <Mail size={18} />
                                    <span>{profile.email}</span>
                                </a>
                            )}
                            {profile.url && (
                                <a href={profile.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                                    <Globe size={18} />
                                    <span className="truncate max-w-[200px]">{profile.url.replace(/^https?:\/\//, '')}</span>
                                </a>
                            )}
                        </div>

                        {profile.summary && (
                            <p className="text-lg text-gray-700 leading-relaxed max-w-2xl">
                                {profile.summary}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">

                {/* Projects Grid */}
                {projects.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
                            <Code className="text-gray-400" size={32} />
                            Featured Projects
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            {projects.flatMap(s => s.items).map((project: any) => (
                                <article key={project.id} className="group bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                                            {project.name}
                                        </h3>
                                        {project.url && (
                                            <a href={project.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                                                <ExternalLink size={20} />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-gray-600 mb-6 leading-relaxed">
                                        {project.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {project.technologies?.map((tech: string, i: number) => (
                                            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {/* Experience Timeline */}
                {experience.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
                            <Calendar className="text-gray-400" size={32} />
                            Work History
                        </h2>
                        <div className="space-y-12 border-l-2 border-gray-200 ml-3 pl-8 md:pl-12 relative">
                            {experience.flatMap(s => s.items).map((job: any) => (
                                <div key={job.id} className="relative">
                                    <div className="absolute -left-[41px] md:-left-[57px] top-1 h-5 w-5 rounded-full border-4 border-white bg-gray-300"></div>
                                    <div className="mb-2 flex flex-wrap items-baseline gap-x-4">
                                        <h3 className="text-xl font-bold text-gray-900">{job.position}</h3>
                                        <span className="text-lg text-gray-600 font-medium">@ {job.company}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 mb-4 font-mono tracking-wide uppercase">
                                        {job.startDate} — {job.endDate || 'Present'}
                                    </div>
                                    <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                                        {job.description}
                                    </p>
                                    {job.highlights && job.highlights.length > 0 && (
                                        <ul className="space-y-2">
                                            {job.highlights.map((highlight: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-gray-600">
                                                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                                    <span>{highlight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Skills Section */}
                {skills.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
                            <Award className="text-gray-400" size={32} />
                            Skills
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {skills.flatMap(s => s.items).map((skill: any) => (
                                <div key={skill.id} className="bg-white border border-gray-200 px-5 py-3 rounded-xl font-medium text-gray-700 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                                    {skill.name}
                                    {skill.level && (
                                        <span className="ml-2 text-xs text-blue-500 uppercase tracking-wider font-bold opacity-75">
                                            {skill.level}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {education.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
                            <BookOpen className="text-gray-400" size={32} />
                            Education
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {education.flatMap(s => s.items).map((edu: any) => (
                                <div key={edu.id} className="bg-gray-50 p-6 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                                    <h3 className="font-bold text-gray-900">{edu.institution}</h3>
                                    <div className="text-blue-600 font-medium mb-1">{edu.degree}</div>
                                    <div className="text-sm text-gray-500">{edu.startDate} - {edu.endDate || 'Present'}</div>
                                    {edu.description && (
                                        <p className="mt-3 text-sm text-gray-600">{edu.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <footer className="bg-white border-t border-gray-100 py-12 text-center text-gray-400 text-sm">
                <p>
                    Built with <strong className="text-gray-900">HandisCV</strong>
                </p>
                <a href="/" className="inline-block mt-2 hover:text-blue-600 transition-colors">
                    Create your own portfolio
                </a>
            </footer>
        </div>
    );
};
