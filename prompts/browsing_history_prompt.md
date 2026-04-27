# Browsing History Interest Extraction Prompt

System prompt given to `gpt-4-turbo-preview` for extracting interest keywords from a participant's browsing history.

> **TODO (Jimmy):** drop in the actual BH system prompt here. The structure should mirror `social_media_prompt.md` but with the source-specific text adjusted (e.g., "I'll provide my 100–200 recent browsing history entries (URLs and page titles)" instead of the SM phrasing). The three explanation types (Feature Importance, Example-Driven, Reasoning-Focused Provenance), the six-keyword output format with `===` and `***` delimiters, and the exclusion list (email, LMS, academic infrastructure) are the same across both sources.

## Notes on the prompt design

- The exclusion list should explicitly cover: email platforms (Gmail, Outlook, etc.), university LMS (Canvas, Blackboard, etc.), work-related infrastructure, and inappropriate or sensitive material.
- For browsing history, additional filters should be considered for: ad/tracker domains, navigation menus, login/auth pages, and short-dwell visits that are likely accidental clicks rather than intentional information seeking.
- The same three explanation types should be rotated across the six extracted keywords (each type used twice), with the type label withheld from the participant-facing output.
