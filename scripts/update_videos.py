#!/usr/bin/env python3
import json
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

CHANNEL_ID = "UCq7sUDbAbuaiYztM-IBO0aQ"
CHANNEL_NAME = "TunnelLab"
CHANNEL_SUFFIX = CHANNEL_ID[2:]
OUT = Path("data/videos.json")

# YouTube's public RSS endpoint can intermittently return 404/500.
# Try the canonical channel feed first, then upload-playlist variants.
FEED_URLS = [
    f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}",
    f"https://www.youtube.com/feeds/videos.xml?playlist_id=UU{CHANNEL_SUFFIX}",
    f"https://www.youtube.com/feeds/videos.xml?playlist_id=UULF{CHANNEL_SUFFIX}",
]

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"
    ),
    "Accept": "application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.8",
}


def fetch_feed(url: str, attempts: int = 3):
    last_error = None
    for attempt in range(1, attempts + 1):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as response:
                data = response.read()
            root = ET.fromstring(data)
            entries = root.findall("atom:entry", NS)
            if not entries:
                raise ValueError("feed returned no entries")
            print(f"Fetched YouTube feed: {url} ({len(entries)} entries)")
            return root, url
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, ValueError, ET.ParseError) as exc:
            last_error = exc
            print(
                f"Feed attempt {attempt}/{attempts} failed for {url}: {exc}",
                file=sys.stderr,
            )
            if attempt < attempts:
                time.sleep(2 * attempt)
    return None, last_error


def parse_videos(root):
    videos = []
    seen = set()
    for entry in root.findall("atom:entry", NS):
        video_id = (entry.findtext("yt:videoId", default="", namespaces=NS) or "").strip()
        title = (entry.findtext("atom:title", default="", namespaces=NS) or "").strip()
        published = (entry.findtext("atom:published", default="", namespaces=NS) or "").strip()
        updated = (entry.findtext("atom:updated", default="", namespaces=NS) or "").strip()

        if not video_id or not title or video_id in seen:
            continue
        seen.add(video_id)

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

    videos.sort(key=lambda item: item.get("publishedAt") or "", reverse=True)
    return videos


def keep_cached_and_exit(errors):
    if OUT.exists():
        try:
            cached = json.loads(OUT.read_text(encoding="utf-8"))
            cached_videos = cached.get("videos") or []
            if cached_videos:
                print(
                    "YouTube feed is temporarily unavailable; "
                    f"keeping {len(cached_videos)} cached videos and exiting successfully."
                )
                for error in errors:
                    print(f"  - {error}", file=sys.stderr)
                return 0
        except (OSError, json.JSONDecodeError) as exc:
            print(f"Cached video data could not be read: {exc}", file=sys.stderr)

    print("No usable YouTube feed and no valid cached data are available.", file=sys.stderr)
    for error in errors:
        print(f"  - {error}", file=sys.stderr)
    return 1


def main():
    root = None
    feed_used = None
    errors = []

    for url in FEED_URLS:
        result, detail = fetch_feed(url)
        if result is not None:
            root = result
            feed_used = url
            break
        errors.append(f"{url}: {detail}")

    if root is None:
        return keep_cached_and_exit(errors)

    videos = parse_videos(root)
    if not videos:
        errors.append(f"{feed_used}: parsed successfully but contained no usable videos")
        return keep_cached_and_exit(errors)

    feed_updated_at = max(
        (video.get("updatedAt") or video.get("publishedAt") or "" for video in videos),
        default="",
    )

    payload = {
        "channelId": CHANNEL_ID,
        "channelName": CHANNEL_NAME,
        "feed": feed_used,
        "feedUpdatedAt": feed_updated_at,
        "videos": videos[:12],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    next_text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    current_text = OUT.read_text(encoding="utf-8") if OUT.exists() else ""

    if next_text == current_text:
        print(f"Video data is already current ({len(payload['videos'])} videos).")
    else:
        OUT.write_text(next_text, encoding="utf-8")
        print(f"Wrote {len(payload['videos'])} videos to {OUT}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
