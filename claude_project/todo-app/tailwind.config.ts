import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/client/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        priority: {
          low: '#6B7280',    // 회색
          medium: '#3B82F6', // 파란색
          high: '#EF4444',   // 빨간색
        },
      },
    },
  },
  plugins: [],
}

export default config
