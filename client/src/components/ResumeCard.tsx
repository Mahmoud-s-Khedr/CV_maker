import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Edit, Trash2, Copy, Eye } from 'lucide-react';
import type { Resume, ResumeSchema } from '../types/resume';
import { usePDF } from '@react-pdf/renderer';
import { Document, Page } from 'react-pdf';
import { ResumeDocument } from './pdf/ResumeDocument';

interface ResumeCardProps {
    resume: Resume;
    onDelete: (id: string) => void;
    onDuplicate: (resume: Resume) => void;
}

export const ResumeCard: React.FC<ResumeCardProps> = ({ resume, onDelete, onDuplicate }) => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Generate PDF Blob URL for preview
    // We cast content to ResumeSchema assuming it matches. 
    // If content is empty/invalid, ResumeDocument might fail, so we wrap in try/catch or rely on boundary.
    const [instance] = usePDF({
        document: <ResumeDocument data={resume.content as ResumeSchema} />
    });

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEdit = () => {
        navigate(`/editor/${resume.id}`);
    };

    return (
        <div
            className="group relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
            onClick={handleEdit}
        >
            {/* Preview Thumbnail Area */}
            <div className="h-60 bg-gray-100 border-b border-gray-200 flex items-center justify-center relative overflow-hidden rounded-t-lg group-hover:bg-gray-50 transition-colors">
                {instance.loading ? (
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="h-32 w-24 bg-gray-200 rounded mb-2"></div>
                        <span className="text-xs text-gray-400">Loading preview...</span>
                    </div>
                ) : instance.error ? (
                    <div className="text-xs text-red-400 p-2 text-center">Preview unavailable</div>
                ) : (
                    <div className="w-full h-full relative">
                        {/* Render just the first page, scaled to fit width/height roughly */}
                        <div className="absolute inset-0 flex items-start justify-center pt-2 overflow-hidden opacity-90 transition-opacity group-hover:opacity-100">
                            {instance.url && (
                                <Document file={instance.url} loading={null}>
                                    <Page
                                        pageNumber={1}
                                        width={300} // Fixed width sufficient for card
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className="shadow-sm"
                                    />
                                </Document>
                            )}
                        </div>
                    </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <button className="bg-white text-gray-800 px-4 py-2 rounded-full font-medium shadow-sm hover:shadow text-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        Open Editor
                    </button>
                </div>
            </div>

            {/* Info Area */}
            <div className="p-4 flex flex-col gap-1 rounded-b-lg">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800 truncate pr-2" title={resume.title}>
                        {resume.title}
                    </h3>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <div className="absolute top-full right-0 mt-1 w-36 bg-white border border-gray-100 rounded-md shadow-lg z-20 py-1 text-sm animate-in fade-in zoom-in-95 duration-75">
                                <button
                                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        handleEdit();
                                    }}
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit
                                </button>
                                <button
                                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        onDuplicate(resume);
                                    }}
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    Duplicate
                                </button>
                                <hr className="my-1 border-gray-100" />
                                <button
                                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        onDelete(resume.id);
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Updated {formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}</span>
                    {resume.isPublic && (resume.viewCount ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {resume.viewCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
