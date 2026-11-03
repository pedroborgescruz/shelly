---
id: 28
chapter: pipes
title: Translating characters
description: A tool that works one character at a time.
prompt: "Print the whole of `logs/access.log` in lower case."
success: "`tr` maps characters to characters. It reads standard input only, which is why it almost always sits in the middle of a pipe."
focus:
  tr: translate or delete characters
  cat: feed a file into a pipeline
hints:
  - "`tr` cannot open a file. It has to be given one."
  - "`tr` takes two sets of characters and maps one onto the other."
  - "`cat logs/access.log | tr A-Z a-z`."
---

```
cat logs/access.log | tr A-Z a-z
```

`tr` — *translate* — maps each character in the first set to the character at
the same position in the second. `A-Z` and `a-z` are ranges, so this is 26
mappings written in seven characters.

Note what is missing: **`tr` does not take a filename.** It reads standard input
and nothing else. That is unusual among these tools, and it is why you nearly
always see it after a pipe or a `<`.

The other mode is deletion:

```
tr -d '\n'        # strip every newline
tr -d '[:punct:]' # strip punctuation
```

And the classic, which turns prose into one word per line:

```
tr ' ' '\n'
```

That line is the first half of the word-frequency pipeline — the one everyone
writes once and then remembers forever. Next level.
