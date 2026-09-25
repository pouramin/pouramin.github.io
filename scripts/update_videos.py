#!/usr/bin/env python3
import json
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

CHANNEL_ID = "UCq7sUDbAbuaiYztM-IBO0aQ"
CHANNEL_NAME = "TunnelLab"
FEED_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
OUT = Path("data/videos.json")

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
    "media": "http://search.yahoo.com/mrss/",
}

req = urllib.request.Request(
    FEED_URL,
    headers={"User-Agent": "pouramin.dev video refresh/1.0"},
)
with urllib.request.urlopen(req, timeout=30) as response:
    xml = response.read()

root = ET.fromstring(xml)
videos = []

for entry in root.findall("atom:entry", NS):
    video_id = (entry.findtext("yt:videoId", default="", namespaces=NS) or "").strip()
    title = (entry.findtext("atom:title", default="", namespaces=NS) or "").strip()
    published = (entry.findtext("atom:published", default="", namespaces=NS) or "").strip()
    updated = (entry.findtext("atom:updated", default="", namespaces=NS) or "").strip()
    if not video_id or not title:
        continue

    videos.append(
        {
            "videoId": video_id,
            "title": title,
            "publishedAt": published,
            "updatedAt": updated,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "thumbnail": f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
        }
    )

payload = {
    "channelId": CHANNEL_ID,
    "channelName": CHANNEL_NAME,
    "feed": FEED_URL,
    "feedUpdatedAt": root.findtext("atom:updated", default="", namespaces=NS),
    "videos": videos[:12],
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(f"Wrote {len(payload['videos'])} videos to {OUT}")
