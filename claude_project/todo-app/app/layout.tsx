import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tika',
  description: 'Ticket-based Kanban Board TODO App',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
