import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiVisionService {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-2.0-flash';

  private getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  async checkConnection(): Promise<boolean> {
    const apiKey = process.env.GEMINI_API_KEY;
    return !!apiKey && apiKey.length > 0 && apiKey !== 'PASTE_YOUR_KEY_HERE';
  }

  async isModelAvailable(): Promise<boolean> {
    // Gemini models are always available if API key is valid
    return this.checkConnection();
  }

  async generateAltText(imageBase64: string, context?: string): Promise<string> {
    const prompt = context
      ? `Describe this image for a visually impaired user. Context: ${context}. Provide a concise but descriptive alt-text (1-2 sentences) that captures the essential visual information.`
      : `Describe this image for a visually impaired user. Provide a concise but descriptive alt-text (1-2 sentences) that captures the essential visual information. Focus on the key elements, their arrangement, and any text visible in the image.`;

    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = this.getClient();
        const model = client.getGenerativeModel({ model: this.modelName });

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64
            }
          }
        ]);

        const response = result.response;
        const text = response.text();

        return this.cleanAltText(text);
      } catch (error: any) {
        lastError = error;
        console.error(`Gemini attempt ${attempt}/${maxRetries} failed:`, error?.message || error);

        // Check for rate limit (429) error
        if (error?.status === 429 || error?.message?.includes('429')) {
          const waitTime = attempt * 20000; // 20s, 40s, 60s
          console.log(`Rate limited. Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // For other errors, don't retry
        break;
      }
    }

    console.error('All Gemini attempts failed:', lastError?.message || lastError);
    throw new Error('Failed to generate alt-text. Rate limit exceeded - please try again later.');
  }

  async generateBatchAltText(
    images: { id: string; base64: string; context?: string }[]
  ): Promise<{ id: string; altText: string }[]> {
    const results: { id: string; altText: string }[] = [];

    for (const image of images) {
      try {
        const altText = await this.generateAltText(image.base64, image.context);
        results.push({ id: image.id, altText });
      } catch (error) {
        console.error(`Failed to generate alt-text for image ${image.id}:`, error);
        results.push({
          id: image.id,
          altText: 'Image description unavailable'
        });
      }
    }

    return results;
  }

  private cleanAltText(text: string): string {
    // Remove common prefixes that LLMs add
    let cleaned = text
      .replace(/^(This image shows|The image shows|This is an image of|This depicts|The picture shows)\s*/i, '')
      .replace(/^(Here is|Here's)\s*(a|an|the)?\s*(description|alt-text|alt text):\s*/i, '')
      .trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Ensure it ends with a period
    if (cleaned && !cleaned.match(/[.!?]$/)) {
      cleaned += '.';
    }

    return cleaned;
  }
}

export const geminiVisionService = new GeminiVisionService();
