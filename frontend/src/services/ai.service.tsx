import api from './api';

export interface AIResponse {
    success: boolean;
    message?: string;

    result?: {
        success?: boolean;
        type?: string;
        reply?: string;
        message?: string;
        confirmation?: boolean;
        workflow?: number;
        steps?: any[];
        results?: {
            steps?: any[];
            context?: any;
        };
        ai?: {
            reply?: string;
        };
    };
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