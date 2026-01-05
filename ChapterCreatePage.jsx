import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createChapter } from '../api/chapter';
import { uploadImage, uploadBgm } from '../api/upload';
import AuthContext from '../context/AuthContext'; // AuthContext 임포트
import './NovelEditPage.css'; // CSS 파일 임포트

// 이미지 미리보기를 위한 헬퍼 컴포넌트
const ImagePreview = ({ file, existingImage, placeholderText }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else if (existingImage) {
      setPreview(existingImage);
    } else {
      setPreview(null);
    }
  }, [file, existingImage]);

  return (
    <div className="image-preview-box">
      {preview ? <img src={preview} alt="배경 미리보기" /> : <span>{placeholderText}</span>}
    </div>
  );
};

export default function ChapterCreatePage() {
  const navigate = useNavigate();
  const { novelId } = useParams();
  const { user } = useContext(AuthContext); // user 정보 가져오기

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isFree: true,
  });

  const [files, setFiles] = useState({
    bgImage: null,
    bgm: null,
  });

  const [fileKeys, setFileKeys] = useState({
    bgImage: Date.now(),
    bgm: Date.now(),
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // 🔹 Hook 최상위에서 비로그인 사용자 처리
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 렌더링 시 비로그인 사용자라면 아무것도 표시하지 않음
  if (!user) return null;

  /** 입력 처리 */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === 'true' ? true : value === 'false' ? false : value),
    }));
  };

  /** 파일 선택 */
  const handleFileChange = (e) => {
    setFiles(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  /** 파일 삭제 */
  const handleRemoveFile = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setFileKeys(prev => ({ ...prev, [type]: Date.now() }));
  };

  /** 제출 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ text: '제목과 내용을 입력해주세요.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      let bgImageUrl = '';
      let bgmUrl = '';

      if (files.bgImage) {
        const { url } = await uploadImage(files.bgImage);
        bgImageUrl = url;
      }

      if (files.bgm) {
        const { url } = await uploadBgm(files.bgm);
        bgmUrl = url;
      }

      const newChapter = {
        title: formData.title,
        content: formData.content,
        images: bgImageUrl ? [bgImageUrl] : [],
        bgm: bgmUrl || '',
        isFree: formData.isFree,
      };

      await createChapter(novelId, newChapter);

      setMessage({ text: '회차 등록 완료!', type: 'success' });
      setTimeout(() => navigate(`/novels/${novelId}`), 1500);
    } catch (err) {
      console.error('회차 등록 실패:', err);
      setMessage({
        text: err.message || '회차 등록 중 오류가 발생했습니다.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="novel-edit-container">
      <h2 className="page-title">회차 등록</h2>
      <p className="page-subtitle">제목, 내용, 배경 이미지, BGM을 등록하세요.</p>

      {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-column">
          {/* 배경 이미지 */}
          <div className="input-group">
            <label>배경 이미지</label>
            <ImagePreview file={files.bgImage} placeholderText="이미지 미리보기" />
            <div className="image-controls">
              <input
                key={fileKeys.bgImage}
                type="file"
                name="bgImage"
                accept="image/*"
                onChange={handleFileChange}
              />
              {files.bgImage && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemoveFile('bgImage')}
                >
                  삭제
                </button>
              )}
            </div>
          </div>

          {/* BGM 업로드 */}
          <div className="input-group">
            <label>BGM 업로드</label>
            <div className="image-controls">
              <input
                key={fileKeys.bgm}
                type="file"
                name="bgm"
                accept="audio/*"
                onChange={handleFileChange}
              />
              {files.bgm && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemoveFile('bgm')}
                >
                  삭제
                </button>
              )}
            </div>
            {files.bgm && (
              <audio controls style={{ marginTop: '8px', width: '100%' }}>
                <source src={URL.createObjectURL(files.bgm)} type={files.bgm.type} />
                브라우저가 오디오를 지원하지 않습니다.
              </audio>
            )}
          </div>

          {/* AI 생성 페이지 버튼 */}
          <div className="ai-helper-link input-group">
            <p>배경 이미지나 BGM이 없으신가요?</p>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/ai-generator')}
            >
              AI로 생성하러 가기
            </button>
          </div>
          
        </div>

        <div className="form-column">
          <div className="input-group">
            <label htmlFor="title">회차 제목</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="content">내용</label>
            <textarea
              id="content"
              name="content"
              rows="12"
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="isFree">무료 공개</label>
            <select id="isFree" name="isFree" value={formData.isFree} onChange={handleChange}>
              <option value={true}>무료</option>
              <option value={false}>유료</option>
            </select>
          </div>
        </div>
      </form>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          취소
        </button>
        <button type="submit" className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '등록 중...' : '회차 등록'}
        </button>
      </div>
    </main>
  );
}
