const STORAGE_KEY = 'flashcards_data';
const REVIEW_PROGRESS_KEY = 'review_progress';

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

// 保存复习进度
export const saveReviewProgress = (progress) => {
    try {
        localStorage.setItem(REVIEW_PROGRESS_KEY, JSON.stringify(progress));
    } catch (error) {
        console.error('Failed to save review progress:', error);
    }
};

// 加载复习进度
export const loadReviewProgress = () => {
    try {
        const data = localStorage.getItem(REVIEW_PROGRESS_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to load review progress:', error);
        return null;
    }
};

// 清除复习进度
export const clearReviewProgress = () => {
    localStorage.removeItem(REVIEW_PROGRESS_KEY);
};
