import { Helmet } from 'react-helmet-async';

const SITE_URL  = 'https://lumen.oscarmajai.dev';
const SITE_NAME = 'Lumen';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`;

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: object;
}

export default function SEO({ title, description, canonical, noindex = false, jsonLd }: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  return (
    <Helmet>
      <html lang="es" />

      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={url} />
      <meta property="og:image"       content={DEFAULT_OG_IMAGE} />

      {/* Twitter */}
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={DEFAULT_OG_IMAGE} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
