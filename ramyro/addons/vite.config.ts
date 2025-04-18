import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
        }),
        tailwindcss(),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'RamyroAddons',
            fileName: (format) => `index.${format}.js`,
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                '@ohif/core',
                '@ohif/ui',
                '@headlessui/react',
                'lucide-react',
            ],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    '@ohif/core': 'OHIFCore',
                    '@ohif/ui': 'OHIFUI',
                },
            },
        },
        sourcemap: true,
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});