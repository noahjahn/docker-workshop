import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Docker workshop',
  description: 'A guide for Docker',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: 'Home', link: '/' }],
    sidebar: [
      {
        text: 'Docker workshop',
        items: [{ text: 'Begin', link: '/begin' }],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'git@github.com:noahjahn/docker-workshop.git' },
    ],
    search: {
      provider: 'local',
    },
  },
});
