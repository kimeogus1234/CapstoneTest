// src/pages/ChapterEditPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { uploadImage, uploadBgm, deleteFile } from '../api/upload';
import { getChapterById, updateChapter, deleteChapter } from '../api/chapter';
import './NovelEditPage.css';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

// 서버 상대경로 처리
const getFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_BASE_URL || '';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

// 이미지 미리보기 컴포넌트
const ImagePreview = ({ file, existingImage, placeholderText }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else if (existingImage) {
      setPreview(getFileUrl(existingImage));
    } else {
      setPreview(null);
    }
  }, [file, existingImage]);

  return (
    <div className="image-preview-box">
      {preview ? <img src={preview} alt="미리보기" /> : <span>{placeholderText}</span>}
    </div>
  );
};

// 오디오 미리보기 컴포넌트
const AudioPreview = ({ file, existingUrl, placeholderText }) => {
  const [preview, setPreview] = useState(existingUrl || null);

  useEffect(() => {
    if (file) setPreview(URL.createObjectURL(file));
    else if (!existingUrl) setPreview(null);
    else setPreview(getFileUrl(existingUrl));
  }, [file, existingUrl]);

  if (!preview) return <span>{placeholderText}</span>;

  return (
    <audio controls style={{ marginTop: '8px', width: '100%' }}>
      <source src={preview} type={file ? file.type : 'audio/mpeg'} />
      브라우저가 오디오를 지원하지 않습니다.
    </audio>
  );
};

export default function ChapterEditPage() {
  const navigate = useNavigate();
  const { chapterId, novelId } = useParams();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isFree: true,
    images: [],
    bgm: '',
    fontStyle: ''
  });

  const [files, setFiles] = useState({ bgImage: null, bgm: null });
  const [removedFlags, setRemovedFlags] = useState({ bgImage: false, bgm: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // 회차 데이터 불러오기
  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const data = await getChapterById(chapterId);
        setFormData({
          title: data.title,
          content: data.content,
          isFree: data.isFree,
          images: data.images || [],
          bgm: data.bgm || '',
          fontStyle: data.fontStyle || ''
        });
      } catch (err) {
        setMessage({ text: err.message || '회차 불러오기 실패', type: 'error' });
      }
    };
    fetchChapter();
  }, [chapterId]);

  // 입력값 변경
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value === 'true' ? true : value === 'false' ? false : value)
    }));
  };

  // 파일 선택
  const handleFileChange = (e) => {
    const name = e.target.name;
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, [name]: file }));
    setRemovedFlags(prev => ({ ...prev, [name]: false })); // 새 파일 선택 시 삭제 플래그 초기화
  };

  // 미리보기에서 삭제 버튼 클릭
  const handleRemovePreview = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setRemovedFlags(prev => ({ ...prev, [type]: true })); // 실제 삭제는 수정 시
  };

  // 회차 수정
  const handleUpdate = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!formData.title.trim() || !formData.content.trim()) {
      setMessage({ text: '제목과 내용을 입력해주세요.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        isFree: formData.isFree,
        fontStyle: formData.fontStyle
      };

      // 이미지 처리
      if (files.bgImage) {
        const res = await uploadImage(files.bgImage);
        payload.images = [res.url];
        if (formData.images[0]) await deleteFile(formData.images[0]); // 기존 파일 삭제
      } else if (removedFlags.bgImage) {
        if (formData.images[0]) await deleteFile(formData.images[0]);
        payload.images = [];
      }

      // BGM 처리
      if (files.bgm) {
        const res = await uploadBgm(files.bgm);
        payload.bgm = res.url;
        if (formData.bgm) await deleteFile(formData.bgm);
      } else if (removedFlags.bgm) {
        if (formData.bgm) await deleteFile(formData.bgm);
        payload.bgm = '';
      }

      await updateChapter(chapterId, payload);
      setMessage({ text: '회차가 수정되었습니다.', type: 'success' });
      setTimeout(() => navigate(`/novels/${novelId}`), 1200);
    } catch (err) {
      setMessage({ text: err.message || '회차 수정 실패', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 회차 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말 이 회차를 삭제하시겠습니까?')) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await deleteChapter(chapterId);
      setMessage({ text: '회차가 삭제되었습니다.', type: 'success' });
      setTimeout(() => navigate(`/novels/${novelId}`), 1200);
    } catch (err) {
      setMessage({ text: err.message || '회차 삭제 실패', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="novel-edit-container">
        <h2 className="page-title">회차 수정 / 삭제</h2>
        <p className="page-subtitle">제목, 내용, 배경 이미지, BGM을 수정하세요.</p>
        {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}

        <form className="form-grid">
          <div className="form-column">
            <div className="input-group">
              <label>배경 이미지</label>
              <ImagePreview
                file={files.bgImage}
                existingImage={removedFlags.bgImage ? null : formData.images[0]}
                placeholderText="이미지 없음"
              />
              <div className="image-controls">
                <input type="file" name="bgImage" accept="image/*" onChange={handleFileChange} />
                {(files.bgImage || formData.images[0]) && (
                  <button type="button" className="remove-btn" onClick={() => handleRemovePreview('bgImage')}>
                    삭제
                  </button>
                )}
              </div>
            </div>

            <div className="input-group">
              <label>BGM</label>
              <AudioPreview
                file={files.bgm}
                existingUrl={removedFlags.bgm ? null : formData.bgm}
                placeholderText="BGM 없음"
              />
              <div className="image-controls">
                <input type="file" name="bgm" accept="audio/*" onChange={handleFileChange} />
                {(files.bgm || formData.bgm) && (
                  <button type="button" className="remove-btn" onClick={() => handleRemovePreview('bgm')}>
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-column">
            <div className="input-group">
              <label>회차 제목</label>
              <input name="title" value={formData.title} onChange={handleChange} type="text" required />
            </div>

            <div className="input-group">
              <label>내용</label>
              <textarea name="content" value={formData.content} onChange={handleChange} rows={12} required />
            </div>

            <div className="input-group">
              <label>무료 공개</label>
              <select name="isFree" value={formData.isFree} onChange={handleChange}>
                <option value={true}>무료</option>
                <option value={false}>유료</option>
              </select>
            </div>
          </div>
        </form>

        <div className="form-actions">
          <button type="button" className="btn-delete" onClick={handleDelete} disabled={loading}>
            {loading ? '삭제 중...' : '삭제'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>취소</button>
          <button type="button" className="btn-primary" onClick={handleUpdate} disabled={loading}>
            {loading ? '수정 중...' : '회차 수정'}
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
