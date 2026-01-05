// src/pages/FindIdPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { findId } from '../api/auth'; // auth.js에 만들어둔 findId 함수

export default function FindIdPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleFindId = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFormMessage({ type: 'error', text: '이메일과 비밀번호를 모두 입력해주세요.' });
      return;
    }

    setLoading(true);
    setFormMessage({ type: '', text: '' });

    try {
      const response = await findId({ email, password });
      // 백엔드 응답 메시지를 성공 메시지로 표시
      setFormMessage({ type: 'success', text: response.message });
    } catch (error) {
      // 백엔드 오류 메시지를 실패 메시지로 표시
      setFormMessage({ type: 'error', text: error.message || '아이디 찾기에 실패했습니다.' });
    }
    setLoading(false);
  };

  return (
    // 로그인 페이지와 동일한 CSS 클래스를 재사용하여 디자인 일관성 유지
    <div className="login-container">
      <form className="login-form" onSubmit={handleFindId}>
        <h2>아이디 찾기</h2>
        <p className="form-description">아이디를 찾기 위해 이메일과 비밀번호를 입력해주세요.</p>

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
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {formMessage.text && (
          <div className={`form-message ${formMessage.type}`}>
            {formMessage.text}
          </div>
        )}

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? '전송 중...' : '아이디 찾기'}
        </button>
        
        <div className="form-footer">
          <Link to="/login">로그인 페이지로 돌아가기</Link>
        </div>
      </form>
    </div>
  );
}