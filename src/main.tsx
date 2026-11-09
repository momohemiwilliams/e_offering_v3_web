import '@/assets/css/app.css';

import { createRoot } from 'react-dom/client';
import { initializeTheme } from '@/hooks/use-appearance';
import { ErrorBoundary } from '@/components/error-boundary';
import AppRouter from '@/router';

// Sets light / dark mode before the first render.
initializeTheme();

createRoot(document.getElementById('app')!).render(
    <ErrorBoundary>
        <AppRouter />
    </ErrorBoundary>
);
