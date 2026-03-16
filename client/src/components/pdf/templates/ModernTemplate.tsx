import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, ResumeSection, SectionItem, SkillItem } from '../../../types/resume';
import {
    asCertificationItem,
    asEducationItem,
    asExperienceItem,
    asProjectItem,
    formatDateRange,
    formatExternalUrl,
    getLanguageItems,
    getSkillItems,
    groupSkillItemsByCategory,
    normalizeExternalUrl,
    sectionHasSkillCategories,
} from '../templateUtils';
import { getAtsSectionTitle } from '../atsConstants';
import { PDF_COLUMN_WIDTHS } from '../layoutTokens';

const FONT_SCALE_MAP = { small: 0.85, medium: 1.0, large: 1.1, xlarge: 1.2 } as const;

const makeStyles = (sc: number) => StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
    },
    nameHeader: {
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerName: {
        fontSize: 24 * sc,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
        color: '#2b6cb0',
        letterSpacing: 2,
        lineHeight: 1.2,
    },
    headerTitle: {
        fontSize: 12 * sc,
        color: '#718096',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    body: {
        flexDirection: 'row',
        flex: 1,
    },
    sidebar: {
        width: PDF_COLUMN_WIDTHS.sidebarStandard,
        backgroundColor: '#2d3748',
        padding: 24,
        color: 'white',
    },
    main: {
        width: PDF_COLUMN_WIDTHS.mainStandard,
        padding: 24,
        paddingTop: 20,
    },
    // Border lives on the View wrapper — Text cannot have borderBottomWidth in react-pdf
    sectionTitleWrapper: {
        marginBottom: 12,
        paddingBottom: 4,
        borderBottomWidth: 2,
        borderBottomColor: '#2b6cb0',
    },
    sectionTitleText: {
        fontSize: 14 * sc,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#2c5282',
        letterSpacing: 1,
    },
    sidebarSectionTitleWrapper: {
        marginBottom: 12,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#4a5568',
        marginTop: 16,
    },
    sidebarSectionTitleText: {
        fontSize: 12 * sc,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#63b3ed',
        letterSpacing: 1,
    },
    itemWrapper: {
        marginBottom: 12,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 11 * sc,
        color: '#2d3748',
    },
    subtitle: {
        fontSize: 10 * sc,
        color: '#4a5568',
        marginBottom: 2,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 9 * sc,
        color: '#718096',
        marginBottom: 4,
    },
    description: {
        fontSize: 10 * sc,
        color: '#4a5568',
        lineHeight: 1.5,
    },
    contactItem: {
        marginBottom: 8,
        fontSize: 9 * sc,
        color: '#e2e8f0',
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    separator: {
        fontSize: 9 * sc,
        color: '#e2e8f0',
        marginHorizontal: 4,
    },
    skillItem: {
        marginBottom: 6,
    },
    skillName: {
        fontSize: 10 * sc,
        fontWeight: 'bold',
        color: 'white',
    },
    skillLevel: {
        fontSize: 9 * sc,
        color: '#cbd5e0',
    },
    link: {
        color: '#63b3ed',
        textDecoration: 'none',
    },
});

interface TemplateProps {
    data: ResumeSchema;
    atsMode?: boolean;
}

export const ModernTemplate: React.FC<TemplateProps> = ({ data, atsMode = false }) => {
    const sc = FONT_SCALE_MAP[data.meta?.themeConfig?.fontSize ?? 'medium'];
    const styles = makeStyles(sc);

    const renderContact = () => {
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
            <View>
                <View style={styles.sidebarSectionTitleWrapper}>
                    <Text style={styles.sidebarSectionTitleText}>Contact</Text>
                </View>
                {data.profile.email && <Text style={styles.contactItem}>{data.profile.email}</Text>}
                {data.profile.phone && <Text style={styles.contactItem}>{data.profile.phone}</Text>}
                {data.profile.location && <Text style={styles.contactItem}>{data.profile.location}</Text>}
                {data.profile.url && (
                    <Link
                        src={normalizeExternalUrl(data.profile.url)}
                        style={[styles.contactItem, styles.link]}
                    >
                        {formatExternalUrl(data.profile.url)}
                    </Link>
                )}
                {extraLinks.map(l => (
                    <Link key={l.id} src={normalizeExternalUrl(l.url)} style={[styles.contactItem, styles.link]}>
                        {`${l.label}: ${formatExternalUrl(l.url)}`}
                    </Link>
                ))}
            </View>
        );
    };

    const renderExperience = (item: ReturnType<typeof asExperienceItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <Text style={styles.bold}>{item.position}</Text>
            <Text style={styles.subtitle}>
                {item.company}{item.location ? ` | ${item.location}` : ''}
            </Text>
            <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderEducation = (item: ReturnType<typeof asEducationItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <Text style={styles.bold}>{item.institution}</Text>
            <Text style={styles.subtitle}>
                {item.degree}{item.field ? ` in ${item.field}` : ''}
            </Text>
            <Text style={styles.date}>
                {formatDateRange(item.startDate, item.endDate)}
                {item.gpa ? ` | GPA: ${item.gpa}` : ''}
            </Text>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderProject = (item: ReturnType<typeof asProjectItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.bold}>{item.name}</Text>
                {item.url && (
                    <Link
                        src={normalizeExternalUrl(item.url)}
                        style={{ fontSize: 9 * sc, color: '#2b6cb0', textDecoration: 'none', marginLeft: 6 }}
                    >
                        Link
                    </Link>
                )}
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderMainItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(asExperienceItem(item));
            case 'education': return renderEducation(asEducationItem(item));
            case 'projects': return renderProject(asProjectItem(item));
            case 'certifications':
                {
                    const certification = asCertificationItem(item);
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <Text style={styles.bold}>{certification.name}</Text>
                        <Text style={styles.subtitle}>{certification.issuer}</Text>
                        <Text style={styles.date}>{certification.date}</Text>
                    </View>
                );
                }
            case 'custom':
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <Text style={styles.bold}>{'title' in item ? item.title : 'name' in item ? item.name : ''}</Text>
                        {'subtitle' in item && item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
                        {'date' in item && item.date ? <Text style={styles.date}>{item.date}</Text> : null}
                        {'description' in item && item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                    </View>
                );
        }
    };

    const orderedSections = data.sections;
    const sidebarSections = orderedSections.filter(s => s.isVisible && (s.type === 'skills' || s.type === 'languages'));
    const mainSections = orderedSections.filter(s => s.isVisible && s.type !== 'skills' && s.type !== 'languages');

    const sidebarStyle = atsMode
        ? { width: PDF_COLUMN_WIDTHS.full, backgroundColor: 'transparent', padding: 0, paddingBottom: 10 }
        : styles.sidebar;

    const mainStyle = atsMode
        ? { width: PDF_COLUMN_WIDTHS.full, padding: 0 }
        : styles.main;

    const sidebarTextColor = atsMode ? '#000000' : '#e2e8f0';
    const sidebarSubColor = atsMode ? '#444444' : '#cbd5e0';

    const renderSidebarSkillsAts = (section: ResumeSection) => {
        const titleWrapper = atsMode
            ? { marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: '#000000' }
            : styles.sidebarSectionTitleWrapper;
        const titleText = atsMode
            ? [styles.sidebarSectionTitleText, { color: '#000000' }]
            : styles.sidebarSectionTitleText;

        const hasCategories = sectionHasSkillCategories(section);
        if (!hasCategories) {
            return (
                <View key={section.id}>
                    <View style={titleWrapper}>
                        <Text style={titleText}>
                            {atsMode ? getAtsSectionTitle(section.type, section.title) : section.title}
                        </Text>
                    </View>
                    {getSkillItems(section).map((item) => (
                        <View key={item.id} style={styles.skillItem}>
                            <Text style={{ ...styles.skillName, color: sidebarTextColor }}>{item.name}</Text>
                            {item.level ? <Text style={{ ...styles.skillLevel, color: sidebarSubColor }}>{item.level}</Text> : null}
                        </View>
                    ))}
                </View>
            );
        }
        const grouped = groupSkillItemsByCategory(section);
        return (
            <View key={section.id}>
                <View style={titleWrapper}>
                    <Text style={titleText}>
                        {atsMode ? getAtsSectionTitle(section.type, section.title) : section.title}
                    </Text>
                </View>
                {Object.entries(grouped).map(([category, items]) => (
                    <View key={category} style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 10 * sc, fontWeight: 'bold', color: atsMode ? '#444444' : '#a0aec0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {category}
                        </Text>
                        {items.map((item: SkillItem) => (
                            <View key={item.id} style={styles.skillItem}>
                                <Text style={{ ...styles.skillName, color: sidebarTextColor }}>{item.name}</Text>
                                {item.level ? <Text style={{ ...styles.skillLevel, color: sidebarSubColor }}>{item.level}</Text> : null}
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        );
    };

    const renderSidebarLanguagesAts = (section: ResumeSection) => {
        const titleWrapper = atsMode
            ? { marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: '#000000' }
            : styles.sidebarSectionTitleWrapper;
        const titleText = atsMode
            ? [styles.sidebarSectionTitleText, { color: '#000000' }]
            : styles.sidebarSectionTitleText;
        return (
            <View key={section.id}>
                <View style={titleWrapper}>
                    <Text style={titleText}>
                        {atsMode ? getAtsSectionTitle(section.type, section.title) : section.title}
                    </Text>
                </View>
                {getLanguageItems(section).map((item) => (
                    <View key={item.id} style={styles.skillItem}>
                        <Text style={{ ...styles.skillName, color: sidebarTextColor }}>{item.name}</Text>
                        {item.proficiency ? <Text style={{ ...styles.skillLevel, color: sidebarSubColor }}>{item.proficiency}</Text> : null}
                    </View>
                ))}
            </View>
        );
    };

    const renderSidebarContent = () => (
        <View style={sidebarStyle}>
            {renderContact()}

            {data.profile.summary ? (
                <View>
                    {atsMode ? (
                        <View style={{ marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: '#000000' }}>
                            <Text style={[styles.sidebarSectionTitleText, { color: '#000000' }]}>Summary</Text>
                        </View>
                    ) : (
                        <View style={styles.sidebarSectionTitleWrapper}>
                            <Text style={styles.sidebarSectionTitleText}>Summary</Text>
                        </View>
                    )}
                    <Text style={{ fontSize: 9 * sc, color: sidebarTextColor, lineHeight: 1.5 }}>{data.profile.summary}</Text>
                </View>
            ) : null}

            {sidebarSections.map(section => {
                if (section.type === 'skills') return renderSidebarSkillsAts(section);
                if (section.type === 'languages') return renderSidebarLanguagesAts(section);
                return null;
            })}
        </View>
    );

    return (
        <Page size="A4" style={[styles.page, atsMode ? { padding: 36 } : {}]}>
            <View style={styles.nameHeader}>
                <Text style={[styles.headerName, atsMode ? { color: '#000000', letterSpacing: 1 } : {}]}>{data.profile.fullName}</Text>
                {data.profile.jobTitle ? <Text style={[styles.headerTitle, atsMode ? { color: '#333333' } : {}]}>{data.profile.jobTitle}</Text> : null}
            </View>

            <View style={[styles.body, atsMode ? { flexDirection: 'column' } : {}]}>
                {renderSidebarContent()}

                <View style={mainStyle}>
                    {mainSections.map((section, index) => (
                        <View key={`${section.id}-${index}`} style={{ marginBottom: 20 }}>
                            {atsMode ? (
                                <View style={{ marginBottom: 12, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: '#000000' }}>
                                    <Text style={[styles.sectionTitleText, { color: '#000000' }]}>
                                        {getAtsSectionTitle(section.type, section.title)}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.sectionTitleWrapper}>
                                    <Text style={styles.sectionTitleText}>{section.title}</Text>
                                </View>
                            )}
                            <View>
                                {section.items.map(item => renderMainItem(section.type, item))}
                            </View>
                            {section.items.length === 0 && (
                                <Text style={{ color: '#cbd5e0', fontSize: 10 * sc, fontStyle: 'italic' }}>No items added yet.</Text>
                            )}
                        </View>
                    ))}
                </View>
            </View>
        </Page>
    );
};
