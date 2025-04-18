import type { Config } from 'tailwindcss';

export default {
    content: [
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    important: '.ramyro-addon',  // This is the key change

    theme: {
        extend: {}, // We can extend the theme if needed
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],

} satisfies Config;