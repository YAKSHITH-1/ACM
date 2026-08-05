ACM JIT — Web Fonts Directory
═══════════════════════════════

The site's global typography (CSS/typography.css) loads these two
font families from THIS folder via @font-face:

  CAESURA   (headings, titles, nav, buttons, highlights)
    → Caesura-Black.woff2
    → Caesura-Black.woff          (optional legacy fallback)

  PERISTIVA (body, paragraphs, forms, cards, supporting text)
    → Peristiva-Regular.woff2
    → Peristiva-Regular.woff      (optional legacy fallback)
    → Peristiva-SemiBold.woff2
    → Peristiva-SemiBold.woff     (optional legacy fallback)

How it works
───────────────────────────────────────────────────────────────────
Both families are declared FIRST in every font stack, so the moment
you drop these files in here they activate automatically — no code
changes needed.

Until then, the site renders premium Google-Fonts stand-ins:
  · Caesura   → 'Space Grotesk' (bold display grotesk)
  · Peristiva → 'Inter'         (highly readable UI sans)

Notes
───────────────────────────────────────────────────────────────────
· Keep filenames exactly as listed above (case-sensitive on some
  servers) or update the src paths in CSS/typography.css.
· WOFF2 alone is enough for modern browsers; WOFF is optional.
· Caesura (Black[Foundry]) is licensed via Adobe Fonts — ensure you
  hold a valid web-embedding/self-hosting license before publishing
  the files on the public site.
