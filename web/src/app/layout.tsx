import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'GEM Bot - The Ultimate Guild Economy System',
  description: 'Create a thriving economy in your Discord server with GEM Bot. Featuring dynamic stores, passive income, and season-based rewards.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <LanguageProvider>
          <Navbar />
          
          <main className="main-container">
            {children}
          </main>

          <footer className="footer">
            <p className="footer-text">© {new Date().getFullYear()} GEM Bot. All rights reserved.</p>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
