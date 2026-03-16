import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';
import {
    asEducationItem,
    asExperienceItem,
    getLanguageItems,
    getSkillItems,
    formatDateRange,
    formatExternalUrl,
    normalizeExternalUrl,
} from '../templateUtils';
import { getAtsSectionTitle, ATS_FONTS } from '../atsConstants';
import { PDF_COLUMN_WIDTHS } from '../layoutTokens';

const GOLD = '#b8860b';
const FONT_SCALE_MAP = { small: 0.85, medium: 1.0, large: 1.1, xlarge: 1.2 } as const;

const makeStyles = (sc: number) => StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 50,
        fontSize: 10 * sc,
        fontFamily: 'Times-Roman',
        lineHeight: 1.7,
    },
    header: {
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        fontSize: 26 * sc,
        fontFamily: 'Helvetica',
        fontWeight: 'bold',
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    jobTitle: {
        fontSize: 11 * sc,
        fontFamily: 'Helvetica',
        color: '#555555',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        fontSize: 9 * sc,
        color: '#555555',
    },
    link: {
        color: '#555555',
        textDecoration: 'none',
        fontSize: 9 * sc,
    },
    divider: {
        borderBottomWidth: 1.5,
        borderBottomColor: GOLD,
        marginTop: 10,
        marginBottom: 10,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitleWrapper: {
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 10 * sc,
        fontFamily: 'Helvetica',
        fontWeight: 'bold',
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: GOLD,
    },
    sectionTitleAts: {
        fontSize: 10 * sc,
        fontFamily: 'Helvetica',
        fontWeight: 'bold',
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: '#000000',
    },
    sectionUnderline: {
        borderBottomWidth: 0.5,
        borderBottomColor: GOLD,
        width: PDF_COLUMN_WIDTHS.full,
        marginTop: 3,
    },
    sectionUnderlineAts: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        width: PDF_COLUMN_WIDTHS.full,
        marginTop: 3,
    },
    itemWrapper: {
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 1,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 10.5 * sc,
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 9.5 * sc,
        fontStyle: 'italic',
        color: '#555555',
    },
    date: {
        fontSize: 9 * sc,
        fontStyle: 'italic',
        color: '#888888',
        textAlign: 'right',
    },
    description: {
        marginTop: 3,
        fontSize: 9.5 * sc,
        color: '#333333',
        lineHeight: 1.6,
        textAlign: 'justify',
    },
    summary: {
        fontSize: 10 * sc,
        color: '#333333',
        lineHeight: 1.7,
        textAlign: 'justify',
        fontStyle: 'italic',
        marginBottom: 14,
    },
    skillsText: {
        fontSize: 9.5 * sc,
        color: '#444444',
        lineHeight: 1.6,
        textAlign: 'center',
    },
});

interface TemplateProps {
    data: ResumeSchema;
    atsMode?: boolean;
}

