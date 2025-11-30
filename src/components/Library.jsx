import React, { useState, useEffect, useMemo } from 'react';
import TagSidebar from './TagSidebar';
import RelationshipGraph from './RelationshipGraph';

const Library = ({ flashcards, onStartReview, onClearData, user, onSync, onBatchDelete, onBatchMove, onDissolveGroup }) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [categories, setCategories] = useState([]);

    // Card Manager State
    const [viewMode, setViewMode] = useState('stats'); // 'stats', 'manager', 'graph'
    const [selectedCards, setSelectedCards] = useState(new Set());
    const [managerCategory, setManagerCategory] = useState('all');
    const [sidebarCategory, setSidebarCategory] = useState('all');

    // SRS State
    const [reviewMode, setReviewMode] = useState('standard'); // 'standard', 'srs'
    const [srsLimit, setSrsLimit] = useState(20);
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth <= 768;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const cats = new Set(flashcards.map(c => c.category).filter(Boolean));
        setCategories(['all', ...Array.from(cats)]);
    }, [flashcards]);

    const categoryCounts = useMemo(() => {
        const counts = {};
        flashcards.forEach(card => {
            const cat = card.category || 'Uncategorized';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [flashcards]);

    const getFilteredCount = () => {
        return flashcards.filter(card => {
            const catMatch = (selectedCategory === 'all' || card.category === selectedCategory) &&
                (sidebarCategory === 'all' || card.category === sidebarCategory);
            const diffMatch = selectedDifficulty === 'all' ||
                (selectedDifficulty === 'new' && !card.difficulty) ||
                card.difficulty === selectedDifficulty;
            return catMatch && diffMatch;
        }).length;
    };

    const handleStart = () => {
        onStartReview({
            category: selectedCategory,
            difficulty: selectedDifficulty,
            mode: reviewMode,
            limit: srsLimit
        });
    };

    // Manager Logic
    const getManagerCards = () => {
        if (managerCategory === 'all') return flashcards;
        return flashcards.filter(c => c.category === managerCategory);
    };

    const toggleCardSelection = (id) => {
        const newSet = new Set(selectedCards);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedCards(newSet);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const ids = getManagerCards().map(c => c.id);
            setSelectedCards(new Set(ids));
        } else {
            setSelectedCards(new Set());
        }
    };

    const handleBatchDelete = () => {
        if (selectedCards.size === 0) return;
        if (confirm(`Delete ${selectedCards.size} cards?`)) {
            onBatchDelete(Array.from(selectedCards));
            setSelectedCards(new Set());
        }
    };

    const handleBatchMove = () => {
        if (selectedCards.size === 0) return;
        const newCat = prompt('Enter new category name:');
        if (newCat) {
            onBatchMove(Array.from(selectedCards), newCat);
            setSelectedCards(new Set());
        }
    };

    const handleDissolveGroup = () => {
        if (managerCategory === 'all') {
            alert('Please select a specific category to dissolve.');
            return;
        }
        if (confirm(`Dissolve group "${managerCategory}"? Cards will become Uncategorized.`)) {
            onDissolveGroup(managerCategory);
        }
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
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '20px',
                flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
                <button
                    className={`btn ${viewMode === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewMode('stats')}
                >
                    Review & Stats
                </button>
                <button
                    className={`btn ${viewMode === 'manager' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewMode('manager')}
                >
                    Card Manager
                </button>
                <button
                    className={`btn ${viewMode === 'graph' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setViewMode('graph')}
                >
                    🔗 Graph View
                </button>
            </div>

            <div style={{
                display: 'flex',
                gap: isMobile ? '16px' : '20px',
                flexDirection: isMobile ? 'column' : 'row'
            }}>
                <TagSidebar
                    categories={categoryCounts}
                    selectedCategory={sidebarCategory}
                    onSelectCategory={setSidebarCategory}
                    isMobile={isMobile}
                />

                <div style={{ flex: 1 }}>
                    {viewMode === 'graph' ? (
                        <RelationshipGraph flashcards={flashcards} onSelectCategory={setSidebarCategory} />
                    ) : viewMode === 'stats' ? (
                        <>
                            <div className="stats-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, 1fr)',
                                gap: '10px',
                                marginBottom: '30px'
                            }}>
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

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ marginRight: '15px' }}>
                                        <input
                                            type="radio"
                                            name="reviewMode"
                                            checked={reviewMode === 'standard'}
                                            onChange={() => setReviewMode('standard')}
                                        /> Standard Review
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="reviewMode"
                                            checked={reviewMode === 'srs'}
                                            onChange={() => setReviewMode('srs')}
                                        /> Smart Review (SRS)
                                    </label>
                                </div>

                                {reviewMode === 'standard' ? (
                                    <>
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
                                    </>
                                ) : (
                                    <div className="select-group">
                                        <label>Cards per Session</label>
                                        <input
                                            type="number"
                                            value={srsLimit}
                                            onChange={(e) => setSrsLimit(Number(e.target.value))}
                                            min="5" max="100"
                                            style={{ width: '100%', padding: '8px' }}
                                        />
                                        <p style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
                                            Prioritizes cards due for review based on Ebbinghaus curve.
                                        </p>
                                    </div>
                                )}

                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleStart}>
                                    Start Review {reviewMode === 'standard' && `(${getFilteredCount()} cards)`}
                                </button>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                flexDirection: isMobile ? 'column' : 'row'
                            }}>
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
                        </>
                    ) : (
                        <div className="card-manager">
                            <div className="manager-controls" style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                    value={managerCategory}
                                    onChange={(e) => setManagerCategory(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '4px' }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'all' ? 'All Categories' : cat}
                                        </option>
                                    ))}
                                </select>

                                <div style={{ flex: 1 }}></div>

                                <button className="btn btn-secondary" onClick={handleBatchMove} disabled={selectedCards.size === 0}>
                                    Move Selected
                                </button>
                                <button className="btn btn-secondary" style={{ color: 'red', borderColor: 'red' }} onClick={handleBatchDelete} disabled={selectedCards.size === 0}>
                                    Delete Selected
                                </button>
                                {managerCategory !== 'all' && (
                                    <button className="btn btn-secondary" style={{ color: 'orange', borderColor: 'orange' }} onClick={handleDissolveGroup}>
                                        Dissolve Group
                                    </button>
                                )}
                            </div>

                            <div className="card-list" style={{
                                maxHeight: '500px',
                                overflowY: 'auto',
                                overflowX: 'auto',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f7fafc', position: 'sticky', top: 0 }}>
                                        <tr>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>
                                                <input type="checkbox" onChange={handleSelectAll} />
                                            </th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Front</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Back</th>
                                            <th style={{ padding: '10px', textAlign: 'left' }}>Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getManagerCards().map(card => (
                                            <tr key={card.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <td style={{ padding: '10px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCards.has(card.id)}
                                                        onChange={() => toggleCardSelection(card.id)}
                                                    />
                                                </td>
                                                <td style={{ padding: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.front}</td>
                                                <td style={{ padding: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.back}</td>
                                                <td style={{ padding: '10px' }}>{card.category}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden input for adding more files */}
            <input
                type="file"
                id="fileInput"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                    if (e.target.files.length > 0) {
                        const event = new CustomEvent('triggerUpload', { detail: e.target.files[0] });
                        window.dispatchEvent(event);
                    }
                }}
            />
        </div>
    );
};

export default Library;
