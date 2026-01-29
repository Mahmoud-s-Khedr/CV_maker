/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    sidebar: {
        width: '32%',
        backgroundColor: '#0f172a', // Slate 900
        color: 'white',
        padding: 25,
        flexDirection: 'column',
    },
    main: {
        width: '68%',
        padding: 35,
        paddingTop: 45,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#f8fafc',
        lineHeight: 1.2,
    },
    jobTitle: {
        fontSize: 11,
        color: '#94a3b8', // blue-gray
        marginBottom: 30,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    sidebarSection: {
        marginBottom: 28,
    },
    sidebarTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        paddingBottom: 6,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    contactItem: {
        fontSize: 8.5,
        color: '#cbd5e1',
        marginBottom: 8,
        lineHeight: 1.4,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a',
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6', // blue-500
        paddingBottom: 5,
        marginBottom: 15,
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
        fontSize: 12,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 10.5,
        color: '#475569',
        marginBottom: 4,
        fontWeight: 'medium',
    },
    date: {
        fontSize: 9,
        color: '#64748b',
    },
    description: {
        marginTop: 4,
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.6,
        textAlign: 'justify',
    },
    descriptionDark: {
        marginTop: 4,
        fontSize: 9,
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
        fontSize: 9,
    }
});

interface TemplateProps {
    data: ResumeSchema;
}

export const CreativeTemplate: React.FC<TemplateProps> = ({ data }) => {
    // Helper to divide sections between Sidebar and Main
    // Typically: Contact, Skills, Languages, Summary -> Sidebar
    // Experience, Education, Projects -> Main
    // This is hardcoded for the template style, but dynamic for content

    const renderExperience = (item: any) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.position}</Text>
                <Text style={styles.date}>
                    {item.startDate} {item.endDate ? `- ${item.endDate}` : '- Present'}
                </Text>
            </View>
            <Text style={styles.subtitle}>{item.company}</Text>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderEducation = (item: any) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={styles.row}>
                <Text style={styles.bold}>{item.institution}</Text>
                <Text style={styles.date}>{item.startDate}</Text>
            </View>
            <Text style={styles.subtitle}>{item.degree} {item.field ? `in ${item.field}` : ''}</Text>
        </View>
    );

    const renderMainItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(item);
            case 'education': return renderEducation(item);
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
            {/* SIDEBAR */}
            <View style={styles.sidebar}>
                <Text style={styles.name}>{data.profile.fullName}</Text>
                {data.profile.jobTitle && <Text style={styles.jobTitle}>{data.profile.jobTitle}</Text>}

                {/* Contact */}
                <View style={styles.sidebarSection}>
                    <Text style={styles.sidebarTitle}>Contact</Text>
                    {data.profile.email && <Text style={styles.contactItem}>{data.profile.email}</Text>}
                    {data.profile.phone && <Text style={styles.contactItem}>{data.profile.phone}</Text>}
                    {data.profile.location && <Text style={styles.contactItem}>{data.profile.location}</Text>}
                    {data.profile.url && <Text style={styles.contactItem}>{data.profile.url.replace(/^https?:\/\//, '')}</Text>}
                </View>

                {/* Summary (if short) or Skills */}
                {data.profile.summary && (
                    <View style={styles.sidebarSection}>
                        <Text style={styles.sidebarTitle}>About Me</Text>
                        <Text style={styles.descriptionDark}>{data.profile.summary}</Text>
                    </View>
                )}

                {/* Render Skills in Sidebar */}
                {data.sections.filter(s => s.type === 'skills' && s.isVisible).map(section => (
                    <View key={section.id} style={styles.sidebarSection}>
                        <Text style={styles.sidebarTitle}>{section.title}</Text>
                        {section.items.map((item: any) => (
                            <View key={item.id} style={styles.skillBadge}>
                                <View style={styles.skillBullet} />
                                <Text style={styles.skillText}>{item.name}</Text>
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            {/* MAIN CONTENT */}
            <View style={styles.main}>
                {/* Render Experience, Education, and custom sections here */}
                {data.sections.filter(s => s.type !== 'skills' && s.isVisible).map(section => (
                    <View key={section.id} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {section.items.map(item => renderMainItem(section.type, item))}
                    </View>
                ))}
            </View>
        </Page>
    );
};
