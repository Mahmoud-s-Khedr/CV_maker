const pdf = require('pdf-parse');

export const parseResumePDF = async (buffer: Buffer): Promise<string> => {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
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
