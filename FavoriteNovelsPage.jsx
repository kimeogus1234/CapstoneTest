import React, { useEffect, useState, useContext } from 'react';
import NovelCard from '../components/NovelCard';
import { getFavoriteNovels } from '../api/like';
import AuthContext from '../context/AuthContext';

export default function FavoriteNovelsPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    getFavoriteNovels()
      .then(data => setNovels(data))
      .catch(() => setError('찜한 소설을 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <p className="center-text">사용자 정보 로딩 중...</p>;
  if (!user) return <p className="center-text">로그인이 필요합니다.</p>;

  return (
    <div className="favorite-novels-page">
      <h1>찜한 소설</h1>
      {loading ? (
        <p className="center-text">로딩 중...</p>
      ) : error ? (
        <p className="center-text error">{error}</p>
      ) : novels.length === 0 ? (
        <p className="center-text">아직 좋아요한 소설이 없습니다.</p>
      ) : (
        <ul className="novel-list">
          {novels.map(novel => (
            <NovelCard key={novel._id} novel={novel} />
          ))}
        </ul>
      )}
    </div>
  );
}
