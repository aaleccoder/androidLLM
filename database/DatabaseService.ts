import { AppDataSource } from './init';
import { ChatThread } from './init';
import { Message } from './init';
import { ApiKey } from './init';
import { Settings } from './init';
import { Repository } from 'typeorm';
import { encryptField, decryptField, isEncrypted } from '../utils/dbEncryption';

export class DatabaseService {
    private chatThreadRepository: Repository<ChatThread>;
    private messageRepository: Repository<Message>;
    private apiKeyRepository: Repository<ApiKey>;
    private settingsRepository: Repository<Settings>;
    private password: string = '';

    constructor() {
        this.chatThreadRepository = AppDataSource.getRepository(ChatThread);
        this.messageRepository = AppDataSource.getRepository(Message);
        this.apiKeyRepository = AppDataSource.getRepository(ApiKey);
        this.settingsRepository = AppDataSource.getRepository(Settings);
    }

    /**
     * Sets the encryption password for database operations
     */
    setPassword(password: string) {
        this.password = password;
    }

    // Chat Thread Operations
    async createChatThread(title: string, model: { id: string; displayName: string; provider: string }): Promise<ChatThread> {
        const thread = new ChatThread();
        thread.id = Date.now().toString();
        thread.title = title;
        thread.modelId = model.id;
        thread.modelDisplayName = model.displayName;
        thread.modelProvider = model.provider;
        thread.messages = [];
        return await this.chatThreadRepository.save(thread);
    }

    async getChatThread(id: string): Promise<ChatThread | null> {
        const thread = await this.chatThreadRepository.findOne({ 
            where: { id },
            relations: ['messages'],
            order: {
                messages: {
                    timestamp: 'ASC'
                }
            }
        });

        if (thread && thread.messages) {
            // Decrypt message texts
            for (const message of thread.messages) {
                if (isEncrypted(message.text)) {
                    message.text = await decryptField(message.text, this.password);
                }
            }
        }

        return thread;
    }

    async getAllChatThreads(): Promise<ChatThread[]> {
        const threads = await this.chatThreadRepository.find({
            relations: ['messages'],
            order: {
                updatedAt: 'DESC',
                messages: {
                    timestamp: 'ASC'
                }
            }
        });

        // Decrypt all message texts
        for (const thread of threads) {
            for (const message of thread.messages) {
                if (isEncrypted(message.text)) {
                    message.text = await decryptField(message.text, this.password);
                }
            }
        }

        return threads;
    }

    async updateChatThread(id: string, updates: Partial<ChatThread>): Promise<ChatThread | null> {
        await this.chatThreadRepository.update(id, updates);
        return await this.getChatThread(id);
    }

    async deleteChatThread(id: string): Promise<boolean> {
        const result = await this.chatThreadRepository.delete(id);
        return result.affected !== 0;
    }

    // Message Operations
    async addMessage(threadId: string, message: Omit<Message, 'id' | 'chatThread' | 'chatThreadId'>): Promise<Message> {
        const thread = await this.getChatThread(threadId);
        if (!thread) throw new Error('Chat thread not found');

        // Encrypt message text
        const encryptedText = await encryptField(message.text, this.password);

        const newMessage = this.messageRepository.create({
            ...message,
            text: encryptedText,
            chatThread: thread,
            chatThreadId: threadId
        });

        const savedMessage = await this.messageRepository.save(newMessage);
        // Decrypt for return value
        savedMessage.text = message.text; // Original unencrypted text
        return savedMessage;
    }

    // API Key Operations
    async setApiKey(serviceName: string, key: string, password: string): Promise<void> {
        const encryptedKey = await encryptField(key, password);
        await this.apiKeyRepository.upsert(
            { serviceName, encryptedKey },
            ['serviceName']
        );
    }

    async getApiKey(serviceName: string, password: string): Promise<string | null> {
        const apiKey = await this.apiKeyRepository.findOne({
            where: { serviceName }
        });
        
        if (!apiKey) return null;
        
        try {
            return await decryptField(apiKey.encryptedKey, password);
        } catch {
            return null;
        }
    }

    // Settings Operations
    async getSettings(): Promise<Settings> {
        let settings = await this.settingsRepository.findOne({ where: {} });
        if (!settings) {
            settings = new Settings();
            await this.settingsRepository.save(settings);
        }
        return settings;
    }

    async updateSettings(updates: Partial<Settings>): Promise<Settings> {
        let settings = await this.getSettings();
        Object.assign(settings, updates);
        return await this.settingsRepository.save(settings);
    }

    // Migration helper
    async importFromJson(data: any): Promise<void> {
        if (!this.password) {
            throw new Error('Password must be set before importing data');
        }

        // Import chat threads and messages
        if (data.chatThreads) {
            for (const threadData of data.chatThreads) {
                const thread = this.chatThreadRepository.create({
                    id: threadData.id,
                    title: threadData.title,
                    modelId: threadData.model.id,
                    modelDisplayName: threadData.model.displayName,
                    modelProvider: threadData.model.provider,
                    createdAt: new Date(threadData.createdAt),
                    updatedAt: new Date(threadData.updatedAt),
                    isActive: threadData.id === data.activeThreadId
                });
                await this.chatThreadRepository.save(thread);

                // Import messages for this thread
                if (threadData.messages) {
                    for (const msgData of threadData.messages) {
                        // Encrypt message text during import
                        const encryptedText = await encryptField(msgData.text, this.password);
                        await this.messageRepository.save(
                            this.messageRepository.create({
                                isUser: msgData.isUser,
                                text: encryptedText,
                                timestamp: msgData.timestamp,
                                chatThread: thread,
                                chatThreadId: thread.id
                            })
                        );
                    }
                }
            }
        }

        // Import API keys if they exist
        if (data.apiKeys) {
            if (data.apiKeys.gemini) {
                await this.setApiKey('gemini', data.apiKeys.gemini, this.password);
            }
            if (data.apiKeys.openRouter) {
                await this.setApiKey('openRouter', data.apiKeys.openRouter, this.password);
            }
        }

        // Import settings
        if (data.settings) {
            await this.updateSettings({
                customPrompt: data.settings.customPrompt,
                openRouterModels: JSON.stringify(data.openRouterModels || [])
            });
        }
    }

    /**
     * Deletes all data from all tables in the database
     */
    async deleteAllData(): Promise<void> {
        // Delete in order to respect foreign key constraints
        await this.messageRepository.clear();
        await this.chatThreadRepository.clear();
        await this.apiKeyRepository.clear();
        await this.settingsRepository.clear();
    }
}