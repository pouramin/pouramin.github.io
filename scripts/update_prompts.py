#!/usr/bin/env python3
import json
import re
import urllib.error
import urllib.request
from html import unescape
from pathlib import Path

OWNER = "pouramin"
OUT = Path("data/prompts.json")
USER_AGENT = "pouramin.dev prompt library refresh/1.0"

def get_text(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read().decode("utf-8", errors="replace")

def clean_text(value):
    value = re.sub(r"<[^>]+>", " ", value or "")
    return " ".join(unescape(value).split()).strip()

def extract(pattern, text):
    match = re.search(pattern, text, flags=re.I | re.S)
    return clean_text(match.group(1)) if match else ""

def discover():
    api = f"https://api.github.com/users/{OWNER}/repos?per_page=100&type=owner&sort=created&direction=desc"
    repos = json.loads(get_text(api))
    entries = []

    for repo in repos:
        if repo.get("private") or repo.get("archived"):
            continue
        name = repo.get("name", "")
        if not name or name == f"{OWNER}.github.io":
            continue

        branch = repo.get("default_branch") or "main"
        raw_url = f"https://raw.githubusercontent.com/{OWNER}/{name}/{branch}/index.html"
        try:
            page = get_text(raw_url)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
            continue

        lowered = page.lower()
        explicit_include = bool(re.search(
            r'<meta[^>]+name=["\']pouramin-prompt-hub["\'][^>]+content=["\']include["\']',
            page, re.I
        ))
        explicit_exclude = bool(re.search(
            r'<meta[^>]+name=["\']pouramin-prompt-hub["\'][^>]+content=["\']exclude["\']',
            page, re.I
        ))
        if explicit_exclude:
            continue

        has_prompt = "prompt" in lowered or "پرامپت" in page
        has_tunnellab = "tunnellab" in lowered
        if not explicit_include and not (has_prompt and has_tunnellab):
            continue

        title = extract(r"<title[^>]*>(.*?)</title>", page) or name
        description = (
            extract(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', page)
            or extract(r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']', page)
        )
        h1 = extract(r"<h1[^>]*>(.*?)</h1>", page)

        entries.append({
            "repo": name,
            "title": title,
            "headline": h1,
            "description": description,
            "siteUrl": f"https://pouramin.dev/{name}/",
            "repoUrl": repo.get("html_url") or f"https://github.com/{OWNER}/{name}",
            "createdAt": repo.get("created_at") or "",
            "updatedAt": repo.get("updated_at") or "",
        })

    entries.sort(key=lambda item: item.get("createdAt") or "", reverse=True)
    return entries

entries = discover()
payload = {
    "owner": OWNER,
    "generatedFrom": "public TunnelLab companion repositories",
    "count": len(entries),
    "entries": entries,
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {len(entries)} prompt companion pages to {OUT}")
