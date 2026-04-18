import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ThemeProvider } from '@/components/theme-provider';
import Dashboard from '@/page/dashboard';

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/preview/:name" element={<Dashboard />} />
            <Route path="*" element={<Dashboard />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider defaultTheme="system">
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </ThemeProvider>
    );
}
