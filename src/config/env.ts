import { 
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  USDA_API_KEY, 
  OPENROUTER_API_KEY,
  EXPO_PUBLIC_OPENROUTER_API_KEY,
  NUTRITION_MODEL,
  DEFAULT_MODEL,
  API_BASE_URL,
  APP_REFERER,
  APP_TITLE,
  MIN_CONFIDENCE_THRESHOLD,
  MAX_RETRIES,
  ANALYSIS_TEMPERATURE,
  GENERAL_TEMPERATURE
} from '@env';

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase configuration is not defined in environment variables');
}

if (!USDA_API_KEY) {
  throw new Error('USDA_API_KEY is not defined in environment variables');
}

if (!OPENROUTER_API_KEY || !EXPO_PUBLIC_OPENROUTER_API_KEY) {
  throw new Error('OpenRouter API keys are not defined in environment variables');
}

const Config = {
  // Database Configuration
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  
  // API Keys
  USDA_API_KEY,
  OPENROUTER_API_KEY,
  EXPO_PUBLIC_OPENROUTER_API_KEY,
  
  // API Configuration
  API_CONFIG: {
    baseURL: API_BASE_URL || 'https://openrouter.ai/api/v1',
    models: {
      default: DEFAULT_MODEL || 'google/gemini-2.0-flash-thinking-exp:free',
      nutrition: NUTRITION_MODEL || 'google/gemini-2.0-flash-exp:free'
    },
    headers: {
      'HTTP-Referer': APP_REFERER || 'https://nutrimind.app',
      'X-Title': APP_TITLE || 'NutriMind'
    },
    parameters: {
      general: {
        temperature: Number(GENERAL_TEMPERATURE) || 0.7,
        max_tokens: 2000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      },
      precise: {
        temperature: Number(ANALYSIS_TEMPERATURE) || 0.3,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }
    },
    analysis: {
      minConfidence: Number(MIN_CONFIDENCE_THRESHOLD) || 0.6,
      maxRetries: Number(MAX_RETRIES) || 3
    }
  },
};

export default Config; 