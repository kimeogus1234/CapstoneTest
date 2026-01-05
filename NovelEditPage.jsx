// src/pages/NovelEditPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNovel, deleteNovel, updateNovel } from '../api/novel';
import { uploadImage, deleteFile } from '../api/upload';
import './NovelEditPage.css';

const NovelEditPage = () => {
  const { novelId } = useParams();
  const navigate = useNavigate();

  const [novel, setNovel] = useState(null);
  const [fileBookCover, setFileBookCover] = useState(null);
  const [fileCoverImage, setFileCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);

  const DAYS_ORDER = ['월','화','수','목','금','토','일','비정기'];

  // ✅ 이미지 절대경로 변환
  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // ✅ 소설 불러오기
  useEffect(() => {
    if (!novelId) return;
    const fetchNovel = async () => {
      try {
        const data = await getNovel(novelId);
        setNovel(data);
        setTags(
          Array.isArray(data.tags)
            ? data.tags.filter(tag => tag && tag.trim() !== "")
            : data.tags
              ? data.tags.split(',').filter(tag => tag && tag.trim() !== "")
              : []
        );
      } catch (err) {
        console.error('소설 불러오기 실패:', err);
      }
    };
    fetchNovel();
  }, [novelId]);

  if (!novel) return <div className="loading">불러오는 중...</div>;

  // ✅ 입력값 변경
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox' && name === 'serializationDays') {
      const day = value;
      setNovel(prev => {
        const updatedDays = checked
          ? [...prev.serializationDays, day]
          : prev.serializationDays.filter(d => d !== day);
        updatedDays.sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b));
        return { ...prev, serializationDays: updatedDays };
      });
    } else if (type === 'select-one' && (value === 'true' || value === 'false')) {
      setNovel(prev => ({ ...prev, [name]: value === 'true' }));
    } else {
      setNovel(prev => ({ ...prev, [name]: value }));
    }
  };

  // ✅ 이미지 삭제
  const handleDeleteImage = async (type) => {
    const url = type === 'bookCover' ? novel.bookCover : novel.coverImage;
    if (!url) return;

    if (!window.confirm('정말로 이 이미지를 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      await deleteFile(url);
      const updateData = type === 'bookCover' ? { bookCover: '' } : { coverImage: '' };
      await updateNovel(novel._id, updateData);
      setNovel(prev => ({ ...prev, ...updateData }));
      if (type === 'bookCover') setFileBookCover(null);
      else setFileCoverImage(null);
      setMessage({ text: '이미지가 삭제되었습니다.', type: 'success' });
    } catch (err) {
      console.error('이미지 삭제 실패:', err.message || err);
      setMessage({ text: '이미지 삭제 실패: ' + (err.message || '알 수 없는 오류'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ 파일 선택
  const handleFileChange = (e, type) => {
    if (type === 'bookCover') setFileBookCover(e.target.files[0]);
    if (type === 'coverImage') setFileCoverImage(e.target.files[0]);
  };

  // ✅ 태그 추가 / 삭제
  const handleTagKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput('');
    }
  };
  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  // ✅ 소설 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말로 이 소설을 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      await deleteNovel(novel._id);
      setMessage({ text: '소설이 삭제되었습니다.', type: 'success' });
      setTimeout(() => navigate('/author'), 1000);
    } catch (err) {
      console.error('소설 삭제 실패:', err.message || err);
      setMessage({ text: '삭제 실패: ' + (err.message || '알 수 없는 오류'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ✅ 소설 수정 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const bookCoverUrl = fileBookCover ? (await uploadImage(fileBookCover)).url : novel.bookCover;
      const coverImageUrl = fileCoverImage ? (await uploadImage(fileCoverImage)).url : novel.coverImage;

      const updateData = {
        title: novel.title,
        description: novel.description,
        genre: novel.genre,
        tags: tags.join(','),
        bookCover: bookCoverUrl || '',
        coverImage: coverImageUrl || '',
        isExclusive: novel.isExclusive,
        volumeType: novel.volumeType,
        ageRating: novel.ageRating,
        serializationDays: novel.serializationDays,
        agreement: novel.agreement,
        status: novel.status
      };

      await updateNovel(novel._id, updateData);
      setMessage({ text: '소설이 수정되었습니다.', type: 'success' });
      setTimeout(() => navigate(`/novels/${novel._id}`), 1200);
    } catch (err) {
      console.error('소설 수정 에러:', err.message || err);
      setMessage({ text: '수정 실패: ' + (err.message || '알 수 없는 오류'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="novel-edit-container">
      <div className="page-header">
        <h2 className="page-title">작품 수정</h2>
      </div>
      <p className="page-subtitle">등록된 작품 정보를 수정할 수 있습니다.</p>

      <form onSubmit={handleSubmit} className="novel-edit-form">
        {message.text && <div className={`form-message ${message.type}`}>{message.text}</div>}

        <div className="form-grid">
          {/* 왼쪽 이미지 */}
          <div className="form-column">
            {/* 북커버 */}
            <div className="input-group">
              <label>북커버 이미지</label>
              <div className="image-preview-box">
                {fileBookCover ? (
                  <img src={URL.createObjectURL(fileBookCover)} alt="책 표지" />
                ) : (
                  novel.bookCover && <img src={getImageUrl(novel.bookCover)} alt="책 표지" />
                )}
              </div>
              <input type="file" onChange={(e) => handleFileChange(e, 'bookCover')} accept="image/*" />
              {(fileBookCover || novel.bookCover) && (
                <button type="button" className="btn-delete-image" onClick={() => fileBookCover ? setFileBookCover(null) : handleDeleteImage('bookCover')}>
                  삭제
                </button>
              )}
            </div>

            {/* 커버 이미지 */}
            <div className="input-group">
              <label>일러스트 이미지</label>
              <div className="image-preview-box">
                {fileCoverImage ? (
                  <img src={URL.createObjectURL(fileCoverImage)} alt="커버 이미지" />
                ) : (
                  novel.coverImage && <img src={getImageUrl(novel.coverImage)} alt="커버 이미지" />
                )}
              </div>
              <input type="file" onChange={(e) => handleFileChange(e, 'coverImage')} accept="image/*" />
              {(fileCoverImage || novel.coverImage) && (
                <button type="button" className="btn-delete-image" onClick={() => fileCoverImage ? setFileCoverImage(null) : handleDeleteImage('coverImage')}>
                  삭제
                </button>
              )}
            </div>
          </div>

          {/* 오른쪽 입력폼 */}
          <div className="form-column">
            <div className="input-group">
              <label>작품명</label>
              <input name="title" value={novel.title} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>분량</label>
              <select name="volumeType" value={novel.volumeType} onChange={handleChange}>
                <option value="free">자유 연재</option>
                <option value="plus">플러스</option>
              </select>
            </div>

            <div className="input-group">
              <label>독점 여부</label>
              <select name="isExclusive" value={novel.isExclusive} onChange={handleChange}>
                <option value={false}>비독점</option>
                <option value={true}>독점</option>
              </select>
            </div>

            <div className="input-group">
              <label>연령 등급</label>
              <select name="ageRating" value={novel.ageRating} onChange={handleChange}>
                <option value="all">전 연령</option>
                <option value="19">19세 이용가</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="categoryTag">1차 분류 태그</label>
              <select
                id="categoryTag"
                name="genre"
                value={novel.genre || ''}
                onChange={handleChange}
                required
              >
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
              <label>해시태그</label>
              <input
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
                    <button type="button" onClick={() => removeTag(tag)}>x</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>연재 요일</label>
              <div className="day-checkbox-group">
                {DAYS_ORDER.map(day => (
                  <label key={day} className={`day-btn ${novel.serializationDays.includes(day) ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      name="serializationDays"
                      value={day}
                      checked={novel.serializationDays.includes(day)}
                      onChange={handleChange}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>작품 소개</label>
              <textarea name="description" value={novel.description} onChange={handleChange} rows={6} />
            </div>

            <div className="input-group">
              <label>표지 사용 규정 확인</label>
              <select name="agreement" value={novel.agreement} onChange={handleChange}>
                <option value="">선택해주세요</option>
                <option value={true}>규정을 확인했으며 동의합니다.</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-delete" onClick={handleDelete}>삭제</button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '수정 중...' : '작품 수정'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default NovelEditPage;
