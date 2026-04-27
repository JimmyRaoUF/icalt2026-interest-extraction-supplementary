# Example Input/Output — Browsing History Extractor

A synthetic example illustrating the format of input and output for the browsing-history interest extractor. Real participant data is not shared, in keeping with IRB-approved consent terms.

## Synthetic input (illustrative — not real participant data)

The participant exports their browser history (typically via the browser's built-in export tool or a dedicated extension) and pastes 100–200 recent entries into a Qualtrics text field. Each entry is a URL plus the page title, averaging ~90 characters. A short illustrative excerpt:

```
google.com — half marathon training plan beginner 16 weeks
runnersworld.com/training/a20807203/the-marathon-training-plan/
youtube.com — How to Pace Yourself in a Half Marathon (Coach Sage Canaday)
reddit.com/r/running/comments/.../shoe_recommendation_for_first_half/
runrepeat.com/saucony-endorphin-pro-3-review
gainesville-half.com/registration
google.com — best protein bars for long runs
clifbar.com/products/clif-bloks-energy-chews
google.com — pytorch crossentropyloss vs nllloss
pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html
stackoverflow.com/questions/.../pytorch-crossentropyloss-target-must-be-1d/
huggingface.co/docs/transformers/training
github.com/karpathy/nanoGPT
youtube.com — Andrej Karpathy: Let's build GPT from scratch
arxiv.org/abs/1706.03762 — Attention Is All You Need
google.com — sci-fi books with strong female protagonists 2024
goodreads.com/list/show/.../strong-female-leads-sci-fi-fantasy
amazon.com — The Fifth Season N.K. Jemisin
broken-earth-trilogy-discussion-reddit
google.com — Spider-Verse 2 art style analysis
youtube.com — Spider-Verse: How to Make a Comic Book Movie | Insider
medium.com/.../the-revolutionary-animation-of-spider-verse
google.com — pour over coffee technique chemex vs v60
homecoffeeguide.com/chemex-vs-v60-comparison
sweetmarias.com — Ethiopian light roast
youtube.com — How to dial in pour over | James Hoffmann
reddit.com/r/coffee/comments/.../grind-size-for-pour-over-help/
google.com — dog adoption events Gainesville FL
alachuahumane.org/adoption
petfinder.com — search by breed and zip
google.com — should i train a marathon at 5 miles a week
[... 70-150 more entries in the same format ...]
```

## Model output (illustrative — what the model returned for the synthetic input above)

```
Keywords:
=== Distance Running Training
=== Deep Learning Implementation
=== Science Fiction Literature
=== Animation as a Visual Medium
=== Pour-Over Coffee Technique
=== Animal Adoption and Welfare

Explanations:
*** Distance Running Training: The following explanation for this interest identified lists the most important words and phrases from your browsing history that led to identifying the interest, along with their importance scores.
- Keyword/Phrase: "half marathon training plan" - 0.91
- Keyword/Phrase: "Saucony Endorphin Pro" - 0.84
- Keyword/Phrase: "pacing" - 0.78
- Keyword/Phrase: "protein bars long runs" - 0.72
Score Meaning: High (>= 0.8) values are strong indicators; Moderate (0.6-0.8) are relevant factors; Low (<0.6) are minimal influences.

*** Deep Learning Implementation: The following explanation for this interest identified shows direct examples from your browsing history that illustrate why the AI picked up on this interest.
- Similar Instance 1: ["pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html"]
  * Reason for Similarity: Direct visit to PyTorch official documentation indicates active engagement with deep-learning code, beyond casual browsing.
- Similar Instance 2: ["github.com/karpathy/nanoGPT"]
  * Reason for Similarity: Visiting a well-known open-source LLM-from-scratch repository indicates intent to build, not just read about, transformer models.

*** Science Fiction Literature: The following explanation for this interest identified describes the thought process the AI used to identify the interest, including the patterns and connections it found in your browsing history.
Derivation Process:
1. Initial Observation: A search for "sci-fi books with strong female protagonists" appears alongside Goodreads list visits.
2. Intermediate Conclusion 1: The participant is actively seeking reading recommendations rather than passively encountering them.
3. Intermediate Conclusion 2: A subsequent Amazon visit to N.K. Jemisin's "The Fifth Season" plus a discussion thread on the Broken Earth trilogy suggests follow-through from search to acquisition to community engagement.
N. Final Conclusion: This pattern indicates a developing individual interest in literary science fiction, especially recent Hugo-recognized work.

*** Animation as a Visual Medium: The following explanation for this interest identified shows direct examples from your browsing history that illustrate why the AI picked up on this interest.
- Similar Instance 1: ["youtube.com — Spider-Verse: How to Make a Comic Book Movie | Insider"]
  * Reason for Similarity: A craft-focused breakdown video, not a fan-reaction video, suggests interest in animation technique rather than the film as entertainment.
- Similar Instance 2: ["medium.com/.../the-revolutionary-animation-of-spider-verse"]
  * Reason for Similarity: A long-form analytical article reinforces the technique-oriented framing of the interest.

*** Pour-Over Coffee Technique: The following explanation for this interest identified lists the most important words and phrases from your browsing history that led to identifying the interest, along with their importance scores.
- Keyword/Phrase: "Chemex vs V60" - 0.88
- Keyword/Phrase: "James Hoffmann pour over" - 0.86
- Keyword/Phrase: "Ethiopian light roast" - 0.79
- Keyword/Phrase: "grind size" - 0.74
Score Meaning: High (>= 0.8) values are strong indicators; Moderate (0.6-0.8) are relevant factors.

*** Animal Adoption and Welfare: The following explanation for this interest identified describes the thought process the AI used to identify the interest, including the patterns and connections it found in your browsing history.
Derivation Process:
1. Initial Observation: A geographically specific search for "dog adoption events Gainesville FL" suggests intent to act, not abstract curiosity.
2. Intermediate Conclusion 1: A subsequent visit to Alachua Humane Society confirms local-organization engagement.
3. Intermediate Conclusion 2: A Petfinder breed-and-zip search indicates active matching behavior, characteristic of someone preparing to adopt rather than browsing pet content for entertainment.
N. Final Conclusion: This is a maintained situational interest, possibly tied to an upcoming adoption decision.
```

## Output parsing rules (used by the Qualtrics wrapper)

The JavaScript wrapper splits the model output as follows to populate Qualtrics embedded-data slots:

1. **Split on `Explanations:`** — everything before is the keywords block; everything after is the explanations block.
2. **Split the keywords block on `===`** — each non-empty segment is one keyword. Six keywords are expected (slots `keyword11` through `keyword16` for the BH wrapper, in contrast to `keyword21`–`keyword26` for the SM wrapper).
3. **Split the explanations block on `***`** — each non-empty segment is one explanation paragraph. Six paragraphs are expected (slots `message11` through `message16`).
4. **Trim whitespace** from each segment before storing.

If the model violates the format (e.g., uses `==` instead of `===` or skips the `Explanations:` header), the parsing degrades gracefully: empty embedded-data slots indicate which keywords/explanations failed to parse.

## Notes on browsing-history-specific behavior

- **Phase distribution.** In the study reported in the paper, browsing history yielded a phase distribution skewed toward Triggered (~10%) and Maintained (~25%) situational interests, with Well-Developed (~35%) interests less prevalent than in social media (~70%). The synthetic example above reflects this characteristic mix: the running and adoption interests skew earlier-phase (situational), while the deep-learning and sci-fi interests reach Emerging or Well-Developed individual phases.
- **Noise sources.** Real browsing-history extracts contain navigational noise (login pages, search-engine landing pages, ad redirects). The system prompt's exclusion of email, LMS, and academic-work content reduces but does not eliminate this. For higher-fidelity extraction, consider adding a server-side preprocessing step that filters URLs by dwell time and removes known-noisy domains.
- **URL truncation.** Long URLs are typically displayed in truncated form (page title + domain). The parser is robust to this; the model uses the page-title and domain pattern to infer interest, not the full URL string.
- **Self-curation impact.** Participants in the original study were instructed to remove sensitive entries before submission (the *self-curation protocol* described in the paper). This means the example above represents a curated corpus, not raw browser history. Ecological deployments without curation would face a different noise profile and a different consent landscape.

## Notes for reproduction

- Use the BH system prompt verbatim — wording differences from the SM prompt (e.g., "browsing history" instead of "posts," "urls or text snippets" instead of "posts or comments") subtly shape the model's output.
- The same temperature (0.6), top-p (1.0), and max_tokens (3600) settings were used for both BH and SM extractors to keep the cross-source comparison clean.
- The BH wrapper uses `convo_history` and `keyword11`–`keyword16` / `message11`–`message16` as embedded-data slot names. The SM wrapper uses `convo_history2` and `keyword21`–`keyword26` / `message21`–`message26`. The numeric suffix (`1` vs `2`) is the only meaningful difference; this allows both extractors to run in the same survey without colliding.
