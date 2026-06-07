import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'SciMath TU',
  description: 'สายการเรียนวิทยาศาสตร์-คณิตศาสตร์ โรงเรียนเตรียมอุดมศึกษา',
  icons: { icon: '/logo.png', apple: '/logo.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* Inline script prevents theme flash before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('scimath-theme')||'light';document.documentElement.setAttribute('data-theme',t)})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Toaster>
              {children}
            </Toaster>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
