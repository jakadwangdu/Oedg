import React from 'react';

export default function Logo({ size = 28, word = true, style = {}, className = '' }) {
  if (!word) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          color: 'var(--w, #fff)',
          lineHeight: 1,
          ...style,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          role="img"
          aria-label="Oedg"
        >
          <path
            d="M62.3 16.2A36 36 0 1 1 37.7 16.2"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="40" cy="54" r="8" fill="currentColor" />
          <circle cx="60" cy="54" r="6.5" stroke="currentColor" strokeWidth="3" />
        </svg>
      </span>
    );
  }

  // Full mark + stroke-drawn wordmark
  const height = size;
  const width = Math.round(size * (380 / 120));

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        color: 'var(--w, #fff)',
        lineHeight: 1,
        ...style,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 380 120"
        fill="none"
        role="img"
        aria-label="Oedg"
      >
        <g transform="translate(10 10)">
          <path
            d="M62.3 16.2A36 36 0 1 1 37.7 16.2"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="40" cy="54" r="8" fill="currentColor" />
          <circle cx="60" cy="54" r="6.5" stroke="currentColor" strokeWidth="3" />
        </g>
        <g
          transform="translate(140 10)"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="24" cy="62" r="18" />
          <path d="M66 62H102A18 18 0 1 0 96.7 74.7" />
          <circle cx="144" cy="62" r="18" />
          <path d="M162 22V80" />
          <circle cx="204" cy="62" r="18" />
          <path d="M222 44V82C222 94 214 98 204 98C195 98 189 95 185 90" />
        </g>
      </svg>
    </span>
  );
}
