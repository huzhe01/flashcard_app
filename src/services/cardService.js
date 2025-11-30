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
        if (!user) return []; // Or handle local storage fallback here if we want mixed mode

        const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Normalize data for frontend (map tags to category)
        return data.map(card => ({
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
        const { error } = await supabase
            .from('flashcards')
            .delete()
            .in('id', ids);
        if (error) throw error;
    },

    async batchUpdateCategory(ids, newCategory) {
        const { error } = await supabase
            .from('flashcards')
            .update({ tags: [newCategory] }) // Assuming single category tag for now
            .in('id', ids);
        if (error) throw error;
    }
};
