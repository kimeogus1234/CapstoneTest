// src/pages/ProfileEditPage.jsx
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 👈 useLocation 훅 추가
import AuthContext from '../context/AuthContext';
import { getUserProfile } from '../api/user';
import ProfileForm from '../components/ProfileForm';
import PasswordChangeForm from '../components/PasswordChangeForm';
import SubscriptionManager from '../components/SubscriptionManager';
import './ProfileEditPage.css';

const ProfileEditPage = () => {
  const location = useLocation(); // 👈 페이지 이동 정보를 담고 있는 객체
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  // 👇 전달받은 state가 있으면 그 값으로, 없으면 'profile'로 초기 탭 설정
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'profile');

  useEffect(() => {
    const fetch = async () => {
      if (!user) {
        try {
          const data = await getUserProfile();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
          console.error("프로필 정보를 가져오는데 실패했습니다.", error);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user, setUser]);

  if (loading) return <p className="loading-text">로딩중...</p>;

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileForm user={user} setUser={setUser} />;
      case 'password':
        return <PasswordChangeForm />;
      case 'subscription':
        return <SubscriptionManager />;
      default:
        return null;
    }
  };

  return (
    <main className="profile-edit-container">
      <h2 className="profile-title">내 프로필 관리</h2>

      <div className="profile-tabs">
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          프로필 수정
        </button>
        <button
          className={activeTab === 'password' ? 'active' : ''}
          onClick={() => setActiveTab('password')}
        >
          비밀번호 변경
        </button>
        <button
          className={activeTab === 'subscription' ? 'active' : ''}
          onClick={() => setActiveTab('subscription')}
        >
          구독 관리
        </button>
        
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <button onClick={() => navigate('/admin')}>
            관리자 페이지
          </button>
        )}
      </div>

      <div className="tab-content">{renderActiveTab()}</div>
    </main>
  );
};

export default ProfileEditPage;