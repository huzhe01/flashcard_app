const STORAGE_KEY = 'flashcards_data';

export const saveFlashcards = (cards) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
        console.error('Failed to save flashcards:', error);
    }
};

export const loadFlashcards = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load flashcards:', error);
        return [];
    }
};

export const clearFlashcards = () => {
    localStorage.removeItem(STORAGE_KEY);
};
