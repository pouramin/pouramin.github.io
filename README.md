# pouramin.dev

Personal builder hub for Amin Pour.

## Site
- Production domain: https://pouramin.dev
- Hosting: GitHub Pages
- Custom domain: `CNAME` → `pouramin.dev`
- Responsive static site with no application framework dependency

## Sections
- Projects + case studies
- Now
- Lab
- Builds
- TunnelLab videos
- Video prompt library
- Build Log
- Uses
- About
- Work With Me
- Start Here

## Dynamic features
- Light/dark theme
- Command palette (`/`)
- Terminal easter egg
- Public GitHub activity feed
- Automated TunnelLab video feed
- Automated video prompt companion index

### TunnelLab automation
`.github/workflows/refresh-site.yml` runs once daily and can also be run manually.

It:
1. reads the public YouTube Atom feed for TunnelLab;
2. writes the latest 12 uploads to `data/videos.json`;
3. scans Amin's public repositories for TunnelLab companion sites that contain prompts;
4. writes the detected prompt sites to `data/prompts.json`, newest repository first;
5. renders both Videos and Prompts into static HTML fallbacks;
6. regenerates `assets/social-preview.png`;
7. commits generated files only when they changed.

The website loads `data/videos.json` on the Videos page and also uses the latest item on the home page. The Prompts page is generated from `data/prompts.json`. If a refresh ever fails, the previously generated JSON and static HTML fallbacks remain available.

No YouTube API key is required.

## SEO / sharing
- Canonical URLs point to `https://pouramin.dev`
- Open Graph and Twitter Card metadata are included
- Social preview: `assets/social-preview.png`
- Sitemap: `/sitemap.xml`
- Robots: `/robots.txt`
- Homepage includes Schema.org structured data

## Local preview

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.
