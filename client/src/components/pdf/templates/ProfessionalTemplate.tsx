import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';
import { asEducationItem, asExperienceItem, formatDateRange, formatExternalUrl, normalizeExternalUrl } from '../templateUtils';
import { getAtsSectionTitle } from '../atsConstants';
import { PDF_COLUMN_WIDTHS } from '../layoutTokens';

const FONT_SCALE_MAP = { small: 0.85, medium: 1.0, large: 1.1, xlarge: 1.2 } as const;

const makeStyles = (sc: number) => StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontSize: 10 * sc,
        fontFamily: 'Helvetica',
        lineHeight: 1.6,
    },
    header: {
        marginBottom: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1e3a8a',
    },
    name: {
        fontSize: 28 * sc,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    jobTitle: {
        fontSize: 13 * sc,
        color: '#64748b',
        marginBottom: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    contact: {
        fontSize: 9 * sc,
        color: '#475569',
    },
    section: {
        marginBottom: 20,
    },
    // Border lives on the View wrapper — Text cannot have borderBottomWidth in react-pdf
    sectionTitleWrapper: {
        marginBottom: 10,
        paddingBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: '#cbd5e1',
    },
    sectionTitleText: {
        fontSize: 12 * sc,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    itemWrapper: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 11 * sc,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 10 * sc,
        color: '#475569',
        fontStyle: 'italic',
    },
    date: {
        fontSize: 9 * sc,
        color: '#64748b',
        textAlign: 'right',
    },
    description: {
        marginTop: 4,
        fontSize: 9.5 * sc,
        color: '#334155',
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    link: {
        color: '#2563EB',
        textDecoration: 'none',
    },
    skillBadge: {
        backgroundColor: '#f8fafc',
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginRight: 6,
        marginBottom: 6,
    },
    skillText: {
        fontSize: 9 * sc,
        color: '#1e40af',
        fontWeight: 'bold',
    },
});

interface TemplateProps {
    data: ResumeSchema;
    atsMode?: boolean;
}

export const ProfessionalTemplate: React.FC<TemplateProps> = ({ data, atsMode = false }) => {
    const sc = FONT_SCALE_MAP[data.meta?.themeConfig?.fontSize ?? 'medium'];
    const styles = makeStyles(sc);

    const renderExperience = (item: ReturnType<typeof asExperienceItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.position}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subtitle}>{item.company} {item.location ? ` | ${item.location}` : ''}</Text>
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderEducation = (item: ReturnType<typeof asEducationItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.institution}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate)}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subtitle}>{item.degree} {item.field ? `in ${item.field}` : ''}</Text>
                {item.gpa && <Text style={styles.date}>GPA: {item.gpa}</Text>}
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const activeSectionTitleWrapper = atsMode
        ? [styles.sectionTitleWrapper, { borderBottomColor: '#000000' }]
        : styles.sectionTitleWrapper;

    const activeSectionTitleText = atsMode
        ? [styles.sectionTitleText, { color: '#000000' }]
        : styles.sectionTitleText;

    const activeHeaderBorder = atsMode
        ? [styles.header, { borderBottomColor: '#000000' }]
        : styles.header;

    const activeNameStyle = atsMode
        ? [styles.name, { color: '#000000' }]
        : styles.name;

    const activeSkillBadge = atsMode
        ? [styles.skillBadge, { backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent' }]
        : styles.skillBadge;

    const activeSkillText = atsMode
        ? [styles.skillText, { color: '#000000' }]
        : styles.skillText;

    const renderItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(asExperienceItem(item));
            case 'education': return renderEducation(asEducationItem(item));
            case 'skills':
                return (
                    <View key={item.id} style={activeSkillBadge}>
                        <Text style={activeSkillText}>
                            {'name' in item ? item.name : ''}
                            {'level' in item && item.level ? ` • ${item.level}` : ''}
                        </Text>
                    </View>
                );
            case 'languages':
                return (
                    <View key={item.id} style={{ width: PDF_COLUMN_WIDTHS.half, marginBottom: 4 }}>
                        <Text style={{ fontSize: 9.5 * sc }}>
                            <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{'name' in item ? item.name : ''}</Text>
                            <Text style={{ color: '#64748b' }}>
                                {'proficiency' in item && item.proficiency ? ` - ${item.proficiency}` : ''}
                            </Text>
                        </Text>
                    </View>
                );
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>
                                {'title' in item ? item.title : 'name' in item ? item.name : ''}
                            </Text>
                        </View>
                        {'description' in item && item.description ? (
                            <Text style={styles.description}>{item.description}</Text>
                        ) : null}
                    </View>
                );
        }
    };

    return (
        <Page size="A4" style={styles.page}>
            {/* HEADER */}
            <View style={activeHeaderBorder}>
                <Text style={activeNameStyle}>{data.profile.fullName}</Text>
                {data.profile.jobTitle && <Text style={styles.jobTitle}>{data.profile.jobTitle}</Text>}

                <View style={styles.contactRow}>
                    {[
                        data.profile.email ? <Text key="email" style={styles.contact}>{data.profile.email}</Text> : null,
                        data.profile.phone ? <Text key="phone" style={styles.contact}>{data.profile.phone}</Text> : null,
                        data.profile.location ? <Text key="location" style={styles.contact}>{data.profile.location}</Text> : null,
                        data.profile.url ? (
                            <Link key="url" src={normalizeExternalUrl(data.profile.url)} style={[styles.contact, styles.link]}>
                                {formatExternalUrl(data.profile.url)}
                            </Link>
                        ) : null,
                        ...(data.profile.links ?? []).map((l) => (
                            <Link key={l.id} src={normalizeExternalUrl(l.url)} style={[styles.contact, styles.link]}>
                                {`${l.label}: ${formatExternalUrl(l.url)}`}
                            </Link>
                        )),
                    ].filter(Boolean).map((item, index) => (
                        <React.Fragment key={`contact-${index}`}>
                            {index > 0 && <Text style={styles.contact}>{' | '}</Text>}
                            {item}
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* SUMMARY */}
            {data.profile.summary && (
                <View style={styles.section}>
                    <View style={activeSectionTitleWrapper}>
                        <Text style={activeSectionTitleText}>Summary</Text>
                    </View>
                    <Text style={styles.description}>{data.profile.summary}</Text>
                </View>
            )}

            {/* SECTIONS */}
            {data.sections.filter(s => s.isVisible).map((section, index) => (
                <View key={`${section.id}-${index}`} style={styles.section}>
                    <View style={activeSectionTitleWrapper}>
                        <Text style={activeSectionTitleText}>
                            {atsMode ? getAtsSectionTitle(section.type, section.title) : section.title}
                        </Text>
                    </View>
                    {section.type === 'skills' ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {section.items.map(item => renderItem(section.type, item))}
                        </View>
                    ) : (
                        <View>
                            {section.items.map(item => renderItem(section.type, item))}
                        </View>
                    )}
                </View>
            ))}
        </Page>
    );
};
