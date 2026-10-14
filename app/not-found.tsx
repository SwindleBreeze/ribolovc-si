import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="sl">
      <body style={{ fontFamily: 'system-ui', padding: '3rem', textAlign: 'center' }}>
        <h1>404</h1>
        <p>
          <Link href="/">Ribolovc.si</Link>
        </p>
      </body>
    </html>
  );
}
