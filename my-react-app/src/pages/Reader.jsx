import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../api';
import { clearBookProgress, loadSavedProgress, saveBookProgress } from '../readingProgress';


const HEADER_PATTERNS = [
  /^глава\b/i,
  /^часть\b/i,
  /^пролог\b/i,
  /^эпилог\b/i,
  /^chapter\b/i,
  /^part\b/i,
  /^prologue\b/i,
  /^epilogue\b/i,
];


const clamp = (value, min, max) => Math.min(Math.max(value, min), max);


const isHeadingParagraph = (text) => {
  const normalized = text.trim();
  if (!normalized) {
    return false;
  }

  if (HEADER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return normalized.length <= 65 && !/[.!?…]/.test(normalized);
};


const normalizeParagraphs = (content) => {
  if (!content) {
    return [];
  }

  return content
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: `${index}-${text.slice(0, 24)}`,
      text,
      isHeading: isHeadingParagraph(text),
    }));
};


const getTargetCharactersPerPage = (viewportWidth, fontSize) => {
  let baseTarget = 2400;

  if (viewportWidth < 640) {
    baseTarget = 1100;
  } else if (viewportWidth < 900) {
    baseTarget = 1500;
  } else if (viewportWidth < 1280) {
    baseTarget = 1900;
  }

  return Math.max(800, Math.round(baseTarget * (18 / fontSize)));
};


const paginateParagraphs = (paragraphs, viewportWidth, fontSize) => {
  if (!paragraphs.length) {
    return [];
  }

  const targetCharacters = getTargetCharactersPerPage(viewportWidth, fontSize);
  const minParagraphs = viewportWidth < 640 ? 2 : 3;
  const maxParagraphs = viewportWidth < 640 ? 5 : 7;

  const pages = [];
  let currentPage = [];
  let currentCharacters = 0;
  let pageStartIndex = 0;

  const pushPage = () => {
    if (!currentPage.length) {
      return;
    }

    pages.push({
      paragraphs: currentPage,
      startIndex: pageStartIndex,
      endIndex: pageStartIndex + currentPage.length - 1,
    });

    pageStartIndex += currentPage.length;
    currentPage = [];
    currentCharacters = 0;
  };

  paragraphs.forEach((paragraph) => {
    const effectiveLength = paragraph.isHeading
      ? Math.round(targetCharacters * 0.22)
      : Math.max(90, paragraph.text.length);

    const shouldStartNewPage = currentPage.length > 0 && (
      (paragraph.isHeading && currentPage.length >= minParagraphs)
      || (currentCharacters + effectiveLength > targetCharacters && currentPage.length >= minParagraphs)
      || currentPage.length >= maxParagraphs
    );

    if (shouldStartNewPage) {
      pushPage();
    }

    currentPage.push(paragraph);
    currentCharacters += effectiveLength;
  });

  pushPage();
  return pages;
};


const findPageByParagraphIndex = (pages, paragraphIndex) => {
  if (!pages.length) {
    return 0;
  }

  const pageIndex = pages.findIndex(
    (page) => paragraphIndex >= page.startIndex && paragraphIndex <= page.endIndex,
  );

  if (pageIndex !== -1) {
    return pageIndex;
  }

  return paragraphIndex > pages[pages.length - 1].endIndex ? pages.length - 1 : 0;
};


const renderDropCapParagraph = (text, color) => {
  if (!text) {
    return null;
  }

  const firstLetter = text.charAt(0);
  const rest = text.slice(1);

  return (
    <>
      <span
        style={{
          float: 'left',
          fontSize: '3.6em',
          lineHeight: 0.78,
          paddingRight: '0.12em',
          fontWeight: 800,
          color,
        }}
      >
        {firstLetter}
      </span>
      {rest}
    </>
  );
};


