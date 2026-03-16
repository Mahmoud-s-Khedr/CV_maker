import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem, SkillItem, LanguageItem, CertificationItem } from '../../../types/resume';
import {
    asEducationItem,
    asExperienceItem,
    asProjectItem,
    formatDateRange,
    formatExternalUrl,
    groupSkillItemsByCategory,
    normalizeExternalUrl,
    sanitizeText,
    sectionHasSkillCategories,
} from '../templateUtils';
import { getAtsSectionTitle } from '../atsConstants';
import { PDF_COLUMN_WIDTHS, PDF_SPACING, buildPadding } from '../layoutTokens';

const FONT_SCALE_MAP = { small: 0.85, medium: 1.0, large: 1.1, xlarge: 1.2 } as const;
const BASE_COLOR = '#111827';
const MUTED_COLOR = '#4b5563';
const BORDER_COLOR = '#d1d5db';

const makeStyles = (sc: number, atsMode: boolean) => {
    const headingColor = atsMode ? '#000000' : BASE_COLOR;
    const bodyColor = atsMode ? '#111111' : BASE_COLOR;
    const mutedColor = atsMode ? '#333333' : MUTED_COLOR;
    const linkColor = atsMode ? '#000000' : '#1f2937';

    return StyleSheet.create({
        page: {
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            ...buildPadding(PDF_SPACING.pageTight),
            fontSize: 8.8 * sc,
            fontFamily: 'Helvetica',
            color: bodyColor,
            lineHeight: 1.28,
        },
        header: {
            marginBottom: PDF_SPACING.headerCompact,
            paddingBottom: PDF_SPACING.headerTight,
            borderBottomWidth: 1,
            borderBottomColor: atsMode ? '#000000' : BORDER_COLOR,
        },
        name: {
            fontSize: 18 * sc,
            fontWeight: 'bold',
            letterSpacing: 0.4,
            color: headingColor,
            marginBottom: 5,
        },
        jobTitle: {
            fontSize: 9.5 * sc,
            color: mutedColor,
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
        },
        contactRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
        },
        contactText: {
            fontSize: 8.1 * sc,
            color: mutedColor,
        },
        link: {
            fontSize: 8.1 * sc,
            color: linkColor,
            textDecoration: 'none',
        },
        section: {
            marginBottom: PDF_SPACING.sectionTight,
        },
        sectionTitleWrapper: {
            marginBottom: 4,
            paddingBottom: 2,
            borderBottomWidth: 0.75,
            borderBottomColor: atsMode ? '#000000' : BORDER_COLOR,
        },
        sectionTitle: {
            fontSize: 9.2 * sc,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: headingColor,
        },
        summary: {
            fontSize: 8.4 * sc,
            color: bodyColor,
            lineHeight: 1.3,
        },
        itemWrapper: {
            marginBottom: PDF_SPACING.itemTight,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
        },
        title: {
            fontSize: 8.8 * sc,
            fontWeight: 'bold',
            color: headingColor,
        },
        subtitle: {
            fontSize: 8.2 * sc,
            color: mutedColor,
        },
        date: {
            fontSize: 7.9 * sc,
            color: mutedColor,
            textAlign: 'right',
        },
        description: {
            marginTop: 1,
            fontSize: 8.1 * sc,
            color: bodyColor,
            lineHeight: 1.25,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        gridItemThird: {
            width: PDF_COLUMN_WIDTHS.oneThird,
            marginBottom: 2,
            paddingRight: 6,
        },
        gridItemHalf: {
            width: PDF_COLUMN_WIDTHS.half,
            marginBottom: 2,
            paddingRight: 6,
        },
        groupedLabel: {
            fontSize: 7.7 * sc,
            fontWeight: 'bold',
            color: mutedColor,
            textTransform: 'uppercase',
            marginBottom: 1,
        },
        skillCompactList: {
            marginTop: 1,
        },
        skillCompactRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 2,
        },
        skillCompactLabel: {
            width: PDF_COLUMN_WIDTHS.oneThird,
            paddingRight: 6,
            fontSize: 7.9 * sc,
            fontWeight: 'bold',
            color: headingColor,
        },
        skillCompactValue: {
            flex: 1,
            fontSize: 8.1 * sc,
            color: bodyColor,
            lineHeight: 1.25,
        },
        tag: {
            borderWidth: 0.5,
            borderColor: atsMode ? '#000000' : BORDER_COLOR,
            borderRadius: 3,
            ...buildPadding(1, 4),
            marginRight: 4,
            marginBottom: 3,
        },
        tagText: {
            fontSize: 7.8 * sc,
            color: bodyColor,
        },
        inlineMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
        },
        emptyText: {
            fontSize: 8 * sc,
            color: mutedColor,
            fontStyle: 'italic',
        },
    });
};

