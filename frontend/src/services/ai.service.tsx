import api from './api';

export interface AIResponse {
  success: boolean;
  result: any;
}

export const aiService = {
  async sendMessage(message: string): Promise<AIResponse> {
    const response = await api.post('/ai/chat', {
      message,
    });

    return response.data;
  },
};

export default aiService;