// Dynamic OG image for beta page
// Next.js automatically serves this at /beta/opengraph-image

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'GLORY Beta - Get Lifetime Premium Free';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Purple glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Beta badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'rgba(147, 51, 234, 0.2)',
            border: '1px solid rgba(147, 51, 234, 0.4)',
            borderRadius: '9999px',
            marginBottom: '24px',
          }}
        >
          <span style={{ fontSize: '20px' }}>🧪</span>
          <span style={{ color: '#c4b5fd', fontSize: '20px', fontWeight: 500 }}>
            Beta Testing Program
          </span>
        </div>

        {/* Logo */}
        <h1
          style={{
            fontSize: '96px',
            fontWeight: 800,
            color: 'white',
            margin: '0 0 16px 0',
            letterSpacing: '-2px',
          }}
        >
          GLORY
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: '32px',
            color: '#a1a1aa',
            margin: '0 0 48px 0',
          }}
        >
          Join the exclusive beta
        </p>

        {/* Reward box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px 40px',
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3))',
            border: '1px solid rgba(147, 51, 234, 0.5)',
            borderRadius: '16px',
          }}
        >
          <span style={{ fontSize: '36px' }}>👑</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#c4b5fd', fontSize: '18px' }}>Your Reward</span>
            <span style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>
              Lifetime Free Premium
            </span>
          </div>
        </div>

        {/* Bottom text */}
        <p
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '20px',
            color: '#71717a',
          }}
        >
          theglory.app/beta
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
