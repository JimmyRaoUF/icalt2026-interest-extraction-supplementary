# Supplementary Materials — ICALT 2026

**Paper:** *Identifying Student Interests for Interest-Based Learning: A Comparison of Interest Extraction from Browsing History and Social Media Posts*

**Conference:** The 26th IEEE International Conference on Advanced Learning Technologies (ICALT 2026)

**Authors:** Nanjie (Jimmy) Rao, Zhanhong Huang, Abhishek Kulkarni, Eric Ragan, Sharon Lynn Chu — Department of Computer & Information Science & Engineering, University of Florida

**Contact:** raon@ufl.edu

---

## What is in this repository

This repository contains the supplementary materials referenced in the paper for reproducibility:

| Folder | Contents |
|---|---|
| `prompts/` | The full system prompts given to `gpt-4-turbo-preview` for interest extraction from social media posts and from browsing history. |
| `qualtrics/` | The JavaScript wrappers that integrated the OpenAI API with the Qualtrics survey to deliver per-participant extractions. |
| `examples/` | Synthetic example input/output pairs illustrating what the model received and returned for each source type. Real participant data is not shared, in keeping with the IRB-approved consent terms. |

## Model parameters

The extraction system used the following parameters (also specified in the paper):

- **Model:** `gpt-4-turbo-preview` (OpenAI API)
- **Temperature:** `0.6` (social media extractor) and matching settings for browsing history
- **Top-p:** `1.0`
- **Max tokens (response):** `3600`
- **Conversation memory:** none retained across participants; each session starts a fresh message thread

## How to reproduce

1. Obtain an OpenAI API key with access to `gpt-4-turbo-preview`.
2. Set your key as an environment variable in your survey backend:
   ```bash
   export OPENAI_API_KEY="sk-..."
   ```
   Never commit the key to a public repository or paste it into a survey-platform code block visible to participants.
3. Copy the appropriate JavaScript wrapper from `qualtrics/` into your survey's question-level JavaScript field. Replace the `OPENAI_API_KEY` placeholder with a server-side proxy that reads the key from your environment (do not embed the key directly in client-side JavaScript).
4. Use the prompts in `prompts/` as the system messages.
5. The example I/O in `examples/` shows the expected output format for downstream parsing (six interest keywords plus explanations, separated by `===` and `***` delimiters).

## Important security note

The original deployment used a client-side JavaScript wrapper that embedded the API key directly into the Qualtrics question. **This is not recommended for any deployment beyond a tightly controlled research study.** A production deployment should:

- Place a server-side proxy between the survey and the OpenAI API.
- Authenticate the proxy with a secret stored in environment variables.
- Apply rate limiting and input sanitization on the proxy.
- Log requests for audit and incident response.

The wrappers in `qualtrics/` have been sanitized — every API key value has been replaced with `YOUR_OPENAI_API_KEY_HERE`. Do not commit a real key to this repository.

## Citation

If you use these materials in your own work, please cite the paper:

```bibtex
@inproceedings{rao2026identifying,
  title     = {Identifying Student Interests for Interest-Based Learning: A Comparison of Interest Extraction from Browsing History and Social Media Posts},
  author    = {Rao, Nanjie and Huang, Zhanhong and Kulkarni, Abhishek and Ragan, Eric and Chu, Sharon Lynn},
  booktitle = {Proceedings of the 26th IEEE International Conference on Advanced Learning Technologies (ICALT 2026)},
  year      = {2026},
  publisher = {IEEE}
}
```

## License

These materials are released under the MIT License (see `LICENSE`). The paper itself is © IEEE 2026; refer to the IEEE copyright transfer for terms governing reuse of the manuscript text.

## Ethical considerations

The original study was IRB-approved. Participants provided informed consent that their data would be analyzed by an LLM service. They were instructed to remove sensitive content before submission (the *self-curation protocol* described in the paper). For deployments outside the original study context, please consult your institution's IRB and apply the safeguards discussed in the paper's Limitations section: granular informed consent, data minimization, FERPA-aligned storage, and explicit opt-out and deletion mechanisms.
