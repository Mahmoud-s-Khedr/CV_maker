import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ProjectItem, ResumeSchema, SectionItem, SkillItem } from '../../../types/resume';
import {
    asEducationItem,
    asExperienceItem,
    asLanguageItem,
    asProjectItem,
    asSkillItem,
    formatDateRange,
    formatExternalUrl,
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
        padding: 50,
        fontSize: 10 * sc,
        fontFamily: 'Times-Roman',
    },
    header: {
        marginBottom: 30,
        textAlign: 'center',
    },
    name: {
        fontSize: 18 * sc,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 2,
    },
    jobTitle: {
        fontSize: 11 * sc,
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1,
        color: '#444',
    },
    contact: {
        fontSize: 9 * sc,
        color: '#444',
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    section: {
        marginBottom: 16,
    },
    // Border lives on the View wrapper — Text cannot have borderBottomWidth in react-pdf
    sectionTitleWrapper: {
        marginBottom: 10,
        paddingBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: '#000',
    },
    sectionTitleText: {
        fontSize: 11 * sc,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    itemWrapper: {
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 10 * sc,
    },
    subtitle: {
        fontSize: 10 * sc,
        fontStyle: 'italic',
    },
    date: {
        fontSize: 9 * sc,
        color: '#444',
    },
    description: {
        marginTop: 2,
        fontSize: 10 * sc,
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    link: {
        color: '#000',
        textDecoration: 'none',
    },
});

interface TemplateProps {
    data: ResumeSchema;
    atsMode?: boolean;
}

export const MinimalistTemplate: React.FC<TemplateProps> = ({ data, atsMode = false }) => {
    const sc = FONT_SCALE_MAP[data.meta?.themeConfig?.fontSize ?? 'medium'];
    const styles = makeStyles(sc);

    const contactItems: React.ReactNode[] = [];
    if (data.profile.email) contactItems.push(<Text key="email">{data.profile.email}</Text>);
    if (data.profile.phone) contactItems.push(<Text key="phone">{data.profile.phone}</Text>);
    if (data.profile.location) contactItems.push(<Text key="location">{data.profile.location}</Text>);
    if (data.profile.url) {
        contactItems.push(
            <Link
                key="url"
                src={normalizeExternalUrl(data.profile.url)}
                style={styles.link}
            >
                {formatExternalUrl(data.profile.url)}
            </Link>
        );
    }
    (data.profile.links ?? []).forEach(l => {
        contactItems.push(
            <Link key={l.id} src={normalizeExternalUrl(l.url)} style={styles.link}>
                {`${l.label}: ${formatExternalUrl(l.url)}`}
            </Link>
        );
    });

    const renderExperience = (item: ReturnType<typeof asExperienceItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.position}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subtitle}>{item.company} {item.location ? `, ${item.location}` : ''}</Text>
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

    const renderSkill = (item: SkillItem) => (
        <View key={item.id} style={{ width: PDF_COLUMN_WIDTHS.oneThird, marginBottom: 4 }}>
            <Text style={{ fontSize: 10 * sc }}>
                {item.name}
                {item.level && <Text style={{ color: '#666', fontSize: 9 * sc }}> ({item.level})</Text>}
            </Text>
        </View>
    );

    const renderProject = (item: ProjectItem) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.name}</Text>
                {item.url && (
                    <Link src={item.url.startsWith('http') ? item.url : `https://${item.url}`} style={styles.link}>
                        Link
                    </Link>
                )}
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(asExperienceItem(item));
            case 'education': return renderEducation(asEducationItem(item));
            case 'projects': return renderProject(asProjectItem(item));
            case 'skills': return renderSkill(asSkillItem(item));
            case 'certifications':
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>{'name' in item ? item.name : ''}</Text>
                            <Text style={styles.date}>{'date' in item ? item.date : ''}</Text>
                        </View>
                        <Text style={styles.subtitle}>{'issuer' in item ? item.issuer : ''}</Text>
                    </View>
                );
            case 'languages':
                {
                    const language = asLanguageItem(item);
                return (
                    <View key={item.id} style={{ width: PDF_COLUMN_WIDTHS.oneThird, marginBottom: 4 }}>
                        <Text style={{ fontSize: 10 * sc }}>
                            {language.name}
                            <Text style={{ color: '#666', fontSize: 9 * sc }}>{` - ${language.proficiency}`}</Text>
                        </Text>
                    </View>
                );
                }
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>{'title' in item ? item.title : ''}</Text>
                            <Text style={styles.date}>{'date' in item ? item.date : ''}</Text>
                        </View>
                        {'subtitle' in item && item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
                        {'description' in item && item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                    </View>
                );
        }
    };

    return (
        <Page size="A4" style={[styles.page, atsMode ? { fontFamily: 'Helvetica' } : {}]}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.name}>{data.profile.fullName}</Text>
                {data.profile.jobTitle && <Text style={styles.jobTitle}>{data.profile.jobTitle}</Text>}

                <View style={styles.contact}>
                    {contactItems.map((item, index) => (
                        <React.Fragment key={`contact-${index}`}>
                            {index > 0 && <Text>{' | '}</Text>}
                            {item}
                        </React.Fragment>
                    ))}
                </View>
            </View>

            {/* SUMMARY */}
            {data.profile.summary && (
                <View style={styles.section}>
                    <View style={styles.sectionTitleWrapper}>
                        <Text style={styles.sectionTitleText}>Summary</Text>
                    </View>
                    <Text style={styles.description}>{data.profile.summary}</Text>
                </View>
            )}

            {/* DYNAMIC SECTIONS */}
            {data.sections
                .filter(s => s.isVisible)
                .map((section, index) => (
                    <View key={`${section.id}-${index}`} style={styles.section}>
                        <View style={styles.sectionTitleWrapper}>
                            <Text style={styles.sectionTitleText}>
                                {atsMode ? getAtsSectionTitle(section.type, section.title) : section.title}
                            </Text>
                        </View>

                        {section.type === 'skills' ? (
                            (() => {
                                const hasCategories = sectionHasSkillCategories(section);
                                if (!hasCategories) {
                                    return (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {section.items.map(item => renderItem(section.type, item))}
                                        </View>
                                    );
                                }
                                const grouped = groupSkillItemsByCategory(section);

                                return (
                                    <View>
                                        {Object.entries(grouped).map(([category, items]) => (
                                            <View key={category} style={{ marginBottom: 8 }}>
                                                <Text style={{ fontSize: 9 * sc, fontWeight: 'bold', color: '#666', marginBottom: 4, textTransform: 'uppercase' }}>
                                                    {category}
                                                </Text>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                    {items.map(item => renderItem(section.type, item))}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                );
                            })()
                        ) : section.type === 'languages' ? (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {section.items.map(item => renderItem(section.type, item))}
                            </View>
                        ) : (
                            <View>
                                {section.items.map(item => renderItem(section.type, item))}
                            </View>
                        )}

                        {section.items.length === 0 && (
                            <Text style={{ color: '#999', fontSize: 9 * sc, fontStyle: 'italic' }}>No items added yet.</Text>
                        )}
                    </View>
                ))}
        </Page>
    );
};
