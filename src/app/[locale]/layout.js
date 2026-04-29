import '@/styles/globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { ThemeProvider } from '@/context/ThemeContext';

export const metadata = {
  title: 'Power Time — أكتر من مجرد جيم',
  description: 'نظام إدارة Power Time الشامل — إدارة العضويات والاشتراكات والسبا والتدريب',
  icons: { icon: '/favicon.ico' },
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

