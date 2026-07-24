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
              style: {
                background: '#1A1A24',
                color: '#F4F4FC',
                border: '1px solid #242430',
                borderRadius: '8px',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0,0,10,0.5)',
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
