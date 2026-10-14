import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ribolovc.si – ribolov v Sloveniji',
    short_name: 'Ribolovc',
    description: 'Ribolovne lokacije, ribe, vabe, dovolilnice in 4-dnevne razmere za ribolov v Sloveniji.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7faf9',
    theme_color: '#0b8573',
    lang: 'sl',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
