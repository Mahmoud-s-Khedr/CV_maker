export function makeResumePdfFilename(fullName?: string, jobTitle?: string): string {
    const sanitizePart = (value: string): string => {
        // Remove control chars
        let s = value.replace(/[\u0000-\u001F\u007F]/g, '');
        // Replace OS-invalid filename characters
        s = s.replace(/[\\/:*?"<>|]/g, ' ');
        // Collapse whitespace
        s = s.replace(/\s+/g, ' ').trim();
        if (!s) return '';
        // Convert spaces to hyphens for the requested pattern
        s = s.replace(/\s+/g, '-');
        // Collapse multiple hyphens
        s = s.replace(/-+/g, '-');
        // Trim problematic trailing/leading characters
        s = s.replace(/^[-.\s]+/, '').replace(/[-.\s]+$/, '');
        return s;
    };

    const safeFullName = fullName ? sanitizePart(fullName) : '';
    const safeJobTitle = jobTitle ? sanitizePart(jobTitle) : '';

    const parts = [safeFullName, safeJobTitle].filter(Boolean);

    let base = parts.length > 0 ? `${parts.join('-')}-CV` : 'CV';

    // Keep the filename reasonably short to avoid OS/path limits.
    const MAX_BASE_LEN = 150;
    if (base.length > MAX_BASE_LEN) {
        base = base.slice(0, MAX_BASE_LEN).replace(/[-.\s]+$/, '');
    }

    return `${base}.pdf`;
}
