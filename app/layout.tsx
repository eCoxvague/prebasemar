import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { Web3Provider } from '@/lib/context/Web3Provider';

export const metadata: Metadata = {
  title: 'Farcaster Prediction Market',
  description: 'Decentralized prediction market on Base blockchain',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <AuthProvider>{children}</AuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