const Reader = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [anchorParagraphIndex, setAnchorParagraphIndex] = useState(0);
  const [savedProgress, setSavedProgress] = useState(() => loadSavedProgress(id));
  const [resumePrompt, setResumePrompt] = useState(null);
  const [resumeChecked, setResumeChecked] = useState(false);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1280 : window.innerWidth,
  );

  const token = localStorage.getItem('access');
  const [fontFamily, setFontFamily] = useState(
    localStorage.getItem('reader-font-family') || '"Georgia", serif',
  );
  const [fontSize, setFontSize] = useState(
    Number.parseInt(localStorage.getItem('reader-font-size'), 10) || 18,
  );
  const [theme, setTheme] = useState(localStorage.getItem('reader-theme') || 'light');
  const isCompact = viewportWidth < 900;
  const isMobile = viewportWidth < 640;
  const showMobileControls = isMobile && mobileControlsOpen;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setBook(null);
    setLoading(true);
    setCurrentPage(0);
    setAnchorParagraphIndex(0);
    setSavedProgress(loadSavedProgress(id));
    setResumePrompt(null);
    setResumeChecked(false);
    setMobileControlsOpen(false);
  }, [id]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api.get(`books/${id}/`)
      .then((response) => {
        setBook(response.data);
      })
      .catch((error) => {
        console.error('Ошибка при загрузке книги:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, token]);

  useEffect(() => {
    if (book?.title) {
      document.title = `${book.title} - чтение | BookHub`;
    }
  }, [book?.title]);

  const paragraphs = useMemo(
    () => normalizeParagraphs(book?.content || ''),
    [book?.content],
  );

  const pages = useMemo(
    () => paginateParagraphs(paragraphs, viewportWidth, fontSize),
    [paragraphs, viewportWidth, fontSize],
  );

  const totalPages = pages.length;
  const currentPageData = pages[currentPage] || pages[0] || { paragraphs: [], startIndex: 0, endIndex: 0 };
  const progressPercent = totalPages
    ? Math.round(((currentPage + 1) / totalPages) * 100)
    : 0;

  useEffect(() => {
    if (!pages.length) {
      return;
    }

    if (!resumeChecked) {
      const savedParagraphIndex = savedProgress?.paragraphIndex;

      if (Number.isInteger(savedParagraphIndex) && savedParagraphIndex > 0) {
        const targetPage = findPageByParagraphIndex(pages, savedParagraphIndex);
        setResumePrompt({
          pageIndex: targetPage,
          paragraphIndex: savedParagraphIndex,
        });
      } else {
        setCurrentPage(0);
        setAnchorParagraphIndex(pages[0].startIndex);
      }

      setResumeChecked(true);
      return;
    }

    const adjustedPage = findPageByParagraphIndex(pages, anchorParagraphIndex);
    if (adjustedPage !== currentPage) {
      setCurrentPage(adjustedPage);
    }
  }, [pages, savedProgress, resumeChecked, anchorParagraphIndex, currentPage]);

  useEffect(() => {
    if (!pages.length || resumePrompt) {
      return;
    }

    const pageData = pages[currentPage] || pages[0];
    if (pageData && pageData.startIndex !== anchorParagraphIndex) {
      setAnchorParagraphIndex(pageData.startIndex);
    }
  }, [currentPage, pages, resumePrompt, anchorParagraphIndex]);

  useEffect(() => {
    localStorage.setItem('reader-font-size', String(fontSize));
    localStorage.setItem('reader-theme', theme);
    localStorage.setItem('reader-font-family', fontFamily);

    if (!pages.length || resumePrompt) {
      return;
    }

    const pageData = pages[currentPage] || pages[0];
    saveBookProgress(id, {
      page: currentPage,
      totalPages: pages.length,
      paragraphIndex: pageData.startIndex,
      title: book?.title,
      author: book?.author,
      genre: book?.genre,
      cover_image: book?.cover_image,
      average_rating: book?.average_rating,
      updatedAt: new Date().toISOString(),
    });
  }, [book?.author, book?.average_rating, book?.cover_image, book?.genre, book?.title, currentPage, fontFamily, fontSize, id, pages, resumePrompt, theme]);

  const openPage = useCallback((pageIndex) => {
    if (!pages.length) {
      return;
    }

    const safeIndex = clamp(pageIndex, 0, pages.length - 1);
    setCurrentPage(safeIndex);
    setAnchorParagraphIndex(pages[safeIndex].startIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pages]);

  useEffect(() => {
    if (!pages.length || resumePrompt) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName?.toUpperCase();
      if (event.repeat || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tagName)) {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        openPage(currentPage + 1);
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        openPage(currentPage - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, openPage, pages.length, resumePrompt]);

  const handleResumeReading = () => {
    if (!resumePrompt) {
      return;
    }

    setCurrentPage(resumePrompt.pageIndex);
    setAnchorParagraphIndex(resumePrompt.paragraphIndex);
    setResumePrompt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartOver = () => {
    clearBookProgress(id);
    setSavedProgress(null);
    setCurrentPage(0);
    setAnchorParagraphIndex(0);
    setResumePrompt(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!token) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f8fafc',
          fontFamily: '"Inter", sans-serif',
          textAlign: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            maxWidth: '400px',
          }}
        >
          <span style={{ fontSize: '50px', marginBottom: '20px', display: 'block' }}>🔒</span>
          <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Доступ ограничен</h2>
          <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: '1.5' }}>
            Чтобы перейти в режим чтения, сначала войдите в аккаунт.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                background: '#4f46e5',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                cursor: 'pointer',
                transition: '0.2s',
              }}
              onMouseOver={(event) => {
                event.currentTarget.style.background = '#4338ca';
              }}
              onMouseOut={(event) => {
                event.currentTarget.style.background = '#4f46e5';
              }}
            >
              Войти в аккаунт
            </button>

            <button
              onClick={() => navigate('/catalog')}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: 'transparent',
                color: '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Вернуться в каталог
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Загрузка...</div>;
  }

  if (!book) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Книга не найдена</div>;
  }

  const themes = {
    light: {
      bg: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
      text: '#1e293b',
      textSoft: '#64748b',
      page: '#ffffff',
      ui: 'rgba(255, 255, 255, 0.92)',
      border: '#e2e8f0',
      accent: '#4f46e5',
      shadow: '0 24px 50px rgba(79, 70, 229, 0.12)',
    },
    sepia: {
      bg: 'linear-gradient(180deg, #f8fafc 0%, #ede9fe 100%)',
      text: '#312e81',
      textSoft: '#6d28d9',
      page: '#faf5ff',
      ui: 'rgba(250, 245, 255, 0.93)',
      border: '#ddd6fe',
      accent: '#6366f1',
      shadow: '0 24px 50px rgba(99, 102, 241, 0.14)',
    },
    dark: {
      bg: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
      text: '#e2e8f0',
      textSoft: '#94a3b8',
      page: '#111827',
      ui: 'rgba(15, 23, 42, 0.92)',
      border: '#334155',
      accent: '#818cf8',
      shadow: '0 24px 50px rgba(0, 0, 0, 0.35)',
    },
  };

  const currentTheme = themes[theme];
  const uiFont = '"Inter", "Segoe UI", Roboto, sans-serif';

  const buttonStyle = {
    padding: '10px 18px',
    cursor: 'pointer',
    borderRadius: '14px',
    border: `1px solid ${currentTheme.border}`,
    background: currentTheme.ui,
    color: currentTheme.text,
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: uiFont,
    transition: '0.2s',
    backdropFilter: 'blur(10px)',
  };

  return (
    <div
      style={{
        background: currentTheme.bg,
        color: currentTheme.text,
        minHeight: '100vh',
        transition: 'background 0.3s, color 0.3s',
      }}
    >
      <header
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          minHeight: '78px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '12px' : '16px',
          flexWrap: 'wrap',
          padding: isMobile ? '12px' : isCompact ? '12px 16px' : '16px 28px',
          backgroundColor: currentTheme.ui,
          borderBottom: `1px solid ${currentTheme.border}`,
          zIndex: 2000,
          boxSizing: 'border-box',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={() => navigate(`/catalog/${id}`)}
            style={{ ...buttonStyle, background: currentTheme.accent, color: '#fff', border: 'none', flex: isMobile ? '1 1 140px' : undefined }}
          >
            ← О книге
          </button>
          <button
            onClick={() => navigate('/catalog')}
            style={{ ...buttonStyle, background: 'transparent', color: currentTheme.accent, border: `1px solid ${currentTheme.accent}`, flex: isMobile ? '1 1 140px' : undefined }}
          >
            Каталог
          </button>
        </div>

        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <button
              onClick={() => setMobileControlsOpen((prev) => !prev)}
              style={{
                ...buttonStyle,
                width: '100%',
                justifyContent: 'space-between',
                background: currentTheme.page,
                border: `1px solid ${currentTheme.border}`,
              }}
            >
              <span>Настройки чтения</span>
              <span style={{ color: currentTheme.accent, fontWeight: 700 }}>
                {showMobileControls ? 'Скрыть' : 'Показать'}
              </span>
            </button>

            {showMobileControls && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '18px',
                  background: currentTheme.page,
                  border: `1px solid ${currentTheme.border}`,
                  boxShadow: `0 10px 24px ${currentTheme.accent}14`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', background: currentTheme.ui, borderRadius: '16px', border: `1px solid ${currentTheme.border}`, overflow: 'hidden', width: '100%', justifyContent: 'space-between' }}>
                  <button onClick={() => setFontSize((prev) => Math.max(14, prev - 2))} style={{ ...buttonStyle, border: 'none', borderRadius: 0, background: 'transparent' }}>A-</button>
                  <span style={{ width: '48px', textAlign: 'center', fontWeight: '700', fontFamily: uiFont }}>{fontSize}</span>
                  <button onClick={() => setFontSize((prev) => Math.min(28, prev + 2))} style={{ ...buttonStyle, border: 'none', borderRadius: 0, background: 'transparent' }}>A+</button>
                </div>

                <select value={theme} onChange={(event) => setTheme(event.target.value)} style={{ ...buttonStyle, width: '100%', padding: '10px 14px', background: currentTheme.ui }}>
                  <option value="light">Светлая</option>
                  <option value="sepia">Сепия</option>
                  <option value="dark">Темная</option>
                </select>

                <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)} style={{ ...buttonStyle, width: '100%', padding: '10px 14px', background: currentTheme.ui }}>
                  <option value='"Georgia", serif'>Классический шрифт</option>
                  <option value='"Inter", sans-serif'>Современный шрифт</option>
                  <option value='"Merriweather", serif'>Литературный шрифт</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: currentTheme.page, borderRadius: '16px', border: `1px solid ${currentTheme.border}`, overflow: 'hidden' }}>
              <button onClick={() => setFontSize((prev) => Math.max(14, prev - 2))} style={{ ...buttonStyle, border: 'none', borderRadius: 0, background: 'transparent' }}>A-</button>
              <span style={{ width: '48px', textAlign: 'center', fontWeight: '700', fontFamily: uiFont }}>{fontSize}</span>
              <button onClick={() => setFontSize((prev) => Math.min(28, prev + 2))} style={{ ...buttonStyle, border: 'none', borderRadius: 0, background: 'transparent' }}>A+</button>
            </div>

            <select value={theme} onChange={(event) => setTheme(event.target.value)} style={{ ...buttonStyle, padding: '10px 14px' }}>
              <option value="light">Светлая</option>
              <option value="sepia">Сепия</option>
              <option value="dark">Темная</option>
            </select>

            <select value={fontFamily} onChange={(event) => setFontFamily(event.target.value)} style={{ ...buttonStyle, padding: '10px 14px' }}>
              <option value='"Georgia", serif'>Классический шрифт</option>
              <option value='"Inter", sans-serif'>Современный шрифт</option>
              <option value='"Merriweather", serif'>Литературный шрифт</option>
            </select>
          </div>
        )}
      </header>

      <main
        style={{
          maxWidth: '980px',
          margin: '0 auto',
          padding: isMobile
            ? showMobileControls
              ? '286px 12px 160px'
              : '156px 12px 160px'
            : isCompact ? '148px 16px 124px' : '132px 24px 120px',
        }}
      >
        <section
          style={{
            background: currentTheme.page,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: isMobile ? '24px' : '32px',
            boxShadow: currentTheme.shadow,
            padding: isMobile ? '24px 16px 28px' : isCompact ? '28px 18px 34px' : '42px 48px 46px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '160px',
              height: '160px',
              background: `radial-gradient(circle, ${currentTheme.accent}22 0%, transparent 68%)`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-20px',
              left: '-10px',
              width: '220px',
              height: '220px',
              background: `radial-gradient(circle, ${currentTheme.accent}12 0%, transparent 72%)`,
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <span style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: '999px', background: `${currentTheme.accent}16`, color: currentTheme.accent, fontFamily: uiFont, fontSize: '13px', fontWeight: 700, letterSpacing: '0.03em' }}>
                  Режим чтения
                </span>
                <h1 style={{ margin: '14px 0 8px', fontSize: isCompact ? '2rem' : '2.6rem', lineHeight: 1.12, color: currentTheme.text }}>
                  {book.title}
                </h1>
                <p style={{ margin: 0, color: currentTheme.textSoft, fontFamily: uiFont, fontSize: '1rem' }}>
                  {book.author}
                </p>
              </div>

              <div style={{ minWidth: isCompact ? '100%' : '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: currentTheme.textSoft, fontFamily: uiFont, fontSize: '14px' }}>
                  <span>Прогресс</span>
                  <span>{progressPercent}%</span>
                </div>
              <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: `${currentTheme.accent}18`, overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: currentTheme.accent, transition: 'width 0.3s ease' }} />
              </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '26px', fontFamily: uiFont, color: currentTheme.textSoft, fontSize: '14px' }}>
              <span>Страница {totalPages ? currentPage + 1 : 0} из {totalPages || 0}</span>
              {!isMobile && <span>Стрелки ← и → тоже листают страницы</span>}
            </div>

            <article
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: isMobile ? 1.82 : 1.95,
                fontFamily,
                textAlign: isMobile ? 'left' : 'justify',
                color: currentTheme.text,
                maxWidth: '760px',
                margin: '0 auto',
                minHeight: isMobile ? '48vh' : isCompact ? '52vh' : '60vh',
              }}
            >
              {currentPageData.paragraphs.map((paragraph, index) => {
                const isFirstTextParagraph = !paragraph.isHeading
                  && currentPageData.paragraphs
                    .slice(0, index)
                    .every((pageParagraph) => pageParagraph.isHeading);

                if (paragraph.isHeading) {
                  return (
                    <h2
                      key={paragraph.id}
                      style={{
                        textAlign: 'center',
                        fontFamily: '"Inter", sans-serif',
                        fontSize: '1.15em',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        margin: index === 0 ? '0 0 1.8em' : '2.4em 0 1.4em',
                        color: currentTheme.accent,
                      }}
                    >
                      {paragraph.text}
                    </h2>
                  );
                }

                return (
                  <p
                    key={paragraph.id}
                    style={{
                      margin: index === 0 ? 0 : '1.25em 0 0',
                      textIndent: isFirstTextParagraph ? 0 : '1.65em',
                      color: currentTheme.text,
                    }}
                  >
                    {isFirstTextParagraph
                      ? renderDropCapParagraph(paragraph.text, currentTheme.accent)
                      : paragraph.text}
                  </p>
                );
              })}
            </article>
          </div>
        </section>
      </main>

      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          minHeight: isMobile ? '116px' : '76px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: currentTheme.ui,
          borderTop: `1px solid ${currentTheme.border}`,
          padding: '12px 16px',
          backdropFilter: 'blur(16px)',
          zIndex: 2000,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '760px' }}>
          <button
            disabled={currentPage === 0}
            onClick={() => openPage(currentPage - 1)}
            style={{ ...buttonStyle, opacity: currentPage === 0 ? 0.45 : 1, flex: isMobile ? '1 1 140px' : undefined }}
          >
            Назад
          </button>

          <div
            style={{
              minWidth: isMobile ? '100%' : '150px',
              padding: '10px 18px',
              borderRadius: '16px',
              background: currentTheme.page,
              border: `1px solid ${currentTheme.border}`,
              textAlign: 'center',
              fontFamily: uiFont,
              fontWeight: 700,
              color: currentTheme.text,
              order: isMobile ? -1 : 0,
            }}
          >
            Страница {totalPages ? currentPage + 1 : 0} / {totalPages || 0}
          </div>

          <button
            disabled={!totalPages || currentPage === totalPages - 1}
            onClick={() => openPage(currentPage + 1)}
            style={{ ...buttonStyle, opacity: !totalPages || currentPage === totalPages - 1 ? 0.45 : 1, flex: isMobile ? '1 1 140px' : undefined }}
          >
            Вперёд
          </button>
        </div>
      </footer>

      {resumePrompt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.46)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 4000,
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              background: currentTheme.page,
              color: currentTheme.text,
              borderRadius: '24px',
              padding: '28px',
              border: `1px solid ${currentTheme.border}`,
              boxShadow: currentTheme.shadow,
            }}
          >
            <div style={{ fontFamily: uiFont, color: currentTheme.accent, fontWeight: 800, marginBottom: '12px' }}>
              Продолжить чтение?
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.5rem' }}>
              Вы остановились на странице {resumePrompt.pageIndex + 1}
            </h3>
            <p style={{ margin: '0 0 22px', color: currentTheme.textSoft, lineHeight: 1.6 }}>
              Можем открыть книгу с сохранённого места или начать чтение сначала.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleResumeReading}
                style={{
                  ...buttonStyle,
                  background: currentTheme.accent,
                  color: '#fff',
                  border: 'none',
                  flex: 1,
                  minWidth: '150px',
                }}
              >
                Продолжить
              </button>
              <button
                onClick={handleStartOver}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  minWidth: '150px',
                }}
              >
                Начать сначала
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Reader;
