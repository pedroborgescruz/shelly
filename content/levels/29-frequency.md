---
id: 29
chapter: pipes
title: Who hit us most?
description: Five commands, one question, one line.
prompt: "Build a pipeline that prints each IP in `logs/access.log` with its request count, most frequent first."
success: "That is the Unix philosophy, fully assembled: five programs that know nothing about each other, answering a question none of them was written for."
focus:
  cut: pull the IP out of each line
  sort: put equal lines next to each other, and order by count
  uniq: tally the runs
  grep: filter, if you want to narrow it first
hints:
  - "Four steps. Extract the field, group it, count it, order it."
  - "`cut` gets the IPs. `sort` groups them. `uniq -c` counts them."
  - "Then sort again — but on the count, biggest first: `sort -rn`."
---

Build it one stage at a time, reading the output after each pipe. That is how
these get written in practice — nobody types the whole line and hopes.

```
cut -d ' ' -f 1 logs/access.log
cut -d ' ' -f 1 logs/access.log | sort
cut -d ' ' -f 1 logs/access.log | sort | uniq -c
cut -d ' ' -f 1 logs/access.log | sort | uniq -c | sort -rn
```

Each stage is one idea:

1. **`cut`** throws away the columns you do not care about.
2. **`sort`** brings equal lines together, because `uniq` needs that.
3. **`uniq -c`** collapses each run into one line with a count.
4. **`sort -rn`** orders by that count, numerically, descending.

Change `cut -f 1` to `cut -f 3` and the same pipeline tells you which URL is
most requested. Change the input to a word list and it is a word-frequency
counter. The pipeline does not care — none of its parts knows what the data is.

This shape — *extract, group, count, rank* — is most of data wrangling. You have
just written it from scratch.
