import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNovel } from '../api/novel';
import { uploadImage } from '../api/upload';
import './NovelEditPage.css';

/** 🔹 이미지 미리보기 컴포넌트 */
const ImagePreview = ({ file, placeholderText }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url); // cleanup
    } else {
      setPreview(null);
    }
  }, [file]);

  return (
    <div className="image-preview-box">
      {preview ? <img src={preview} alt="미리보기" /> : <span>{placeholderText}</span>}
    </div>
  );
};

export default function NovelCreatePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    volumeType: 'free',
    isExclusive: 'false',
    ageRating: 'all',
    categoryTag: '',
    serializationDays: [],
    description: '',
    agreement: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [files, setFiles] = useState({ bookCover: null, coverImage: null });
  const [fileKeys, setFileKeys] = useState({ bookCover: Date.now(), coverImage: Date.now() });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const DAYS_ORDER = ['월', '화', '수', '목', '금', '토', '일', '비정기'];

  /** 🔹 입력 핸들러 */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const groupName = name.split('-')[0];
      let updated = checked
        ? [...formData[groupName], value]
        : formData[groupName].filter(day => day !== value);

      updated.sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b));
      setFormData(prev => ({ ...prev, [groupName]: updated }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  /** 🔹 파일 변경 */
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
  };

  /** 🔹 이미지 삭제 */
  const handleRemoveImage = (type) => {
    setFiles(prev => ({ ...prev, [type]: null }));
    setFileKeys(prev => ({ ...prev, [type]: Date.now() }));
  };

  /** 🔹 태그 */
  const handleTagKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput('');
    }
  };
  const removeTag = (tagToRemove) => setTags(tags.filter(tag => tag !== tagToRemove));

  /** 🔹 제출 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    if (!formData.title.trim() || !formData.description.trim() || !formData.categoryTag.trim()) {
      setMessage({ text: '제목, 설명, 장르를 모두 입력해주세요.', type: 'error' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    try {
      let bookCoverUrl = '';
      let coverImageUrl = '';

      if (files.bookCover) {
        const res = await uploadImage(files.bookCover);
        bookCoverUrl = res.url;
      }

      if (files.coverImage) {
        const res = await uploadImage(files.coverImage);
        coverImageUrl = res.url;
      }

      const data = {
        title: formData.title,
        description: formData.description,
        genre: formData.categoryTag,
        volumeType: formData.volumeType,
        isExclusive: formData.isExclusive === 'true',
        ageRating: formData.ageRating,
        serializationDays: formData.serializationDays,
        agreement: formData.agreement === 'true',
        tags,
        bookCoverUrl,
        coverImageUrl,
      };

      const response = await createNovel(data);
      setMessage({ text: response?.data?.message || '작품 등록 완료!', type: 'success' });
      setTimeout(() => navigate('/author'), 1500);
    } catch (err) {
      console.error('등록 실패:', err.response?.data || err.message);
      setMessage({
        text: err.response?.data?.message || err.message || '등록에 실패했습니다.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="novel-edit-container">
      <h2 className="page-title">작품 등록</h2>
      <p className="page-subtitle">등록하실 작품에 대한 정보를 입력해 주세요.</p>

      {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className="form-grid">
        {/* 왼쪽 컬럼: 이미지 */}
        <div className="form-column">
          <div className="input-group">
            <label>북커버 이미지</label>
            <ImagePreview file={files.bookCover} placeholderText="북커버 준비중" />
            <div className="image-controls">
              <input
                key={fileKeys.bookCover}
                type="file"
                name="bookCover"
                accept="image/*"
                onChange={handleFileChange}
              />
              {files.bookCover && (
                <button type="button" className="remove-btn" onClick={() => handleRemoveImage('bookCover')}>
                  삭제
                </button>
              )}
            </div>
          </div>

          <div className="input-group">
            <label>일러스트 이미지</label>
            <ImagePreview file={files.coverImage} placeholderText="일러스트 준비중" />
            <div className="image-controls">
              <input
                key={fileKeys.coverImage}
                type="file"
                name="coverImage"
                accept="image/*"
                onChange={handleFileChange}
              />
              {files.coverImage && (
                <button type="button" className="remove-btn" onClick={() => handleRemoveImage('coverImage')}>
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽 컬럼: 정보 */}
        <div className="form-column">
          <div className="input-group">
            <label htmlFor="title">작품명</label>
            <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label htmlFor="volumeType">분량</label>
            <select id="volumeType" name="volumeType" value={formData.volumeType} onChange={handleChange}>
              <option value="free">자유 연재</option>
              <option value="plus">플러스</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="isExclusive">독점 여부</label>
            <select id="isExclusive" name="isExclusive" value={formData.isExclusive} onChange={handleChange}>
              <option value="false">비독점</option>
              <option value="true">독점</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="ageRating">연령</label>
            <select id="ageRating" name="ageRating" value={formData.ageRating} onChange={handleChange}>
              <option value="all">전 연령</option>
              <option value="19">19세 이용가</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="categoryTag">장르</label>
            <select id="categoryTag" name="categoryTag" value={formData.categoryTag} onChange={handleChange} required>
              <option value="">선택</option>
              <option value="판타지">판타지</option>
              <option value="로맨스">로맨스</option>
              <option value="현대판타지">현대판타지</option>
              <option value="무협">무협</option>
              <option value="SF">SF</option>
              <option value="미스터리">미스터리</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="tags-input">해시태그</label>
            <input
              id="tags-input"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="스페이스바 또는 엔터로 추가"
            />
            <div className="tags-display">
              {tags.map(tag => (
                <div key={tag} className="tag-item">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)}>X</button>
                </div>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label>연재요일</label>
            <div className="day-checkbox-group">
              {DAYS_ORDER.map(day => {
                const isActive = formData.serializationDays.includes(day);
                return (
                  <div
                    key={day}
                    className={`day-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      const updated = isActive
                        ? formData.serializationDays.filter(d => d !== day)
                        : [...formData.serializationDays, day];
                      updated.sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b));
                      setFormData(prev => ({ ...prev, serializationDays: updated }));
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="description">작품 소개</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="8"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="agreement">표지 사용 규정 확인</label>
            <select id="agreement" name="agreement" value={formData.agreement} onChange={handleChange} required>
              <option value="">선택해주세요</option>
              <option value="true">규정을 확인했으며 동의합니다.</option>
              <option value="false">동의하지 않습니다.</option>
            </select>
          </div>
        </div>
      </form>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>취소</button>
        <button type="button" className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '등록 중...' : '작품 등록'}
        </button>
      </div>
    </main>
  );
}
