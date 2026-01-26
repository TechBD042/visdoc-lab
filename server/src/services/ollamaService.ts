import { Ollama } from 'ollama';

const ollama = new Ollama({ host: 'http://localhost:11434' });

class OllamaService {
  private modelName = 'llava';

  async checkConnection(): Promise<boolean> {
    try {
      await ollama.list();
      return true;
    } catch {
      return false;
    }
  }

  async isModelAvailable(): Promise<boolean> {
    try {
      const models = await ollama.list();
      return models.models.some(m => m.name.startsWith(this.modelName));
    } catch {
      return false;
    }
  }

  async generateAltText(imageBase64: string, context?: string): Promise<string> {
    const prompt = context
      ? `Describe this image for a visually impaired user. Context: ${context}. Provide a concise but descriptive alt-text (1-2 sentences) that captures the essential visual information.`
      : `Describe this image for a visually impaired user. Provide a concise but descriptive alt-text (1-2 sentences) that captures the essential visual information. Focus on the key elements, their arrangement, and any text visible in the image.`;

    try {
      const response = await ollama.generate({
        model: this.modelName,
        prompt,
        images: [imageBase64],
        options: {
          temperature: 0.3,
          num_predict: 150
        }
      });

      return this.cleanAltText(response.response);
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw new Error('Failed to generate alt-text. Is Ollama running with llava model?');
    }
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

  async chat(messages: { role: string; content: string }[]): Promise<string> {
    try {
      const response = await ollama.chat({
        model: 'llama3.2',
        messages: messages.map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content
        }))
      });

      return response.message.content;
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw new Error('Failed to chat with Ollama');
    }
  }
}

export const ollamaService = new OllamaService();
