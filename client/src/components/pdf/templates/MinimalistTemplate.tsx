/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 50,
        fontSize: 10,
        fontFamily: 'Times-Roman',
    },
    header: {
        marginBottom: 30,
        textAlign: 'center',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 2,
    },
    jobTitle: {
        fontSize: 11,
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1,
        color: '#444',
    },
    contact: {
        fontSize: 9,
        color: '#444',
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 12,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000',
        paddingBottom: 4,
        marginBottom: 10,
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
        fontSize: 10,
    },
    subtitle: {
        fontSize: 10,
        fontStyle: 'italic',
    },
    date: {
        fontSize: 9,
        color: '#444',
    },
    description: {
        marginTop: 2,
        fontSize: 10,
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    link: {
        color: '#000',
        textDecoration: 'none',
    }
});

interface TemplateProps {
    data: ResumeSchema;
}

export const MinimalistTemplate: React.FC<TemplateProps> = ({ data }) => {
    const renderExperience = (item: any) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.position}</Text>
                <Text style={styles.date}>
                    {item.startDate} {item.endDate ? `- ${item.endDate}` : '- Present'}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subtitle}>{item.company} {item.location ? `, ${item.location}` : ''}</Text>
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
        <View key={item.id} style={{ width: '33%', marginBottom: 4 }}>
            <Text style={{ fontSize: 10 }}>
                {item.name}
                {item.level && <Text style={{ color: '#666', fontSize: 9 }}> ({item.level})</Text>}
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
            case 'skills': return renderSkill(item);
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
                    <View key={item.id} style={{ width: '33%', marginBottom: 4 }}>
                        <Text style={{ fontSize: 10 }}>
                            {(item as any).name}
                            <Text style={{ color: '#666', fontSize: 9 }}> - {(item as any).proficiency}</Text>
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
                    {data.profile.phone && <Text>{data.profile.phone}</Text>}
                    {data.profile.location && <Text>{data.profile.location}</Text>}
                    {data.profile.url && <Link src={data.profile.url} style={styles.link}>{data.profile.url}</Link>}
                </View>
            </View>

            {/* SUMMARY */}
            {data.profile.summary && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <Text style={styles.description}>{data.profile.summary}</Text>
                </View>
            )}

            {/* DYNAMIC SECTIONS */}
            {data.sections
                .filter(s => s.isVisible)
                .map((section, index) => (
                    <View key={`${section.id}-${index}`} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>

                        {/* Grid layout for skills/languages in minimalist too */}
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
                                            <View key={category} style={{ marginBottom: 8 }}>
                                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#666', marginBottom: 4, textTransform: 'uppercase' }}>
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
