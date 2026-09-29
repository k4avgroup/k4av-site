# Local font assets

Geist Sans and Geist Mono, normal variable weight 100–900, Latin subsets.
These unchanged binaries were copied from the installed Next.js 16.3.6
distribution (`next/dist/next-devtools/server/font/`).

Upstream: https://github.com/vercel/geist-font
Copyright 2024 The Geist Project Authors. Distributed under SIL OFL 1.1;
the upstream license is included in `OFL.txt`.

`lib/fonts.ts` loads the files through `next/font/local`. The Sans face is
preloaded; the Mono face is used sparingly for technical labels. Neither
development builds nor visitors need to fetch fonts from an external host.
