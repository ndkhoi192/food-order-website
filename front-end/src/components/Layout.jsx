import Header from './Header';
import { Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
    const location = useLocation();
    const isTableSelect = location.pathname === '/';

    if (isTableSelect) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen bg-[#FCF8F5] flex flex-col font-['Mulish',sans-serif]">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-0 md:px-4 py-0 pb-8 md:pb-8">
                <Outlet />
            </main>
        </div>
    );
}
