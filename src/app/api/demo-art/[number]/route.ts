import { NextResponse } from "next/server";

const palettes = [
  ["#36c4ff", "#90f2c7", "#ffd84d"], ["#7c6cff", "#ef8bff", "#ffbd5e"],
  ["#1fd3c6", "#4a8cff", "#fff173"], ["#ff8a65", "#ffd54f", "#71e6ba"],
  ["#4bb8ff", "#5f76ff", "#ff91d1"], ["#72df9d", "#24b8cd", "#ffdf6e"],
];

export async function GET(_: Request, context: { params: Promise<{ number: string }> }) {
  const { number } = await context.params;
  const seed = Number.parseInt(number, 10) || 1;
  const [a, b, c] = palettes[(seed - 1) % palettes.length];
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 900" role="img" aria-label="Demo artwork ${number}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="12"/></filter>
    </defs>
    <rect width="1400" height="900" fill="url(#sky)"/>
    <circle cx="1120" cy="170" r="92" fill="${c}" opacity=".95"/>
    <circle cx="1120" cy="170" r="132" fill="${c}" opacity=".25" filter="url(#glow)"/>
    <path d="M0 610 Q220 470 420 610 T820 600 T1200 590 T1500 620 V900 H0Z" fill="#f7fff8" opacity=".96"/>
    <path d="M0 690 Q230 540 430 700 T870 690 T1230 680 T1500 710 V900 H0Z" fill="#5ad58f" opacity=".86"/>
    <path d="M130 760 C350 620 650 610 860 760 S1220 880 1450 720" fill="none" stroke="#fff" stroke-width="74" stroke-linecap="round" opacity=".9"/>
    <path d="M130 760 C350 620 650 610 860 760 S1220 880 1450 720" fill="none" stroke="${c}" stroke-width="9" stroke-dasharray="24 24"/>
    <g fill="#fff" opacity=".9"><circle cx="180" cy="180" r="18"/><circle cx="245" cy="125" r="9"/><circle cx="360" cy="220" r="13"/><circle cx="760" cy="135" r="15"/></g>
    <g transform="translate(700 450)"><path d="m0-118 25 76 80-1-65 47 25 76-65-46-65 46 25-76-65-47 80 1Z" fill="${c}" stroke="#fff" stroke-width="16"/></g>
    <text x="70" y="100" fill="#fff" font-family="Arial,sans-serif" font-size="38" font-weight="700" opacity=".9">ARTVENTURE DEMO</text>
    <text x="70" y="155" fill="#fff" font-family="Arial,sans-serif" font-size="28" opacity=".8">ARTWORK #${String(number).replace(/[^0-9]/g, "").padStart(3, "0")}</text>
  </svg>`;
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
}
