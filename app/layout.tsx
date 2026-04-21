import './globals.css';
import type { Metadata } from 'next';
import { Inter, Satisfy } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const satisfy = Satisfy({ 
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-satisfy'
});

export const metadata: Metadata = {
  title: 'GENERACIÓN A GENERACIÓN • Registro',
  description: 'Sistema de registro para el Precampamento de Varones AAFCJ 2026',
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png' }
    ]
  },
  manifest: '/manifest.json'
};

export const viewport = {
  themeColor: '#FF0000',
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${satisfy.variable} font-sans`} suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}