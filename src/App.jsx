import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import Flashcard from './components/Flashcard';
import Controls from './components/Controls';
import Library from './components/Library';
import { parseCSV } from './utils/csvParser';
import { saveFlashcards, loadFlashcards, clearFlashcards } from './utils/storage';
import './App.css';
// Import all CSV files from assets/data
const csvFiles = import.meta.glob('./assets/data/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true
});

function App() {
  const [step, setStep] = useState('loading'); // loading, library, upload, map, study
  const [csvData, setCsvData] = useState({ headers: [], data: [] });
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [studySession, setStudySession] = useState([]); // Subset of cards for current session
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  // Load data on mount
  useEffect(() => {
    const localCards = loadFlashcards();
    let initialCards = [...localCards];

    // Load embedded CSVs
    // Note: This is a simple merge. In a real app, we might want to track which file a card came from
    // to avoid duplicates or updates. For now, we just append if not empty.
    // However, simply appending every time will duplicate cards if we save back to local storage.
    // Strategy: We will only use embedded data if local storage is empty OR we can treat embedded data as a separate "read-only" source.
    // But user wants "sync". 
    // Simplified approach: If local storage is empty, load ALL embedded files.
    // If local storage has data, we assume it's the source of truth (user might have deleted cards).
    // BUT user wants to see new files.
    // Better approach: Load all embedded cards. Filter out ones that already exist in local storage (by content).

    const embeddedCards = [];
    Object.values(csvFiles).forEach(csvContent => {
      const parsed = parseCSV(csvContent);
      if (parsed.data.length > 0) {
        // We assume standard columns for embedded files: Front, Back, Category (optional)
        // Since we can't map columns for auto-loaded files easily without user interaction,
        // we'll assume: Col 0 = Front, Col 1 = Back, Col 2 = Category (if exists)
        // OR we just prompt user to map if it's the VERY first time.

        // Let's try to be smart: Use first 2 columns.
        const newCards = parsed.data.map(row => ({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          front: row[0] || '',
          back: row[1] || '',
          category: row[2] || 'Imported',
          difficulty: null,
          lastReviewed: null
        })).filter(card => card.front && card.back);
        embeddedCards.push(...newCards);
      }
    });

    if (localCards.length === 0 && embeddedCards.length > 0) {
      // First time load
      setAllFlashcards(embeddedCards);
      setStep('library');
    } else if (localCards.length > 0) {
      // We have local data. 
      // Ideally we merge new files. But detecting "new" is hard without IDs.
      // For now, let's just show local data to be safe, or user can "Reset" to get new data.
      // User request: "I upload 1.csv, 2.csv... I want to see them".
      // Let's check if we should merge.
      // A simple way: Check if the number of cards differs significantly or just append?
      // Appending duplicates is bad.
      // Let's stick to: Local Storage is King. 
      // IF user wants to sync new files, they might need a "Reload from Files" button in Library.
      setAllFlashcards(localCards);
      setStep('library');
    } else {
      setStep('upload');
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (step !== 'loading') {
      saveFlashcards(allFlashcards);
    }
  }, [allFlashcards, step]);

  // Listen for custom upload event from Library
  useEffect(() => {
    const handleCustomUpload = (e) => handleFileUpload(e.detail);
    window.addEventListener('triggerUpload', handleCustomUpload);
    return () => window.removeEventListener('triggerUpload', handleCustomUpload);
  }, []);

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCSV(text);
      if (parsed.data.length > 0) {
        setCsvData(parsed);
        setStep('map');
      } else {
        alert('CSV file is empty or invalid');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = (frontCol, backCol, categoryCol) => {
    const newCards = csvData.data.map(row => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      front: row[frontCol] || '',
      back: row[backCol] || '',
      category: categoryCol >= 0 ? (row[categoryCol] || 'Uncategorized') : 'Uncategorized',
      difficulty: null,
      lastReviewed: null
    })).filter(card => card.front && card.back);

    if (newCards.length === 0) {
      alert('No valid cards found');
      return;
    }

    setAllFlashcards(prev => [...prev, ...newCards]);
    setStep('library');
  };

  const handleStartReview = (filters) => {
    let sessionCards = allFlashcards.filter(card => {
      const catMatch = filters.category === 'all' || card.category === filters.category;
      const diffMatch = filters.difficulty === 'all' ||
        (filters.difficulty === 'new' && !card.difficulty) ||
        card.difficulty === filters.difficulty;
      return catMatch && diffMatch;
    });

    if (sessionCards.length === 0) {
      alert('No cards match your filters');
      return;
    }

    // Shuffle
    for (let i = sessionCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sessionCards[i], sessionCards[j]] = [sessionCards[j], sessionCards[i]];
    }

    setStudySession(sessionCards);
    setStep('study');
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCount(0);
  };

  const handleClearData = () => {
    clearFlashcards();
    setAllFlashcards([]);
    setStep('upload');
  };

  const handleNext = () => {
    if (currentIndex < studySession.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    } else {
      // End of session
      if (confirm('Session complete! Return to Library?')) {
        setStep('library');
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const handleDifficulty = (level) => {
    const currentCard = studySession[currentIndex];

    // Update the card in the global state
    const updatedAllCards = allFlashcards.map(c =>
      c.id === currentCard.id
        ? { ...c, difficulty: level, lastReviewed: Date.now() }
        : c
    );
    setAllFlashcards(updatedAllCards);

    // Update local session state to reflect change immediately if needed
    // (Optional, but good for UI consistency)

    if (level === 'easy') {
      setMasteredCount(prev => prev + 1);
    } else if (level === 'hard') {
      // Requeue logic for hard cards in current session
      const newSession = [...studySession];
      // Move current card to end
      newSession.splice(currentIndex, 1);
      newSession.push(currentCard);
      setStudySession(newSession);

      if (currentIndex >= newSession.length) {
        setCurrentIndex(newSession.length - 1);
      }
      setIsFlipped(false);
      return;
    }

    handleNext();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (step !== 'study') return;

      switch (e.key) {
        case 'ArrowLeft': handlePrev(); break;
        case 'ArrowRight': handleNext(); break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          setIsFlipped(prev => !prev);
          break;
        case '1': handleDifficulty('easy'); break;
        case '2': handleDifficulty('medium'); break;
        case '3': handleDifficulty('hard'); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, currentIndex, studySession]);

  if (step === 'loading') return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>📚 Flashcard App</h1>

      {step === 'upload' && (
        <>
          <p className="subtitle">Upload your CSV file to start learning</p>
          <FileUpload onFileUpload={handleFileUpload} />
          {allFlashcards.length > 0 && (
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setStep('library')}>
              Cancel & Go to Library
            </button>
          )}
        </>
      )}

      {step === 'map' && (
        <ColumnMapper
          headers={csvData.headers}
          onGenerate={handleImport}
        />
      )}

      {step === 'library' && (
        <Library
          flashcards={allFlashcards}
          onStartReview={handleStartReview}
          onClearData={handleClearData}
        />
      )}

      {step === 'study' && studySession.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#718096' }}>
            <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8em' }} onClick={() => setStep('library')}>
              Exit
            </button>
            <span>Card {currentIndex + 1} / {studySession.length}</span>
          </div>

          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', marginBottom: '20px' }}>
            <div style={{
              width: `${((currentIndex + 1) / studySession.length) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <Flashcard
            front={studySession[currentIndex].front}
            back={studySession[currentIndex].back}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          <Controls
            onNext={handleNext}
            onPrev={handlePrev}
            onDifficulty={handleDifficulty}
            hasPrev={currentIndex > 0}
            hasNext={true} // Always allow next (it might end session)
          />
        </div>
      )}
    </div>
  );
}

export default App;
