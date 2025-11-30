import React, { useRef, useState } from 'react';

const FileUpload = ({ onFileUpload }) => {
    const fileInputRef = useRef(null);
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = () => {
        setIsDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.csv')) {
            onFileUpload(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files.length > 0) {
            onFileUpload(e.target.files[0]);
        }
    };

    return (
        <div
            className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                style={{ display: 'none' }}
            />
            <span className="upload-icon">📁</span>
            <h3>Click to upload or drag & drop</h3>
            <p style={{ color: '#718096', marginTop: '10px' }}>
                Supported format: .csv
            </p>
        </div>
    );
};

export default FileUpload;
