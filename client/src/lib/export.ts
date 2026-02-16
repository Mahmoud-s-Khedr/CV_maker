import type { ResumeSchema } from '../types/resume';

function triggerDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function exportAsJSON(resume: ResumeSchema, filename: string) {
    const json = JSON.stringify(resume, null, 2);
    triggerDownload(json, filename, 'application/json');
}

export function exportAsPlainText(resume: ResumeSchema, filename: string) {
    const lines: string[] = [];
    const { profile, sections } = resume;

    // Header
    if (profile.fullName) lines.push(profile.fullName.toUpperCase());
    const contactParts = [profile.jobTitle, profile.email, profile.phone, profile.location, profile.url].filter(Boolean);
    if (contactParts.length) lines.push(contactParts.join(' | '));
    lines.push('');

    // Summary
    if (profile.summary) {
        lines.push('SUMMARY');
        lines.push(profile.summary);
        lines.push('');
    }

    // Sections
    for (const section of sections) {
        if (!section.isVisible || section.items.length === 0) continue;

        lines.push(section.title.toUpperCase());

        for (const item of section.items) {
            switch (section.type) {
                case 'experience': {
                    const exp = item as any;
                    const dateRange = [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' - ');
                    lines.push(`${exp.position || ''} — ${exp.company || ''} (${dateRange})`);
                    if (exp.location) lines.push(`  ${exp.location}`);
                    if (exp.description) lines.push(`  ${exp.description}`);
                    if (exp.highlights?.length) {
                        for (const h of exp.highlights) {
                            if (h) lines.push(`  • ${h}`);
                        }
                    }
                    lines.push('');
                    break;
                }
                case 'education': {
                    const edu = item as any;
                    const dateRange = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
                    const degree = [edu.degree, edu.field].filter(Boolean).join(' in ');
                    lines.push(`${degree} — ${edu.institution || ''} (${dateRange})`);
                    if (edu.gpa) lines.push(`  GPA: ${edu.gpa}`);
                    if (edu.description) lines.push(`  ${edu.description}`);
                    if (edu.highlights?.length) {
                        for (const h of edu.highlights) {
                            if (h) lines.push(`  • ${h}`);
                        }
                    }
                    lines.push('');
                    break;
                }
                case 'skills': {
                    const skill = item as any;
                    const level = skill.level ? ` (${skill.level})` : '';
                    lines.push(`  • ${skill.name}${level}`);
                    break;
                }
                case 'projects': {
                    const proj = item as any;
                    lines.push(`${proj.name || ''}`);
                    if (proj.description) lines.push(`  ${proj.description}`);
                    if (proj.technologies?.length) lines.push(`  Technologies: ${proj.technologies.join(', ')}`);
                    if (proj.url) lines.push(`  ${proj.url}`);
                    if (proj.highlights?.length) {
                        for (const h of proj.highlights) {
                            if (h) lines.push(`  • ${h}`);
                        }
                    }
                    lines.push('');
                    break;
                }
                case 'certifications': {
                    const cert = item as any;
                    lines.push(`  • ${cert.name} — ${cert.issuer || ''}${cert.date ? ` (${cert.date})` : ''}`);
                    break;
                }
                case 'languages': {
                    const lang = item as any;
                    lines.push(`  • ${lang.name} — ${lang.proficiency || ''}`);
                    break;
                }
                default: {
                    const custom = item as any;
                    if (custom.title) lines.push(`${custom.title}`);
                    if (custom.subtitle) lines.push(`  ${custom.subtitle}`);
                    if (custom.description) lines.push(`  ${custom.description}`);
                    lines.push('');
                    break;
                }
            }
        }

        if (section.type === 'skills' || section.type === 'certifications' || section.type === 'languages') {
            lines.push('');
        }
    }

    triggerDownload(lines.join('\n'), filename, 'text/plain');
}
