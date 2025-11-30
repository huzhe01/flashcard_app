import React from 'react';

const Flashcard = ({ front, back, isFlipped, onFlip, disableAnimation }) => {
    const cardClassNames = [
        'flashcard',
        isFlipped ? 'flipped' : '',
        disableAnimation ? 'no-flip-animation' : ''
    ].filter(Boolean).join(' ');

    return (
        <div className="flashcard-container" onClick={onFlip}>
            <div className={cardClassNames}>
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
