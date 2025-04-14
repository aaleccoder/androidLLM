import React, { createContext, useContext, useState } from 'react';
import { loadFile, writeFile } from '../utils/readJson';

// Define types for chat history
export interface Message {
  isUser: boolean;
  text: string;
  timestamp: number;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface AppData {
  apiKeys: {
    gemini: string;
    openRouter: string;
  };
  chatThreads: ChatThread[];
  openRouterModels?: string[];
  activeThreadId?: string;
  settings?: {
    customPrompt?: string;
  };
}

interface DataContextType {
  data: AppData | null;
  loadData: (password: string) => Promise<void>;
  saveData: (newData: AppData, password: string) => Promise<void>;
  createChatThread: (password: string) => Promise<string>;
  updateChatThread: (threadId: string, messages: Message[], password: string) => Promise<void>;
  setActiveThread: (threadId: string, password: string) => Promise<void>;
  deleteChatThread: (threadId: string, password: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  const loadData = async (password: string) => {
    try {
      const loadedData = await loadFile(password);
      
      // Migrate older data format if needed
      if (!loadedData.chatThreads) {
        loadedData.chatThreads = [];
      }
      if (!loadedData.openRouterModels) {
        loadedData.openRouterModels = [];
      }
      
      setData(loadedData as AppData);
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  };

  const saveData = async (newData: AppData, password: string) => {
    try {
      await writeFile(newData, password);
      setData(newData);
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  };

  /**
   * Creates a new chat thread
   */
  const createChatThread = async (password: string): Promise<string> => {
    if (!data) throw new Error('No data loaded');
    
    const newThreadId = Date.now().toString();
    const newThread: ChatThread = {
      id: newThreadId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const updatedData = {
      ...data,
      chatThreads: [...data.chatThreads, newThread],
      activeThreadId: newThreadId
    };
    
    await saveData(updatedData, password);
    return newThreadId;
  };

  /**
   * Updates a chat thread with new messages
   */
  const updateChatThread = async (threadId: string, messages: Message[], password: string) => {
    if (!data) throw new Error('No data loaded');
    
    // Check if any actual changes exist before updating
    const existingThread = data.chatThreads.find(thread => thread.id === threadId);
    if (!existingThread) {
      throw new Error('Thread not found');
    }
    
    // Skip update if messages are the same
    if (existingThread.messages.length === messages.length && 
        JSON.stringify(existingThread.messages) === JSON.stringify(messages)) {
      console.log('No changes in messages, skipping update');
      return;
    }
    
    const updatedThreads = data.chatThreads.map(thread => {
      if (thread.id === threadId) {
        // Update title based on first chat exchange
        let title = thread.title;
        if (title === 'New Chat' && messages.length >= 2) {
          // Find first user message
          const firstUserMessage = messages.find(m => m.isUser)?.text || '';
          
          // Extract a concise title from user's first message
          title = firstUserMessage
            .split('\n')[0] // Take first line
            .replace(/^[#\s]+/, '') // Remove markdown headings and leading spaces
            .substring(0, 50); // Limit length
          
          // Add ellipsis if truncated
          if (firstUserMessage.length > 50) title += '...';
          
          // Fallback if title is too short
          if (title.length < 10) {
            // Try to extract context from AI's first response
            const firstAIResponse = messages.find(m => !m.isUser)?.text || '';
            const aiTitle = firstAIResponse
              .split('\n')[0]
              .replace(/^[#\s]+/, '')
              .substring(0, 50);
              
            if (aiTitle.length > title.length) title = aiTitle;
          }
        }
        
        return {
          ...thread,
          title,
          messages,
          updatedAt: Date.now()
        };
      }
      return thread;
    });
    
    const updatedData = {
      ...data,
      chatThreads: updatedThreads
    };
    
    await saveData(updatedData, password);
  };

  /**
   * Sets the active thread
   */
  const setActiveThread = async (threadId: string, password: string) => {
    if (!data) throw new Error('No data loaded');
    
    const updatedData = {
      ...data,
      activeThreadId: threadId
    };
    
    await saveData(updatedData, password);
  };

  /**
   * Deletes a chat thread
   */
  const deleteChatThread = async (threadId: string, password: string) => {
    console.log("here");
    if (!data) throw new Error('No data loaded');
    
    // Find if there's a thread to delete
    const threadToDelete = data.chatThreads.find(thread => thread.id === threadId);
    if (!threadToDelete) {
      throw new Error('Thread not found');
    }
    
    // Filter out the deleted thread
    const updatedThreads = data.chatThreads.filter(thread => thread.id !== threadId);
    
    // Handle active thread management
    let activeThreadId = data.activeThreadId;
    if (activeThreadId === threadId) {
      // If we're deleting the active thread, set the most recent thread as active
      // or undefined if no threads remain
      activeThreadId = updatedThreads.length > 0 ? 
        updatedThreads.sort((a, b) => b.updatedAt - a.updatedAt)[0].id : 
        undefined;
    }
    
    const updatedData = {
      ...data,
      chatThreads: updatedThreads,
      activeThreadId
    };
    
    // Save the updated data
    await saveData(updatedData, password);
  };

  return (
    <DataContext.Provider value={{ 
      data, 
      loadData, 
      saveData,
      createChatThread,
      updateChatThread,
      setActiveThread,
      deleteChatThread
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};