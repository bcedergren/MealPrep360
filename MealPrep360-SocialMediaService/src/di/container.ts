import { Container } from 'typescript-ioc';
import {
	MessageServiceToken,
	NotificationServiceToken,
	ModerationServiceToken,
	AuthServiceToken,
} from './tokens';
import { MessageService } from '../services/MessageService';
import { ModerationService } from '../services/ModerationService';
import { NotificationService } from '../services/NotificationService';
import { AuthService } from '../services/AuthService';
import { BaseRepository } from '../repositories/BaseRepository';
import { Message } from '../models/Message';
import { Post } from '../models/Post';
import { Report } from '../models/Report';
import { OpenAIConfig } from '../interfaces/ai';

// Load OpenAI configuration from environment
const openAIConfig: OpenAIConfig | undefined = process.env.OPENAI_API_KEY
	? {
			apiKey: process.env.OPENAI_API_KEY,
			organization: process.env.OPENAI_ORGANIZATION,
			maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3', 10),
			timeout: parseInt(process.env.OPENAI_TIMEOUT || '10000', 10),
		}
	: undefined;

// Configure services
Container.bind(MessageServiceToken).to(MessageService);
Container.bind(NotificationServiceToken).to(NotificationService);
Container.bind(ModerationServiceToken).factory(() => {
	const reportRepository = new BaseRepository(Report);
	return new ModerationService(reportRepository, openAIConfig);
});
Container.bind(AuthServiceToken).to(AuthService);

// Configure model injections
Container.bindName('MessageModel').to(Message);
Container.bindName('PostModel').to(Post);

export { Container };
