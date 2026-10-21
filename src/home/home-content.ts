export const HOME_SPEECH_LINES = [
  'What should we tackle first?',
  'I can help you write, research, or code.',
  'Tap me for another idea.',
] as const;

export type HomeSuggestion = {
  id: string;
  title: string;
  subtitle?: string;
};

export const HOME_SUGGESTIONS: HomeSuggestion[] = [
  {
    id: 'code-error',
    title: "What's causing this error in my code?",
  },
  {
    id: 'rest-api',
    title: 'Build a REST API with authentication',
  },
  {
    id: 'summarize',
    title: 'Summarize this article in bullet points',
  },
  {
    id: 'email',
    title: 'Draft a concise follow-up email',
  },
];
