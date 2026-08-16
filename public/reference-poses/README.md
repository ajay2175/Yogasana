# Reference pose photos

Drop one JPEG per asana here to enable **Google MediaPipe** photo enhancement:

| File | Pose |
|------|------|
| `trikonasana.jpg` | Trikonasana |
| `adho-mukha-svanasana.jpg` | Downward dog |
| … | `{poseKey}.jpg` matching `asana-visuals.json` |

The app **always loads** anatomy-guided 3D simulation without these files. MediaPipe runs only when a matching local image exists.

Wikimedia URLs in the JSON were removed — many returned 404 and caused "failed to load" in the browser.
