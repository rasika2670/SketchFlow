import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppInitializer from '@/features/shared/AppInitializer';
import ErrorBoundary from '@/features/shared/ErrorBoundary';
import AppRoutes from '@/app/routes';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppInitializer>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              className: '!bg-sf-raised !text-slate-50 !border !border-slate-700 shadow-sf-overlay',
              style: {
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#34D399',
                  secondary: '#1A1A24',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FB7185',
                  secondary: '#1A1A24',
                },
              },
            }}
          />
        </AppInitializer>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
