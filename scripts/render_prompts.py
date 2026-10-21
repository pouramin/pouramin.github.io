#!/usr/bin/env python3
import html
import json
from datetime import datetime
from pathlib import Path

DATA = Path("data/prompts.json")
PAGE = Path("prompts/index.html")
START = "<!-- AUTO:PROMPT_LIBRARY:START -->"
END = "<!-- AUTO:PROMPT_LIBRARY:END -->"

def date_label(value):
    if not value:
        return ""
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%d %b %Y").upper()
    except ValueError:
        return ""

def clean_title(title):
    title = title.replace(" — TunnelLab", "").replace(" | TunnelLab", "").strip()
    return title or "Video prompts"

data = json.loads(DATA.read_text(encoding="utf-8"))
entries = data.get("entries") or []

cards = []
for item in entries:
    title = html.escape(clean_title(item.get("title", "")))
    desc = html.escape(item.get("description") or item.get("headline") or "Prompts and companion resources for a TunnelLab video.")
    site = html.escape(item.get("siteUrl", ""), quote=True)
    repo = html.escape(item.get("repo", ""))
    date = html.escape(date_label(item.get("createdAt", "")))
    cards.append(f'''<a class="prompt-item" href="{site}" target="_blank" rel="noreferrer">
  <span class="prompt-icon" aria-hidden="true">✦</span>
  <span class="prompt-copy">
    <span class="micro">VIDEO PROMPTS · {date}</span>
    <strong>{title}</strong>
    <small>{desc}</small>
    <span class="prompt-meta">{repo}</span>
  </span>
  <span class="prompt-arrow" aria-hidden="true">↗</span>
</a>''')

if cards:
    body = "\n".join(cards)
else:
    body = '<div class="panel"><p>No prompt companion pages have been detected yet.</p></div>'

block = f"""{START}
<div class="prompt-list">
{body}
</div>
{END}"""

text = PAGE.read_text(encoding="utf-8")
a = text.find(START)
b = text.find(END)
if a < 0 or b < 0 or b < a:
    raise SystemExit("Prompt library markers not found.")
b += len(END)
PAGE.write_text(text[:a] + block + text[b:], encoding="utf-8")
print(f"Rendered {len(entries)} prompt entries into {PAGE}")
