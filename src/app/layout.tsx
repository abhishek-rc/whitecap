import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/CartContext';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'White Cap - Vertex AI Search POC',
  description: 'A proof of concept for Vertex AI-based search solution for White Cap ECommerce platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        {/* CartProvider wraps the app for cart context */}
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}

