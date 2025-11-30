import React from 'react';

const ColumnMapper = ({ headers, onGenerate }) => {
    const [frontCol, setFrontCol] = React.useState(0);
    const [backCol, setBackCol] = React.useState(1);
    const [categoryMode, setCategoryMode] = React.useState('none'); // none, column, custom
    const [categoryCol, setCategoryCol] = React.useState(0);
    const [customCategory, setCustomCategory] = React.useState('');

    const handleGenerate = () => {
        if (frontCol === backCol) {
            alert('Please select different columns for Front and Back');
            return;
        }

        let finalCategoryCol = -1;
        let finalCustomCategory = '';

        if (categoryMode === 'column') {
            finalCategoryCol = categoryCol;
        } else if (categoryMode === 'custom') {
            if (!customCategory.trim()) {
                alert('Please enter a category name');
                return;
            }
            finalCustomCategory = customCategory.trim();
        }

        onGenerate(frontCol, backCol, finalCategoryCol, finalCustomCategory);
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
                <label>Category</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <label style={{ fontWeight: 'normal' }}>
                        <input
                            type="radio"
                            name="catMode"
                            checked={categoryMode === 'none'}
                            onChange={() => setCategoryMode('none')}
                        /> None
                    </label>
                    <label style={{ fontWeight: 'normal' }}>
                        <input
                            type="radio"
                            name="catMode"
                            checked={categoryMode === 'column'}
                            onChange={() => setCategoryMode('column')}
                        /> From CSV
                    </label>
                    <label style={{ fontWeight: 'normal' }}>
                        <input
                            type="radio"
                            name="catMode"
                            checked={categoryMode === 'custom'}
                            onChange={() => setCategoryMode('custom')}
                        /> Custom
                    </label>
                </div>

                {categoryMode === 'column' && (
                    <select value={categoryCol} onChange={(e) => setCategoryCol(Number(e.target.value))}>
                        {headers.map((header, index) => (
                            <option key={index} value={index}>
                                {header || `Column ${index + 1}`}
                            </option>
                        ))}
                    </select>
                )}

                {categoryMode === 'custom' && (
                    <input
                        type="text"
                        placeholder="Enter category name (e.g. History)"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0' }}
                    />
                )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGenerate}>
                Import Flashcards
            </button>
        </div>
    );
};

export default ColumnMapper;
