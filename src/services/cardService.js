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
        return data;
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
    }
};
