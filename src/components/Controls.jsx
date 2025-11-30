import React from 'react';

const Controls = ({ onNext, onPrev, onDifficulty, hasPrev, hasNext }) => {
    return (
        <div>
            <div className="nav-controls">
                <button
                    className="btn btn-secondary"
                    onClick={onPrev}
                    disabled={!hasPrev}
                    style={{ opacity: hasPrev ? 1 : 0.5 }}
                >
                    ⬅️ Previous
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={onNext}
                    disabled={!hasNext}
                    style={{ opacity: hasNext ? 1 : 0.5 }}
                >
                    Next ➡️
                </button>
            </div>

            <div className="controls">
                <button className="difficulty-btn btn-easy" onClick={() => onDifficulty('easy')}>
                    Easy
                </button>
                <button className="difficulty-btn btn-medium" onClick={() => onDifficulty('medium')}>
                    Medium
                </button>
                <button className="difficulty-btn btn-hard" onClick={() => onDifficulty('hard')}>
                    Hard
                </button>
            </div>
        </div>
    );
};

export default Controls;
