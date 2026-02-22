/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                void: '#050508',
                obsidian: '#0D0D14',
                surface: '#12121C',
                glass: '#1A1A2E',
                caution: '#F59E0B',
                nominal: '#22C55E',
                critical: '#E63B2E',
                accent: 'var(--accent)',
            },
            fontFamily: {
                heading: ['"Space Grotesk"', 'sans-serif'],
                mono: ['"Space Mono"', '"JetBrains Mono"', 'monospace'],
                serif: ['"DM Serif Display"', 'serif'],
                sans: ['"Inter"', 'sans-serif'],
            },
            borderColor: {
                DEFAULT: 'rgba(255,255,255,0.06)',
            },
        },
    },
    plugins: [],
}
