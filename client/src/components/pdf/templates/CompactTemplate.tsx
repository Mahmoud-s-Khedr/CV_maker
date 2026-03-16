import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';
import { asEducationItem, asExperienceItem, formatDateRange, formatExternalUrl, normalizeExternalUrl } from '../templateUtils';
import { getAtsSectionTitle } from '../atsConstants';
import { PDF_COLUMN_WIDTHS } from '../layoutTokens';

const TEAL = '#0f766e';
const FONT_SCALE_MAP = { small: 0.85, medium: 1.0, large: 1.1, xlarge: 1.2 } as const;

const makeStyles = (sc: number) => StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 28,
        fontSize: 9 * sc,
        fontFamily: 'Helvetica',
        lineHeight: 1.4,
    },
    header: {
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1.5,
        borderBottomColor: TEAL,
    },
    name: {
        fontSize: 18 * sc,
        fontWeight: 'bold',
        color: '#111827',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    jobTitle: {
        fontSize: 10 * sc,
        color: TEAL,
        marginBottom: 4,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    contact: {
        fontSize: 8 * sc,
        color: '#4b5563',
    },
    link: {
        color: TEAL,
        textDecoration: 'none',
        fontSize: 8 * sc,
    },
    section: {
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 8.5 * sc,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: TEAL,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingLeft: 6,
        paddingTop: 2,
        paddingBottom: 2,
        marginBottom: 5,
    },
    sectionTitleAts: {
        fontSize: 8.5 * sc,
        fontWeight: 'bold',
        color: '#000000',
        backgroundColor: '#e5e7eb',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingLeft: 6,
        paddingTop: 2,
        paddingBottom: 2,
        marginBottom: 5,
    },
    itemWrapper: {
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 1,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 9 * sc,
        color: '#111827',
    },
    subtitle: {
        fontSize: 8.5 * sc,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    date: {
        fontSize: 8 * sc,
        color: '#9ca3af',
        textAlign: 'right',
    },
    description: {
        marginTop: 2,
        fontSize: 8.5 * sc,
        color: '#374151',
        lineHeight: 1.4,
    },
    skillsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    skillItem: {
        width: PDF_COLUMN_WIDTHS.oneThird,
        fontSize: 8.5 * sc,
        color: '#374151',
        marginBottom: 2,
    },
    summarySection: {
        marginBottom: 8,
    },
    summaryTitle: {
        fontSize: 8.5 * sc,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: TEAL,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingLeft: 6,
        paddingTop: 2,
        paddingBottom: 2,
        marginBottom: 4,
    },
    summaryText: {
        fontSize: 8.5 * sc,
        color: '#374151',
        lineHeight: 1.5,
    },
});

interface TemplateProps {
    data: ResumeSchema;
    atsMode?: boolean;
}

export const CompactTemplate: React.FC<TemplateProps> = ({ data, atsMode = false }) => {
    const sc = FONT_SCALE_MAP[data.meta?.themeConfig?.fontSize ?? 'medium'];
    const styles = makeStyles(sc);

    const titleStyle = atsMode ? styles.sectionTitleAts : styles.sectionTitle;

    const renderExperience = (item: ReturnType<typeof asExperienceItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.company}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            </View>
            <Text style={styles.subtitle}>{item.position}{item.location ? ` · ${item.location}` : ''}</Text>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderEducation = (item: ReturnType<typeof asEducationItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.institution}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate)}</Text>
            </View>
            <Text style={styles.subtitle}>{item.degree}{item.field ? ` in ${item.field}` : ''}{item.gpa ? ` · GPA ${item.gpa}` : ''}</Text>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(asExperienceItem(item));
            case 'education': return renderEducation(asEducationItem(item));
            case 'skills':
                return (
                    <View key={item.id} style={styles.skillItem}>
                        <Text>{'name' in item ? item.name : ''}{'level' in item && item.level ? ` (${item.level})` : ''}</Text>
                    </View>
                );
            case 'projects':
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>{'name' in item ? item.name : ''}</Text>
                            {'url' in item && item.url && (
                                <Link src={normalizeExternalUrl(item.url as string)} style={styles.link}>
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
                return (
                    <View key={item.id} style={[styles.skillItem, { width: PDF_COLUMN_WIDTHS.half }]}>
                        <Text>{'name' in item ? item.name : ''}{'proficiency' in item && item.proficiency ? ` — ${item.proficiency}` : ''}</Text>
                    </View>
                );
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
        <Page size="A4" style={styles.page}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={atsMode ? [styles.name, { color: '#000000' }] : styles.name}>
                    {data.profile.fullName}
                </Text>
                {data.profile.jobTitle && (
                    <Text style={atsMode ? [styles.jobTitle, { color: '#000000' }] : styles.jobTitle}>
                        {data.profile.jobTitle}
                    </Text>
                )}
                <View style={styles.contactRow}>
                    {[
                        data.profile.email ? <Text key="email" style={styles.contact}>{data.profile.email}</Text> : null,
                        data.profile.phone ? <Text key="phone" style={styles.contact}>{data.profile.phone}</Text> : null,
                        data.profile.location ? <Text key="location" style={styles.contact}>{data.profile.location}</Text> : null,
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
                            {index > 0 && <Text style={styles.contact}>{' | '}</Text>}
                            {item}
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* SUMMARY */}
            {data.profile.summary && (
                <View style={styles.summarySection}>
                    <Text style={atsMode ? styles.sectionTitleAts : styles.summaryTitle}>Summary</Text>
                    <Text style={styles.summaryText}>{data.profile.summary}</Text>
                </View>
            )}

            {/* SECTIONS */}
            {data.sections.filter(s => s.isVisible).map((section, index) => (
                <View key={`${section.id}-${index}`} style={styles.section}>
                    <Text style={titleStyle}>
                        {atsMode ? getAtsSectionTitle(section.type, section.title) : section.title}
                    </Text>
                    {section.type === 'skills' || section.type === 'languages' ? (
                        <View style={styles.skillsGrid}>
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
