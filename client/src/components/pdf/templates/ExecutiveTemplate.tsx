/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: '45 45', // More white space
        fontSize: 10,
        fontFamily: 'Times-Roman',
        lineHeight: 1.6, // More spacious
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
        paddingBottom: 20,
    },
    name: {
        fontSize: 30,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        color: '#000',
        letterSpacing: 2,
    },
    jobTitle: {
        fontSize: 13,
        color: '#4b5563', // slate-600
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
    contact: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20,
        fontSize: 9.5,
        color: '#374151',
        borderTopWidth: 0.5,
        borderTopColor: '#9ca3af',
        paddingTop: 10,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 3,
        marginBottom: 15,
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
        fontSize: 11.5,
        color: '#000',
    },
    subtitle: {
        fontSize: 10.5,
        color: '#1f2937',
        fontStyle: 'italic',
    },
    date: {
        fontSize: 10,
        color: '#4b5563',
        textAlign: 'right',
    },
    description: {
        marginTop: 5,
        fontSize: 10,
        color: '#111827',
        lineHeight: 1.6,
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

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data }) => {
    // Helper to format URL
    const formatUrl = (url?: string) => {
        if (!url) return '';
        return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    };

    const renderExperience = (item: any) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.company}</Text>
                <Text style={styles.date}>
                    {item.startDate} {item.endDate ? `- ${item.endDate}` : '- Present'}
                </Text>
            </View>
            <View style={styles.row}>
                <Text style={styles.subtitle}>{item.position} {item.location ? ` | ${item.location}` : ''}</Text>
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
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(item);
            case 'education': return renderEducation(item);
            case 'skills':
                return (
                    <View key={item.id} style={{ width: '33%', marginBottom: 6 }}>
                        <Text style={{ fontSize: 10 }}>• {(item as any).name}</Text>
                    </View>
                );
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <Text style={styles.bold}>{(item as any).title || (item as any).name}</Text>
                        {/*@ts-ignore*/}
                        {(item as any).description && <Text style={styles.description}>{(item as any).description}</Text>}
                    </View>
                );
        }
    };

    return (
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.name}>{data.profile.fullName}</Text>
                {data.profile.jobTitle && <Text style={styles.jobTitle}>{data.profile.jobTitle}</Text>}

                <View style={styles.contact}>
                    {data.profile.email && <Text>{data.profile.email}</Text>}
                    {data.profile.phone && <Text>• {data.profile.phone}</Text>}
                    {data.profile.location && <Text>• {data.profile.location}</Text>}
                    {data.profile.url && <Text>• {formatUrl(data.profile.url)}</Text>}
                </View>
            </View>

            {data.profile.summary && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile</Text>
                    <Text style={styles.description}>{data.profile.summary}</Text>
                </View>
            )}

            {data.sections.filter(s => s.isVisible).map((section, index) => (
                <View key={`${section.id}-${index}`} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
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
