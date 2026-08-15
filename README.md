# Harsha Vardhan Reddy — Editing Portfolio

A single-page portfolio built around an "editing suite" visual identity: a
monitor-style hero with a working scrub bar and timecode readout, a
timeline clip-switcher for the reel samples, and a render-pipeline
section that mirrors the real edit → enhance → grade → deliver workflow.

## Structure

```
index.html
css/styles.css
js/script.js
assets/videos/timeline-1.mp4   (clip 01)
assets/videos/timeline-2.mp4   (clip 02)
assets/videos/timeline-3.mp4   (clip 03)
assets/videos/timeline-4.mp4   (clip 04 — Mahesh Babu title card)
assets/videos/timeline-5.mp4   (clip 05 — Mahesh Babu birthday edit, SFX pass)
assets/videos/timeline-6.mp4   (clip 06 — Mahesh Babu birthday edit, SFX + music)
assets/videos/timeline-7.mp4   (clip 07 — Spider-Man fan edit)
assets/posters/poster-1.jpg    (poster frame for clip 01, shown before video loads)
assets/posters/poster-2.jpg
assets/posters/poster-3.jpg
assets/posters/poster-4.jpg
assets/posters/poster-5.jpg
assets/posters/poster-6.jpg
assets/posters/poster-7.jpg
resume.pdf
```

## Run locally

Static site — open `index.html` directly, or serve it:

```bash
npx serve .
```

## Deploy on GitHub Pages

1. Create a new GitHub repository and push this folder to `main`.
2. In the repository, go to **Settings → Pages**.
3. Set **Source** to **GitHub Actions**.
4. Push to `main` — `.github/workflows/deploy.yml` builds and deploys automatically.

## Swap in new reel clips

Add or replace files in `assets/videos/`, then regenerate a poster frame so
the page still shows a still image before the video loads:

```bash
ffmpeg -y -ss 00:00:01 -i assets/videos/timeline-1.mp4 -frames:v 1 -q:v 3 -vf "scale=960:-1" assets/posters/poster-1.jpg
```

Repeat for each `timeline-N.mp4` / `poster-N.jpg` pair. To add a brand-new
clip rather than replace one, copy an existing `.clip` button block in
`index.html`'s `#track` element, bump the `timeline-N` / `poster-N` /
`data-index` numbers, and set new `data-title` / `data-desc` captions — the
clip switcher (`js/script.js`) and grid layout (`css/styles.css`) both
scale automatically to however many `.clip` buttons are present.

## Notes

- Video files are the largest asset in this repo (~18 MB total, re-encoded
  with `ffmpeg -crf 27` capped at 1080p to keep the repo lightweight for
  GitHub). GitHub
  Pages serves them fine, but if load time matters for your audience,
  consider re-encoding with `ffmpeg -crf 26` or hosting them on a CDN and
  pointing the `src` attributes at the CDN URL instead.
- The hero video pauses automatically when scrolled out of view and the
  clip switcher lazy-loads each clip only when selected, to keep the
  initial page weight down.
