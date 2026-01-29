# Real-Time PDF Preview Implementation Strategy

Rendering a PDF document in the browser is computationally expensive. Attempting to render it on every keystroke will freeze the UI. To solve this, we implement a **"Dual-State with Debounce"** architecture.

## 1. The Architecture: Editor State vs. PDF State

We do not pass the raw form state directly to the PDF engine. Instead, we insert a buffer layer.

```mermaid
graph LR
    Input[User Types] --> |Instant| EditorState[Zustand Store]
    EditorState --> |Reactive| FormUI[UI Components]
    
    EditorState --> |Debounce 600ms| PDFState[Deferred State]
    PDFState --> |Trigger Render| PDFEngine[@react-pdf/renderer]
    PDFEngine --> |Async| Blob[PDF Blob URL]
    Blob --> |Update| Iframe[Preview Window]
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
import { useResumeStore } from '../../store/resume';
import { useDebounce } from '../../hooks/useDebounce';
import { PDFViewer } from '@react-pdf/renderer';
import { ResumeDocument } from '../pdf/ResumeDocument';

export const ResumeEditor = () => {
    const resumeData = useResumeStore((state) => state.resume);
    
    // The Critical Optimization:
    // This value only updates 600ms after the user STOPS typing.
    const debouncedResumeData = useDebounce(resumeData, 600);

    return (
        <div className="flex h-screen">
            {/* Left: Editor (Interactive, Instant) */}
            <div className="w-1/2 overflow-auto p-6">
                <EditorForm data={resumeData} />
            </div>

            {/* Right: Preview (Passive, Delayed) */}
            <div className="w-1/2 bg-gray-100 p-6">
                <PDFViewer className="w-full h-full" showToolbar={false}>
                    {/* The PDF engine only sees the 'stale' debounced data */}
                    <ResumeDocument data={debouncedResumeData} />
                </PDFViewer>
            </div>
        </div>
    );
};
```

### Step C: Template Selection
The `ResumeDocument` component routes to the appropriate template based on `meta.templateId`:

```tsx
// client/src/components/pdf/ResumeDocument.tsx
import { Document } from '@react-pdf/renderer';
import { ModernTemplate } from './templates/ModernTemplate';
import { MinimalistTemplate } from './templates/MinimalistTemplate';
import { StandardTemplate } from './templates/StandardTemplate';

const TEMPLATES = {
    modern: ModernTemplate,
    minimalist: MinimalistTemplate,
    standard: StandardTemplate,
};

export const ResumeDocument = ({ data }) => {
    const TemplateComponent = TEMPLATES[data.meta?.templateId] || ModernTemplate;
    
    return (
        <Document>
            <TemplateComponent data={data} />
        </Document>
    );
};
```

### Step D: Aggressive Memoization (`React.memo`)
Each template uses memoization to prevent re-rendering sections that haven't changed:

```tsx
// Example from ModernTemplate.tsx
const ExperienceSection = React.memo(({ items }) => {
    return (
        <View>
            {items.map(item => <ExperienceItem key={item.id} {...item} />)}
        </View>
    );
}, (prev, next) => {
    return JSON.stringify(prev.items) === JSON.stringify(next.items);
});
```

## 3. Available Templates

| Template | Style | Best For |
|----------|-------|----------|
| **Modern** | Clean with accent colors | Tech industry, startups |
| **Minimalist** | Ultra-clean, lots of whitespace | Design roles, senior positions |
| **Standard** | Traditional, formal | Corporate, government |

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

1. **600ms Debounce:** Balances responsiveness with performance. Users see updates quickly but not on every keystroke.

2. **Immer Integration:** The store uses Immer for immutable updates, which pairs well with React.memo's shallow comparison.

3. **Selective Re-renders:** Only the PDF preview re-renders on debounced changes; the editor remains instantly responsive.

4. **Backend Sync:** Save operations are separate from the debounce cycle, triggered explicitly rather than on every state change.
