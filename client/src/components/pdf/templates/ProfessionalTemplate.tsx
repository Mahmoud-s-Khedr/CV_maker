import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, SectionItem } from '../../../types/resume';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        lineHeight: 1.6,
    },
    header: {
        marginBottom: 25,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1e3a8a', // sophisticated navy
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    jobTitle: {
        fontSize: 13,
        color: '#64748b', // slate
        marginBottom: 12,
        fontWeight: 'medium',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    contactRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginTop: 4,
    },
    contact: {
        fontSize: 9,
        color: '#475569',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#cbd5e1',
        paddingBottom: 4,
    },
    itemWrapper: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 2,
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 11,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 10,
        color: '#475569',
        fontStyle: 'italic',
    },
    date: {
        fontSize: 9,
        color: '#64748b',
        textAlign: 'right',
    },
    description: {
        marginTop: 4,
        fontSize: 9.5,
        color: '#334155',
        lineHeight: 1.5,
        textAlign: 'justify',
    },
    link: {
        color: '#2563EB',
        textDecoration: 'none',
    },
    skillBadge: {
        backgroundColor: '#f8fafc',
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginRight: 6,
        marginBottom: 6,
    },
    skillText: {
        fontSize: 9,
        color: '#1e40af',
        fontWeight: 'medium',
    }
});

interface TemplateProps {
    data: ResumeSchema;
}

export const ProfessionalTemplate: React.FC<TemplateProps> = ({ data }) => {
    // Helper to format URL
    const formatUrl = (url?: string) => {
        if (!url) return '';
        return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    };

    // Helper render functions
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

    const renderItem = (type: string, item: SectionItem) => {
        switch (type) {
            case 'experience': return renderExperience(item);
            case 'education': return renderEducation(item);
            case 'skills':
                return (
                    <View key={item.id} style={styles.skillBadge}>
                        <Text style={styles.skillText}>
                            {(item as any).name}
                            {(item as any).level && ` • ${(item as any).level}`}
                        </Text>
                    </View>
                );
            case 'languages':
                return (
                    <View key={item.id} style={{ width: '50%', marginBottom: 4 }}>
                        <Text style={{ fontSize: 9.5 }}>
                            <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{(item as any).name}</Text>
                            <Text style={{ color: '#64748b' }}> - {(item as any).proficiency}</Text>
                        </Text>
                    </View>
                );
            default:
                return (
                    <View key={item.id} style={styles.itemWrapper}>
                        <View style={styles.row}>
                            <Text style={styles.bold}>{(item as any).title || (item as any).name}</Text>
                        </View>
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

                <View style={styles.contactRow}>
                    {data.profile.email && <Text style={styles.contact}>{data.profile.email}</Text>}
                    {data.profile.phone && <Text style={styles.contact}>{data.profile.phone}</Text>}
                    {data.profile.location && <Text style={styles.contact}>{data.profile.location}</Text>}
                    {data.profile.url && (
                        <Link src={data.profile.url} style={[styles.contact, styles.link]}>
                            {formatUrl(data.profile.url)}
                        </Link>
                    )}
                </View>
            </View>

            {/* SUMMARY */}
            {data.profile.summary && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <Text style={styles.description}>{data.profile.summary}</Text>
                </View>
            )}

            {/* SECTIONS */}
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
