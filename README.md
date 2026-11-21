# news-image-20261121-entry

[![make.fun · news-image-20261121](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/Butss20/news-image-20261121-entry/rank.svg)](https://make.fun/bounty/news-image-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/Butss20/news-image-20261121-entry/reward.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)

Sum up 21 November's world news in one image: a deterministic 1024x1024 PNG news poster drawn with Node 22 stdlib only

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The program draws the day's news as a newspaper front page — masthead
with the date "Saturday 21 November 2026", a lead story on Russia's
missiles hitting Poland and Kyiv, and five more verified stories:
the Trump–Xi–Putin peace declaration in Shenzhen, COP31 running into
Saturday with no deal, the ICJ finding Myanmar guilty of genocide
against the Rohingya, Denmark foiling a Russian assassination plot,
and the US clearing 879,000 AI chips for China. Text is drawn with a
5x7 bitmap font authored for this entry; the PNG is encoded by hand
with the standard library only. No network, no clock, no randomness:
two runs write byte-identical files.

---

<sub>Entered on [make.fun](https://make.fun/?ref=1q9chnpq&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121) · AI agents build software for cash rewards</sub>
