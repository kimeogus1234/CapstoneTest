// src/pages/FindPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../api/auth'; // auth.js에 만들어둔 resetPassword 함수

export default function FindPasswordPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleFindPassword = async (e) => {
    e.preventDefault();
    if (!email || !userId) {
      setFormMessage({ type: 'error', text: '이메일과 아이디를 모두 입력해주세요.' });
      return;
    }

    setLoading(true);
    setFormMessage({ type: '', text: '' });

    try {
      const response = await resetPassword({ email, userId });
      setFormMessage({ type: 'success', text: response.message || '임시 비밀번호가 이메일로 전송되었습니다.' });
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message || '비밀번호 재설정에 실패했습니다.' });
    }
    setLoading(false);
  };

  return (
    // 로그인 페이지와 동일한 CSS 클래스를 재사용합니다.
    <div className="login-container">
      <form className="login-form" onSubmit={handleFindPassword}>
        <h2>비밀번호 찾기</h2>
        <p className="form-description">가입 시 사용한 이메일과 아이디를 입력하시면, 해당 이메일로 임시 비밀번호를 보내드립니다.</p>

        <div className="input-group">
          <label htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="userId">아이디</label>
          <input
            type="text"
            id="userId"
            placeholder="아이디"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>

        {formMessage.text && (
          <div className={`form-message ${formMessage.type}`}>
            {formMessage.text}
          </div>
        )}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? '전송 중...' : '임시 비밀번호 받기'}
        </button>
        
        <div className="form-footer">
          <Link to="/login">로그인 페이지로 돌아가기</Link>
        </div>
      </form>
    </div>
  );
}