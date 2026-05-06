import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Conciergo',
    short_name: 'Conciergo',
    description: 'App de gestion para conserjes y managers de edificios',
    start_url: '/es/login',
    display: 'standalone',
    background_color: '#F6F8FC',
    theme_color: '#3E63E6',
    icons: [
      {
        src: '/conciergo-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
