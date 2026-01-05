// src/pages/AIGenerationPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // axios 인스턴스
import {
  generateAiImage,
  generateAiBgm,
  listAiImages,
  deleteAiImage,
  listAiBgms,
  deleteAiBgm,
} from '../api/ai';
import './AIGenerationPage.css';

export default function AIGenerationPage() {
  // 이미지
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageList, setImageList] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);

  // BGM
  const [bgmPrompt, setBgmPrompt] = useState('');
  const [bgmList, setBgmList] = useState([]);
  const [bgmLoading, setBgmLoading] = useState(false);
  const [bgmResult, setBgmResult] = useState(null);

  const [message, setMessage] = useState({ text: '', type: '' });

  // --- 이미지 함수들 ---
  const fetchImages = async () => {
    try {
      const images = await listAiImages();
      setImageList(images);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  useEffect(() => {
    fetchImages();
    fetchBgms();
  }, []);

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    setImageLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await generateAiImage(imagePrompt);
      setMessage({ text: '이미지 생성이 완료되었습니다.', type: 'success' });
      setImagePrompt('');
      fetchImages();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = async (imageUrl) => {
    if (!window.confirm('이 이미지를 서버에서 영구적으로 삭제하시겠습니까?')) return;
    try {
      await deleteAiImage(imageUrl);
      setMessage({ text: '이미지가 삭제되었습니다.', type: 'success' });
      fetchImages();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleImageDownload = async (imageUrl) => {
    try {
      const filename = imageUrl.split('/').pop();
      const response = await api.get(`/ai/download?filename=${filename}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setMessage({ text: '이미지 다운로드 실패', type: 'error' });
    }
  };

  // --- BGM 함수들 ---
  const fetchBgms = async () => {
    try {
      const bgms = await listAiBgms();
      setBgmList(bgms);
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleBgmSubmit = async (e) => {
    e.preventDefault();
    setBgmLoading(true);
    setMessage({ text: '', type: '' });
    setBgmResult(null);
    try {
      const data = await generateAiBgm(bgmPrompt);
      setBgmResult(data.bgmUrl);
      setMessage({ text: 'BGM 생성이 완료되었습니다.', type: 'success' });
      setBgmPrompt('');
      fetchBgms();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setBgmLoading(false);
    }
  };

  const handleDeleteBgm = async (bgmUrl) => {
    if (!window.confirm('이 BGM을 서버에서 영구적으로 삭제하시겠습니까?')) return;
    try {
      await deleteAiBgm(bgmUrl);
      setMessage({ text: 'BGM이 삭제되었습니다.', type: 'success' });
      fetchBgms();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleBgmDownload = async (bgmUrl) => {
    try {
      const filename = bgmUrl.split('/').pop();
      const response = await api.get(`/ai/download-bgm?filename=${filename}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setMessage({ text: 'BGM 다운로드 실패', type: 'error' });
    }
  };

  return (
    <main className="ai-gen-container">
      <h1 className="page-title">AI 콘텐츠 생성</h1>
      <p className="page-subtitle">각 항목에 맞는 프롬프트를 입력하여 콘텐츠를 생성하세요.</p>

      {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}

      {/* --- 이미지 생성 폼 --- */}
      <form onSubmit={handleImageSubmit} className="ai-gen-form">
        <div className="input-group">
          <label htmlFor="imagePrompt">배경 이미지 생성</label>
          <textarea
            id="imagePrompt"
            rows="3"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="예: 어두운 숲, 비가 내리는 밤"
            required
          />
        </div>
        <button type="submit" className="submit-button" disabled={imageLoading}>
          {imageLoading ? '이미지 생성 중...' : '이미지 생성'}
        </button>
      </form>

      {/* --- 이미지 보관함 --- */}
        <div className="gallery-container">
          <h2>AI 이미지 보관함</h2>
          {imageList.length === 0 && !imageLoading && (
            <p className="no-results-message">생성된 이미지가 없습니다.</p>
          )}
          <div className="image-grid">
            {imageList.map((imageUrl) => {
              const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${imageUrl}`;
              return (
                <div key={imageUrl} className="image-card">
                  <img src={fullUrl} alt="AI 생성 이미지" />
                  <div className="image-actions">
                    <button onClick={() => handleImageDownload(imageUrl)} className="download-btn">
                      다운로드
                    </button>
                    <button onClick={() => handleDeleteImage(imageUrl)} className="delete-btn">
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


      <hr className="divider" />

      {/* --- BGM 생성 폼 --- */}
      <form onSubmit={handleBgmSubmit} className="ai-gen-form">
        <div className="input-group">
          <label htmlFor="bgmPrompt">배경 음악 (BGM) 생성</label>
          <textarea
            id="bgmPrompt"
            rows="3"
            value={bgmPrompt}
            onChange={(e) => setBgmPrompt(e.target.value)}
            placeholder="예: 긴장감 있는, 웅장한, 1분"
            required
          />
        </div>
        <button type="submit" className="submit-button" disabled={bgmLoading}>
          {bgmLoading ? 'BGM 생성 중...' : 'BGM 생성'}
        </button>
      </form>

      {/* --- BGM 보관함 --- */}
      <div className="gallery-container">
        <h2>AI BGM 보관함</h2>
        {bgmList.length === 0 && !bgmLoading && <p className="no-results-message">생성된 BGM이 없습니다.</p>}
        <div className="bgm-list">
          {bgmList.map((bgmUrl) => {
            const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${bgmUrl}`;
            return (
              <div key={bgmUrl} className="bgm-card">
                <audio controls src={fullUrl}></audio>
                <div className="bgm-actions">
                  <button onClick={() => handleBgmDownload(bgmUrl)} className="download-btn">다운로드</button>
                  <button onClick={() => handleDeleteBgm(bgmUrl)} className="delete-btn">삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
