// =============================================================================
//  Browsing History Interest Extractor — Qualtrics question-level JavaScript
//
//  Used in the IRB-approved study reported in:
//  Rao et al. (ICALT 2026), "Identifying Student Interests for Interest-Based
//  Learning: A Comparison of Interest Extraction from Browsing History and
//  Social Media Posts."
//
//  WHAT IT DOES
//    1. Initializes a chat-style conversation with gpt-4-turbo-preview seeded
//       with the BH extraction system prompt (see prompts/browsing_history_prompt.md).
//    2. When the participant pastes their 100–200 lines of browsing history and
//       clicks "Submit Response", appends the text as a user message and calls
//       the OpenAI Chat Completions API.
//    3. Parses the model's response for six "=== Keyword" lines and six
//       "*** Keyword: Explanation" blocks, and writes each into a Qualtrics
//       embedded-data slot for downstream display.
//
//  SECURITY WARNING
//    The original deployment embedded the API key directly into this client-side
//    JavaScript. THIS IS NOT RECOMMENDED for any deployment beyond a tightly
//    controlled research study. Production deployments should:
//      - Place a server-side proxy between the survey and the OpenAI API.
//      - Authenticate the proxy with a secret stored in environment variables.
//      - Apply rate limiting and input sanitization on the proxy.
//      - Log requests for audit and incident response.
//
//    The placeholder "YOUR_OPENAI_API_KEY_HERE" must be replaced with either
//    a server-side proxy URL or, for an ephemeral research-only deployment,
//    a key that is rotated immediately after the study.
// =============================================================================

