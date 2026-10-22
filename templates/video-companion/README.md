# TunnelLab video companion template

Use this folder as the baseline for future per-video companion repositories.

## Required conventions

1. Keep the published site at the repository root in index.html.
2. Add this marker so pouramin.dev/prompts/ can include the site even if automatic content detection changes later:

~~~html
<meta name="pouramin-prompt-hub" content="include">
~~~

3. Keep a useful page description:

~~~html
<meta name="description" content="Short description of the video's prompts and companion resources.">
~~~

4. Include Cloudflare Web Analytics before the closing body tag:

~~~html
<!-- Cloudflare Web Analytics -->
<script type="module"
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token":"3f433bf073514d6999f1cbee2dfc770e"}'></script>
<!-- End Cloudflare Web Analytics -->
~~~

5. Link back to the central prompt library:

~~~html
<a href="https://pouramin.dev/prompts/">More TunnelLab prompts</a>
~~~

## Prompt-library behavior

The main site periodically scans Amin's public GitHub repositories. A repository is included when either the explicit prompt-hub marker is present, or the root page contains both TunnelLab branding and prompt content.

Entries are sorted by repository creation time, newest first.

## Analytics

The same Cloudflare Web Analytics site token is intentionally reused across companion sites under pouramin.dev. This allows traffic to be separated by URL path in the Cloudflare dashboard.
