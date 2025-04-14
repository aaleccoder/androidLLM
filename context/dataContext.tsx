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
    groq: string;
  };
  chatThreads: ChatThread[];
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
        // Update title based on first AI response if it's a new chat
        let title = thread.title;
        if (title === 'New Chat' && messages.length >= 2 && !messages[0].isUser) {
          // Extract title from first AI message (use first line or first 20 chars)
          const firstMessage = messages[1].isUser ? messages[0].text : messages[1].text;
          title = firstMessage.split('\n')[0].replace(/^#+\s*/, '').substring(0, 30);
          if (title.length === 30) title += '...';
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