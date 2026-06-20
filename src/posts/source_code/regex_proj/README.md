---
title: "regexproj"
date: 2026-06-20
description: "Python 3 project initialized from the regex documents under 工具&中间件/正则表达式."
tags:
  - "source_code"
  - "regex_proj"
category: "源码项目"
---

# regex_proj

Python 3 project initialized from the regex documents under `工具&中间件/正则表达式`.

## Layout

- `src/regex_proj/patterns.py`: characters, escaping, predefined classes, Unicode/ASCII differences.
- `src/regex_proj/quantifiers.py`: greedy, lazy, possessive, atomic, and bounded matching.
- `src/regex_proj/groups.py`: capture, non-capture, named groups, alternation, backreferences.
- `src/regex_proj/assertions.py`: anchors, boundaries, flags, lookahead, lookbehind.
- `src/regex_proj/engine.py`: backtracking traces, branch order, capture rollback, NFA/RE2 comparison.
- `src/regex_proj/redos.py`: ReDoS audit, attack samples, rewrite suggestions.
- `src/regex_proj/operations.py`: extraction, replacement, splitting, cleaning, structured log project.
- `src/regex_proj/dialects.py`: Java, JavaScript, Python, PCRE, .NET, RE2 dialect differences.
- `src/regex_proj/review.py`: production review checklist and case studies.
- `docs/knowledge_coverage.md`: document-to-source/test coverage map.

## Run

```powershell
python -m pytest
python -m coverage run -m pytest
python -m coverage report
```

Current verification: `16 passed`, total source coverage `100%`.
