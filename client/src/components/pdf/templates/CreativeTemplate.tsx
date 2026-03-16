import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';
import {
    asEducationItem,
    asExperienceItem,
    getSkillItems,
    formatDateRange,
    formatExternalUrl,
    normalizeExternalUrl,
} from '../templateUtils';
import { getAtsSectionTitle } from '../atsConstants';
import { PDF_COLUMN_WIDTHS } from '../layoutTokens';

const FONT_SCALE_MAP = { small: 0.85, medium: 1.0, large: 1.1, xlarge: 1.2 } as const;

const makeStyles = (sc: number) => StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    sidebar: {
        width: PDF_COLUMN_WIDTHS.sidebarStandard,
        backgroundColor: '#0f172a',
        color: 'white',
        padding: 25,
        flexDirection: 'column',
    },
    main: {
        width: PDF_COLUMN_WIDTHS.mainStandard,
        padding: 35,
        paddingTop: 45,
    },
    name: {
        fontSize: 22 * sc,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#f8fafc',
        lineHeight: 1.2,
    },
    jobTitle: {
        fontSize: 11 * sc,
        color: '#94a3b8',
        marginBottom: 30,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    sidebarSection: {
        marginBottom: 28,
    },
    // Sidebar section title: border goes on View wrapper
    sidebarTitleWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        paddingBottom: 6,
        marginBottom: 12,
    },
    sidebarTitleText: {
        fontSize: 11 * sc,
        fontWeight: 'bold',
        color: '#f8fafc',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    contactItem: {
        fontSize: 8.5 * sc,
        color: '#cbd5e1',
        marginBottom: 8,
        lineHeight: 1.4,
    },
    section: {
        marginBottom: 25,
    },
    // Main section title: border goes on View wrapper
    sectionTitleWrapper: {
        marginBottom: 15,
        paddingBottom: 5,
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6',
    },
    sectionTitleText: {
        fontSize: 15 * sc,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    itemWrapper: {
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 12 * sc,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 10.5 * sc,
        color: '#475569',
        marginBottom: 4,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 9 * sc,
        color: '#64748b',
    },
    description: {
        marginTop: 4,
        fontSize: 10 * sc,
        color: '#334155',
        lineHeight: 1.6,
        textAlign: 'justify',
    },
    descriptionDark: {
        marginTop: 4,
        fontSize: 9 * sc,
        color: '#94a3b8',
        lineHeight: 1.5,
    },
    skillBadge: {
        marginBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    skillBullet: {
        width: 3,
        height: 3,
        backgroundColor: '#3b82f6',
        borderRadius: 2,
        marginRight: 8,
    },
    skillText: {
        color: '#cbd5e1',
        fontSize: 9 * sc,
    },
});

interface TemplateProps {
    data: ResumeSchema;
    atsMode?: boolean;
}

export const CreativeTemplate: React.FC<TemplateProps> = ({ data, atsMode = false }) => {
    const sc = FONT_SCALE_MAP[data.meta?.themeConfig?.fontSize ?? 'medium'];
    const styles = makeStyles(sc);

    const renderExperience = (item: ReturnType<typeof asExperienceItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.position}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            </View>
            <Text style={styles.subtitle}>{item.company}</Text>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderEducation = (item: ReturnType<typeof asEducationItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.institution}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            </View>
            <Text style={styles.subtitle}>{item.degree} {item.field ? `in ${item.field}` : ''}</Text>
        </View>
    );

    const renderMainItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(asExperienceItem(item));
            case 'education': return renderEducation(asEducationItem(item));
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <Text style={styles.bold}>
                            {'title' in item ? item.title : 'name' in item ? item.name : ''}
                        </Text>
                        {'description' in item && item.description ? (
                            <Text style={styles.description}>{item.description}</Text>
                        ) : null}
                    </View>
                );
        }
    };

    const sidebarBg = atsMode ? 'transparent' : '#0f172a';
    const sidebarTextPrimary = atsMode ? '#000000' : '#f8fafc';
    const sidebarTextSecondary = atsMode ? '#444444' : '#94a3b8';
    const sidebarContactColor = atsMode ? '#000000' : '#cbd5e1';
    const sidebarTitleBorderColor = atsMode ? '#000000' : '#334155';
    const mainSectionTitleColor = atsMode ? '#000000' : '#0f172a';
    const mainSectionBorderColor = atsMode ? '#000000' : '#3b82f6';

    const activeSidebarStyle = atsMode
        ? { width: PDF_COLUMN_WIDTHS.full, backgroundColor: sidebarBg, padding: 0, paddingBottom: 12 }
        : styles.sidebar;

    const activeMainStyle = atsMode
        ? { width: PDF_COLUMN_WIDTHS.full, padding: 0 }
        : styles.main;

    const renderContactBlock = () => {
        const extraLinks = data.profile.links ?? [];
        if (atsMode) {
            const parts = [
                data.profile.email ? `Email: ${data.profile.email}` : null,
                data.profile.phone ? `Phone: ${data.profile.phone}` : null,
                data.profile.location ? `Location: ${data.profile.location}` : null,
                data.profile.url ? formatExternalUrl(data.profile.url) : null,
                ...extraLinks.map(l => `${l.label}: ${l.url}`),
            ].filter(Boolean);
            return (
                <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 9 * sc, color: '#000000' }}>{parts.join('  |  ')}</Text>
                </View>
            );
        }
        return (
            <View style={styles.sidebarSection}>
                <View style={[styles.sidebarTitleWrapper, { borderBottomColor: sidebarTitleBorderColor }]}>
                    <Text style={[styles.sidebarTitleText, { color: sidebarTextPrimary }]}>Contact</Text>
                </View>
                {data.profile.email && <Text style={[styles.contactItem, { color: sidebarContactColor }]}>{data.profile.email}</Text>}
                {data.profile.phone && <Text style={[styles.contactItem, { color: sidebarContactColor }]}>{data.profile.phone}</Text>}
                {data.profile.location && <Text style={[styles.contactItem, { color: sidebarContactColor }]}>{data.profile.location}</Text>}
                {data.profile.url && (
                    <Link
                        src={normalizeExternalUrl(data.profile.url)}
                        style={[styles.contactItem, { color: sidebarContactColor, textDecoration: 'none' }]}
                    >
                        {formatExternalUrl(data.profile.url)}
                    </Link>
                )}
                {extraLinks.map(l => (
                    <Link key={l.id} src={normalizeExternalUrl(l.url)} style={[styles.contactItem, { color: sidebarContactColor, textDecoration: 'none' }]}>
                        {`${l.label}: ${formatExternalUrl(l.url)}`}
                    </Link>
                ))}
            </View>
        );
    };

    return (
        <Page size="A4" style={[styles.page, atsMode ? { flexDirection: 'column', padding: 36 } : {}]}>
            {atsMode && (
                <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.name, { color: '#000000' }]}>{data.profile.fullName}</Text>
                    {data.profile.jobTitle && <Text style={[styles.jobTitle, { color: '#333333', marginBottom: 6 }]}>{data.profile.jobTitle}</Text>}
                    {renderContactBlock()}
                </View>
            )}

            <View style={activeSidebarStyle}>
                {!atsMode && (
                    <>
                        <Text style={[styles.name, { color: sidebarTextPrimary }]}>{data.profile.fullName}</Text>
                        {data.profile.jobTitle && <Text style={[styles.jobTitle, { color: sidebarTextSecondary }]}>{data.profile.jobTitle}</Text>}
                        {renderContactBlock()}
                    </>
                )}

                {data.profile.summary && (
                    <View style={atsMode ? { marginBottom: 10 } : styles.sidebarSection}>
                        <View style={[styles.sidebarTitleWrapper, { borderBottomColor: sidebarTitleBorderColor }]}>
                            <Text style={[styles.sidebarTitleText, { color: sidebarTextPrimary }]}>
                                {atsMode ? 'Summary' : 'About Me'}
                            </Text>
                        </View>
                        <Text style={[styles.descriptionDark, { color: atsMode ? '#333333' : '#94a3b8' }]}>{data.profile.summary}</Text>
                    </View>
                )}

                {data.sections.filter(s => s.type === 'skills' && s.isVisible).map(section => (
                    <View key={section.id} style={atsMode ? { marginBottom: 10 } : styles.sidebarSection}>
                        <View style={[styles.sidebarTitleWrapper, { borderBottomColor: sidebarTitleBorderColor }]}>
                            <Text style={[styles.sidebarTitleText, { color: sidebarTextPrimary }]}>
                                {atsMode ? getAtsSectionTitle(section.type, section.title) : section.title}
                            </Text>
                        </View>
                        {getSkillItems(section).map((item) => (
                            <View key={item.id} style={styles.skillBadge}>
                                {atsMode
                                    ? <Text style={{ fontSize: 9 * sc, color: '#000000' }}>- {item.name}</Text>
                                    : (
                                        <>
                                            <View style={styles.skillBullet} />
                                            <Text style={styles.skillText}>{item.name}</Text>
                                        </>
                                    )
                                }
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            <View style={activeMainStyle}>
                {data.sections.filter(s => s.type !== 'skills' && s.isVisible).map(section => (
                    <View key={section.id} style={styles.section}>
                        <View style={[styles.sectionTitleWrapper, { borderBottomColor: mainSectionBorderColor }]}>
                            <Text style={[styles.sectionTitleText, { color: mainSectionTitleColor }]}>
                                {atsMode ? getAtsSectionTitle(section.type, section.title) : section.title}
                            </Text>
                        </View>
                        {section.items.map(item => renderMainItem(section.type, item))}
                    </View>
                ))}
            </View>
        </Page>
    );
};
