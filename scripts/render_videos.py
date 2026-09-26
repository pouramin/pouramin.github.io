#!/usr/bin/env python3
import html
import json
from datetime import datetime
from pathlib import Path

DATA = Path("data/videos.json")
VIDEOS_PAGE = Path("videos/index.html")
HOME_PAGE = Path("index.html")

GRID_START = "<!-- AUTO:TUNNELLAB_GRID:START -->"
GRID_END = "<!-- AUTO:TUNNELLAB_GRID:END -->"
HOME_START = "<!-- AUTO:TUNNELLAB_HOME:START -->"
HOME_END = "<!-- AUTO:TUNNELLAB_HOME:END -->"


def date_label(value: str) -> str:
    if not value:
        return ""
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.strftime("%d %b %Y").upper()
    except ValueError:
        return value


def replace_marked(text: str, start: str, end: str, block: str) -> str:
    a = text.find(start)
    b = text.find(end)
    if a < 0 or b < 0 or b < a:
        raise RuntimeError(f"Missing marker pair: {start} / {end}")
    b += len(end)
    return text[:a] + block + text[b:]


data = json.loads(DATA.read_text(encoding="utf-8"))
videos = data.get("videos") or []
if not videos:
    raise SystemExit("No videos available in data/videos.json")

cards = []
for video in videos[:6]:
    video_id = html.escape(video.get("videoId", ""), quote=True)
    title = html.escape(video.get("title", "TunnelLab video"), quote=True)
    url = html.escape(video.get("url") or f"https://www.youtube.com/watch?v={video_id}", quote=True)
    thumb = html.escape(video.get("thumbnail") or f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg", quote=True)
    date = html.escape(date_label(video.get("publishedAt", "")), quote=True)
    cards.append(
        f'''    <a class="latest-video-card" href="{url}" target="_blank" rel="noreferrer">
      <div class="latest-video-thumb"><img src="{thumb}" alt="{title} thumbnail" loading="lazy"></div>
      <div class="latest-video-body"><span class="micro">{date}</span><h3 dir="auto">{title}</h3><div class="latest-video-meta"><span>TunnelLab</span><span>Watch ↗</span></div></div>
    </a>'''
    )

grid_block = f'''{GRID_START}
  <div class="latest-video-grid" data-video-grid>
{chr(10).join(cards)}
  </div>
  {GRID_END}'''

videos_text = VIDEOS_PAGE.read_text(encoding="utf-8")
videos_text = replace_marked(videos_text, GRID_START, GRID_END, grid_block)
VIDEOS_PAGE.write_text(videos_text, encoding="utf-8")

latest = videos[0]
latest_id = html.escape(latest.get("videoId", ""), quote=True)
latest_title = html.escape(latest.get("title", "Latest TunnelLab video"), quote=True)
latest_url = html.escape(latest.get("url") or f"https://www.youtube.com/watch?v={latest_id}", quote=True)
latest_date = html.escape(date_label(latest.get("publishedAt", "")), quote=True)

home_block = f'''{HOME_START}
      <a class="panel hover video-feature span-5 reveal" href="{latest_url}" target="_blank" rel="noreferrer" data-latest-video-feature>
        <div><span class="micro">LATEST ON TUNNELLAB</span><h3 data-latest-video-title dir="auto">{latest_title}</h3><p data-latest-video-meta>Latest upload · {latest_date}</p></div><span class="video-play">▶</span>
      </a>
      {HOME_END}'''

home_text = HOME_PAGE.read_text(encoding="utf-8")
home_text = replace_marked(home_text, HOME_START, HOME_END, home_block)
HOME_PAGE.write_text(home_text, encoding="utf-8")

print(f"Rendered {min(6, len(videos))} TunnelLab videos into static HTML.")
