# Example Input/Output — Social Media Extractor

A synthetic example illustrating the format of input and output for the social media interest extractor. Real participant data is not shared, in keeping with IRB-approved consent terms.

## Synthetic input (illustrative — not real participant data)

The participant pastes 50–70 social-media posts and comments into a Qualtrics text field. Each entry is roughly 250 characters of natural-language text. A short illustrative excerpt:

```
Just got back from my morning run — pushed it to 5 miles for the first time this season! Marathon training feels real now.

Anyone got recommendations for sci-fi books with strong female leads? Just finished the Broken Earth trilogy and I'm hungry for more.

@friend yes, the new Spider-Verse animated short is incredible. The art style alone is worth the watch.

Hot take: cold brew is overrated. Pour-over with light roast beans is the only acceptable way to start the day.

Volunteered at the dog adoption event downtown today — three of my favorites got adopted! Best Saturday in a while.

Replying to @user — for that PyTorch error, try checking your tensor dimensions. CrossEntropyLoss expects (N, C) for predictions, not one-hot.

Anyone running the Gainesville half-marathon in November? Looking for training buddies for the long runs.

[... 45-65 more posts in the same format ...]
```

## Model output (illustrative — what the model returned for the synthetic input above)

```
Keywords:
=== Distance Running
=== Science Fiction Literature
=== Animated Films and Visual Storytelling
=== Specialty Coffee Brewing
=== Animal Welfare and Volunteering
=== Machine Learning Engineering

Explanations:
*** Distance Running: The explanation for this interest identified lists the most important words and phrases from your posts that led to identifying the interest, along with their importance scores.
- Keyword/Phrase: "marathon training" - 0.92
- Keyword/Phrase: "5 miles" - 0.85
- Keyword/Phrase: "half-marathon" - 0.88
- Keyword/Phrase: "long runs" - 0.78
Score Meaning: High (>= 0.8) values are strong indicators; Moderate (0.6-0.8) are relevant factors; Low (<0.6) are minimal influences.

*** Science Fiction Literature: The explanation for this interest identified shows direct examples from your posts or comments that illustrate why the AI picked up on this interest.
- Similar Instance 1: "Anyone got recommendations for sci-fi books with strong female leads?"
  * Reason for Similarity: Direct request for sci-fi reading recommendations indicates active engagement with the genre.
- Similar Instance 2: "Just finished the Broken Earth trilogy and I'm hungry for more."
  * Reason for Similarity: References a specific Hugo Award-winning sci-fi/fantasy series, suggesting depth of engagement beyond casual interest.

*** Animated Films and Visual Storytelling: The following explanation for this interest identified describes the thought process the AI used to identify the interest, including the patterns and connections it found in your posts.
Derivation Process:
1. Initial Observation: A reply about Spider-Verse animated short praises the art style specifically.
2. Intermediate Conclusion 1: Aesthetic appreciation of animation style suggests interest extends beyond casual viewing.
3. Intermediate Conclusion 2: The viewer engages with animation as a craft, not just as entertainment.
N. Final Conclusion: This indicates a developed interest in animated films and visual storytelling, attentive to artistic technique.

*** Specialty Coffee Brewing: The explanation for this interest identified lists the most important words and phrases from your posts that led to identifying the interest, along with their importance scores.
- Keyword/Phrase: "pour-over" - 0.86
- Keyword/Phrase: "light roast beans" - 0.82
- Keyword/Phrase: "cold brew" - 0.71
Score Meaning: High (>= 0.8) values are strong indicators; Moderate (0.6-0.8) are relevant factors.

*** Animal Welfare and Volunteering: The explanation for this interest identified shows direct examples from your posts or comments that illustrate why the AI picked up on this interest.
- Similar Instance 1: "Volunteered at the dog adoption event downtown today — three of my favorites got adopted!"
  * Reason for Similarity: Direct evidence of in-person volunteering activity at an animal welfare event.

*** Machine Learning Engineering: The following explanation for this interest identified describes the thought process the AI used to identify the interest, including the patterns and connections it found in your posts.
Derivation Process:
1. Initial Observation: A technically detailed reply addresses a PyTorch CrossEntropyLoss error.
2. Intermediate Conclusion 1: The level of specificity indicates working knowledge of deep learning libraries.
3. Intermediate Conclusion 2: The reply pattern (offering technical help to others) suggests the participant uses ML in their own work or study.
N. Final Conclusion: This is consistent with an active interest in machine learning engineering, beyond casual familiarity.
```

## Output parsing rules (used by the Qualtrics wrapper)

The JavaScript wrapper splits the model output as follows to populate Qualtrics embedded-data slots:

1. **Split on `Explanations:`** — everything before is the keywords block; everything after is the explanations block.
2. **Split the keywords block on `===`** — each non-empty segment is one keyword. Six keywords are expected (slots `keyword21` through `keyword26`).
3. **Split the explanations block on `***`** — each non-empty segment is one explanation paragraph. Six paragraphs are expected (slots `message21` through `message26`).
4. **Trim whitespace** from each segment before storing.

If the model violates the format (e.g., uses `==` instead of `===` or skips the `Explanations:` header), the parsing degrades gracefully: empty embedded-data slots indicate which keywords/explanations failed to parse. The format-reminder messages in the seed conversation reduce but do not eliminate format violations; in our N=32 study, format violations occurred in <5% of submissions.

## Notes for reproduction

- Use the same prompt verbatim — small wording changes alter both the keyword distribution and the rotation of explanation types.
- Keep the format-reminder user message between the system prompt and the assistant's first turn; without it, the model is more likely to emit explanation-type labels in plain text.
- The `temperature: 0.6` setting was chosen during pilot testing as a balance between deterministic format compliance (lower temperatures) and topic-grouping diversity (higher temperatures). Other values are reasonable; report whatever you use.
