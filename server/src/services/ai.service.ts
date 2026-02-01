import OpenAI from 'openai';
import config from '../config/config';


export const analyzeResume = async (resumeContent: any) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured in .env');
    }

    const openai = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
    });

    try {
        const completion = await openai.chat.completions.create({
            model: config.ai.defaultModel,
            messages: [
                {
                    role: 'system',
                    content: `You are an expert ATS (Applicant Tracking System) optimization specialist and career coach. 
                    Analyze the provided resume JSON data. 
                    Provide valid JSON output with the following structure:
                    {
                        "score": number (0-100),
                        "summary": "Brief overall feedback",
                        "strengths": ["string", "string"],
                        "weaknesses": ["string", "string"],
                        "suggestions": ["string", "string"]
                    }
                    Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.`
                },
                {
                    role: 'user',
                    content: JSON.stringify(resumeContent)
                }
            ],
            response_format: { type: "json_object" }
        });

        const result = completion.choices[0].message.content;
        return JSON.parse(result || '{}');
    } catch (error) {
        console.error('AI Analysis Error:', error);
        throw new Error('Failed to analyze resume');
    }
};

export const parseResumeText = async (text: string) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured in .env');
    }

    const openai = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
    });

    try {
        const completion = await openai.chat.completions.create({
            model: config.ai.defaultModel,
            messages: [
                {
                    role: 'system',
                    content: `You are an expert resume parser. 
                    Extract the following structure from the provided resume text.
                    Return ONLY valid JSON.
                    
                    Structure:
                    {
                        "fullName": "string",
                        "email": "string",
                        "phone": "string",
                        "summary": "string",
                        "location": "string",
                        "links": { "linkedin": "string", "github": "string", "portfolio": "string" },
                        "experience": [
                            {
                                "company": "string",
                                "position": "string",
                                "startDate": "string",
                                "endDate": "string",
                                "description": "string (bullet points)"
                            }
                        ],
                        "education": [
                            {
                                "school": "string",
                                "degree": "string",
                                "graduationDate": "string"
                            }
                        ],
                        "skills": ["string"]
                    }`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            response_format: { type: "json_object" }
        });

        const result = completion.choices[0].message.content;
        return JSON.parse(result || '{}');
    } catch (error) {
        console.error('AI Parsing Error:', error);
        throw new Error('Failed to parse resume text');
    }
};
