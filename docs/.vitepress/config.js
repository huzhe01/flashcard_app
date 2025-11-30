import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Flashcard App",
    description: "A modern flashcard application",
    base: '/flashcard_app/docs/', // Important: Deploy to /docs/ subpath
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Features', link: '/features/upload' },
            { text: 'Roadmap', link: '/roadmap' }
        ],

        sidebar: [
            {
                text: 'Features',
                items: [
                    { text: 'Upload & Sync', link: '/features/upload' },
                    { text: 'Study Mode', link: '/features/study' },
                    { text: 'Library & Filters', link: '/features/library' }
                ]
            },
            {
                text: 'Future',
                items: [
                    { text: 'Roadmap', link: '/roadmap' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/huzhe01/flashcard_app' }
        ]
    }
})
