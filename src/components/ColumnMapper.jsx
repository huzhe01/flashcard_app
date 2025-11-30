import React from 'react';

const ColumnMapper = ({ headers, onGenerate }) => {
    const [frontCol, setFrontCol] = React.useState(0);
    const [backCol, setBackCol] = React.useState(1);
    const [categoryCol, setCategoryCol] = React.useState(-1); // -1 means no category

    const handleGenerate = () => {
        if (frontCol === backCol) {
            alert('Please select different columns for Front and Back');
            return;
        }
        onGenerate(frontCol, backCol, categoryCol);
    };

    return (
        <div className="mapper-container">
            <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Configure Flashcards</h2>

            <div className="select-group">
                <label>Front Side (Question/Word)</label>
                <select value={frontCol} onChange={(e) => setFrontCol(Number(e.target.value))}>
                    {headers.map((header, index) => (
                        <option key={index} value={index}>
                            {header || `Column ${index + 1}`}
                        </option>
                    ))}
                </select>
            </div>

            <div className="select-group">
                <label>Back Side (Answer/Meaning)</label>
                <select value={backCol} onChange={(e) => setBackCol(Number(e.target.value))}>
                    {headers.map((header, index) => (
                        <option key={index} value={index}>
                            {header || `Column ${index + 1}`}
                        </option>
                    ))}
                </select>
            </div>

            <div className="select-group">
                <label>Category (Optional)</label>
                <select value={categoryCol} onChange={(e) => setCategoryCol(Number(e.target.value))}>
                    <option value={-1}>-- None --</option>
                    {headers.map((header, index) => (
                        <option key={index} value={index}>
                            {header || `Column ${index + 1}`}
                        </option>
                    ))}
                </select>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGenerate}>
                Import Flashcards
            </button>
        </div>
    );
};

export default ColumnMapper;
