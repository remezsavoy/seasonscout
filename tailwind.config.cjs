/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#102033',
        sand: '#f6f0e6',
        coral: '#e97551',
        lagoon: '#2d6f6d',
        mist: '#d7e4e1',
        sunrise: '#f4c98b',
      },
      boxShadow: {
        soft: '0 22px 55px rgba(16, 32, 51, 0.12)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Newsreader"', 'serif'],
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(circle at top, rgba(244, 201, 139, 0.35), transparent 42%), radial-gradient(circle at bottom right, rgba(45, 111, 109, 0.2), transparent 32%)',
      },
    },
  },
  plugins: [],
};
