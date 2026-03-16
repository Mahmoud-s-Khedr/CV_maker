import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';
import { asEducationItem, asExperienceItem, formatDateRange, formatExternalUrl, normalizeExternalUrl } from '../templateUtils';
import { getAtsSectionTitle } from '../atsConstants';
import { PDF_COLUMN_WIDTHS, buildPadding } from '../layoutTokens';

const FONT_SCALE_MAP = { small: 0.85, medium: 1.0, large: 1.1, xlarge: 1.2 } as const;

const makeStyles = (sc: number) => StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        ...buildPadding(45, 45),
        fontSize: 10 * sc,
        fontFamily: 'Times-Roman',
        lineHeight: 1.6,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
        paddingBottom: 20,
    },
    name: {
        fontSize: 30 * sc,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        color: '#000',
        letterSpacing: 2,
    },
    jobTitle: {
        fontSize: 13 * sc,
        color: '#4b5563',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
    contact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        fontSize: 9.5 * sc,
        color: '#374151',
        borderTopWidth: 0.5,
        borderTopColor: '#9ca3af',
        paddingTop: 10,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitleWrapper: {
        marginBottom: 15,
        paddingBottom: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    sectionTitleText: {
        fontSize: 11 * sc,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        textAlign: 'center',
        letterSpacing: 2.5,
    },
    itemWrapper: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 11.5 * sc,
        color: '#000',
    },
    subtitle: {
        fontSize: 10.5 * sc,
        color: '#1f2937',
        fontStyle: 'italic',
    },
    date: {
        fontSize: 10 * sc,
        color: '#4b5563',
        textAlign: 'right',
    },
    description: {
        marginTop: 5,
        fontSize: 10 * sc,
        color: '#111827',
        lineHeight: 1.6,
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

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data, atsMode = false }) => {
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
                style={[styles.link, { fontSize: 9.5 * sc, color: '#374151' }]}
            >
                {formatExternalUrl(data.profile.url)}
            </Link>
        );
    }
    (data.profile.links ?? []).forEach(l => {
        contactItems.push(
            <Link key={l.id} src={normalizeExternalUrl(l.url)} style={[styles.link, { fontSize: 9.5 * sc, color: '#374151' }]}>
                {`${l.label}: ${formatExternalUrl(l.url)}`}
            </Link>
        );
    });

    const renderExperience = (item: ReturnType<typeof asExperienceItem>) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.company}</Text>
                <Text style={styles.date}>{formatDateRange(item.startDate, item.endDate, { fallbackToPresent: true })}</Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subtitle}>{item.position} {item.location ? ` | ${item.location}` : ''}</Text>
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
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(asExperienceItem(item));
            case 'education': return renderEducation(asEducationItem(item));
            case 'skills':
                return (
                    <View key={item.id} style={{ width: PDF_COLUMN_WIDTHS.oneThird, marginBottom: 6 }}>
                        <Text style={{ fontSize: 10 * sc }}>{atsMode ? '- ' : '• '}{'name' in item ? item.name : ''}</Text>
                    </View>
                );
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

    return (
        <Page size="A4" style={[styles.page, atsMode ? { fontFamily: 'Helvetica' } : {}]}>
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

            {data.profile.summary && (
                <View style={styles.section}>
                    <View style={styles.sectionTitleWrapper}>
                        <Text style={styles.sectionTitleText}>{atsMode ? 'Professional Summary' : 'Profile'}</Text>
                    </View>
                    <Text style={styles.description}>{data.profile.summary}</Text>
                </View>
            )}

            {data.sections.filter(s => s.isVisible).map((section, index) => (
                <View key={`${section.id}-${index}`} style={styles.section}>
                    <View style={styles.sectionTitleWrapper}>
                        <Text style={styles.sectionTitleText}>
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
