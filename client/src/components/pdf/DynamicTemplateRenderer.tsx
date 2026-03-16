import React from 'react';
import { Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { ResumeSchema, ResumeSection, SectionItem } from '../../types/resume';
import type { TemplateConfig, TextStyle } from '../../types/template';
import {
    formatExternalUrl,
    getSectionItemDate,
    getSectionItemDescription,
    getSectionItemSubtitle,
    getSectionItemTitle,
    normalizeExternalUrl,
    sanitizeText,
} from './templateUtils';
import { ATS_FONTS, getAtsSectionTitle } from './atsConstants';
import { PDF_COLUMN_WIDTHS, PDF_SPACING, buildPadding, getGridColumnWidth, parsePercentageWidth } from './layoutTokens';

type SectionConfig = TemplateConfig['sections'][string];

const getTextStyle = (
    style: TextStyle,
    theme: TemplateConfig['theme'],
    fallbackColor?: string
) => {
    const resolvedFontSize = style.fontSize || theme.fontSize;

    return {
        fontSize: resolvedFontSize,
        fontFamily: theme.fontFamily,
        fontWeight: style.fontWeight === 'bold' || style.fontWeight === 'medium' ? 'bold' : 'normal',
        color: style.color || fallbackColor || theme.textColor,
        textTransform: style.textTransform,
        letterSpacing: style.letterSpacing,
        marginBottom: style.marginBottom,
        fontStyle: style.fontStyle,
        lineHeight: resolvedFontSize * theme.lineHeight,
    };
};

function applyAtsModeOverrides(config: TemplateConfig): TemplateConfig {
    return {
        ...config,
        layout: 'single-column',
        theme: {
            ...config.theme,
            fontFamily: ATS_FONTS.primary,
            textColor: '#000000',
        },
        sidebar: undefined,
        sections: Object.fromEntries(
            Object.entries(config.sections ?? {}).map(([key, value]) => [
                key,
                {
                    ...value,
                    titleStyle: {
                        ...value.titleStyle,
                        color: '#000000',
                    },
                    itemStyle: {
                        ...value.itemStyle,
                        title: {
                            ...value.itemStyle.title,
                            color: '#000000',
                        },
                        subtitle: {
                            ...value.itemStyle.subtitle,
                            color: '#333333',
                        },
                        date: {
                            ...value.itemStyle.date,
                            color: '#555555',
                        },
                        description: {
                            ...value.itemStyle.description,
                            color: '#111111',
                        },
                    },
                },
            ])
        ),
    };
}

interface RendererProps {
    data: ResumeSchema;
    config: TemplateConfig;
    atsMode?: boolean;
}

const buildChipLabel = (item: SectionItem): string => {
    const title = getSectionItemTitle(item);
    const subtitle = getSectionItemSubtitle(item);

    if ('level' in item && item.level) {
        return `${title} (${item.level})`;
    }

    if ('proficiency' in item && item.proficiency) {
        return `${title} (${item.proficiency})`;
    }

    return [title, subtitle].filter(Boolean).join(' - ');
};

export const DynamicTemplateRenderer: React.FC<RendererProps> = ({ data, config, atsMode = false }) => {
    const activeConfig = atsMode ? applyAtsModeOverrides(config) : config;
    const sidebarWidth = parsePercentageWidth(activeConfig.sidebar?.width, 30);
    const mainWidth = 100 - sidebarWidth;
    const isSidebarLayout = activeConfig.layout !== 'single-column';
    const sectionSpacing = Math.max(PDF_SPACING.sectionCompact, activeConfig.theme.fontSize * activeConfig.theme.lineHeight + 2);
    const itemSpacing = Math.max(PDF_SPACING.itemCompact, activeConfig.theme.fontSize * 0.8);
    const headerSpacing = Math.max(PDF_SPACING.headerCompact, activeConfig.theme.fontSize * 1.5);
    const summarySpacing = Math.max(PDF_SPACING.sectionCompact, sectionSpacing - 4);
    const headerAlignment =
        activeConfig.header.layout === 'centered'
            ? 'center'
            : activeConfig.header.layout === 'right'
                ? 'right'
                : 'left';
    const headerJustifyContent =
        activeConfig.header.layout === 'centered'
            ? 'center'
            : activeConfig.header.layout === 'right'
                ? 'flex-end'
                : 'flex-start';
    const sidebarTextColor = activeConfig.sidebar?.textColor || activeConfig.theme.textColor;

    const resolveSectionConfig = (sectionType: string): SectionConfig => {
        return activeConfig.sections[sectionType]
            || activeConfig.sections.default
            || activeConfig.sections.experience;
    };

    const styles = StyleSheet.create({
        page: {
            flexDirection: 'column',
            backgroundColor: activeConfig.theme.backgroundColor,
            ...buildPadding(
                activeConfig.theme.margins.top,
                activeConfig.theme.margins.right,
                activeConfig.theme.margins.bottom,
                activeConfig.theme.margins.left
            ),
        },
        body: {
            flexDirection: activeConfig.layout === 'sidebar-right' ? 'row-reverse' : 'row',
            flex: 1,
        },
        sidebar: {
            width: `${sidebarWidth}%`,
            backgroundColor: activeConfig.sidebar?.backgroundColor || '#f0f0f0',
            ...buildPadding(PDF_SPACING.inlineStandard),
        },
        main: {
            width: isSidebarLayout ? `${mainWidth}%` : PDF_COLUMN_WIDTHS.full,
            ...buildPadding(PDF_SPACING.inlineStandard),
        },
        header: {
            marginBottom: headerSpacing,
            textAlign: headerAlignment,
        },
        headerName: getTextStyle(activeConfig.header.name, activeConfig.theme),
        headerTitle: getTextStyle(activeConfig.header.title, activeConfig.theme),
        contactRow: {
            flexDirection: 'row',
            justifyContent: headerJustifyContent,
            flexWrap: 'wrap',
        },
        contactText: {
            fontSize: activeConfig.theme.fontSize,
            color: activeConfig.theme.textColor,
            lineHeight: activeConfig.theme.fontSize * activeConfig.theme.lineHeight,
        },
        contactLink: {
            fontSize: activeConfig.theme.fontSize,
            color: activeConfig.theme.primaryColor,
            textDecoration: 'none',
            lineHeight: activeConfig.theme.fontSize * activeConfig.theme.lineHeight,
        },
        contactSeparator: {
            fontSize: activeConfig.theme.fontSize,
            color: activeConfig.theme.textColor,
        },
    });

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
                <Link
                    key="url"
                    src={normalizeExternalUrl(data.profile.url)}
                    style={styles.contactLink}
                >
                    {formatExternalUrl(data.profile.url)}
                </Link>
            );
        }
        (data.profile.links ?? []).forEach((link) => {
            contactItems.push(
                <Link
                    key={link.id}
                    src={normalizeExternalUrl(link.url)}
                    style={styles.contactLink}
                >
                    {`${sanitizeText(link.label)}: ${formatExternalUrl(link.url)}`}
                </Link>
            );
        });

        return (
            <View style={styles.header}>
                <Text style={styles.headerName}>{sanitizeText(data.profile.fullName)}</Text>
                {data.profile.jobTitle ? <Text style={styles.headerTitle}>{sanitizeText(data.profile.jobTitle)}</Text> : null}
                {contactItems.length > 0 ? (
                    <View style={styles.contactRow}>
                        {contactItems.map((item, index) => (
                            <React.Fragment key={`contact-${index}`}>
                                {index > 0 && <Text style={styles.contactSeparator}>{' | '}</Text>}
                                {item}
                            </React.Fragment>
                        ))}
                    </View>
                ) : null}
            </View>
        );
    };

    const renderSectionItems = (section: ResumeSection, sectionConfig: SectionConfig, inSidebar: boolean) => {
        const titleStyle = getTextStyle(sectionConfig.itemStyle.title, activeConfig.theme, inSidebar ? sidebarTextColor : undefined);
        const subtitleStyle = getTextStyle(sectionConfig.itemStyle.subtitle, activeConfig.theme, inSidebar ? sidebarTextColor : undefined);
        const dateStyle = getTextStyle(sectionConfig.itemStyle.date, activeConfig.theme, inSidebar ? sidebarTextColor : undefined);
        const descStyle = getTextStyle(sectionConfig.itemStyle.description, activeConfig.theme, inSidebar ? sidebarTextColor : undefined);
        const gridWidth = getGridColumnWidth(sectionConfig.columns || 2);

        if (sectionConfig.layout === 'chips') {
            return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: itemSpacing / 2 }}>
                    {section.items.map((item) => (
                        <View
                            key={item.id}
                            style={{
                                borderWidth: 0.5,
                                borderColor: sectionConfig.titleStyle.color || activeConfig.theme.primaryColor,
                                borderRadius: 999,
                                marginRight: itemSpacing,
                                marginBottom: itemSpacing,
                                ...buildPadding(3, 8),
                            }}
                        >
                            <Text style={titleStyle}>{buildChipLabel(item)}</Text>
                        </View>
                    ))}
                </View>
            );
        }

        const content = section.items.map((item: SectionItem) => {
            const title = getSectionItemTitle(item);
            const subtitle = getSectionItemSubtitle(item);
            const date = getSectionItemDate(item);
            const description = getSectionItemDescription(item);

            return (
                <View
                    key={item.id}
                    style={{
                        marginBottom: sectionConfig.itemStyle.marginBottom || itemSpacing,
                        width: sectionConfig.layout === 'grid' ? gridWidth : PDF_COLUMN_WIDTHS.full,
                        paddingRight: sectionConfig.layout === 'grid' ? itemSpacing : 0,
                    }}
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={titleStyle}>{title}</Text>
                        {date ? <Text style={dateStyle}>{date}</Text> : null}
                    </View>
                    {subtitle ? <Text style={subtitleStyle}>{subtitle}</Text> : null}
                    {description ? <Text style={descStyle}>{description}</Text> : null}
                </View>
            );
        });

        if (sectionConfig.layout === 'grid') {
            return <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{content}</View>;
        }

        return <View>{content}</View>;
    };

    const renderSection = (section: ResumeSection, inSidebar: boolean = false) => {
        const sectionConfig = resolveSectionConfig(section.type);
        const titleStyle = getTextStyle(sectionConfig.titleStyle, activeConfig.theme, inSidebar ? sidebarTextColor : undefined);

        return (
            <View key={section.id} style={{ marginBottom: sectionSpacing }}>
                <Text style={titleStyle}>
                    {atsMode ? getAtsSectionTitle(section.type, section.title) : sanitizeText(section.title)}
                </Text>
                {renderSectionItems(section, sectionConfig, inSidebar)}
            </View>
        );
    };

    const defaultSectionConfig = resolveSectionConfig('default');
    const summaryTitleStyle = getTextStyle(defaultSectionConfig.titleStyle, activeConfig.theme);
    const summaryBodyStyle = getTextStyle(defaultSectionConfig.itemStyle.description, activeConfig.theme);

    const sidebarSectionIds = activeConfig.sidebar?.order || [];
    const visibleSections = data.sections.filter((section) => section.isVisible);
    const sidebarSections = visibleSections.filter((section) => sidebarSectionIds.includes(section.type));
    const mainSections = visibleSections.filter((section) => !sidebarSectionIds.includes(section.type));

    return (
        <Page size="A4" style={styles.page}>
            {renderHeader()}

            {isSidebarLayout ? (
                <View style={styles.body}>
                    <View style={styles.sidebar}>
                        {sidebarSections.map((section) => renderSection(section, true))}
                    </View>
                    <View style={styles.main}>
                        {data.profile.summary ? (
                            <View style={{ marginBottom: summarySpacing }}>
                                <Text style={summaryTitleStyle}>{atsMode ? 'SUMMARY' : 'Summary'}</Text>
                                <Text style={summaryBodyStyle}>{sanitizeText(data.profile.summary)}</Text>
                            </View>
                        ) : null}
                        {mainSections.map((section) => renderSection(section))}
                    </View>
                </View>
            ) : (
                <View style={styles.main}>
                    {data.profile.summary ? (
                        <View style={{ marginBottom: summarySpacing }}>
                            <Text style={summaryTitleStyle}>{atsMode ? 'SUMMARY' : 'Summary'}</Text>
                            <Text style={summaryBodyStyle}>{sanitizeText(data.profile.summary)}</Text>
                        </View>
                    ) : null}
                    {mainSections.map((section) => renderSection(section))}
                </View>
            )}
        </Page>
    );
};
