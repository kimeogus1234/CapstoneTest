// src/pages/RankingPage.jsx
import React, { useState, useEffect } from 'react';
import { getRankedNovels } from '../api/novel';
import NovelCard from '../components/NovelCard';
import './RankingPage.css';

const popularGenres = ['판타지', '로맨스', '현대판타지', '무협', 'SF', '미스터리', '기타'];

const RankingPage = () => {
  const [novels, setNovels] = useState([]);
  const [activeTab, setActiveTab] = useState('views');    // '실시간' 또는 '신작' 상태
  const [activeGenre, setActiveGenre] = useState(null); // 선택된 장르 상태 (null이면 '전체')
  const [loading, setLoading] = useState(true);

  // activeTab 또는 activeGenre가 변경될 때마다 데이터를 새로고침
  useEffect(() => {
    const fetchNovels = async () => {
      setLoading(true);
      try {
        // 현재 선택된 탭(sortBy)과 장르(genre)를 모두 API로 전달
        const options = { 
          sortBy: activeTab, 
          genre: activeGenre, 
          page: 1 
        };
        const data = await getRankedNovels(options);
        setNovels(data.novels || []);
      } catch (error) {
        console.error("랭킹 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNovels();
  }, [activeTab, activeGenre]);

  return (
    <main className="ranking-page-container">
      <h1 className="page-title">랭킹</h1>
      <div className="ranking-tabs">
        <button
          className={`tab-button ${activeTab === 'views' ? 'active' : ''}`}
          onClick={() => setActiveTab('views')} // 탭 상태만 변경
        >
          실시간
        </button>
        <button
          className={`tab-button ${activeTab === 'createdAt' ? 'active' : ''}`}
          onClick={() => setActiveTab('createdAt')} // 탭 상태만 변경
        >
          신작
        </button>
      </div>

      <div className="tag-search-section">
        <div className="tag-list">
          <button
            className={`tag-item all ${!activeGenre ? 'active' : ''}`}
            onClick={() => setActiveGenre(null)} // '전체'는 장르 상태를 null로 설정
          >
            전체
          </button>
          {popularGenres.map(genre => (
            <button
              key={genre}
              className={`tag-item ${activeGenre === genre ? 'active' : ''}`}
              onClick={() => setActiveGenre(genre)} // 장르 상태만 변경
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p>목록을 불러오는 중...</p>
      ) : novels.length > 0 ? (
        <div className="ranking-results-grid">
          {novels.map(novel => (
            <NovelCard key={novel._id} novel={novel} />
          ))}
        </div>
      ) : (
        <p className="no-results-message">해당 조건의 작품이 없습니다.</p>
      )}
    </main>
  );
};

export default RankingPage;