/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ResumeSchema } from '../../types/resume';
import type { TemplateConfig, TextStyle } from '../../types/template';

// Helper to convert TextStyle to react-pdf StyleSheet object
const getTextStyle = (style: TextStyle, theme: TemplateConfig['theme']) => {
    return {
        fontSize: style.fontSize || theme.fontSize,
        fontFamily: theme.fontFamily, // Currently global font, specific font support can be added
        fontWeight: style.fontWeight === 'medium' ? 'bold' : style.fontWeight, // react-pdf minimal support
        color: style.color || theme.textColor,
        textTransform: style.textTransform,
        letterSpacing: style.letterSpacing,
        marginBottom: style.marginBottom,
        fontStyle: style.fontStyle,
    };
};

interface RendererProps {
    data: ResumeSchema;
    config: TemplateConfig;
}

export const DynamicTemplateRenderer: React.FC<RendererProps> = ({ data, config }) => {

    // Dynamic Styles Generation
    const styles = StyleSheet.create({
        page: {
            flexDirection: config.layout === 'sidebar-left' ? 'row' :
                config.layout === 'sidebar-right' ? 'row-reverse' : 'column',
            backgroundColor: config.theme.backgroundColor,
            paddingTop: config.theme.margins.top,
            paddingRight: config.theme.margins.right,
            paddingBottom: config.theme.margins.bottom,
            paddingLeft: config.theme.margins.left,
        },
        sidebar: {
            width: config.sidebar?.width || '30%',
            backgroundColor: config.sidebar?.backgroundColor || '#f0f0f0',
            color: config.sidebar?.textColor || '#000',
            padding: 10,
            height: '100%',
        },
        main: {
            width: config.layout === 'single-column' ? '100%' :
                (100 - parseInt(config.sidebar?.width || '30')) + '%',
            padding: 10,
        },
        // Header
        header: {
            marginBottom: 20,
            textAlign: config.header.layout === 'centered' ? 'center' :
                config.header.layout === 'right' ? 'right' : 'left',
        },
        headerName: getTextStyle(config.header.name, config.theme) as any,
        headerTitle: getTextStyle(config.header.title, config.theme) as any,
    });

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.headerName}>{data.profile.fullName}</Text>
            <Text style={styles.headerTitle}>{data.profile.jobTitle}</Text>
            <View style={{ flexDirection: 'row', justifyContent: styles.header.textAlign as any, gap: 10, flexWrap: 'wrap' }}>
                {data.profile.email && <Text style={{ fontSize: 10 }}>{data.profile.email}</Text>}
                {data.profile.phone && <Text style={{ fontSize: 10 }}>{data.profile.phone}</Text>}
                {data.profile.location && <Text style={{ fontSize: 10 }}>{data.profile.location}</Text>}
            </View>
        </View>
    );

    const renderSection = (section: any) => {
        const sectionConfig = config.sections[section.type] || config.sections.default || config.sections['experience']; // Fallback

        const titleStyle = getTextStyle(sectionConfig.titleStyle, config.theme);
        const itemTitleStyle = getTextStyle(sectionConfig.itemStyle.title, config.theme);
        const subtitleStyle = getTextStyle(sectionConfig.itemStyle.subtitle, config.theme);
        const dateStyle = getTextStyle(sectionConfig.itemStyle.date, config.theme);
        const descStyle = getTextStyle(sectionConfig.itemStyle.description, config.theme);

        return (
            <View key={section.id} style={{ marginBottom: 15 }}>
                <Text style={titleStyle as any}>{section.title}</Text>

                {section.items.map((item: any) => (
                    <View key={item.id} style={{ marginBottom: sectionConfig.itemStyle.marginBottom }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={itemTitleStyle as any}>{item.title || item.company || item.institution || item.name}</Text>
                            <Text style={dateStyle as any}>{item.date || item.startDate ? `${item.startDate} - ${item.endDate || 'Present'}` : ''}</Text>
                        </View>

                        {(item.subtitle || item.position || item.degree) && (
                            <Text style={subtitleStyle as any}>{item.subtitle || item.position || item.degree}</Text>
                        )}

                        {item.description && (
                            <Text style={descStyle as any}>{item.description}</Text>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    const sidebarSectionIds = config.sidebar?.order || [];
    const mainSections = data.sections.filter(s => s.isVisible && !sidebarSectionIds.includes(s.type));
    const sidebarSections = data.sections.filter(s => s.isVisible && sidebarSectionIds.includes(s.type));

    return (
        <Page size="A4" style={styles.page}>
            {/* If sidebar-left, it renders first due to flex-direction: row */}
            {config.layout !== 'single-column' && (
                <View style={styles.sidebar}>
                    {sidebarSections.map(renderSection)}
                </View>
            )}

            <View style={styles.main}>
                {renderHeader()}
                {/* Summary is special, often part of header or top of main */}
                {data.profile.summary && (
                    <View style={{ marginBottom: 15 }}>
                        <Text style={{ fontWeight: 'bold', borderBottom: `1px solid ${config.theme.primaryColor}`, marginBottom: 5 }}>SUMMARY</Text>
                        <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{data.profile.summary}</Text>
                    </View>
                )}
                {mainSections.map(renderSection)}
            </View>

            {/* If sidebar-right, it renders last visually because of flex */}
        </Page>
    );
};
