// =============================================================================
//  Social Media Interest Extractor — Qualtrics question-level JavaScript
//
//  Used in the IRB-approved study reported in:
//  Rao et al. (ICALT 2026), "Identifying Student Interests for Interest-Based
//  Learning: A Comparison of Interest Extraction from Browsing History and
//  Social Media Posts."
//
//  WHAT IT DOES
//    1. Initializes a chat-style conversation with gpt-4-turbo-preview seeded
//       with the SM extraction system prompt (see prompts/social_media_prompt.md).
//    2. When the participant pastes their 50–70 social-media posts and clicks
//       "Submit Response", appends the post text as a user message and calls
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
    const EMBEDDED_DATA_DEST2 = "convo_history2";

    // OpenAI API credentials. SEE SECURITY WARNING ABOVE — never commit a real key.
    const OPENAI_API_KEY2  = "Bearer YOUR_OPENAI_API_KEY_HERE";
    const OPENAI_ENDPOINT2 = "https://api.openai.com/v1/chat/completions";
    const OPENAI_MODEL2    = "gpt-4-turbo-preview";

    // ----- System prompt and conversation seed ---------------------------------

    // The full system prompt describing the AI Interest Analyst's task,
    // expected output format, and three explanation types.
    // See prompts/social_media_prompt.md for the human-readable version.
    const GPT4_SYS_PROMPT2 = `Hello! You're an AI Interest Analyst. Research consistently demonstrates the powerful impact of interest on learning, your help is very important for us to have a robust understanding of student interests. I'll provide my 50-70 posts from my social media, including posts and comments from platforms like Reddit, Facebook, Twitter, and Instagram. Please do the following:
Group Related Interactions: Examine my social media activity and group related interactions. Find patterns and themes in my posts and comments, creating distinct topic groups.
Extract Keywords: Find 6 topic keywords that represent the major topic groups you discover. Please exclude any content related to email, learning management systems, or academic research/work activities.
Topics Explanations: For each topic keyword, provide one of the following explanations. Must use each type twice, don't label it in your output, but please give some context about what kind of explanation is being provided to improve personal relevance.
-Feature Importance: List the most important keywords, phrases, or other features you used to extract the interests with their importance ratings. Use the following key-value format:
output format:
-- Start by saying "The explanation for this interest identified lists the most important words and phrases from your posts that led to identifying the interest, along with their importance scores."
--Keyword/Phrase: (Insert the most important keyword or phrase related to the interest ) - (Score between 0 and 1)
--Score Meaning: Explain what the scores mean using these guidelines:
High: Scores >= 0.8 --> Strong indicator of the interest, Moderate: Scores between 0.6 and 0.8 --> Relevant factor in the interest, Low Importance: Scores below 0.6 --> Minimal influence on the interest.
-Example-Driven: Show original data ("Direct Quote") of one or two relevant text snippets you used to extract the interests.
Based on Similar Instances.
output format:
- Start by saying "The explanation for this interest identified shows direct examples from your posts or comments that illustrate why the AI picked up on this interest."
- Similar Instance 1: ["Direct Quote"]
  * Reason for Similarity: [Explanation of why this instance is similar]
- Similar Instance 2: ["Direct Quote"]
  * Reason for Similarity: [Explanation of why this instance is similar]
-Reasoning-Focused Provenance: Instead of providing direct examples, focus on explaining the process and reasoning behind identifying the topic. This might include: The types of language patterns you looked for (e.g., frequent use of certain terms, sentiment towards a subject), How you connected different posts or comments to form a broader interest area, Any assumptions you made based on the context of the posts.
output format:
0. Start by saying "The following explanation for this interest identified describes the thought process the AI used to identify the interest, including the patterns and connections it found in your posts."
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
*** Keyword 1: Explanations
*** Keyword 2: Explanations
 `;

    // The first-turn assistant message that re-states the output format.
    const FORMAT2 = `
Output Format: (only show information like below format)
Keywords:
=== (Keyword 1)
=== (Keyword 2) .....
Explanations:
*** Keyword 1: Explanations
*** Keyword 2: Explanations`;

    // Initial conversation thread: system prompt -> format reminder -> assistant
    // confirmation echoing the format (this helps anchor the model's first reply).
    var messageS = [
        { role: 'system',    content: GPT4_SYS_PROMPT2 },
        { role: 'user',      content: "Remember to use each explanation type twice, please refrain from explicitly stating the type of explanation you're using (e.g., 'Feature Importance,' 'Example-Driven', 'Provenance').**. Quick formatting reminder regarding the 3 types of explanations, please follow the following strictly: Please no direct label of the type of explanation you are using here. Feature Importance: Keyword/Phrase: (Insert the most important keyword or phrase related to the interest ) - (Score between 0 and 1). Example-Driven: “Direct Quote from posts”. Reasoning-Focused Provenance: NO direct quote, but describes the analytical process." },
        { role: 'assistant', content: FORMAT2 }
    ];

    // Persist the seed conversation for downstream blocks of the survey.
    Qualtrics.SurveyEngine.setEmbeddedData(EMBEDDED_DATA_DEST2, JSON.stringify(messageS));

    // Reference for use inside callbacks below.
    const question_this2 = this;

    // Track length of the seed thread so we can detect when the participant has replied.
    var initial_messages_length2 = messageS.length;
    Qualtrics.SurveyEngine.setEmbeddedData("initial2", initial_messages_length2);

    // ----- UI: replace the default Next button with a custom Submit -----------

    this.disableNextButton();
    jQuery(".advanceButtonContainer").empty();

    // Build the custom Submit button.
    var newButton2 = jQuery('<input type="button" value="Submit Response" class="CustomButton2" id="submitButton2" disabled>');
    newButton2.appendTo(jQuery(this.questionContainer));
    jQuery(newButton2).prop("disabled", false);

    // ----- Submit handler ------------------------------------------------------

    jQuery("#submitButton2").click(function () {
        var current_user_response2 = jQuery(".InputText").val();
        jQuery(".InputText").hide();

        // Minimum-length gate to keep accidental empty submits from triggering
        // an API call. The threshold is conservative; the prompt expects 50-70 posts.
        if ((current_user_response2 == undefined) || (current_user_response2.length < 100)) {
            alert("Please copy and paste around 50-70 posts and comments that might reflect your interests before submitting.");
            jQuery(".InputText").show();
            return;
        }

        jQuery("#submitButton2").prop("disabled", true);

        // Append participant input to the conversation thread.
        messageS.push({
            role: 'user',
            content: current_user_response2,
        });
        Qualtrics.SurveyEngine.setEmbeddedData(EMBEDDED_DATA_DEST2, JSON.stringify(messageS));

        // ----- API request body ------------------------------------------------

        const data2 = {
            model: OPENAI_MODEL2,
            messages: messageS,
            max_tokens: 3600,
            temperature: 0.6,
        };

        // ----- Call OpenAI -----------------------------------------------------

        fetch(OPENAI_ENDPOINT2, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': OPENAI_API_KEY2
            },
            body: JSON.stringify(data2)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data2 => {
            // The model's reply text.
            var messageS = data2.choices[0].message.content;

            // Replace the question text with the model output so the participant sees the result.
            $$('.QuestionText')[0].innerText = messageS;
            $$('.QuestionText')[1].innerText = 'PulseReader has successfully analyzed your interests, see above. Do not worry about analyzing everything now – you will get to rate each interest in detail later. Please continue to the next step.';

            // ----- Parse the response into keywords + explanations -----------

            // Convert newlines to <br> for HTML display.
            var hisout3 = data2.choices[0].message.content;
            var hisout2 = hisout3.replace(/\n/g, '<br>');

            // The model returns a "Keywords:" block followed by an "Explanations:"
            // block. Split on "Explanations:" to separate the two halves.
            var parts2 = hisout2.split("Explanations:");
            var keywordsPart2  = parts2[0];
            var paragraphsPart2 = parts2[1] || "";

            // Each keyword is delimited by "===". paragraphs are delimited by "***".
            var keywords2 = keywordsPart2.split('===');
            if (keywords2.length > 1) Qualtrics.SurveyEngine.setEmbeddedData('keyword21', keywords2[1].trim());
            if (keywords2.length > 2) Qualtrics.SurveyEngine.setEmbeddedData('keyword22', keywords2[2].trim());
            if (keywords2.length > 3) Qualtrics.SurveyEngine.setEmbeddedData('keyword23', keywords2[3].trim());
            if (keywords2.length > 4) Qualtrics.SurveyEngine.setEmbeddedData('keyword24', keywords2[4].trim());
            if (keywords2.length > 5) Qualtrics.SurveyEngine.setEmbeddedData('keyword25', keywords2[5].trim());
            if (keywords2.length > 6) Qualtrics.SurveyEngine.setEmbeddedData('keyword26', keywords2[6].trim());

            var paragraphs2 = paragraphsPart2.split('***');
            if (paragraphs2.length > 1) Qualtrics.SurveyEngine.setEmbeddedData('message21', paragraphs2[1].trim());
            if (paragraphs2.length > 2) Qualtrics.SurveyEngine.setEmbeddedData('message22', paragraphs2[2].trim());
            if (paragraphs2.length > 3) Qualtrics.SurveyEngine.setEmbeddedData('message23', paragraphs2[3].trim());
            if (paragraphs2.length > 4) Qualtrics.SurveyEngine.setEmbeddedData('message24', paragraphs2[4].trim());
            if (paragraphs2.length > 5) Qualtrics.SurveyEngine.setEmbeddedData('message25', paragraphs2[5].trim());
            if (paragraphs2.length > 6) Qualtrics.SurveyEngine.setEmbeddedData('message26', paragraphs2[6].trim());

            Qualtrics.SurveyEngine.setEmbeddedData("XX2", paragraphs2.length);
            Qualtrics.SurveyEngine.setEmbeddedData("YY2", keywords2.length);
            Qualtrics.SurveyEngine.setEmbeddedData("ml2", messageS.length);

            // Reset input field and re-enable navigation.
            jQuery(".InputText").val('');
            jQuery("#submitButton2").prop("disabled", false);
            question_this2.enableNextButton();
            jQuery("#submitButton2").prop("disabled", true);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            Qualtrics.SurveyEngine.setEmbeddedData("API Error", "true");
            // Allow the participant to advance even on API failure so they don't get stuck.
            question_this2.enableNextButton();
        });
    });

});

Qualtrics.SurveyEngine.addOnReady(function () {
    /* Place your JavaScript here to run when the page is fully displayed */
});

Qualtrics.SurveyEngine.addOnUnload(function () {
    /* Place your JavaScript here to run when the page is unloaded */
});
