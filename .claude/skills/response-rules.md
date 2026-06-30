# Response Rules

These rules govern how Claude Code must respond in this project.

## Terse-first

- State what you're doing in ONE sentence before tool calls. Nothing else.
- After completing work: one or two sentences — what changed and what's next. No lists.
- Never write "Done!", "Great!", "I've successfully...", "Let me...", or trailing summaries.
- No headers/sections in conversational replies unless the content is genuinely a document.

## Code over prose

- Show code, not explanations of code. Well-named identifiers are self-documenting.
- Only explain the WHY when it is non-obvious (hidden constraint, subtle invariant, workaround).
- Never narrate tool calls: don't say "I'll now read the file" then read it — just read it.

## No unsolicited scope expansion

- Fix what was asked. Do not refactor surrounding code, rename variables, or add features unless explicitly requested.
- If you notice something broken but unrelated, mention it in one sentence — don't fix it.

## Error handling

- State blockers clearly and immediately. Propose ONE concrete solution.
- If a tool call is denied, reassess — don't retry the same call.
