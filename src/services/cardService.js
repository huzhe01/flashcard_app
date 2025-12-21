import { supabase } from '../lib/supabase';
import Papa from 'papaparse';

// Helper to parse CSV (legacy support / local mode)
export const parseCSV = (csvText) => {
    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error),
        });
    });
};

export const cardService = {
    // Fetch cards from Supabase or fallback
    async getCards(user) {
        if (!user) return [];

        let allData = [];
        let from = 0;
        const PAGE_SIZE = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('flashcards')
                .select('*')
                .range(from, from + PAGE_SIZE - 1)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) {
                hasMore = false;
                break;
            }

            allData = [...allData, ...data];
            
            if (data.length < PAGE_SIZE) {
                hasMore = false;
            } else {
                from += PAGE_SIZE;
            }
        }

        // Normalize data for frontend (map tags to category)
        return allData.map(card => ({
            ...card,
            category: card.tags && card.tags.length > 0 ? card.tags[0] : 'Uncategorized'
        }));
    },

    async addCard(card, user) {
        if (!user) throw new Error('User must be logged in');

        const { data, error } = await supabase
            .from('flashcards')
            .insert([
                {
                    user_id: user.id,
                    front: card.front,
                    back: card.back,
                    tags: card.tags || [],
                    review_count: 0,
                    // next_review_date defaults to now() in DB
                }
            ])
            .select();

        if (error) throw error;
        return data[0];
    },

    async batchAddCards(cards, user) {
        if (!user) throw new Error('User must be logged in');

        const payload = cards.map(card => ({
            user_id: user.id,
            front: card.front,
            back: card.back,
            tags: card.tags || [],
            review_count: 0
        }));

        // Split into chunks of 500
        const CHUNK_SIZE = 500;
        for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
            const chunk = payload.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
                .from('flashcards')
                .insert(chunk);
            if (error) throw error;
        }
    },

    async updateCard(id, updates) {
        const { data, error } = await supabase
            .from('flashcards')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async deleteCard(id) {
        const { error } = await supabase
            .from('flashcards')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Advanced Features
    async getDueCards(user, limit = 20) {
        if (!user) return [];

        const now = new Date().toISOString();

        // 1. Fetch cards due for review
        const { data: dueCards, error: dueError } = await supabase
            .from('flashcards')
            .select('*')
            .lte('next_review_date', now)
            .order('next_review_date', { ascending: true })
            .limit(limit);

        if (dueError) throw dueError;

        let cards = dueCards || [];

        // 2. If not enough, fill with new cards (review_count = 0)
        if (cards.length < limit) {
            const remaining = limit - cards.length;
            const { data: newCards, error: newError } = await supabase
                .from('flashcards')
                .select('*')
                .eq('review_count', 0)
                .limit(remaining);

            if (!newError && newCards) {
                cards = [...cards, ...newCards];
            }
        }

        // Normalize
        return cards.map(card => ({
            ...card,
            category: card.tags && card.tags.length > 0 ? card.tags[0] : 'Uncategorized'
        }));
    },

    async batchDelete(ids) {
        // Split into chunks of 50 to prevent URL limits (URL length limit is ~2048 chars)
        // 50 UUIDs is approx 1800 chars, which is safe.
        const CHUNK_SIZE = 50;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
                .from('flashcards')
                .delete()
                .in('id', chunk);
            if (error) throw error;
        }
    },

    async batchUpdateCategory(ids, newCategory) {
        // Update requests also use query params for filtering
        const CHUNK_SIZE = 50;
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase
                .from('flashcards')
                .update({ tags: [newCategory] }) // Assuming single category tag for now
                .in('id', chunk);
            if (error) throw error;
        }
    }
};
