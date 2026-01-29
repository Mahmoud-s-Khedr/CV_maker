/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
    },
    sidebar: {
        width: '32%',
        backgroundColor: '#2d3748', // Slate-800
        padding: 24,
        color: 'white',
        height: '100%',
    },
    main: {
        width: '68%',
        padding: 24,
        paddingTop: 32,
    },
    headerName: {
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
        color: '#2b6cb0',
        letterSpacing: 2,
        lineHeight: 1.2,
    },
    headerTitle: {
        fontSize: 12,
        color: '#718096',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 20,
    },
    sidebarName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#fff',
        textAlign: 'center',
    },
    sidebarJob: {
        fontSize: 11,
        color: '#cbd5e0',
        textAlign: 'center',
        marginBottom: 24,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#2c5282',
        marginBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: '#2b6cb0',
        paddingBottom: 4,
        letterSpacing: 1,
    },
    sidebarSectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#63b3ed',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#4a5568',
        paddingBottom: 4,
        letterSpacing: 1,
        marginTop: 16,
    },
    itemWrapper: {
        marginBottom: 12,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 11,
        color: '#2d3748',
    },
    subtitle: {
        fontSize: 10,
        color: '#4a5568',
        marginBottom: 2,
        fontWeight: 'medium',
    },
    date: {
        fontSize: 9,
        color: '#718096',
        marginBottom: 4,
    },
    description: {
        fontSize: 10,
        color: '#4a5568',
        lineHeight: 1.5,
    },
    contactItem: {
        marginBottom: 8,
        fontSize: 9,
        color: '#e2e8f0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    skillItem: {
        marginBottom: 6,
    },
    skillName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    skillLevel: {
        fontSize: 9,
        color: '#cbd5e0',
    },
    link: {
        color: '#63b3ed',
        textDecoration: 'none',
    }
});

interface TemplateProps {
    data: ResumeSchema;
}

export const ModernTemplate: React.FC<TemplateProps> = ({ data }) => {

    // Helpers for sidebar items
    const renderContact = () => (
        <View>
            <Text style={styles.sidebarSectionTitle}>Contact</Text>
            {data.profile.email && <Text style={styles.contactItem}>{data.profile.email}</Text>}
            {data.profile.phone && <Text style={styles.contactItem}>{data.profile.phone}</Text>}
            {data.profile.location && <Text style={styles.contactItem}>{data.profile.location}</Text>}
            {data.profile.url && (
                <Link src={data.profile.url} style={[styles.contactItem, styles.link]}>
                    Portfolio/Web
                </Link>
            )}
        </View>
    );

    const renderSidebarSkills = (section: any) => {
        const hasCategories = section.items.some((item: any) => item.category);

        if (!hasCategories) {
            return (
                <View key={section.id}>
                    <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
                    {section.items.map((item: any) => (
                        <View key={item.id} style={styles.skillItem}>
                            <Text style={styles.skillName}>{item.name}</Text>
                            <Text style={styles.skillLevel}>{item.level}</Text>
                        </View>
                    ))}
                </View>
            );
        }

        const grouped = section.items.reduce((acc: any, item: any) => {
            const category = item.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
            return acc;
        }, {} as Record<string, SectionItem[]>);

        return (
            <View key={section.id}>
                <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
                {Object.entries(grouped).map(([category, items]: [string, any]) => (
                    <View key={category} style={{ marginBottom: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#a0aec0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {category}
                        </Text>
                        {items.map((item: any) => (
                            <View key={item.id} style={styles.skillItem}>
                                <Text style={styles.skillName}>{item.name}</Text>
                                <Text style={styles.skillLevel}>{item.level}</Text>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        );
    };

    const renderSidebarLanguages = (section: any) => (
        <View key={section.id}>
            <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
            {section.items.map((item: any) => (
                <View key={item.id} style={styles.skillItem}>
                    <Text style={styles.skillName}>{item.name}</Text>
                    <Text style={styles.skillLevel}>{item.proficiency}</Text>
                </View>
            ))}
        </View>
    );

    // Helpers for Main Content
    const renderExperience = (item: any) => (
        <View key={item.id} style={styles.itemWrapper}>
            <Text style={styles.bold}>{item.position}</Text>
            <Text style={styles.subtitle}>{item.company} | {item.location}</Text>
            <Text style={styles.date}>
                {item.startDate} - {item.endDate || 'Present'}
            </Text>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderEducation = (item: any) => (
        <View key={item.id} style={styles.itemWrapper}>
            <Text style={styles.bold}>{item.institution}</Text>
            <Text style={styles.subtitle}>{item.degree} {item.field ? `in ${item.field}` : ''}</Text>
            <Text style={styles.date}>
                {item.startDate} - {item.endDate} {item.gpa ? `| GPA: ${item.gpa}` : ''}
            </Text>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderProject = (item: any) => (
        <View key={item.id} style={styles.itemWrapper}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.bold}>{item.name}</Text>
                {item.url && <Link src={item.url} style={{ fontSize: 9, color: '#2b6cb0' }}>Link</Link>}
            </View>
            {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
    );

    const renderMainItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(item);
            case 'education': return renderEducation(item);
            case 'projects': return renderProject(item);
            case 'certifications':
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <Text style={styles.bold}>{(item as any).name}</Text>
                        <Text style={styles.subtitle}>{(item as any).issuer}</Text>
                        <Text style={styles.date}>{(item as any).date}</Text>
                    </View>
                );
            case 'custom':
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <Text style={styles.bold}>{(item as any).title}</Text>
                        <Text style={styles.subtitle}>{(item as any).subtitle}</Text>
                        <Text style={styles.date}>{(item as any).date}</Text>
                        {(item as any).description && <Text style={styles.description}>{(item as any).description}</Text>}
                    </View>
                );
        }
    };

    // Split sections into Sidebar vs Main
    const sidebarSections = data.sections.filter(s => s.isVisible && (s.type === 'skills' || s.type === 'languages'));
    const mainSections = data.sections.filter(s => s.isVisible && s.type !== 'skills' && s.type !== 'languages');

    return (
        <Page size="A4" style={styles.page}>
            {/* SIDEBAR */}
            <View style={styles.sidebar}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    {/* Initials circle could go here if we had image support set up */}
                </View>

                {renderContact()}

                {sidebarSections.map(section => {
                    if (section.type === 'skills') return renderSidebarSkills(section);
                    if (section.type === 'languages') return renderSidebarLanguages(section);
                    return null;
                })}
            </View>

            {/* MAIN CONTENT */}
            <View style={styles.main}>
                <View style={{ borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 20, marginBottom: 20 }}>
                    <Text style={styles.headerName}>{data.profile.fullName}</Text>
                    <Text style={styles.headerTitle}>{data.profile.jobTitle}</Text>
                    <Text style={styles.description}>{data.profile.summary}</Text>
                </View>

                {mainSections.map((section, index) => (
                    <View key={`${section.id}-${index}`} style={{ marginBottom: 20 }}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View>
                            {section.items.map(item => renderMainItem(section.type, item))}
                        </View>
                        {section.items.length === 0 && (
                            <Text style={{ color: '#cbd5e0', fontSize: 10, fontStyle: 'italic' }}>No items added yet.</Text>
                        )}
                    </View>
                ))}
            </View>
        </Page>
    );
};
