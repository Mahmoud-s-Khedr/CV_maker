import type { ResumeSchema } from '../types/resume';
import {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    Packer,
    AlignmentType,
    BorderStyle,
    ExternalHyperlink,
} from 'docx';

function normalizeDownloadFilename(filename: string, extension: string): string {
    const trimmed = filename.trim();
    if (!trimmed) {
        return `resume.${extension}`;
    }

    return trimmed.toLowerCase().endsWith(`.${extension}`) ? trimmed : `${trimmed}.${extension}`;
}

function sanitizeText(value?: string): string {
    return (value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function normalizeUrl(value?: string): string {
    const trimmed = sanitizeText(value);
    if (!trimmed) {
        return '';
    }

    return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
}

function triggerDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    triggerBinaryDownload(blob, filename);
}

function triggerBinaryDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function exportAsJSON(resume: ResumeSchema, filename: string) {
    const json = JSON.stringify(resume, null, 2);
    triggerDownload(json, normalizeDownloadFilename(filename, 'json'), 'application/json');
}

export function exportAsPlainText(resume: ResumeSchema, filename: string) {
    const lines: string[] = [];
    const { profile, sections } = resume;

    // Header
    if (profile.fullName) lines.push(sanitizeText(profile.fullName).toUpperCase());
    const linkParts = (profile.links ?? [])
        .map((link) => {
            const label = sanitizeText(link.label);
            const url = sanitizeText(link.url);
            return label && url ? `${label}: ${url}` : url;
        })
        .filter(Boolean);
    const contactParts = [
        sanitizeText(profile.jobTitle),
        sanitizeText(profile.email),
        sanitizeText(profile.phone),
        sanitizeText(profile.location),
        sanitizeText(profile.url),
        ...linkParts,
    ].filter(Boolean);
    if (contactParts.length) lines.push(contactParts.join(' | '));
    lines.push('');

    // Summary
    if (profile.summary) {
        lines.push('SUMMARY');
        lines.push(sanitizeText(profile.summary));
        lines.push('');
    }

    // Sections
    for (const section of sections) {
        if (!section.isVisible || section.items.length === 0) continue;

        lines.push(sanitizeText(section.title).toUpperCase());

        for (const item of section.items) {
            switch (section.type) {
                case 'experience': {
                    const exp = item as any;
                    const dateRange = [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' - ');
                    lines.push(`${sanitizeText(exp.position)} — ${sanitizeText(exp.company)} (${dateRange})`);
                    if (exp.location) lines.push(`  ${sanitizeText(exp.location)}`);
                    if (exp.description) lines.push(`  ${sanitizeText(exp.description)}`);
                    if (exp.highlights?.length) {
                        for (const h of exp.highlights) {
                            if (h) lines.push(`  • ${sanitizeText(h)}`);
                        }
                    }
                    lines.push('');
                    break;
                }
                case 'education': {
                    const edu = item as any;
                    const dateRange = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
                    const degree = [edu.degree, edu.field].filter(Boolean).join(' in ');
                    lines.push(`${sanitizeText(degree)} — ${sanitizeText(edu.institution)} (${dateRange})`);
                    if (edu.gpa) lines.push(`  GPA: ${sanitizeText(edu.gpa)}`);
                    if (edu.description) lines.push(`  ${sanitizeText(edu.description)}`);
                    if (edu.highlights?.length) {
                        for (const h of edu.highlights) {
                            if (h) lines.push(`  • ${sanitizeText(h)}`);
                        }
                    }
                    lines.push('');
                    break;
                }
                case 'skills': {
                    const skill = item as any;
                    const level = skill.level ? ` (${skill.level})` : '';
                    lines.push(`  • ${sanitizeText(skill.name)}${level}`);
                    break;
                }
                case 'projects': {
                    const proj = item as any;
                    lines.push(`${sanitizeText(proj.name)}`);
                    if (proj.description) lines.push(`  ${sanitizeText(proj.description)}`);
                    if (proj.technologies?.length) lines.push(`  Technologies: ${proj.technologies.map((value: string) => sanitizeText(value)).filter(Boolean).join(', ')}`);
                    if (proj.url) lines.push(`  ${sanitizeText(proj.url)}`);
                    if (proj.highlights?.length) {
                        for (const h of proj.highlights) {
                            if (h) lines.push(`  • ${sanitizeText(h)}`);
                        }
                    }
                    lines.push('');
                    break;
                }
                case 'certifications': {
                    const cert = item as any;
                    lines.push(`  • ${sanitizeText(cert.name)} — ${sanitizeText(cert.issuer)}${cert.date ? ` (${sanitizeText(cert.date)})` : ''}`);
                    break;
                }
                case 'languages': {
                    const lang = item as any;
                    lines.push(`  • ${sanitizeText(lang.name)} — ${sanitizeText(lang.proficiency)}`);
                    break;
                }
                default: {
                    const custom = item as any;
                    if (custom.title) lines.push(`${sanitizeText(custom.title)}`);
                    if (custom.subtitle) lines.push(`  ${sanitizeText(custom.subtitle)}`);
                    if (custom.description) lines.push(`  ${sanitizeText(custom.description)}`);
                    lines.push('');
                    break;
                }
            }
        }

        if (section.type === 'skills' || section.type === 'certifications' || section.type === 'languages') {
            lines.push('');
        }
    }

    triggerDownload(lines.join('\n'), normalizeDownloadFilename(filename, 'txt'), 'text/plain');
}

function makeBulletParagraph(text: string): Paragraph {
    return new Paragraph({
        children: [new TextRun({ text: `• ${text}`, size: 20 })],
        indent: { left: 360 },
        spacing: { after: 40 },
    });
}

function makeSectionHeading(title: string): Paragraph {
    return new Paragraph({
        text: title.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
        border: {
            bottom: { style: BorderStyle.SINGLE, size: 4, color: '334155', space: 4 },
        },
    });
}

export async function exportAsDocx(resume: ResumeSchema, filename: string) {
    const { profile, sections } = resume;
    const paragraphs: Paragraph[] = [];

    // Name
    if (profile.fullName) {
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: sanitizeText(profile.fullName), bold: true, size: 48, color: '1e3a8a' })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 60 },
        }));
    }

    // Job title
    if (profile.jobTitle) {
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: sanitizeText(profile.jobTitle), size: 26, color: '64748b' })],
            spacing: { after: 60 },
        }));
    }

    // Contact line
    const contactParts = [profile.email, profile.phone, profile.location, profile.url]
        .map((value) => sanitizeText(value))
        .filter(Boolean);
    const linkParts = (profile.links ?? [])
        .map((link) => {
            const label = sanitizeText(link.label);
            const url = sanitizeText(link.url);
            return label && url ? `${label}: ${url}` : url;
        })
        .filter(Boolean);
    const allContact = [...contactParts, ...linkParts];
    if (allContact.length) {
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: allContact.join('  |  '), size: 18, color: '475569' })],
            spacing: { after: 80 },
        }));
    }

    // Summary
    if (profile.summary) {
        paragraphs.push(makeSectionHeading('Summary'));
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: sanitizeText(profile.summary), italics: true, size: 20 })],
            spacing: { after: 80 },
        }));
    }

    // Sections
    for (const section of sections) {
        if (!section.isVisible || section.items.length === 0) continue;

        paragraphs.push(makeSectionHeading(sanitizeText(section.title)));

        for (const item of section.items) {
            switch (section.type) {
                case 'experience': {
                    const exp = item as any;
                    const dateRange = [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ');
                    paragraphs.push(new Paragraph({
                        children: [
                            new TextRun({ text: sanitizeText(exp.position), bold: true, size: 22 }),
                            new TextRun({ text: exp.company ? `  —  ${sanitizeText(exp.company)}` : '', size: 22 }),
                            new TextRun({ text: dateRange ? `  (${dateRange})` : '', size: 20, color: '64748b' }),
                        ],
                        spacing: { before: 120, after: 40 },
                    }));
                    if (exp.location) paragraphs.push(new Paragraph({ children: [new TextRun({ text: sanitizeText(exp.location), size: 18, color: '94a3b8' })], spacing: { after: 40 } }));
                    if (exp.description) paragraphs.push(new Paragraph({ children: [new TextRun({ text: sanitizeText(exp.description), size: 20 })], spacing: { after: 40 } }));
                    if (exp.highlights?.length) {
                        for (const h of exp.highlights) {
                            if (h) paragraphs.push(makeBulletParagraph(sanitizeText(h)));
                        }
                    }
                    break;
                }
                case 'education': {
                    const edu = item as any;
                    const dateRange = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
                    const degree = [edu.degree, edu.field].filter(Boolean).join(' in ');
                    paragraphs.push(new Paragraph({
                        children: [
                            new TextRun({ text: sanitizeText(degree), bold: true, size: 22 }),
                            new TextRun({ text: edu.institution ? `  —  ${sanitizeText(edu.institution)}` : '', size: 22 }),
                            new TextRun({ text: dateRange ? `  (${dateRange})` : '', size: 20, color: '64748b' }),
                        ],
                        spacing: { before: 120, after: 40 },
                    }));
                    if (edu.gpa) paragraphs.push(new Paragraph({ children: [new TextRun({ text: `GPA: ${sanitizeText(edu.gpa)}`, size: 18 })], spacing: { after: 40 } }));
                    if (edu.description) paragraphs.push(new Paragraph({ children: [new TextRun({ text: sanitizeText(edu.description), size: 20 })], spacing: { after: 40 } }));
                    if (edu.highlights?.length) {
                        for (const h of edu.highlights) {
                            if (h) paragraphs.push(makeBulletParagraph(sanitizeText(h)));
                        }
                    }
                    break;
                }
                case 'skills': {
                    const skill = item as any;
                    const level = skill.level ? ` (${skill.level})` : '';
                    paragraphs.push(makeBulletParagraph(`${sanitizeText(skill.name)}${level}`));
                    break;
                }
                case 'projects': {
                    const proj = item as any;
                    const nameRuns: (TextRun | ExternalHyperlink)[] = [new TextRun({ text: sanitizeText(proj.name), bold: true, size: 22 })];
                    const projectUrl = normalizeUrl(proj.url);
                    if (projectUrl) {
                        nameRuns.push(new TextRun({ text: '  ' }));
                        nameRuns.push(new ExternalHyperlink({
                            link: projectUrl,
                            children: [new TextRun({ text: sanitizeText(proj.url), style: 'Hyperlink', size: 18 })],
                        }));
                    }
                    paragraphs.push(new Paragraph({ children: nameRuns, spacing: { before: 120, after: 40 } }));
                    if (proj.description) paragraphs.push(new Paragraph({ children: [new TextRun({ text: sanitizeText(proj.description), size: 20 })], spacing: { after: 40 } }));
                    if (proj.technologies?.length) {
                        paragraphs.push(new Paragraph({ children: [new TextRun({ text: `Technologies: ${proj.technologies.map((value: string) => sanitizeText(value)).filter(Boolean).join(', ')}`, size: 18, italics: true })], spacing: { after: 40 } }));
                    }
                    if (proj.highlights?.length) {
                        for (const h of proj.highlights) {
                            if (h) paragraphs.push(makeBulletParagraph(sanitizeText(h)));
                        }
                    }
                    break;
                }
                case 'certifications': {
                    const cert = item as any;
                    const certText = [cert.name, cert.issuer, cert.date].map((value) => sanitizeText(value)).filter(Boolean).join('  —  ');
                    paragraphs.push(makeBulletParagraph(certText));
                    break;
                }
                case 'languages': {
                    const lang = item as any;
                    paragraphs.push(makeBulletParagraph(`${sanitizeText(lang.name)}  —  ${sanitizeText(lang.proficiency)}`));
                    break;
                }
                default: {
                    const custom = item as any;
                    if (custom.title) {
                        paragraphs.push(new Paragraph({
                            children: [new TextRun({ text: sanitizeText(custom.title), bold: true, size: 22 })],
                            spacing: { before: 100, after: 40 },
                        }));
                    }
                    if (custom.subtitle) paragraphs.push(new Paragraph({ children: [new TextRun({ text: sanitizeText(custom.subtitle), size: 20, italics: true })], spacing: { after: 40 } }));
                    if (custom.description) paragraphs.push(new Paragraph({ children: [new TextRun({ text: sanitizeText(custom.description), size: 20 })], spacing: { after: 40 } }));
                    break;
                }
            }
        }
    }

    const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: 'Heading2',
                    name: 'Heading 2',
                    basedOn: 'Normal',
                    next: 'Normal',
                    run: { bold: true, size: 24, color: '1e3a8a' },
                    paragraph: { spacing: { before: 240, after: 80 } },
                },
            ],
        },
        sections: [{ properties: {}, children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    triggerBinaryDownload(blob, normalizeDownloadFilename(filename, 'docx'));
}
