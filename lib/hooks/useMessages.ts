// lib/hooks/useMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Message, MessageCreateInput } from '@/types';
import {
  getAllMessages,
  createMessage,
  updateMessage,
  toggleMessageComplete,
  deleteMessage,
} from '@/lib/storage/database';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const loadMessages = useCallback(async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true);
      }
      setError(null);
      const data = await getAllMessages();
      setMessages(data);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const addMessage = useCallback(async (input: MessageCreateInput): Promise<Message | null> => {
    try {
      const newMessage = await createMessage(input);
      setMessages(prev => [newMessage, ...prev]);
      return newMessage;
    } catch (err) {
      console.error('Add message error:', err);
      setError('Failed to add message');
      return null;
    }
  }, []);

  const editMessage = useCallback(async (id: string, updates: Partial<Message>): Promise<Message | null> => {
    try {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === id ? { ...msg, ...updates, updatedAt: new Date().toISOString() } : msg
        )
      );
      
      const updated = await updateMessage(id, updates);
      if (!updated) {
        await loadMessages();
      }
      return updated;
    } catch (err) {
      console.error('Edit message error:', err);
      await loadMessages();
      return null;
    }
  }, [loadMessages]);

  const toggleComplete = useCallback(async (id: string): Promise<boolean> => {
    try {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === id ? { ...msg, isCompleted: !msg.isCompleted } : msg
        )
      );
      
      const updated = await toggleMessageComplete(id);
      return !!updated;
    } catch (err) {
      console.error('Toggle complete error:', err);
      await loadMessages();
      return false;
    }
  }, [loadMessages]);

  const removeMessage = useCallback(async (id: string): Promise<boolean> => {
    try {
      setMessages(prev => prev.filter(msg => msg.id !== id));
      
      const success = await deleteMessage(id);
      if (!success) {
        await loadMessages();
        return false;
      }
      return true;
    } catch (err) {
      console.error('Delete message error:', err);
      await loadMessages();
      return false;
    }
  }, [loadMessages]);

  // Filter helpers
  const notes = messages.filter(m => m.type === 'note');
  const tasks = messages.filter(m => m.type === 'task');
  const reminders = messages.filter(m => m.type === 'reminder');
  const incompleteTasks = tasks.filter(t => !t.isCompleted);

  return {
    messages,
    notes,
    tasks,
    reminders,
    incompleteTasks,
    loading,
    error,
    loadMessages,
    addMessage,
    editMessage,
    toggleComplete,
    removeMessage,
  };
}