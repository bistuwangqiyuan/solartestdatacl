import '../styles/globals.css';
import { Footer } from '../components/footer';
import { AuthProvider } from '../contexts/AuthContext';

export const metadata = {
    title: {
        template: '%s | Solar Testing',
        default: 'Solar Disconnect Testing Data Management'
    },
    description: 'Industrial-grade system for managing photovoltaic disconnect device testing data'
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.svg" sizes="any" />
            </head>
            <body className="antialiased text-gray-900 bg-gray-50">
                <AuthProvider>
                    <div className="flex flex-col min-h-screen">
                        <main className="flex-1">
                            {children}
                        </main>
                        <Footer />
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
