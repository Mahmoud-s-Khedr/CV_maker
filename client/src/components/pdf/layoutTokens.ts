export const PDF_COLUMN_WIDTHS = {
    full: '100%',
    oneThird: '33.333%',
    half: '50%',
    sidebarStandard: '32%',
    mainStandard: '68%',
    sidebarCompact: '31%',
    mainCompact: '69%',
} as const;

export const PDF_SPACING = {
    pageTight: 24,
    pageNarrow: 28,
    pageStandard: 40,
    pageWide: 50,
    headerTight: 6,
    headerCompact: 10,
    headerStandard: 24,
    headerWide: 30,
    sectionTight: 6,
    sectionCompact: 8,
    sectionStandard: 16,
    sectionWide: 25,
    itemTight: 4,
    itemCompact: 6,
    itemStandard: 10,
    itemWide: 15,
    inlineCompact: 6,
    inlineStandard: 10,
    inlineWide: 12,
} as const;

export const buildPadding = (
    top: number,
    right: number = top,
    bottom: number = top,
    left: number = right
) => ({
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left,
});

export const getGridColumnWidth = (columns: number = 1): string => {
    const normalizedColumns = Math.min(4, Math.max(1, Math.floor(columns)));
    return `${(100 / normalizedColumns).toFixed(3)}%`;
};

export const parsePercentageWidth = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseFloat(value ?? '');
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 100) {
        return fallback;
    }

    return parsed;
};