Qualtrics.SurveyEngine.addOnload(function () {

    // ----- Configuration --------------------------------------------------------

    // Embedded-data field where the full conversation JSON is stored after
    // the participant interaction. Set this to match your Qualtrics survey flow.
    const EMBEDDED_DATA_DEST = "convo_history";

    // OpenAI API credentials. SEE SECURITY WARNING ABOVE — never commit a real key.
    const OPENAI_API_KEY  = "Bearer YOUR_OPENAI_API_KEY_HERE";
    const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
    const OPENAI_MODEL    = "gpt-4-turbo-preview";

    // Reserved for future multi-turn variants of the extractor; not used in
    // the single-shot deployment reported in the paper.
    const MAX_TURNS = 6;

    // ----- System prompt and conversation seed ---------------------------------

    // The full system prompt describing the AI Interest Analyst's task,
    // expected output format, and three explanation types.
    // See prompts/browsing_history_prompt.md for the human-readable version.
    const GPT4_SYS_PROMPT = `Hello! You're an AI Interest Analyst. Research consistently demonstrates the powerful impact of interest on learning, your help is very important for us to have a robust understanding of student interests. I'll provide my 100-200 lines of browsing history. Please do the following: :

Group Related Interactions: Examine my browsing history and group related interactions to create distinct topic groups.
Extract Keywords: Find 6 topic keywords that represent the major topic groups you discover. Please exclude any content related to email, learning management systems, or academic research/work activities.
Topics Explanations: For each topic keyword, provide one of the following explanations. Must use each type twice, don't label it in your output, but please give some context about what kind of explanation is being provided to improve personal relevance.

-Feature Importance: List the most important keywords, phrases, or other features you used to extract the interests with their importance ratings. Use the following key-value format:
output format:
--Start by saying "The following explanation for this interest identified lists the most important words and phrases from your browsing history that led to identifying the interest, along with their importance scores."
--Keyword/Phrase: (Insert the most important keyword or phrase related to the interest ) - (Score between 0 and 1)
--Score Meaning: Explain what the scores mean using these guidelines:
High: Scores >= 0.8 --> Strong indicator of the interest, Moderate: Scores between 0.6 and 0.8 --> Relevant factor in the interest, Low Importance: Scores below 0.6 --> Minimal influence on the interest.

-Example-Driven: Show orginal data ("Direct Quote") of one or two relevant urls or text snippets you used to extract the interests.
Based on Similar Instances.
output format:
- Start by saying "The following explanation for this interest identified shows direct examples from your browsing history that illustrate why the AI picked up on this interest."
- Similar Instance 1: ["Direct Quote"]
  * Reason for Similarity: [Explanation of why this instance is similar]
- Similar Instance 2: ["Direct Quote"]
  * Reason for Similarity: [Explanation of why this instance is similar]


-Reasoning-Focused Provenance: Instead of providing direct examples, focus on explaining the process and reasoning behind identifying the topic. This might include: The types of language patterns you looked for (e.g., frequent use of certain terms, sentiment towards a subject), How you connected different posts or comments to form a broader interest area, Any assumptions you made based on the context of the posts.
output format:
0. Start by saying "The following explanation for this interest identified describes the thought process the AI used to identify the interest, including the patterns and connections it found in your browsing history."
Derivation Process:
1. Initial Observation: [Brief description of the initial observation from the content]
2. Intermediate Conclusion 1: [Brief description of the first intermediate conclusion]
3. Intermediate Conclusion 2: [Brief description of the second intermediate conclusion]
...
N. Final Conclusion: [Brief description of how the final prediction was reached]


Filter Content: Exclude sensitive or NSFW content.
Handle Ambiguity: If the meaning of an interaction isn't clear, make your best educated guess based on the available context within my social media activity.
I'm ready to share my social media data! Let's see what interests you find.
Output Format: (only show information like below format, must have 6 pieces.)
Keywords:

=== (Keyword 1)

=== (Keyword 2)

…

Explanations: (please follow the Topics Explanations, only show output format, do not display these phrases: Example-Driven, Reasoning-Focused Provenance, Feature Importance, I want to identify them by myself. )

*** Keyword 1: Explanation

*** Keyword 2: Explanation `;

    // The first-turn assistant message that re-states the output format.
    const FORMAT = `
Output Format: (only show information like below format)

Keywords:

=== (Keyword 1)

=== (Keyword 2) .....

Explanations:

*** Keyword 1: Explanations

*** Keyword 2: Explanations




`;

    // Initial conversation thread: system prompt -> "begin" cue -> assistant
    // confirmation echoing the format (this helps anchor the model's first reply).
    var messages = [
        { role: 'system',    content: GPT4_SYS_PROMPT },
        { role: 'user',      content: "begin" },
        { role: 'assistant', content: FORMAT }
    ];

    // Persist the seed conversation for downstream blocks of the survey.
    Qualtrics.SurveyEngine.setEmbeddedData(EMBEDDED_DATA_DEST, JSON.stringify(messages));

    // Reference for use inside callbacks below.
    const question_this = this;

    // Track length of the seed thread so we can detect when the participant has replied.
    var initial_messages_length = messages.length;
    Qualtrics.SurveyEngine.setEmbeddedData("initial", initial_messages_length);

    // ----- UI: replace the default Next button with a custom Submit -----------

    this.disableNextButton();
    jQuery(".advanceButtonContainer").empty();

    // Build the custom Submit button.
    var newButton = jQuery('<input type="button" value="Submit Response" class="CustomButton" id="submitButton" disabled>');
    newButton.appendTo(jQuery(this.questionContainer));
    jQuery(newButton).prop("disabled", false);

    // ----- Submit handler ------------------------------------------------------

    jQuery("#submitButton").click(function () {
        var current_user_response = jQuery(".InputText").val();
        Qualtrics.SurveyEngine.setEmbeddedData("input", current_user_response);
        jQuery(".InputText").hide();

        // Minimum-length gate to keep accidental empty submits from triggering
        // an API call. The threshold is conservative; the prompt expects 100-200 lines.
        if ((current_user_response == undefined) || (current_user_response.length < 100)) {
            alert("Please copy and paste around 100-200 lines of browsing history that might reflect your interests before submitting.");
            jQuery(".InputText").show();
            return;
        }

        jQuery("#submitButton").prop("disabled", true);

        // Append participant input to the conversation thread.
        messages.push({
            role: 'user',
            content: current_user_response,
        });
        Qualtrics.SurveyEngine.setEmbeddedData(EMBEDDED_DATA_DEST, JSON.stringify(messages));

        // ----- API request body ------------------------------------------------

        const data = {
            model: OPENAI_MODEL,
            messages: messages,
            max_tokens: 3600,
            temperature: 0.6,
        };

        // ----- Call OpenAI -----------------------------------------------------

        fetch(OPENAI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': OPENAI_API_KEY
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // The model's reply text.
            var message = data.choices[0].message.content;

            // Replace the question text with the model output so the participant sees the result.
            $$('.QuestionText')[0].innerText = message;
            $$('.QuestionText')[1].innerText = 'TrailGazer has successfully analyzed your interests, see above. Do not worry about analyzing everything now – you will get to rate each interest in detail later. Please continue to the next step.';

            // ----- Parse the response into keywords + explanations -----------

            // Convert newlines to <br> for HTML display.
            var hisout = data.choices[0].message.content;
            var parts6 = hisout.replace(/\n/g, '<br>');

            // The model returns a "Keywords:" block followed by an "Explanations:"
            // block. Split on "Explanations:" to separate the two halves.
            var parts = parts6.split("Explanations:");
            var keywordsPart  = parts[0];
            var paragraphsPart = parts[1] || "";

            // Each keyword is delimited by "===". Paragraphs are delimited by "***".
            var keywords = keywordsPart.split("===");
            if (keywords.length > 1) Qualtrics.SurveyEngine.setEmbeddedData('keyword1', keywords[1].trim());
            if (keywords.length > 2) Qualtrics.SurveyEngine.setEmbeddedData('keyword2', keywords[2].trim());
            if (keywords.length > 3) Qualtrics.SurveyEngine.setEmbeddedData('keyword3', keywords[3].trim());
            if (keywords.length > 4) Qualtrics.SurveyEngine.setEmbeddedData('keyword4', keywords[4].trim());
            if (keywords.length > 5) Qualtrics.SurveyEngine.setEmbeddedData('keyword5', keywords[5].trim());
            if (keywords.length > 6) Qualtrics.SurveyEngine.setEmbeddedData('keyword6', keywords[6].trim());

            var paragraphs = paragraphsPart.split("***");
            if (paragraphs.length > 1) Qualtrics.SurveyEngine.setEmbeddedData('message1', paragraphs[1].trim());
            if (paragraphs.length > 2) Qualtrics.SurveyEngine.setEmbeddedData('message2', paragraphs[2].trim());
            if (paragraphs.length > 3) Qualtrics.SurveyEngine.setEmbeddedData('message3', paragraphs[3].trim());
            if (paragraphs.length > 4) Qualtrics.SurveyEngine.setEmbeddedData('message4', paragraphs[4].trim());
            if (paragraphs.length > 5) Qualtrics.SurveyEngine.setEmbeddedData('message5', paragraphs[5].trim());
            if (paragraphs.length > 6) Qualtrics.SurveyEngine.setEmbeddedData('message6', paragraphs[6].trim());

            Qualtrics.SurveyEngine.setEmbeddedData("XX", paragraphs.length);
            Qualtrics.SurveyEngine.setEmbeddedData("YY", keywords.length);
            Qualtrics.SurveyEngine.setEmbeddedData("ml", messages.length);

            // Reset input field and re-enable navigation.
            jQuery(".InputText").val('');
            jQuery("#submitButton").prop("disabled", false);
            question_this.enableNextButton();
            jQuery("#submitButton").prop("disabled", true);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            Qualtrics.SurveyEngine.setEmbeddedData("API Error", "true");
            // Allow the participant to advance even on API failure so they don't get stuck.
            question_this.enableNextButton();
        });
    });

});

Qualtrics.SurveyEngine.addOnReady(function () {
    /* Place your JavaScript here to run when the page is fully displayed */
});

Qualtrics.SurveyEngine.addOnUnload(function () {
    /* Place your JavaScript here to run when the page is unloaded */
});
