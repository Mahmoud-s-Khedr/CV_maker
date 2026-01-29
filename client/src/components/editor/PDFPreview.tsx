import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface PDFPreviewProps {
    url: string | null;
    loading: boolean;
    error: Error | null;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ url, loading, error }) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [scale, setScale] = useState(1.0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => setScale(1.0);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white p-4">
                <p className="font-bold text-red-400 mb-2">Error generating PDF</p>
                <p className="text-sm text-gray-300">{error.toString()}</p>
            </div>
        );
    }

    if (loading || !url) {
        return (
            <div className="flex items-center justify-center h-full text-white font-medium">
                {loading ? 'Generating PDF...' : 'Preparing Preview...'}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-700 rounded-lg overflow-hidden shadow-2xl relative">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-4 z-10 transition-opacity hover:opacity-100 opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-2">
                    <button onClick={handleZoomOut} className="p-1 hover:text-blue-400 transition" title="Zoom Out">
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={handleZoomIn} className="p-1 hover:text-blue-400 transition" title="Zoom In">
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button onClick={handleResetZoom} className="p-1 hover:text-blue-400 transition ml-1" title="Reset Zoom">
                        <RotateCcw className="w-3 h-3" />
                    </button>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                {/* Page Count */}
                {numPages && (
                    <span className="text-xs text-gray-300">
                        {numPages} Page{numPages > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Download Button (Floating bottom right) */}
            <a
                href={url}
                download="resume.pdf"
                className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-10 transition-transform hover:scale-105 flex items-center justify-center transform translate-y-0"
                title="Download PDF"
            >
                <Download className="w-6 h-6" />
            </a>

            {/* Scrollable Document Area */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-500/50 group">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="text-white mt-10">Loading Viewer...</div>}
                    className="flex flex-col gap-4"
                >
                    {Array.from(new Array(numPages), (_, index) => (
                        <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="bg-white shadow-xl"
                        />
                    ))}
                </Document>
            </div>
        </div>
    );
};
