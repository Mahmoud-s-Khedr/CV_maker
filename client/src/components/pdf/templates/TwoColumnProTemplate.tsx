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
import { PDF_COLUMN_WIDTHS, buildPadding } from '../layoutTokens';

const BLUE = '#1d4ed8';
const BLUE_LIGHT = '#eff6ff';
const SIDEBAR_BG = '#f8f9fa';
const FONT_SCALE_MAP = { small: 0.85, medium: 1.0, large: 1.1, xlarge: 1.2 } as const;

const makeStyles = (sc: number) => StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        fontSize: 10 * sc,
        fontFamily: 'Helvetica',
    },
    headerBanner: {
        backgroundColor: BLUE,
        ...buildPadding(22, 28),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    headerLeft: {
        flex: 1,
    },
    name: {
        fontSize: 22 * sc,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    jobTitle: {
        fontSize: 11 * sc,
        color: '#bfdbfe',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    headerContact: {
        alignItems: 'flex-end',
    },
    headerContactText: {
        fontSize: 8.5 * sc,
        color: '#dbeafe',
        marginBottom: 3,
    },
    headerLink: {
        fontSize: 8.5 * sc,
        color: '#dbeafe',
        textDecoration: 'none',
        marginBottom: 3,
    },
    body: {
        flexDirection: 'row',
        flex: 1,
    },
    sidebar: {
        width: PDF_COLUMN_WIDTHS.sidebarCompact,
        backgroundColor: SIDEBAR_BG,
        ...buildPadding(18, 16),
    },
    main: {
        width: PDF_COLUMN_WIDTHS.mainCompact,
        ...buildPadding(18, 22, 18, 18),
        backgroundColor: '#FFFFFF',
    },
    // Sidebar section titles: border on View wrapper
    sidebarSectionTitleWrapper: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#d1d5db',
        paddingBottom: 3,
        marginBottom: 6,
        marginTop: 12,
    },
    sidebarSectionTitleWrapperFirst: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#d1d5db',
        paddingBottom: 3,
        marginBottom: 6,
        marginTop: 0,
    },
    sidebarSectionTitleText: {
        fontSize: 8.5 * sc,
        fontWeight: 'bold',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    skillItem: {
        marginBottom: 4,
    },
    skillName: {
        fontSize: 9 * sc,
        color: '#374151',
    },
    skillLevel: {
        fontSize: 8 * sc,
        color: '#9ca3af',
    },
    langItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    langName: {
        fontSize: 9 * sc,
        color: '#374151',
        fontWeight: 'bold',
    },
    langProficiency: {
        fontSize: 8 * sc,
        color: '#6b7280',
    },
    mainSectionWrapper: {
        marginBottom: 16,
    },
    mainSectionTitleWrapper: {
        marginBottom: 8,
        paddingBottom: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#bfdbfe',
    },
    mainSectionTitle: {
        fontSize: 11 * sc,
        fontWeight: 'bold',
        color: BLUE,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    mainSectionTitleAts: {
        fontSize: 11 * sc,
        fontWeight: 'bold',
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
        fontSize: 10 * sc,
        color: '#111827',
    },
    subtitle: {
        fontSize: 9 * sc,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    date: {
        fontSize: 8.5 * sc,
        color: '#9ca3af',
        textAlign: 'right',
    },
    description: {
        marginTop: 3,
        fontSize: 9 * sc,
        color: '#374151',
        lineHeight: 1.5,
    },
    summaryText: {
        fontSize: 9.5 * sc,
        color: '#374151',
        lineHeight: 1.6,
        textAlign: 'justify',
    },
    link: {
        color: BLUE,
        textDecoration: 'none',
        fontSize: 9 * sc,
    },
});

interface TemplateProps {
    data: ResumeSchema;
    atsMode?: boolean;
}

const SIDEBAR_TYPES = new Set(['skills', 'languages']);

export const TwoColumnProTemplate: React.FC<TemplateProps> = ({ data, atsMode = false }) => {
    const sc = FONT_SCALE_MAP[data.meta?.themeConfig?.fontSize ?? 'medium'];
    const styles = makeStyles(sc);

    const visibleSections = data.sections.filter(s => s.isVisible);
    const sidebarSections = visibleSections.filter(s => SIDEBAR_TYPES.has(s.type));
    const mainSections = visibleSections.filter(s => !SIDEBAR_TYPES.has(s.type));

    const renderExperience = (item: ReturnType<typeof asExperienceItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.position}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            </View>
            <Text style={styles.subtitle}>{item.company}{item.location ? ` | ${item.location}` : ''}</Text>
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

    const renderMainItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(asExperienceItem(item));
            case 'education': return renderEducation(asEducationItem(item));
            case 'projects':
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>{'name' in item ? item.name : ''}</Text>
                            {'url' in item && item.url && (
                                <Link src={normalizeExternalUrl(item.url as string)} style={atsMode ? styles.date : styles.link}>
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
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <Text style={styles.bold}>{'title' in item ? item.title : 'name' in item ? item.name : ''}</Text>
                        {'description' in item && item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                    </View>
                );
        }
    };

    // In ATS mode, render everything single-column
    if (atsMode) {
        return (
            <Page size="A4" style={{ flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 40, fontSize: 10 * sc, fontFamily: ATS_FONTS.primary }}>
                <View style={{ marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#000000' }}>
                    <Text style={{ fontSize: 22 * sc, fontWeight: 'bold', color: '#000000', marginBottom: 3 }}>{data.profile.fullName}</Text>
                    {data.profile.jobTitle && <Text style={{ fontSize: 11 * sc, color: '#000000', marginBottom: 4 }}>{data.profile.jobTitle}</Text>}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {[
                            data.profile.email ? <Text key="email" style={{ fontSize: 9 * sc, color: '#000000' }}>{data.profile.email}</Text> : null,
                            data.profile.phone ? <Text key="phone" style={{ fontSize: 9 * sc, color: '#000000' }}>{data.profile.phone}</Text> : null,
                            data.profile.location ? <Text key="location" style={{ fontSize: 9 * sc, color: '#000000' }}>{data.profile.location}</Text> : null,
                            data.profile.url ? (
                                <Link key="url" src={normalizeExternalUrl(data.profile.url)} style={{ fontSize: 9 * sc, color: '#000000', textDecoration: 'none' }}>
                                    {formatExternalUrl(data.profile.url)}
                                </Link>
                            ) : null,
                            ...(data.profile.links ?? []).map((l) => (
                                <Link key={l.id} src={normalizeExternalUrl(l.url)} style={{ fontSize: 9 * sc, color: '#000000', textDecoration: 'none' }}>
                                    {`${l.label}: ${formatExternalUrl(l.url)}`}
                                </Link>
                            )),
                        ].filter(Boolean).map((item, index) => (
                            <React.Fragment key={`contact-${index}`}>
                                {index > 0 && <Text style={{ fontSize: 9 * sc, color: '#000000' }}>{' | '}</Text>}
                                {item}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {data.profile.summary && (
                    <View style={{ marginBottom: 12 }}>
                        <View style={{ marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: '#000000' }}>
                            <Text style={styles.mainSectionTitleAts}>Summary</Text>
                        </View>
                        <Text style={styles.summaryText}>{data.profile.summary}</Text>
                    </View>
                )}

                {visibleSections.map((section, index) => (
                    <View key={`${section.id}-${index}`} style={{ marginBottom: 12 }}>
                        <View style={{ marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: '#000000' }}>
                            <Text style={styles.mainSectionTitleAts}>
                                {getAtsSectionTitle(section.type, section.title)}
                            </Text>
                        </View>
                        {section.type === 'skills' ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {getSkillItems(section).map((item) => (
                                    <View key={item.id} style={{ width: PDF_COLUMN_WIDTHS.oneThird, marginBottom: 3 }}>
                                        <Text style={{ fontSize: 9 * sc, color: '#000000' }}>- {item.name}{item.level ? ` (${item.level})` : ''}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : section.type === 'languages' ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {getLanguageItems(section).map((item) => (
                                    <View key={item.id} style={{ width: PDF_COLUMN_WIDTHS.half, marginBottom: 3 }}>
                                        <Text style={{ fontSize: 9 * sc, color: '#000000' }}>- {item.name}{item.proficiency ? ` (${item.proficiency})` : ''}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View>
                                {section.items.map(item => renderMainItem(section.type, item))}
                            </View>
                        )}
                    </View>
                ))}
            </Page>
        );
    }

    // Normal two-column layout
    return (
        <Page size="A4" style={styles.page}>
            <View style={[styles.headerBanner, { backgroundColor: BLUE_LIGHT, borderBottomWidth: 3, borderBottomColor: BLUE }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.name, { color: BLUE }]}>{data.profile.fullName}</Text>
                    {data.profile.jobTitle && (
                        <Text style={[styles.jobTitle, { color: '#3b82f6' }]}>{data.profile.jobTitle}</Text>
                    )}
                </View>
                <View style={styles.headerContact}>
                    {data.profile.email && <Text style={[styles.headerContactText, { color: '#374151' }]}>{data.profile.email}</Text>}
                    {data.profile.phone && <Text style={[styles.headerContactText, { color: '#374151' }]}>{data.profile.phone}</Text>}
                    {data.profile.location && <Text style={[styles.headerContactText, { color: '#374151' }]}>{data.profile.location}</Text>}
                    {data.profile.url && (
                        <Link src={normalizeExternalUrl(data.profile.url)} style={[styles.headerLink, { color: BLUE }]}>
                            {formatExternalUrl(data.profile.url)}
                        </Link>
                    )}
                    {(data.profile.links ?? []).map(l => (
                        <Link key={l.id} src={normalizeExternalUrl(l.url)} style={[styles.headerLink, { color: BLUE }]}>
                            {`${l.label}: ${formatExternalUrl(l.url)}`}
                        </Link>
                    ))}
                </View>
            </View>

            <View style={styles.body}>
                <View style={styles.sidebar}>
                    {sidebarSections.map((section, i) => (
                        <View key={section.id}>
                            <View style={i === 0 ? styles.sidebarSectionTitleWrapperFirst : styles.sidebarSectionTitleWrapper}>
                                <Text style={styles.sidebarSectionTitleText}>{section.title}</Text>
                            </View>
                            {section.type === 'skills' && getSkillItems(section).map((item) => (
                                <View key={item.id} style={styles.skillItem}>
                                    <Text style={styles.skillName}>▸ {item.name}</Text>
                                    {item.level && <Text style={styles.skillLevel}>{item.level}</Text>}
                                </View>
                            ))}
                            {section.type === 'languages' && getLanguageItems(section).map((item) => (
                                <View key={item.id} style={styles.langItem}>
                                    <Text style={styles.langName}>{item.name}</Text>
                                    {item.proficiency && <Text style={styles.langProficiency}>{item.proficiency}</Text>}
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                <View style={styles.main}>
                    {data.profile.summary && (
                        <View style={styles.mainSectionWrapper}>
                            <View style={styles.mainSectionTitleWrapper}>
                                <Text style={styles.mainSectionTitle}>Profile</Text>
                            </View>
                            <Text style={styles.summaryText}>{data.profile.summary}</Text>
                        </View>
                    )}

                    {mainSections.map((section, index) => (
                        <View key={`${section.id}-${index}`} style={styles.mainSectionWrapper}>
                            <View style={styles.mainSectionTitleWrapper}>
                                <Text style={styles.mainSectionTitle}>{section.title}</Text>
                            </View>
                            <View>
                                {section.items.map(item => renderMainItem(section.type, item))}
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </Page>
    );
};
