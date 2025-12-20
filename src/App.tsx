import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ModuleProvider } from '@/contexts/ModuleContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import routes from './routes';

export default function App() {
  return (
    <Router>
      <ModuleProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <Header />
          <main className="flex-grow">
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster />
        </div>
      </ModuleProvider>
    </Router>
  );
}
