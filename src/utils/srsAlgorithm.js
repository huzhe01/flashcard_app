// Simplified Spaced Repetition Algorithm
// Based on Ebbinghaus Forgetting Curve / SM-2 concepts

export const calculateNextReview = (currentInterval, rating) => {
    // rating: 'easy', 'medium', 'hard'
    // currentInterval: days since last review (or 0 if new)

    let nextInterval = 1;

    if (rating === 'hard') {
        // Reset or keep short
        nextInterval = 1;
    } else if (rating === 'medium') {
        // 1.5x expansion or minimum 2 days
        nextInterval = Math.max(2, Math.ceil(currentInterval * 1.5));
    } else if (rating === 'easy') {
        // 2.5x expansion or minimum 4 days
        if (currentInterval === 0) nextInterval = 4;
        else nextInterval = Math.ceil(currentInterval * 2.5);
    }

    // Calculate date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);

    return {
        nextReviewDate: nextDate.toISOString(),
        interval: nextInterval
    };
};
