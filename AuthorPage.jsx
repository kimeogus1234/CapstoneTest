// src/pages/AuthorPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthorStats, getAuthorSupport, getAuthorSettlement } from '../api/novel';
import AuthContext from '../context/AuthContext';
import NovelCard from '../components/NovelCard'; // 컴포넌트로 분리
import './ProfileEditPage.css'; // 기존 CSS

export default function AuthorPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('myWorks');
  const [stats, setStats] = useState({});
  const [novels, setNovels] = useState([]);
  const [support, setSupport] = useState([]);
  const [settlement, setSettlement] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAuthorVerified = ['author', 'admin', 'superadmin'].includes(user?.role);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const statsResponse = await getAuthorStats(user.userId);
        setStats(statsResponse?.stats || {});
        setNovels(
          Array.isArray(statsResponse?.novels)
            ? statsResponse.novels.filter((novel) => novel.authorId === user.userId)
            : []
        );

        const supportResponse = await getAuthorSupport(user.userId);
        setSupport(Array.isArray(supportResponse) ? supportResponse : []);

        const settlementResponse = await getAuthorSettlement(user.userId);
        setSettlement(Array.isArray(settlementResponse) ? settlementResponse : []);
      } catch (error) {
        console.error('작가 데이터를 가져오는 데 실패했습니다:', error);
        setNovels([]);
        setSupport([]);
        setSettlement([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateNovel = () => {
    if (!user) return navigate('/login');

    if (isAuthorVerified) {
      navigate('/novels/create');
    } else {
      navigate('/verify');
    }
  };

  const renderTabContent = () => {
    if (loading) return <p>로딩 중...</p>;

    switch (activeTab) {
      case 'myWorks':
        return (
          <div className="tab-content">
            <button className="submit-button" onClick={handleCreateNovel}>
              새 작품 등록
            </button>
            <br></br><br></br>

            <ul className="novel-list">
              {novels.map((novel) => (
                <NovelCard key={novel._id} novel={novel} navigate={navigate} />
              ))}
            </ul>
          </div>
        );

      case 'support':
        return (
          <div className="tab-content">
            <ul>
              {support.map((s) => (
                <li key={s._id || s.id} className="subscription-status-card">
                  <div className="status-grid">
                    <span className="status-label">작품:</span>
                    <span className="status-value">{s.novelTitle}</span>
                    <span className="status-label">금액:</span>
                    <span className="status-value">{s.amount}원</span>
                    <span className="status-label">후원자:</span>
                    <span className="status-value">{s.supporter}</span>
                    <span className="status-label">날짜:</span>
                    <span className="status-value">{new Date(s.date).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'stats':
        return (
          <div className="tab-content subscription-status-card">
            <div className="status-grid">
              <span className="status-label">총 소설 수:</span>
              <span className="status-value">{stats.totalNovels || 0}</span>
              <span className="status-label">총 수익:</span>
              <span className="status-value">{stats.totalRevenue || 0}원</span>
              <span className="status-label">총 후원 수:</span>
              <span className="status-value">{stats.totalSupport || 0}</span>
            </div>
          </div>
        );

      case 'settlement':
        return (
          <div className="tab-content">
            <ul>
              {settlement.map((s) => (
                <li key={s._id || s.id} className="subscription-status-card">
                  <div className="status-grid">
                    <span className="status-label">기간:</span>
                    <span className="status-value">{s.period}</span>
                    <span className="status-label">금액:</span>
                    <span className="status-value">{s.amount}원</span>
                    <span className="status-label">상태:</span>
                    <span className={`status-value ${s.status === '완료' ? 'active' : 'inactive'}`}>
                      {s.status || '대기중'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="profile-edit-container">
      <h1 className="profile-title">작가 페이지</h1>

      <div className="profile-tabs">
        <button className={activeTab === 'myWorks' ? 'active' : ''} onClick={() => setActiveTab('myWorks')}>
          내 작품
        </button>
        <button className={activeTab === 'support' ? 'active' : ''} onClick={() => setActiveTab('support')}>
          후원 관리
        </button>
        <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>
          작품 통계
        </button>
        <button className={activeTab === 'settlement' ? 'active' : ''} onClick={() => setActiveTab('settlement')}>
          정산
        </button>
      </div>

      {renderTabContent()}
    </main>
  );
}
