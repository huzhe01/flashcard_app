import React, { useState, useMemo } from 'react';

const DailyReviewModal = ({ flashcards, onClose, onStartReview }) => {
    const [selectedTags, setSelectedTags] = useState([]);
    const [cardCount, setCardCount] = useState(10);

    // 可用标签
    const availableTags = useMemo(() => {
        const tags = new Set();
        flashcards.forEach(card => {
            const category = card.category || 'Uncategorized';
            tags.add(category);
        });
        return Array.from(tags).sort();
    }, [flashcards]);

    // 选中标签下的卡片数量
    const selectedCardCount = useMemo(() => {
        if (selectedTags.length === 0) return flashcards.length;
        return flashcards.filter(card =>
            selectedTags.includes(card.category || 'Uncategorized')
        ).length;
    }, [flashcards, selectedTags]);

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const selectAllTags = () => setSelectedTags(availableTags);
    const clearAllTags = () => setSelectedTags([]);

    const handleStartReview = () => {
        let eligibleCards = flashcards;
        if (selectedTags.length > 0) {
            eligibleCards = flashcards.filter(card =>
                selectedTags.includes(card.category || 'Uncategorized')
            );
        }

        if (eligibleCards.length === 0) {
            alert('没有符合条件的卡片！');
            return;
        }

        // 打乱并截取数量
        const shuffled = [...eligibleCards].sort(() => Math.random() - 0.5);
        const reviewCards = shuffled.slice(0, Math.min(cardCount, shuffled.length));

        onStartReview(reviewCards);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="daily-review-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🎯 每日回顾</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="review-section">
                        <div className="section-header">
                            <label>选择标签分类</label>
                            <div className="tag-actions">
                                <button className="tag-action-btn" onClick={selectAllTags}>全选</button>
                                <button className="tag-action-btn" onClick={clearAllTags}>清除</button>
                            </div>
                        </div>
                        <div className="tag-grid">
                            {availableTags.map(tag => (
                                <div
                                    key={tag}
                                    className={`tag-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    <span className="tag-name">{tag}</span>
                                    <span className="tag-count">
                                        {flashcards.filter(c => (c.category || 'Uncategorized') === tag).length}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {selectedTags.length === 0 && (
                            <p className="hint-text">未选择标签时将从所有卡片中随机抽取</p>
                        )}
                    </div>

                    <div className="review-section">
                        <label>回顾卡片数量</label>
                        <div className="count-input-group">
                            <input
                                type="range"
                                min="5"
                                max={Math.min(50, Math.max(selectedCardCount, 1))}
                                value={Math.min(cardCount, Math.max(selectedCardCount, 1))}
                                onChange={(e) => setCardCount(Number(e.target.value))}
                                className="count-slider"
                            />
                            <input
                                type="number"
                                min="1"
                                max={Math.max(selectedCardCount, 1)}
                                value={cardCount}
                                onChange={(e) => setCardCount(Math.max(1, Number(e.target.value)))}
                                className="count-number"
                            />
                        </div>
                        <p className="hint-text">
                            可用卡片: {selectedCardCount} 张
                            {selectedTags.length > 0 && ` (已选 ${selectedTags.length} 个标签)`}
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        取消
                    </button>
                    <button
                        className="btn btn-primary daily-review-start-btn"
                        onClick={handleStartReview}
                        disabled={selectedCardCount === 0}
                    >
                        🚀 开始回顾 ({Math.min(cardCount, Math.max(selectedCardCount, 1))} 张卡片)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DailyReviewModal;