interface TemplateProps {
    data: ResumeSchema;
    atsMode?: boolean;
}

export const AtsCompactTemplate: React.FC<TemplateProps> = ({ data, atsMode = false }) => {
    const sc = FONT_SCALE_MAP[data.meta?.themeConfig?.fontSize ?? 'medium'];
    const styles = makeStyles(sc, atsMode);

    const renderHeader = () => {
        const contactItems: React.ReactNode[] = [];

        if (data.profile.email) {
            contactItems.push(<Text key="email" style={styles.contactText}>{sanitizeText(data.profile.email)}</Text>);
        }
        if (data.profile.phone) {
            contactItems.push(<Text key="phone" style={styles.contactText}>{sanitizeText(data.profile.phone)}</Text>);
        }
        if (data.profile.location) {
            contactItems.push(<Text key="location" style={styles.contactText}>{sanitizeText(data.profile.location)}</Text>);
        }
        if (data.profile.url) {
            contactItems.push(
                <Link key="url" src={normalizeExternalUrl(data.profile.url)} style={styles.link}>
                    {formatExternalUrl(data.profile.url)}
                </Link>
            );
        }
        (data.profile.links ?? []).forEach((link) => {
            contactItems.push(
                <Link key={link.id} src={normalizeExternalUrl(link.url)} style={styles.link}>
                    {`${sanitizeText(link.label)}: ${formatExternalUrl(link.url)}`}
                </Link>
            );
        });

        return (
            <View style={styles.header}>
                <Text style={styles.name}>{sanitizeText(data.profile.fullName)}</Text>
                {data.profile.jobTitle ? <Text style={styles.jobTitle}>{sanitizeText(data.profile.jobTitle)}</Text> : null}
                {contactItems.length > 0 ? (
                    <View style={styles.contactRow}>
                        {contactItems.map((item, index) => (
                            <React.Fragment key={`contact-${index}`}>
                                {index > 0 && <Text style={styles.contactText}>{' | '}</Text>}
                                {item}
                            </React.Fragment>
                        ))}
                    </View>
                ) : null}
            </View>
        );
    };

    const renderExperience = (item: ReturnType<typeof asExperienceItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.title}>{sanitizeText(item.position)}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            </View>
            <View style={styles.inlineMeta}>
                <Text style={styles.subtitle}>{sanitizeText(item.company)}</Text>
                {item.location ? <Text style={styles.subtitle}>{` | ${sanitizeText(item.location)}`}</Text> : null}
            </View>
            {item.description ? <Text style={styles.description}>{sanitizeText(item.description)}</Text> : null}
        </View>
    );

    const renderEducation = (item: ReturnType<typeof asEducationItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.title}>{sanitizeText(item.institution)}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate)}</Text>
            </View>
            <View style={styles.inlineMeta}>
                <Text style={styles.subtitle}>
                    {sanitizeText(item.degree)}
                    {item.field ? ` in ${sanitizeText(item.field)}` : ''}
                </Text>
                {item.gpa ? <Text style={styles.subtitle}>{` | GPA ${sanitizeText(item.gpa)}`}</Text> : null}
            </View>
            {item.description ? <Text style={styles.description}>{sanitizeText(item.description)}</Text> : null}
        </View>
    );

    const renderProjects = (item: ReturnType<typeof asProjectItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.title}>{sanitizeText(item.name)}</Text>
                {item.url ? (
                    <Link src={normalizeExternalUrl(item.url)} style={styles.link}>
                        {formatExternalUrl(item.url)}
                    </Link>
                ) : null}
            </View>
            {item.technologies.length > 0 ? (
                <View style={styles.inlineMeta}>
                    <Text style={styles.subtitle}>
                        {item.technologies.map((tech) => sanitizeText(tech)).filter(Boolean).join(' • ')}
                    </Text>
                </View>
            ) : null}
            {item.description ? <Text style={styles.description}>{sanitizeText(item.description)}</Text> : null}
        </View>
    );

    const renderSkillsSection = (items: SkillItem[]) => {
        const toCompactSkillsText = (skillItems: SkillItem[]) =>
            skillItems.map((item) => sanitizeText(item.name)).filter(Boolean).join(', ');

        const section = data.sections.find((entry) => entry.type === 'skills' && entry.items === items);
        if (section && sectionHasSkillCategories(section)) {
            const grouped = groupSkillItemsByCategory(section);
            return (
                <View style={styles.skillCompactList}>
                    {Object.entries(grouped).map(([category, groupedItems]) => (
                        <View key={category} style={styles.skillCompactRow}>
                            <Text style={styles.skillCompactLabel}>{sanitizeText(category)}</Text>
                            <Text style={styles.skillCompactValue}>{toCompactSkillsText(groupedItems)}</Text>
                        </View>
                    ))}
                </View>
            );
        }

        return (
            <View style={styles.skillCompactList}>
                <View style={styles.skillCompactRow}>
                    <Text style={styles.skillCompactLabel}>Skills</Text>
                    <Text style={styles.skillCompactValue}>{toCompactSkillsText(items)}</Text>
                </View>
            </View>
        );
    };

    const renderLanguages = (items: LanguageItem[]) => (
        <View style={styles.grid}>
            {items.map((item) => (
                <View key={item.id} style={styles.gridItemHalf}>
                    <Text style={styles.tagText}>
                        {sanitizeText(item.name)}
                        {item.proficiency ? ` - ${sanitizeText(item.proficiency)}` : ''}
                    </Text>
                </View>
            ))}
        </View>
    );

    const renderCertifications = (items: CertificationItem[]) => (
        <View style={styles.grid}>
            {items.map((item) => (
                <View key={item.id} style={styles.gridItemHalf}>
                    <Text style={styles.tagText}>
                        {sanitizeText(item.name)}
                        {item.issuer ? ` - ${sanitizeText(item.issuer)}` : ''}
                        {item.date ? ` (${sanitizeText(item.date)})` : ''}
                    </Text>
                </View>
            ))}
        </View>
    );

    const renderDefaultItem = (item: SectionItem) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.title}>
                    {'title' in item && item.title
                        ? sanitizeText(item.title)
                        : 'name' in item && item.name
                            ? sanitizeText(item.name)
                            : ''}
                </Text>
                {'date' in item && item.date ? <Text style={styles.date}>{sanitizeText(item.date)}</Text> : null}
            </View>
            {'subtitle' in item && item.subtitle ? <Text style={styles.subtitle}>{sanitizeText(item.subtitle)}</Text> : null}
            {'description' in item && item.description ? <Text style={styles.description}>{sanitizeText(item.description)}</Text> : null}
        </View>
    );

    const renderSectionContent = (type: string, items: SectionItem[]) => {
        switch (type) {
            case 'experience':
                return items.map((item) => renderExperience(asExperienceItem(item)));
            case 'education':
                return items.map((item) => renderEducation(asEducationItem(item)));
            case 'projects':
                return items.map((item) => renderProjects(asProjectItem(item)));
            case 'skills':
                return renderSkillsSection(items as SkillItem[]);
            case 'languages':
                return renderLanguages(items as LanguageItem[]);
            case 'certifications':
                return renderCertifications(items as CertificationItem[]);
            default:
                return items.map((item) => renderDefaultItem(item));
        }
    };

    return (
        <Page size="A4" style={styles.page}>
            {renderHeader()}

            {data.profile.summary ? (
                <View style={styles.section}>
                    <View style={styles.sectionTitleWrapper}>
                        <Text style={styles.sectionTitle}>{atsMode ? 'SUMMARY' : 'Summary'}</Text>
                    </View>
                    <Text style={styles.summary}>{sanitizeText(data.profile.summary)}</Text>
                </View>
            ) : null}

            {data.sections.filter((section) => section.isVisible).map((section) => (
                <View key={section.id} style={styles.section}>
                    <View style={styles.sectionTitleWrapper}>
                        <Text style={styles.sectionTitle}>
                            {atsMode ? getAtsSectionTitle(section.type, section.title) : sanitizeText(section.title)}
                        </Text>
                    </View>
                    {section.items.length > 0
                        ? renderSectionContent(section.type, section.items)
                        : <Text style={styles.emptyText}>No items added yet.</Text>}
                </View>
            ))}
        </Page>
    );
};
