import React from 'react';

const TagSidebar = ({ categories, selectedCategory, onSelectCategory }) => {
    // categories is an object { categoryName: count }

    const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);

    return (
        <div style={{
            width: '220px',
            borderRight: '1px solid #e2e8f0',
            paddingRight: '20px',
            marginRight: '20px',
            maxHeight: '80vh',
            overflowY: 'auto'
        }}>
            <h3 style={{ fontSize: '1.1em', marginBottom: '15px', color: '#2d3748' }}>📚 Categories</h3>

            <div
                style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    background: selectedCategory === 'all' ? '#667eea' : 'transparent',
                    color: selectedCategory === 'all' ? 'white' : '#4a5568',
                    marginBottom: '8px',
                    fontWeight: selectedCategory === 'all' ? '600' : 'normal',
                    transition: 'all 0.2s'
                }}
                onClick={() => onSelectCategory('all')}
            >
                All Cards
            </div>

            {sortedCategories.map(([category, count]) => (
                <div
                    key={category}
                    style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        background: selectedCategory === category ? '#667eea' : 'transparent',
                        color: selectedCategory === category ? 'white' : '#4a5568',
                        marginBottom: '4px',
                        fontSize: '0.95em',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => onSelectCategory(category)}
                    onMouseEnter={(e) => {
                        if (selectedCategory !== category) {
                            e.currentTarget.style.background = '#f7fafc';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (selectedCategory !== category) {
                            e.currentTarget.style.background = 'transparent';
                        }
                    }}
                >
                    <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginRight: '8px'
                    }}>
                        {category}
                    </span>
                    <span style={{
                        fontSize: '0.85em',
                        color: selectedCategory === category ? 'rgba(255,255,255,0.8)' : '#a0aec0',
                        fontWeight: '600',
                        flexShrink: 0
                    }}>
                        {count}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default TagSidebar;
