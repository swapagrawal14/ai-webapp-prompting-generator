/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';

declare global {
  interface Window {
    marked: {
      parse(markdown: string): string;
    };
  }
}

// --- DOM ELEMENT REFERENCES ---
// API Key Section
const apiKeyContainer = document.getElementById('api-key-container');
const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
const saveKeyBtn = document.getElementById('save-key-btn') as HTMLButtonElement;
const apiKeyError = document.getElementById('api-key-error');

// Main App Section
const appContainer = document.getElementById('app-container');
const appIdeaInput = document.getElementById('app-idea-input') as HTMLTextAreaElement;
const keyFeaturesInput = document.getElementById('key-features-input') as HTMLInputElement;
const targetAudienceInput = document.getElementById('target-audience-input') as HTMLInputElement;
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
const loader = document.getElementById('loader');
const outputSection = document.getElementById('output-section');
const promptOutputDiv = document.getElementById('prompt-output');
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const errorMessageDiv = document.getElementById('error-message');

// --- GEMINI API SETUP ---
const SYSTEM_INSTRUCTIONS = `You are an expert Product Manager and Software Architect.
Your task is to take a user's raw app idea and transform it into a comprehensive and detailed development prompt.
This prompt should be well-structured and clear enough for an AI developer or a human engineering team to start building the app.
The output MUST be in markdown format.

Structure your response into the following sections:

### 1. App Overview & Core Value Proposition
- Briefly summarize the app idea.
- Clearly state the primary problem it solves and for whom.
- What makes this app unique or better than existing solutions?

### 2. User Stories & Key Features
- Write clear user stories (e.g., "As a [user type], I want to [action], so that [benefit].").
- Detail the key features provided by the user, and add any other essential features that would be necessary for a minimum viable product (MVP).
- Group related features together.

### 3. UI/UX Design & Branding
- Suggest a look and feel (e.g., modern, minimalist, playful).
- Recommend a color palette and font pairing.
- Describe the key screens and user flows (e.g., Onboarding, Main Dashboard, Settings).

### 4. Technical Stack Recommendation
- Suggest a suitable technology stack for the frontend, backend, and database.
- Justify your choices briefly (e.g., "React Native for cross-platform mobile development," "Firebase for easy backend setup and real-time features").
- Mention any necessary APIs or third-party services (e.g., Stripe for payments, Google Maps for location).

### 5. Monetization Strategy
- Suggest potential ways the app could generate revenue (e.g., Freemium model, Subscription, In-app purchases, Ads).`;

let ai: GoogleGenAI | null = null;
let rawResponseText = '';

/**
 * Handles saving the user's API key and initializing the app.
 */
function handleSaveKey() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    if (apiKeyError) {
      apiKeyError.textContent = 'Please enter a valid API key.';
      apiKeyError.classList.remove('hidden');
    }
    return;
  }
  
  ai = new GoogleGenAI({ apiKey });

  apiKeyContainer?.classList.add('hidden');
  appContainer?.classList.remove('hidden');
  if(apiKeyError) apiKeyError.classList.add('hidden');
}


/**
 * Sets the loading state of the UI.
 * @param isLoading - Whether the app is in a loading state.
 */
function setLoading(isLoading: boolean) {
  if (isLoading) {
    loader?.classList.remove('hidden');
    generateBtn.disabled = true;
  } else {
    loader?.classList.add('hidden');
    generateBtn.disabled = false;
  }
}

/**
 * Displays an error message in the UI.
 * @param message - The error message to display.
 */
function showError(message: string) {
  if (!errorMessageDiv) return;
  errorMessageDiv.textContent = message;
  errorMessageDiv.classList.remove('hidden');
}

/** Hides the error message. */
function hideError() {
  if (errorMessageDiv) errorMessageDiv.classList.add('hidden');
}

/** Handles the "Generate Prompt" button click. */
async function handleGenerate() {
  if (!ai) {
    showError('API client is not initialized. Please configure your API key.');
    return;
  }
    
  const idea = appIdeaInput.value.trim();
  const features = keyFeaturesInput.value.trim();
  const audience = targetAudienceInput.value.trim();

  if (!idea) {
    showError('Please enter your core app idea.');
    return;
  }

  hideError();
  setLoading(true);
  outputSection?.classList.add('hidden');

  const userPrompt = `
    Core App Idea: ${idea}
    Key Features to Include: ${features || 'User has not specified any particular features.'}
    Target Audience: ${audience || 'User has not specified a target audience.'}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: { systemInstruction: SYSTEM_INSTRUCTIONS },
    });

    rawResponseText = response.text;
    const htmlContent = window.marked.parse(rawResponseText);

    if (promptOutputDiv) {
      promptOutputDiv.innerHTML = htmlContent;
    }
    outputSection?.classList.remove('hidden');
  } catch (error) {
    console.error('Error generating prompt:', error);
    showError(
      `An error occurred while generating the prompt. Please check your API key and network connection. Details: ${
        (error as Error).message
      }`,
    );
  } finally {
    setLoading(false);
  }
}

/** Handles copying the generated prompt text to the clipboard. */
function handleCopy() {
  if (!rawResponseText) return;
  navigator.clipboard
    .writeText(rawResponseText)
    .then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Prompt';
      }, 2000);
    })
    .catch((err) => {
      console.error('Failed to copy text: ', err);
      showError('Failed to copy text to clipboard.');
    });
}

// --- EVENT LISTENERS ---
saveKeyBtn?.addEventListener('click', handleSaveKey);
apiKeyInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleSaveKey();
  }
});
generateBtn?.addEventListener('click', handleGenerate);
copyBtn?.addEventListener('click', handleCopy);
