import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNovel } from '../api/novel';
import { getComments, createComment } from '../api/comment';
import { getChaptersByNovel } from '../api/chapter';
import ChapterList from '../components/ChapterList';
import CommentBox from '../components/CommentBox';
import AuthContext from '../context/AuthContext';
import ReportModal from '../components/ReportModal';
import { toggleLike, checkLike } from '../api/like';

import './NovelDetailPage.css';

export default function NovelDetailPage() {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [novel, setNovel] = useState(null);
  const [comments, setComments] = useState([]);
  const [chapters, setChapters] = useState([]);
  // ✅ 신고 모달 상태
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [reportTargetType, setReportTargetType] = useState('novel');

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const novelData = await getNovel(novelId);
        setNovel(novelData);
        setLikeCount(novelData.likeCount || 0); // 🔥 소설 좋아요 수

        // 댓글
        const commentsData = await getComments({ novelId });
        setComments(commentsData);

        // 회차
        const chaptersData = await getChaptersByNovel(novelId);
        setChapters(chaptersData);

        // 🔥 좋아요 상태 불러오기
        if (user) {
          const likeRes = await checkLike('novel', novelId);
          setLiked(likeRes.liked);
        }
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      }
    };
    fetchData();
  }, [novelId, user]);

  // 댓글 등록
  const handleCommentSubmit = async (commentText) => {
    if (!commentText.trim()) return;

    try {
      // chapterId는 null
      const newComment = await createComment({
        novelId,
        chapterId: null,
        content: commentText,
      });
      // 새 댓글 추가
      setComments((prev) => [...prev, newComment.comment]);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const result = await toggleLike('novel', novelId);

      setLiked(result.liked);
      setLikeCount((prev) => (result.liked ? prev + 1 : prev - 1));
    } catch (error) {
      console.error('좋아요 오류:', error);
    }
  };

  if (!novel) return <p className="center-text">로딩 중...</p>;
  if (authLoading) return <p className="center-text">사용자 정보 로딩 중...</p>;

  const sortedChapters = [...chapters].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const handleStartRead = () => {
    if (sortedChapters.length > 0) {
      const first = sortedChapters[0];
      navigate(`/novels/${novelId}/chapter/${first._id}`);
    }
  };

  const handleLatestRead = () => {
    if (sortedChapters.length > 0) {
      const last = sortedChapters[sortedChapters.length - 1];
      navigate(`/novels/${novelId}/chapter/${last._id}`);
    }
  };

  const canEditOrCreate =
    user &&
    (['admin', 'superadmin'].includes(user.role) ||
      String(user.userId) === String(novel.authorId));

  // ✅ 신고 모달 열기 함수
  const openReportModal = () => {
    setReportTargetType('novel');
    setReportTargetId(novelId);
    setIsReportOpen(true);
  };

  return (
    <>
      <div className="novel-detail-page">
        {/* 소설 헤더 */}
        <div className="novel-header">
          <div className="novel-header-left">
            {novel.bookCover ? (
              <img
                src={
                  novel.bookCover.startsWith("http")
                    ? novel.bookCover
                    : `${import.meta.env.VITE_API_BASE_URL}${novel.bookCover}`
                }
                alt={novel.title}
                className="novel-cover"
              />
            ) : (
              <div className="novel-cover-placeholder">
                <h2>{novel.title}</h2>
              </div>
            )}
          </div>

          <div className="novel-header-right">
            <div className="novel-header-info">
              {/* 제목 + 좋아요 */}
              <div className="novel-title-row">
                <h1 className="novel-title">{novel.title}</h1>
                <button
                  onClick={handleToggleLike}
                  className={`novel-like-button ${liked ? "liked" : ""}`}
                >
                  찜 {liked ? "❤️" : "🤍"} {likeCount}
                </button>
              </div>

              <div className="novel-meta-row">
                <p className="novel-author-item">
                  작가명 <span className="author-name">{novel.authorName || '알 수 없음'}</span>
                </p>

                <div className="meta-items">
                  <p className={`novel-volume-type-item ${novel.volumeType}`}>
                    <span className="values">{novel.volumeType === 'free' ? '자유' : 'PLUS'}</span>
                  </p>

                  <p className="novel-exclusive-item">
                    <span className="values">{novel.isExclusive ? '독점' : '비독점'}</span>
                  </p>
                </div>
              </div>

              {/* 연령 등급 */}
              <p className="novel-age-rating-item">
                연령 등급:{" "}
                <span className="value">
                  {novel.ageRating === 'all' ? '전 연령' : '19세 이용가'}
                </span>
              </p>

              {/* 연재 요일 */}
              {novel.serializationDays && novel.serializationDays.length > 0 && (
                <p className="novel-serialization-days-item">
                  연재 {" "}
                  <span className="value">{novel.serializationDays.join('/')}</span>
                </p>
              )}

              {/* 조회 */}
              <div className="novel-stats-item">
                <p><span>조회 <span className="value">{novel.views}</span></span></p>
                <p><span>회차 <span className="value">{chapters.length}</span></span></p>
              </div>

              {/* 태그 */}
              {(() => {
                const allTags = novel.genre ? [novel.genre, ...(novel.tags || [])] : [...(novel.tags || [])];
                const filteredTags = allTags.filter(tag => tag && tag.trim() !== "");
                if (filteredTags.length === 0) return null;

                return (
                  <div className="novel-tags-item">
                    {filteredTags.map(tag => (
                      <span key={tag} className="novel-tag">#{tag}</span>
                    ))}
                  </div>
                );
              })()}

              <p className="novel-description">{novel.description}</p>
              <p></p>
            </div>
          </div>
        </div>

        <div className="novel-header-extra">
          <div className="novel-actions">
            <button className="start-read-button" onClick={handleStartRead}>첫 화 보기</button>
            <button className="latest-read-button" onClick={handleLatestRead}>최신화 보기</button>
            {canEditOrCreate && (
              <>
                <button onClick={() => navigate(`/novels/${novelId}/create-chapter`)} className="latest-read-button">회차 생성</button>
                <button onClick={() => navigate(`/novels/${novelId}/edit`)} className="latest-read-button">소설 수정</button>
              </>
            )}
            {/* ✅ 신고 모달 */}
            <ReportModal
              isOpen={isReportOpen}
              onClose={() => setIsReportOpen(false)}
              targetType={reportTargetType}
              targetId={reportTargetId}
            />
          </div>

          <div className="novel-report-container">
            <button onClick={openReportModal} className="novel-report-btn">신고</button>
          </div>
        </div>

        {/* 회차 리스트 */}
        <div className="novel-episodes-section">
          <h2>전체 회차 ({chapters.length})</h2>
          <ChapterList chapters={chapters} />
        </div>

        {/* 댓글 섹션 */}
        {/* novelId만 전달, chapterId는 null */}
        <CommentBox
          comments={comments}
          onSubmit={handleCommentSubmit}
          novelId={novel._id}
          chapterId={null}
        />
      </div>
    </>
  );
}
