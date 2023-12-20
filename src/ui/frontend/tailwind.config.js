/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-reverse': 'spin 1s linear infinite reverse'
      },
      colors: {
        'iris': {
          100: '#e0e1ff',
          200: '#c6befe',
          300: '#ac98fd',
          400: '#9278fb',
          500: '#7855fa',
          600: '#6d40e6',
          700: '#612bd2',
          800: '#5615be',
          900: '#4b00aa'
        },
        'charcoal': {
          100: '#f0f0f0',
          200: '#d7d7d7',
          300: '#bfbfbf',
          400: '#a6a6a6',
          500: '#8e8e8e',
          600: '#757575',
          700: '#5d5d5d',
          800: '#444444',
          850: '#333333',
          900: '#2c2c2c',
          950: '#1f1f1f',
          DEFAULT: '#131313'
        },
        'aqua': {
          100: '#b2f8ff',
          200: '#8df1fa',
          300: '#69ebf4',
          400: '#44e4ef',
          500: '#1fdde9',
          600: '#17cadb',
          700: '#10b8cd',
          800: '#08a5be',
          900: '#0092b0'
        },
        'mantis': {
          100: '#dbfab1',
          200: '#c9f38d',
          300: '#b6ec6a',
          400: '#a4e447',
          500: '#92dd23',
          600: '#7ed01a',
          700: '#6ac312',
          800: '#55b709',
          900: '#41aa00'
        },
        'peach': {
          100: '#ffe2d4',
          200: '#ffcebd',
          300: '#ffbaa6,',
          400: '#ffa58f',
          500: '#ff9178',
          600: '#f57a62',
          700: '#eb644b',
          800: '#e14e35',
          900: '#d7371e'
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@headlessui/tailwindcss')
  ],
}
