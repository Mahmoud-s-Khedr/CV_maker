import { logError } from '../utils/logger';

// pdf-parse@2.x exports a PDFParse class (not a callable function).
// When loaded from CommonJS it may appear under `.default`.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParseModule = require('pdf-parse');
const PDFParseCtor: any = pdfParseModule?.PDFParse ?? pdfParseModule?.default?.PDFParse;

export const parseResumePDF = async (buffer: Buffer): Promise<string> => {
    try {
        if (typeof PDFParseCtor !== 'function') {
            throw new Error('pdf-parse PDFParse export not found');
        }

        const parser = new PDFParseCtor({ data: buffer });
        const result = await parser.getText();

        // Best-effort cleanup (some versions expose destroy)
        try {
            if (typeof parser.destroy === 'function') {
                await parser.destroy();
            }
        } catch {
            // ignore
        }

        if (typeof result === 'string') {
            return result;
        }

        if (result && typeof result.text === 'string') {
            return result.text;
        }

        // Fallback: return whatever can be stringified
        return String((result as any)?.text ?? '');
    } catch (error) {
        logError(error as Error, { context: 'pdf.parseResumePDF' });
        throw new Error('Failed to parse PDF file');
    }
};

/**
 * Basic heuristic to extract name and email from text.
 * Real implementation should use an LLM for better accuracy.
 */
export const extractProfileData = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Naive User Name extraction (First non-empty line usually)
    const fullName = lines[0] || '';

    // Simple Email Regex
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';

    // Simple Phone Regex (US-centric for MVP)
    const phoneRegex = /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : '';

    return {
        fullName,
        email,
        phone,
        rawText: text // accessible for debugging or filling summary
    };
};
