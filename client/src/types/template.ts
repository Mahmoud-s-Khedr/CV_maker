export interface TemplateConfig {
    id: string;
    layout: 'sidebar-left' | 'sidebar-right' | 'single-column';

    // Global Styles
    theme: {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        textColor: string;
        fontFamily: string;
        fontSize: number;
        lineHeight: number;
        margins: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
    };

    // Section Configuration
    sections: {
        // Map section types (e.g., 'experience', 'education') to specific styles/layouts
        [key: string]: {
            titleStyle: TextStyle;
            itemStyle: {
                title: TextStyle;
                subtitle: TextStyle;
                date: TextStyle;
                description: TextStyle;
                marginBottom: number;
            };
            layout: 'list' | 'grid' | 'chips'; // chips for skills
            columns?: number;
        };
    };

    // Sidebar Specifics (if applicable)
    sidebar?: {
        width: string; // e.g., "30%"
        backgroundColor: string;
        textColor: string;
        order: string[]; // Section IDs to show in sidebar
    };

    // Header Specifics
    header: {
        layout: 'centered' | 'left' | 'right';
        name: TextStyle;
        title: TextStyle;
        showPhoto: boolean;
        photoStyle?: {
            shape: 'circle' | 'square' | 'rounded';
            size: number;
            border?: boolean;
        };
    };
}

export interface TextStyle {
    fontSize: number;
    fontWeight: 'normal' | 'bold' | 'medium' | 'light';
    color?: string; // If undefined, use theme text color
    textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    letterSpacing?: number;
    marginBottom?: number;
    fontStyle?: 'normal' | 'italic';
}
