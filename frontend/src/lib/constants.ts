export const CATEGORIES = [
  { slug: 'data-analysis', name: 'Data Analysis', icon: '\ud83d\udcca' },
  { slug: 'automation', name: 'Automation & Workflows', icon: '\u2699\ufe0f' },
  { slug: 'development', name: 'Code & Development', icon: '\ud83d\udcbb' },
  { slug: 'web-browser', name: 'Web & Browser', icon: '\ud83c\udf10' },
  { slug: 'content-creation', name: 'Content Creation', icon: '\u270d\ufe0f' },
  { slug: 'integration-apis', name: 'Integration & APIs', icon: '\ud83d\udd17' },
  { slug: 'research-learning', name: 'Research & Learning', icon: '\ud83d\udcda' },
  { slug: 'devops-infra', name: 'DevOps & Infrastructure', icon: '\ud83d\udd27' },
  { slug: 'communication', name: 'Communication', icon: '\ud83d\udcac' },
];

export const TOOL_ICONS: Record<string, string> = {
  terminal: '\ud83d\udda5\ufe0f',
  file: '\ud83d\udcc1',
  web_search: '\ud83d\udd0d',
  browser: '\ud83c\udf10',
  image_gen: '\ud83c\udfa8',
  code_execution: '\u26a1',
  vision: '\ud83d\udc41\ufe0f',
  tts: '\ud83d\udd0a',
  skills: '\ud83e\udde9',
  memory: '\ud83e\udde0',
  delegation: '\ud83e\udd1d',
  cronjob: '\u23f0',
  clarify: '\u2753',
  webhook: '\ud83d\udd14',
};

export const TOOL_LABELS: Record<string, string> = {
  terminal: 'Terminal',
  file: 'File',
  web_search: 'Web Search',
  browser: 'Browser',
  image_gen: 'Image Gen',
  code_execution: 'Code Exec',
  vision: 'Vision',
  tts: 'Text-to-Speech',
  skills: 'Skills',
  memory: 'Memory',
  delegation: 'Delegation',
  cronjob: 'Cron Jobs',
  clarify: 'Clarify',
  webhook: 'Webhooks',
};

export const API_BASE = '/api';
