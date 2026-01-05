// src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';      // 이전에 만든 API 함수
import AuthContext, { AuthProvider } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  // 보내주신 코드처럼 개별 state로 관리
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault(); // form의 기본 새로고침 동작 방지
    try {
      const response = await loginUser({ userId, password });
      alert(response.message); // 보내주신 코드처럼 alert 사용

      // localStorage에 토큰과 사용자 정보 저장
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // 전역 상태 업데이트
      login(response.user);
      
      // 메인 페이지로 이동
      navigate('/');
    } catch (error) {
      alert(error.message || '로그인 실패');
    }
  };

  // 아이디/비밀번호 찾기 페이지로 이동하는 함수
  const goToFindId = () => navigate('/find-id');
  const goToFindPassword = () => navigate('/find-password');

  return (
    <div className="login-container">
      {/* form 태그에 onSubmit 이벤트 연결 */}
      <form className="login-form" onSubmit={handleLogin}>
        <h2>로그인</h2>
        <div className="input-group">
          <label htmlFor="userId">아이디</label>
          <input
            type="text"
            id="userId"
            placeholder="아이디를 입력하세요"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-button">
          로그인
        </button>
        
        <div className="form-footer-buttons">
          <button type="button" onClick={goToFindId} className="sub-button">
            아이디 찾기
          </button>
          <button type="button" onClick={goToFindPassword} className="sub-button">
            비밀번호 찾기
          </button>
        </div>

        <div className="form-footer">
          <span>아직 회원이 아니신가요?</span>
          <Link to="/register">회원가입</Link>
        </div>
      </form>
    </div>
  );
}