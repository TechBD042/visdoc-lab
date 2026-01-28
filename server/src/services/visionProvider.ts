import { ollamaService } from './ollamaService.js';
import { geminiVisionService } from './geminiVisionService.js';

export interface VisionService {
  checkConnection(): Promise<boolean>;
  isModelAvailable(): Promise<boolean>;
  generateAltText(imageBase64: string, context?: string): Promise<string>;
  generateBatchAltText(
    images: { id: string; base64: string; context?: string }[]
  ): Promise<{ id: string; altText: string }[]>;
}

export type VisionProviderType = 'gemini' | 'ollama';

export function getVisionProvider(): VisionProviderType {
  const provider = process.env.VISION_PROVIDER?.toLowerCase();

  // Explicit provider selection
  if (provider === 'ollama') {
    return 'ollama';
  }
  if (provider === 'gemini') {
    return 'gemini';
  }

  // Auto-detect: prefer Gemini if API key is set, otherwise fallback to Ollama
  if (process.env.GEMINI_API_KEY) {
    return 'gemini';
  }

  return 'ollama';
}

export function getVisionService(): VisionService {
  const provider = getVisionProvider();

  if (provider === 'gemini') {
    return geminiVisionService;
  }

  return ollamaService;
}
