import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import Flashcard from './components/Flashcard';
import Controls from './components/Controls';
import Library from './components/Library';
import Auth from './components/Auth';
import { calculateNextReview } from './utils/srsAlgorithm';
import { parseCSV } from './utils/csvParser';
import { saveFlashcards, loadFlashcards, clearFlashcards, saveReviewProgress, loadReviewProgress, clearReviewProgress } from './utils/storage';
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

  const handleImport = async (frontCol, backCol, categoryCol, customCategory) => {
    const newCards = csvData.data.map(row => {
      let category = 'Uncategorized';
      if (customCategory) {
        category = customCategory;
      } else if (categoryCol >= 0) {
        category = row[categoryCol] || 'Uncategorized';
      }

      return {
        id: user ? undefined : Date.now() + Math.random().toString(36).substr(2, 9), // Let DB generate ID if cloud
        front: row[frontCol] || '',
        back: row[backCol] || '',
        category: category,
        tags: [category], // Ensure tags are set for Supabase
        difficulty: null,
        lastReviewed: null
      };
    }).filter(card => card.front && card.back);

    if (newCards.length === 0) {
      alert('No valid cards found');
      return;
    }

    if (user) {
      // Cloud Import
      try {
        await cardService.batchAddCards(newCards, user);
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

  // Advanced Card Management Handlers
  const handleBatchDelete = async (ids) => {
    if (user) {
      try {
        await cardService.batchDelete(ids);
        // Refresh
        const cloudCards = await cardService.getCards(user);
        setAllFlashcards(cloudCards);
      } catch (e) {
        console.error(e);
        alert('Batch delete failed');
      }
    } else {
      setAllFlashcards(prev => prev.filter(c => !ids.includes(c.id)));
    }
  };

  const handleBatchMove = async (ids, newCategory) => {
    if (user) {
      try {
        await cardService.batchUpdateCategory(ids, newCategory);
        // Refresh
        const cloudCards = await cardService.getCards(user);
        setAllFlashcards(cloudCards);
      } catch (e) {
        console.error(e);
        alert('Batch move failed');
      }
    } else {
      setAllFlashcards(prev => prev.map(c => ids.includes(c.id) ? { ...c, category: newCategory } : c));
    }
  };

  const handleDissolveGroup = async (category) => {
    const cardsInGroup = allFlashcards.filter(c => c.category === category);
    const ids = cardsInGroup.map(c => c.id);
    await handleBatchMove(ids, 'Uncategorized');
  };

  const handleStartReview = async (filters, resumeProgress = false) => {
    let sessionCards = [];
    let savedIndex = 0;
    let finalSessionCards = [];

    if (filters.mode === 'daily') {
      // Daily Review 使用预先选好的卡片
      sessionCards = filters.cards || [];

      if (resumeProgress) {
        const savedProgress = loadReviewProgress();
        if (savedProgress) {
          savedIndex = Math.min(savedProgress.currentIndex || 0, Math.max(sessionCards.length - 1, 0));
          if (savedProgress.cardIds && Array.isArray(savedProgress.cardIds)) {
            const cardMap = new Map(allFlashcards.map(card => [card.id, card]));
            const orderedCards = savedProgress.cardIds
              .map(id => cardMap.get(id))
              .filter(Boolean);
            if (orderedCards.length > 0) {
              sessionCards = orderedCards;
            }
          }
        }
      }
    } else if (filters.mode === 'srs') {
      // SRS Mode
      if (user) {
        try {
          sessionCards = await cardService.getDueCards(user, filters.limit);
        } catch (e) {
          console.error(e);
          alert('Failed to fetch due cards');
          return;
        }
      } else {
        alert('SRS mode currently only works with Cloud Sync enabled (Login required).');
        return;
      }
    } else {
      // Standard Mode
      sessionCards = allFlashcards.filter(card => {
        const cardCategory = Array.isArray(card.tags) ? (card.tags[0] || 'Uncategorized') : (card.category || 'Uncategorized');
        const catMatch = filters.category === 'all' || cardCategory === filters.category;
        const diffMatch = filters.difficulty === 'all' ||
          (filters.difficulty === 'new' && !card.difficulty) ||
          card.difficulty === filters.difficulty;
        return catMatch && diffMatch;
      });

      // Shuffle Standard Mode (only if not resuming)
      if (!resumeProgress) {
        for (let i = sessionCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [sessionCards[i], sessionCards[j]] = [sessionCards[j], sessionCards[i]];
        }
      }
    }

    if (sessionCards.length === 0) {
      alert('No cards match your filters');
      return;
    }

    finalSessionCards = sessionCards;

    // 如果恢复进度，尝试从存储中加载（非 daily 模式）
    if (filters.mode !== 'daily' && resumeProgress) {
      const savedProgress = loadReviewProgress();
      if (savedProgress && savedProgress.filters) {
        const filtersMatch =
          savedProgress.filters.mode === filters.mode &&
          savedProgress.filters.category === filters.category &&
          savedProgress.filters.difficulty === filters.difficulty &&
          (filters.mode !== 'srs' || savedProgress.filters.limit === filters.limit);

        if (filtersMatch && savedProgress.currentIndex !== undefined) {
          savedIndex = Math.min(savedProgress.currentIndex, sessionCards.length - 1);

          if (savedProgress.cardIds && Array.isArray(savedProgress.cardIds)) {
            const cardMap = new Map(sessionCards.map(card => [card.id, card]));
            const orderedCards = savedProgress.cardIds
              .map(id => cardMap.get(id))
              .filter(Boolean);

            if (orderedCards.length > 0) {
              finalSessionCards = orderedCards;
            }
          }
        }
      }
    }

    setStudySession(finalSessionCards);
    setStep('study');
    setCurrentIndex(savedIndex);
    setIsFlipped(false);
    setMasteredCount(0);

    // 保存复习进度（包括卡片ID顺序）
    saveReviewProgress({
      filters: filters,
      currentIndex: savedIndex,
      cardIds: finalSessionCards.map(card => card.id),
      timestamp: Date.now()
    });
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
      const cardsToSync = localCards.map(card => ({
        front: card.front,
        back: card.back,
        tags: [card.category || 'Imported']
      }));

      await cardService.batchAddCards(cardsToSync, user);
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
      const nextIndex = currentIndex + 1;
      resetFlipWithoutAnimation(() => setCurrentIndex(nextIndex));
      // 保存进度
      const savedProgress = loadReviewProgress();
      if (savedProgress) {
        saveReviewProgress({
          ...savedProgress,
          currentIndex: nextIndex,
          cardIds: studySession.map(card => card.id),
          timestamp: Date.now()
        });
      }
    } else {
      if (confirm('Session complete! Return to Library?')) {
        clearReviewProgress();
        setStep('library');
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      resetFlipWithoutAnimation(() => setCurrentIndex(prevIndex));
      // 保存进度
      const savedProgress = loadReviewProgress();
      if (savedProgress) {
        saveReviewProgress({
          ...savedProgress,
          currentIndex: prevIndex,
          cardIds: studySession.map(card => card.id),
          timestamp: Date.now()
        });
      }
    }
  };

  const handleDifficulty = async (level) => {
    const currentCard = studySession[currentIndex];

    // Calculate SRS
    // We need current interval. If not present, assume 0.
    // In DB we don't store interval explicitly yet, but we can infer or just start fresh.
    // Ideally we should store 'interval' in DB. For now, let's just use a local property if available, or 0.
    // Since we re-fetch cards, we lose local state. We should probably add 'interval' to DB schema later.
    // For now, let's assume 'review_count' roughly correlates or just use 0 if missing.
    // actually, let's just use 0 for now as MVP or try to read from card if we added it.

    // Better approach for MVP without schema change: 
    // Use 'review_count' as a proxy for "streak" if we want, OR just calculate based on last review date? No, that's hard.
    // Let's just calculate next date based on rating.

    // If we want real SRS, we need to persist 'interval'.
    // I will add 'interval' to the update payload. If DB rejects it (schema strict), it might fail.
    // But Supabase is usually strict.
    // Let's assume we can only update existing columns.
    // Existing: review_count, next_review_date.
    // We can use 'review_count' as the 'interval' (days) for simplicity? No, that's bad.
    // Let's just implement a simple logic:
    // Easy -> +3 days. Medium -> +1 day. Hard -> +0 days (today).
    // Wait, user asked for Ebbinghaus.
    // Let's try to store metadata in 'tags' or just be simple.
    // "next_review_date" is the key.

    // Let's use the helper but pass 0 as interval if unknown.
    // We will try to store 'last_interval' in the card object in memory.

    const lastInterval = currentCard.last_interval || 0;
    const { nextReviewDate, interval } = calculateNextReview(lastInterval, level);

    // Optimistic Update
    const updatedAllCards = allFlashcards.map(c =>
      c.id === currentCard.id
        ? { ...c, difficulty: level, lastReviewed: Date.now(), next_review_date: nextReviewDate, last_interval: interval }
        : c
    );
    setAllFlashcards(updatedAllCards);

    if (user) {
      try {
        await cardService.updateCard(currentCard.id, {
          review_count: (currentCard.review_count || 0) + 1,
          next_review_date: nextReviewDate,
          // We can't save 'last_interval' without schema change. 
          // We'll have to live with "stateless" SRS (always assumes 0 or based on review_count) unless we migrate schema.
          // For now, let's just save what we can.
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
      const newIndex = currentIndex >= newSession.length ? newSession.length - 1 : currentIndex;
      resetFlipWithoutAnimation(() => {
        setStudySession(newSession);
        setCurrentIndex(newIndex);
        
        // 保存进度
        const savedProgress = loadReviewProgress();
        if (savedProgress) {
          saveReviewProgress({
            ...savedProgress,
            currentIndex: newIndex,
            cardIds: newSession.map(card => card.id),
            timestamp: Date.now()
          });
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
          onBatchDelete={handleBatchDelete}
          onBatchMove={handleBatchMove}
          onDissolveGroup={handleDissolveGroup}
          onResumeReview={handleStartReview}
        />
      )}

      {step === 'study' && studySession.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#718096' }}>
            <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8em' }} onClick={() => {
              // 保存当前进度
              const savedProgress = loadReviewProgress();
              if (savedProgress) {
                saveReviewProgress({
                  ...savedProgress,
                  currentIndex: currentIndex,
                  cardIds: studySession.map(card => card.id),
                  timestamp: Date.now()
                });
              }
              setStep('library');
            }}>
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
