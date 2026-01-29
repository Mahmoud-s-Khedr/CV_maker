/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 12,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 6,
        letterSpacing: 1,
        color: '#1a1a1a',
    },
    jobTitle: {
        fontSize: 14,
        color: '#444',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    contact: {
        fontSize: 9,
        color: '#555',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 4,
        letterSpacing: 1,
        color: '#1a1a1a',
    },
    itemWrapper: {
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 10,
        color: '#000',
    },
    subtitle: {
        fontSize: 9,
        color: '#333',
        fontStyle: 'italic',
    },
    date: {
        fontSize: 9,
        color: '#666',
        textAlign: 'right',
    },
    description: {
        marginTop: 2,
        fontSize: 9,
        color: '#333',
        lineHeight: 1.4,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    bullet: {
        width: 10,
        fontSize: 10,
        marginLeft: 4,
    },
    bulletText: {
        flex: 1,
        fontSize: 9,
    },
    tag: {
        backgroundColor: '#f3f4f6',
        padding: '2 6',
        borderRadius: 4,
        fontSize: 8,
        marginRight: 4,
        marginBottom: 4,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    link: {
        color: '#2563EB',
        textDecoration: 'none',
    }
});

interface TemplateProps {
    data: ResumeSchema;
}

export const StandardTemplate: React.FC<TemplateProps> = ({ data }) => {
    const renderExperience = (item: any) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.position}</Text>
                <Text style={styles.date}>
                    {item.startDate} {item.endDate ? `- ${item.endDate}` : '- Present'}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subtitle}>{item.company} {item.location ? ` | ${item.location}` : ''}</Text>
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderEducation = (item: any) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.institution}</Text>
                <Text style={styles.date}>
                    {item.startDate} {item.endDate ? `- ${item.endDate}` : ''}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subtitle}>{item.degree} {item.field ? `in ${item.field}` : ''}</Text>
                {item.gpa && <Text style={styles.date}>GPA: {item.gpa}</Text>}
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderSkill = (item: any) => (
        <View key={item.id} style={{ width: '50%', marginBottom: 4 }}>
            <Text style={{ fontSize: 9 }}>
                <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
                {item.level && <Text style={{ color: '#666' }}> - {item.level}</Text>}
            </Text>
        </View>
    );

    const renderProject = (item: any) => (
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
            case 'experience': return renderExperience(item);
            case 'education': return renderEducation(item);
            case 'projects': return renderProject(item);
            case 'skills': return renderSkill(item); // Handled separately for layout usually, but fallback here
            case 'certifications':
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>{(item as any).name}</Text>
                            <Text style={styles.date}>{(item as any).date}</Text>
                        </View>
                        <Text style={styles.subtitle}>{(item as any).issuer}</Text>
                    </View>
                );
            case 'languages':
                return (
                    <View key={item.id} style={{ width: '50%', marginBottom: 4 }}>
                        <Text style={{ fontSize: 9 }}>
                            <Text style={{ fontWeight: 'bold' }}>{(item as any).name}</Text>
                            <Text style={{ color: '#666' }}> - {(item as any).proficiency}</Text>
                        </Text>
                    </View>
                );
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>{(item as any).title}</Text>
                            <Text style={styles.date}>{(item as any).date}</Text>
                        </View>
                        {/*@ts-ignore*/}
                        {(item as any).subtitle && <Text style={styles.subtitle}>{(item as any).subtitle}</Text>}
                        {/*@ts-ignore*/}
                        {(item as any).description && <Text style={styles.description}>{(item as any).description}</Text>}
                    </View>
                );
        }
    };

    return (
        <Page size="A4" style={styles.page}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.name}>{data.profile.fullName}</Text>
                {data.profile.jobTitle && <Text style={styles.jobTitle}>{data.profile.jobTitle}</Text>}

                <View style={styles.contact}>
                    {data.profile.email && <Text>{data.profile.email}</Text>}
                    {data.profile.phone && <Text>• {data.profile.phone}</Text>}
                    {data.profile.location && <Text>• {data.profile.location}</Text>}
                    {data.profile.url && <Link src={data.profile.url} style={styles.link}>{data.profile.url}</Link>}
                </View>
            </View>

            {/* SUMMARY */}
            {data.profile.summary && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Summary</Text>
                    <Text style={styles.description}>{data.profile.summary}</Text>
                </View>
            )}

            {/* DYNAMIC SECTIONS */}
            {data.sections
                .filter(s => s.isVisible)
                .map((section, index) => (
                    <View key={`${section.id}-${index}`} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>

                        {section.type === 'skills' ? (
                            (() => {
                                const hasCategories = section.items.some((item: any) => item.category);
                                if (!hasCategories) {
                                    return (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            {section.items.map(item => renderItem(section.type, item))}
                                        </View>
                                    );
                                }
                                const grouped = section.items.reduce((acc, item: any) => {
                                    const category = item.category || 'Other';
                                    if (!acc[category]) acc[category] = [];
                                    acc[category].push(item);
                                    return acc;
                                }, {} as Record<string, SectionItem[]>);

                                return (
                                    <View>
                                        {Object.entries(grouped).map(([category, items]) => (
                                            <View key={category} style={{ marginBottom: 6 }}>
                                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#555', marginBottom: 2, textTransform: 'uppercase' }}>
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
                            <Text style={{ color: '#999', fontSize: 9, fontStyle: 'italic' }}>No items added yet.</Text>
                        )}
                    </View>
                ))}
        </Page>
    );
};
