// @ts-ignore  // 临时忽略类型声明错误，等待 react-router-dom 类型包安装
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ModuleProvider } from '@/contexts/ModuleContext';
import { useBrowserTitle } from '@/hooks/useBrowserTitle';
import { Analytics } from '@vercel/analytics/react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import routes from './routes';

export default function App() {
  // 动态更新浏览器标题
  useBrowserTitle();

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
          <Analytics />
        </div>
      </ModuleProvider>
    </Router>
  );
}
