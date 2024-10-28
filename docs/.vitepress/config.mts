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
        items: [
          {
            text: 'Introduction',
            link: '/introduction',
            items: [{ text: 'Prerequisites', link: '/prerequisites' }],
          },
          {
            text: 'Docker CLI',
            link: '/cli',
          },
          {
            text: 'Shell script wrapping',
            link: '/shell',
          },
          {
            text: 'Docker Desktop GUI',
            link: '/desktop',
          },
          {
            text: 'Dockerfiles',
            link: '/dockerfiles',
          },
          {
            text: 'Docker compose',
            link: '/compose',
          },
          {
            text: 'Docker context',
            link: '/context',
          },
        ],
      },
      {
        text: 'Examples',
        items: [
          {
            text: 'Vitepress docs',
            link: '/vitepress',
          },
          {
            text: 'Python example',
            link: '/python',
          },
          {
            text: 'Node.js example',
            link: '/nodejs',
          },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/noahjahn/docker-workshop' },
    ],
    search: {
      provider: 'local',
    },
  },
  ignoreDeadLinks: 'localhostLinks',
  lastUpdated: true,
});
