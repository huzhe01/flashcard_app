import React from 'react';

const Flashcard = ({ front, back, isFlipped, onFlip }) => {
    return (
        <div className="flashcard-container" onClick={onFlip}>
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                <div className="card-face card-front">
                    {front}
                </div>
                <div className="card-face card-back">
                    {back}
                </div>
            </div>
        </div>
    );
};

export default Flashcard;
