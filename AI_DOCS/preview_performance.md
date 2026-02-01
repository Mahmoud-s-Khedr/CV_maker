# Real-Time PDF Preview Implementation Strategy (Current Implementation)

Rendering a PDF document in the browser is computationally expensive. Attempting to regenerate a PDF on every keystroke will freeze the UI. The current implementation uses a **debounced data snapshot** + `@react-pdf/renderer`'s `usePDF()` to generate a Blob URL, then renders that Blob URL using `react-pdf` (pdf.js) for a fast viewer.

## 1. The Architecture: Editor State vs. PDF Snapshot

We do not pass the raw form state directly to the PDF engine. Instead, we insert a buffer layer.

```mermaid
graph LR
    Input[User Types] -->|Instant| Store[Zustand Store]
    Store -->|Reactive| FormUI[Editor UI]

    Store -->|Debounce ~500ms| Snapshot[debouncedResume]
    Snapshot -->|useMemo| PDFDoc[ResumeDocument]
    PDFDoc -->|usePDF()| Blob[Blob URL]
    Blob -->|react-pdf| Viewer[PDF Preview]
```

## 2. Solution Implementation

### Step A: The `useDebounce` Hook
A hook to delay value updates, implemented in `client/src/hooks/useDebounce.ts`.

```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Step B: The Split-Screen Component
The main orchestrator in `client/src/components/editor/ResumeEditor.tsx`:

```tsx
import React, { useEffect, useMemo } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { useDebounce } from '../../hooks/useDebounce';
import { useResumeStore } from '../../store/resume';
import { ResumeDocument } from '../pdf/ResumeDocument';

export const ResumeEditor = () => {
    const { resume, dynamicTemplateConfig } = useResumeStore();

    // Critical optimization: only update snapshot after user pauses typing
    const debouncedResume = useDebounce(resume, 500);

    const pdfDocument = useMemo(
        () => <ResumeDocument data={debouncedResume} dynamicConfig={dynamicTemplateConfig} />,
        [debouncedResume, dynamicTemplateConfig]
    );

    // Generate a Blob URL
    const [instance, updateInstance] = usePDF({ document: pdfDocument });

    // Ensure updates are triggered when the memoized document changes
    useEffect(() => {
        updateInstance(pdfDocument);
    }, [pdfDocument, updateInstance]);

    // instance.url is rendered by the PDF viewer component (react-pdf)
    return null;
};
```

### Step C: Dynamic Template Selection
The `ResumeDocument` component selects the renderer based on whether the template is a legacy hardcoded one or a dynamic configuration.

```tsx
// client/src/components/pdf/ResumeDocument.tsx
export const ResumeDocument = ({ data, dynamicConfig }) => {
  // If dynamicConfig is present, it takes priority
  // Otherwise it falls back to built-in templates (standard/modern/minimalist/etc.)
};
```

### Step D: Memoization + Stable Updates
The PDF document React tree is memoized (`useMemo`) and then fed into `usePDF()`. We also explicitly call `updateInstance()` when the memoized document changes to avoid stale renders.

```tsx
const pdfDocument = useMemo(
    () => <ResumeDocument data={debouncedResume} dynamicConfig={dynamicTemplateConfig} />,
    [debouncedResume, dynamicTemplateConfig]
);
```

## 3. Template Strategy (Hybrid)

| Type | Pros | Cons |
|------|------|------|
| **Legacy (Hardcoded)** | Easy to write initially | Requires code deploy to change |
| **Dynamic (JSON)** | Update via Admin Panel, DB-stored | Complex renderer logic |

## 4. State Management Integration

The Zustand store (`client/src/store/resume.ts`) provides:

```typescript
interface ResumeState {
    resume: ResumeSchema;
    updateProfile: (field: keyof Profile, value: string) => void;
    setSections: (sections: Section[]) => void;
    updateTemplate: (templateId: string) => void;
    
    // Backend sync
    backendId: string | null;
    isSaving: boolean;
    saveToBackend: () => Promise<void>;
    loadFromBackend: (id: string) => Promise<void>;
}
```

## 5. Performance Considerations

1. **~500ms Debounce:** Balances responsiveness with performance. Users see updates quickly but not on every keystroke.

2. **Immer Integration:** The store uses Immer for immutable updates, which pairs well with React.memo's shallow comparison.

3. **Selective Re-renders:** Only the preview pipeline re-runs on debounced changes; the editor remains instantly responsive.

4. **Backend Sync:** Save operations are separate from the debounce cycle (manual save button / explicit actions).
