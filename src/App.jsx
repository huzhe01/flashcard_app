import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import Flashcard from './components/Flashcard';
import Controls from './components/Controls';
import Library from './components/Library';
import Auth from './components/Auth';
import { parseCSV } from './utils/csvParser';
import { saveFlashcards, loadFlashcards, clearFlashcards } from './utils/storage';
import { supabase } from './lib/supabase';
import { cardService } from './services/cardService';
import './App.css';

// Import all CSV files from assets/data
const csvFiles = import.meta.glob('./assets/data/*.csv', {
  query: '?raw',
  import: 'default',
  eager: true
});

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [step, setStep] = useState('loading'); // loading, library, upload, map, study, auth
  const [csvData, setCsvData] = useState({ headers: [], data: [] });
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [studySession, setStudySession] = useState([]); // Subset of cards for current session
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [disableFlipAnimation, setDisableFlipAnimation] = useState(false);

  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check Auth on Mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data logic
  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      if (user) {
        // Cloud Mode
        try {
          const cloudCards = await cardService.getCards(user);
          setAllFlashcards(cloudCards);
          setStep('library');
        } catch (error) {
          console.error('Error loading cloud cards:', error);
          alert('Failed to load cards from cloud');
        }
      } else {
        // Local Mode
        const localCards = loadFlashcards();

        // Handle embedded files for first-time local users
        if (localCards.length === 0) {
          const embeddedCards = [];
          Object.values(csvFiles).forEach(csvContent => {
            const parsed = parseCSV(csvContent);
            if (parsed.data.length > 0) {
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

          if (embeddedCards.length > 0) {
            setAllFlashcards(embeddedCards);
            setStep('library');
            return;
          }
        }

        if (localCards.length > 0) {
          setAllFlashcards(localCards);
          setStep('library');
        } else {
          setStep('upload');
        }
      }
    };

    loadData();
  }, [user, authLoading]);

  // Save data whenever it changes (Local Mode Only)
  useEffect(() => {
    if (step !== 'loading' && !user) {
      saveFlashcards(allFlashcards);
    }
  }, [allFlashcards, step, user]);

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

  const handleImport = async (frontCol, backCol, categoryCol) => {
    const newCards = csvData.data.map(row => ({
      id: user ? undefined : Date.now() + Math.random().toString(36).substr(2, 9), // Let DB generate ID if cloud
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

    if (user) {
      // Cloud Import
      try {
        const promises = newCards.map(card => cardService.addCard(card, user));
        await Promise.all(promises);
        // Refresh data
        const cloudCards = await cardService.getCards(user);
        setAllFlashcards(cloudCards);
      } catch (error) {
        console.error('Import error:', error);
        alert('Error saving to cloud');
      }
    } else {
      // Local Import
      setAllFlashcards(prev => [...prev, ...newCards]);
    }
    setStep('library');
  };

  const handleStartReview = (filters) => {
    let sessionCards = allFlashcards.filter(card => {
      // Handle array tags from Supabase vs string category from CSV
      const cardCategory = Array.isArray(card.tags) ? (card.tags[0] || 'Uncategorized') : (card.category || 'Uncategorized');

      const catMatch = filters.category === 'all' || cardCategory === filters.category;
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

  const handleClearData = async () => {
    if (user) {
      alert('Bulk delete not implemented for cloud yet to prevent accidents.');
    } else {
      clearFlashcards();
      setAllFlashcards([]);
      setStep('upload');
    }
  };

  const handleSync = async () => {
    if (!user) return;
    if (!confirm('This will upload all local cards to your account. Continue?')) return;

    const localCards = loadFlashcards();
    if (localCards.length === 0) {
      alert('No local cards to sync.');
      return;
    }

    try {
      // Simple upload
      const promises = localCards.map(card => cardService.addCard({
        front: card.front,
        back: card.back,
        tags: [card.category || 'Imported']
      }, user));

      await Promise.all(promises);
      alert('Sync complete!');

      // Refresh
      const cloudCards = await cardService.getCards(user);
      setAllFlashcards(cloudCards);

      // Optional: Clear local?
      // clearFlashcards(); 
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed: ' + error.message);
    }
  };

  const resetFlipWithoutAnimation = (callback = () => { }) => {
    setDisableFlipAnimation(true);
    setIsFlipped(false);
    callback();
    setTimeout(() => setDisableFlipAnimation(false), 0);
  };

  const handleNext = () => {
    if (currentIndex < studySession.length - 1) {
      resetFlipWithoutAnimation(() => setCurrentIndex(prev => prev + 1));
    } else {
      if (confirm('Session complete! Return to Library?')) {
        setStep('library');
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      resetFlipWithoutAnimation(() => setCurrentIndex(prev => prev - 1));
    }
  };

  const handleDifficulty = async (level) => {
    const currentCard = studySession[currentIndex];

    // Optimistic Update
    const updatedAllCards = allFlashcards.map(c =>
      c.id === currentCard.id
        ? { ...c, difficulty: level, lastReviewed: Date.now() } // Note: Supabase uses different field names usually, but we'll map it
        : c
    );
    setAllFlashcards(updatedAllCards);

    if (user) {
      // Save to Cloud
      // Note: Our schema has review_count, next_review_date. 
      // We are storing 'difficulty' string in local state. 
      // Ideally we should update the schema or map it.
      // For now, let's just update the card if we added a 'difficulty' column or just ignore persistence of difficulty if schema doesn't support it.
      // Wait, schema has 'review_count'. Let's just increment that for now as a proxy for "reviewed".
      try {
        await cardService.updateCard(currentCard.id, {
          review_count: (currentCard.review_count || 0) + 1,
          // We could store difficulty in a JSONB column or add a column. 
          // For MVP, let's assume we just track reviews.
        });
      } catch (e) {
        console.error('Failed to update card progress', e);
      }
    }

    if (level === 'easy') {
      setMasteredCount(prev => prev + 1);
    } else if (level === 'hard') {
      const newSession = [...studySession];
      newSession.splice(currentIndex, 1);
      newSession.push(currentCard);
      resetFlipWithoutAnimation(() => {
        setStudySession(newSession);
        if (currentIndex >= newSession.length) {
          setCurrentIndex(newSession.length - 1);
        }
      });
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

  if (authLoading || step === 'loading') return <div className="container">Loading...</div>;

  if (step === 'auth') {
    return (
      <div className="container">
        <button className="btn btn-secondary" onClick={() => setStep('library')}>Back</button>
        <Auth />
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📚 Flashcard App</h1>
        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8em' }}>{user.email}</span>
              <button className="btn btn-secondary" style={{ padding: '5px 10px' }} onClick={() => supabase.auth.signOut()}>Logout</button>
            </div>
          ) : (
            <button className="btn btn-primary" style={{ padding: '5px 10px' }} onClick={() => setStep('auth')}>Login / Sync</button>
          )}
        </div>
      </header>

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
          user={user}
          onSync={handleSync}
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
            disableAnimation={disableFlipAnimation}
          />

          <Controls
            onNext={handleNext}
            onPrev={handlePrev}
            onDifficulty={handleDifficulty}
            hasPrev={currentIndex > 0}
            hasNext={true}
          />
        </div>
      )}
    </div>
  );
}

export default App;
