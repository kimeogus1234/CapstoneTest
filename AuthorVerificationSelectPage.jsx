import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthorVerificationSelectPage.css';

export default function AuthorVerificationSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="verification-select-container">
      <h1>본인인증 방법 선택</h1>
      <p>
        작가 등록을 위해 본인인증이 필요합니다.<br />
        원하시는 인증 방법을 선택해주세요.
      </p>

      <div className="verification-select-buttons">
        <button className="sms-button" onClick={() => navigate('/verify/toss')}>
          문자 인증 하기
        </button>

        <button className="kakao-button" onClick={() => alert('카카오 인증은 준비 중입니다.')}>
          카카오 인증 하기
        </button>

        <button className="naver-button" onClick={() => alert('네이버 인증은 준비 중입니다.')}>
          네이버 인증 하기
        </button>
      </div>
    </div>
  );
}
