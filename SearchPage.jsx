// src/pages/SearchPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchNovels } from '../api/novel';
import NovelCard from '../components/NovelCard';
import './SearchPage.css'; // SearchPage.css를 그대로 사용합니다.

// RankingPage에서 가져온 장르 목록
const popularGenres = ['판타지', '로맨스', '현대판타지', '무협', 'SF', '미스터리', '기타'];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 랭킹 페이지와 동일한 상태 추가
  const [activeTab, setActiveTab] = useState('views'); // '실시간' 또는 '신작'
  const [activeGenre, setActiveGenre] = useState(null); // 선택된 장르

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        // API 호출 시 모든 상태(query, sortBy, genre)를 전달
        const options = {
          query: query,
          sortBy: activeTab,
          genre: activeGenre
        };
        const data = await searchNovels(options);
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
    // query, activeTab, activeGenre가 바뀔 때마다 API를 다시 호출
  }, [query, activeTab, activeGenre]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleGenreClick = (genre) => {
    if (genre === '전체') {
      setActiveGenre(null);
    } else {
      setActiveGenre(genre);
    }
  };

  return (
    <main className="search-page-container">
      <h1 className="search-title">
        '<span className="query-highlight">{query}</span>' 검색 결과
      </h1>

      {/* --- 👇 RankingPage의 탭과 장르 필터 UI를 그대로 가져옴 --- */}
      <div className="ranking-tabs">
        <button
          className={`tab-button ${activeTab === 'views' ? 'active' : ''}`}
          onClick={() => handleTabClick('views')}
        >
          실시간
        </button>
        <button
          className={`tab-button ${activeTab === 'createdAt' ? 'active' : ''}`}
          onClick={() => handleTabClick('createdAt')}
        >
          신작
        </button>
      </div>

      <div className="tag-search-section">
        <div className="tag-list">
          <button
            className={`tag-item all ${!activeGenre ? 'active' : ''}`}
            onClick={() => handleGenreClick('전체')}
          >
            전체
          </button>
          {popularGenres.map(genre => (
            <button
              key={genre}
              className={`tag-item ${activeGenre === genre ? 'active' : ''}`}
              onClick={() => handleGenreClick(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      {/* ---------------------------------------------------- */}


      {loading && <p>검색 중...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && (
        results.length > 0 ? (
          <div className="search-results-grid">
            {results.map(novel => (
              <NovelCard key={novel._id} novel={novel} />
            ))}
          </div>
        ) : (
          <p className="no-results-message">검색 결과가 없습니다.</p>
        )
      )}
    </main>
  );
}