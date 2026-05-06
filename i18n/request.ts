import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async (params) => {
  const requestLocale = await params.requestLocale;
  const locales = routing.locales as readonly string[];

  const locale = requestLocale && locales.includes(requestLocale)
    ? requestLocale!
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