export const ElegantTemplate: React.FC<TemplateProps> = ({ data, atsMode = false }) => {
    const sc = FONT_SCALE_MAP[data.meta?.themeConfig?.fontSize ?? 'medium'];
    const styles = makeStyles(sc);

    const activeFont = atsMode ? ATS_FONTS.primary : 'Times-Roman';

    const renderSectionTitle = (title: string) => (
        <View style={styles.sectionTitleWrapper}>
            <Text style={atsMode ? styles.sectionTitleAts : styles.sectionTitle}>{title}</Text>
            <View style={atsMode ? styles.sectionUnderlineAts : styles.sectionUnderline} />
        </View>
    );

    const renderExperience = (item: ReturnType<typeof asExperienceItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.position}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            </View>
            <Text style={styles.subtitle}>{item.company}{item.location ? ` · ${item.location}` : ''}</Text>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderEducation = (item: ReturnType<typeof asEducationItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.institution}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate)}</Text>
            </View>
            <Text style={styles.subtitle}>{item.degree}{item.field ? ` in ${item.field}` : ''}</Text>
            {item.gpa && <Text style={styles.date}>GPA: {item.gpa}</Text>}
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(asExperienceItem(item));
            case 'education': return renderEducation(asEducationItem(item));
            case 'skills':
                return null; // Skills rendered as joined text, not individually
            case 'projects':
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>{'name' in item ? item.name : ''}</Text>
                            {'url' in item && item.url && (
                                <Link src={normalizeExternalUrl(item.url as string)} style={[styles.date, { color: atsMode ? '#000000' : GOLD }]}>
                                    {formatExternalUrl(item.url as string)}
                                </Link>
                            )}
                        </View>
                        {'description' in item && item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                    </View>
                );
            case 'certifications':
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>{'name' in item ? item.name : ''}</Text>
                            <Text style={styles.date}>{'date' in item ? item.date : ''}</Text>
                        </View>
                        {'issuer' in item && item.issuer ? <Text style={styles.subtitle}>{item.issuer}</Text> : null}
                    </View>
                );
            case 'languages':
                return null; // Languages rendered as joined text
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <Text style={styles.bold}>{'title' in item ? item.title : 'name' in item ? item.name : ''}</Text>
                        {'description' in item && item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                    </View>
                );
        }
    };

    return (
        <Page size="A4" style={[styles.page, atsMode ? { fontFamily: activeFont } : {}]}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={[styles.name, atsMode ? { fontFamily: ATS_FONTS.bold, letterSpacing: 1 } : {}]}>
                    {data.profile.fullName}
                </Text>
                {data.profile.jobTitle && (
                    <Text style={[styles.jobTitle, atsMode ? { color: '#000000', fontFamily: ATS_FONTS.primary } : {}]}>
                        {data.profile.jobTitle}
                    </Text>
                )}
                <View style={styles.contactRow}>
                    {[
                        data.profile.email ? <Text key="email">{data.profile.email}</Text> : null,
                        data.profile.phone ? <Text key="phone">{data.profile.phone}</Text> : null,
                        data.profile.location ? <Text key="location">{data.profile.location}</Text> : null,
                        data.profile.url ? (
                            <Link key="url" src={normalizeExternalUrl(data.profile.url)} style={styles.link}>
                                {formatExternalUrl(data.profile.url)}
                            </Link>
                        ) : null,
                        ...(data.profile.links ?? []).map((l) => (
                            <Link key={l.id} src={normalizeExternalUrl(l.url)} style={styles.link}>
                                {`${l.label}: ${formatExternalUrl(l.url)}`}
                            </Link>
                        )),
                    ].filter(Boolean).map((item, index) => (
                        <React.Fragment key={`contact-${index}`}>
                            {index > 0 && <Text>{' | '}</Text>}
                            {item}
                        </React.Fragment>
                    ))}
                </View>
            </View>

            <View style={styles.divider} />

            {/* SUMMARY */}
            {data.profile.summary && (
                <Text style={styles.summary}>{data.profile.summary}</Text>
            )}

            {/* SECTIONS */}
            {data.sections.filter(s => s.isVisible).map((section, index) => {
                const title = atsMode ? getAtsSectionTitle(section.type, section.title) : section.title;
                return (
                    <View key={`${section.id}-${index}`} style={styles.section}>
                        {renderSectionTitle(title)}

                        {section.type === 'skills' ? (
                            <Text style={styles.skillsText}>
                                {getSkillItems(section).map((item) => item.name).filter(Boolean).join('  ·  ')}
                            </Text>
                        ) : section.type === 'languages' ? (
                            <Text style={styles.skillsText}>
                                {getLanguageItems(section).map((item) => `${item.name}${item.proficiency ? ` (${item.proficiency})` : ''}`).filter(Boolean).join('  ·  ')}
                            </Text>
                        ) : (
                            <View>
                                {section.items.map(item => renderItem(section.type, item))}
                            </View>
                        )}
                    </View>
                );
            })}
        </Page>
    );
};
