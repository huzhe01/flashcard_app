import React, { useState, useEffect } from 'react';

const Library = ({ flashcards, onStartReview, onClearData, user, onSync }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const cats = new Set(flashcards.map(c => c.category).filter(Boolean));
        setCategories(['all', ...Array.from(cats)]);
    }, [flashcards]);

    const getFilteredCount = () => {
        return flashcards.filter(card => {
            const catMatch = selectedCategory === 'all' || card.category === selectedCategory;
            const diffMatch = selectedDifficulty === 'all' ||
                (selectedDifficulty === 'new' && !card.difficulty) ||
                card.difficulty === selectedDifficulty;
            return catMatch && diffMatch;
        }).length;
    };

    const handleStart = () => {
        onStartReview({
            category: selectedCategory,
            difficulty: selectedDifficulty
        });
    };

    const counts = {
        total: flashcards.length,
        easy: flashcards.filter(c => c.difficulty === 'easy').length,
        medium: flashcards.filter(c => c.difficulty === 'medium').length,
        hard: flashcards.filter(c => c.difficulty === 'hard').length,
        new: flashcards.filter(c => !c.difficulty).length
    };

    return (
        <div className="library-container">
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Your Library</h2>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px' }}>
                <div className="stat-box" style={{ background: '#e2e8f0', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{counts.total}</div>
                    <div style={{ fontSize: '0.8em' }}>Total</div>
                </div>
                <div className="stat-box" style={{ background: '#c6f6d5', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#2f855a' }}>{counts.easy}</div>
                    <div style={{ fontSize: '0.8em' }}>Easy</div>
                </div>
                <div className="stat-box" style={{ background: '#feebc8', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#c05621' }}>{counts.medium}</div>
                    <div style={{ fontSize: '0.8em' }}>Medium</div>
                </div>
                <div className="stat-box" style={{ background: '#fed7d7', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#c53030' }}>{counts.hard}</div>
                    <div style={{ fontSize: '0.8em' }}>Hard</div>
                </div>
            </div>

            <div className="filter-section" style={{ background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '15px' }}>Start Review Session</h3>

                <div className="select-group">
                    <label>Category</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="select-group">
                    <label>Difficulty</label>
                    <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
                        <option value="all">All Cards</option>
                        <option value="new">New Only</option>
                        <option value="hard">Hard Only</option>
                        <option value="medium">Medium Only</option>
                        <option value="easy">Easy Only</option>
                    </select>
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleStart}>
                    Start Review ({getFilteredCount()} cards)
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => document.getElementById('fileInput').click()}>
                    Import More CSV
                </button>
                {user && (
                    <button className="btn btn-primary" style={{ flex: 1, background: '#667eea' }} onClick={onSync}>
                        Sync Local to Cloud
                    </button>
                )}
                <button className="btn btn-secondary" style={{ flex: 1, color: '#e53e3e', borderColor: '#e53e3e' }} onClick={() => {
                    if (confirm('Are you sure you want to delete all cards?')) onClearData();
                }}>
                    Clear Data
                </button>
            </div>

            {/* Hidden input for adding more files */}
            <input
                type="file"
                id="fileInput"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                    if (e.target.files.length > 0) {
                        // This needs to be handled by parent to switch to map mode
                        // For now we can just reload page or handle it better in App.jsx
                        // Let's just trigger the upload handler in App
                        const event = new CustomEvent('triggerUpload', { detail: e.target.files[0] });
                        window.dispatchEvent(event);
                    }
                }}
            />
        </div>
    );
};

export default Library;
