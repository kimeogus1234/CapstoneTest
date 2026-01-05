import React, { useState, useRef, useEffect, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChapterById, getChaptersByNovel } from "../api/chapter";
import { getNovel } from "../api/novel";
import Viewer from "../components/Viewer";
import AuthContext from "../context/AuthContext";

export default function ChapterPage() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [chapterData, setChapterData] = useState(null);
  const [novelData, setNovelData] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ▼▼▼ 5초 타이머 Ref 및 상수 ▼▼▼
  const nextChapterTimerRef = useRef(null); 
  const NEXT_CHAPTER_DELAY = 5000; 

  // ✅ 상대경로 → 절대경로 변환
  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. 현재 회차 불러오기
        const currentChapter = await getChapterById(chapterId);

        // ─── 유료 회차 접근 제어 ───
        if (!currentChapter.isFree) {
          if (!user) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
          }
          const isAuthor = String(user.userId) === String(currentChapter.authorId);
          const isAdmin = ['admin', 'superadmin'].includes(user.role);
          if (!isAuthor && !isAdmin && !user.isSubscribed) {
            alert("이 회차는 구독 회원만 이용 가능합니다.");
            navigate("/subscribe");
            return;
          }
        }

        // chapterData 저장
        setChapterData(currentChapter);

        // novelId 안전 추출
        const novelId = currentChapter.novelId?._id?.toString() || currentChapter.novelId?.toString();
        if (!novelId) throw new Error("소설 ID를 찾을 수 없습니다.");

        // 회차 목록 및 소설 정보
        const allChapters = await getChaptersByNovel(novelId);
        setChapters(allChapters);

        const novel = await getNovel(novelId);
        setNovelData(novel);

      } catch (error) {
        console.error("회차 데이터 불러오기 실패:", error.response?.data || error);
        const message = error.response?.data?.message || "회차를 불러올 수 없습니다.";
        alert(message);
        if (error.response?.status === 403) {
          if (!user) navigate("/login");
          else navigate("/subscribe");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [chapterId, user, authLoading, navigate]);

  // 다음 회차로 이동
  const goToNextChapter = useCallback(() => {
    if (!chapterData || chapters.length === 0) return;
    const idx = chapters.findIndex(c => String(c._id) === String(chapterId));

    if (nextChapterTimerRef.current) {
      clearTimeout(nextChapterTimerRef.current);
      nextChapterTimerRef.current = null;
    }

    if (idx < chapters.length - 1) {
      const novelId = chapterData.novelId?._id?.toString() || chapterData.novelId?.toString();
      navigate(`/novels/${novelId}/chapter/${chapters[idx + 1]._id}`);
    } else {
      console.log("마지막 회차입니다.");
    }
  }, [chapterData, chapterId, chapters, navigate]);

  // 이전 회차로 이동
  const goToPrevChapter = useCallback(() => {
    if (nextChapterTimerRef.current) {
      clearTimeout(nextChapterTimerRef.current);
      nextChapterTimerRef.current = null;
    }

    if (!chapterData || chapters.length === 0) return;
    const idx = chapters.findIndex(c => String(c._id) === String(chapterId));
    if (idx > 0) {
      const novelId = chapterData.novelId?._id?.toString() || chapterData.novelId?.toString();
      navigate(`/novels/${novelId}/chapter/${chapters[idx - 1]._id}`);
    } else {
      alert("첫번째 회차입니다.");
    }
  }, [chapterData, chapterId, chapters, navigate]);

  // 목록으로 이동
  const goToNovelList = () => {
    if (!chapterData) {
      navigate("/novels");
      return;
    }
    const novelId = chapterData.novelId?._id?.toString() || chapterData.novelId?.toString();
    if (novelId) navigate(`/novels/${novelId}`);
    else navigate("/novels");
  };

  // 목차에서 회차 선택
  const handleSelectChapter = useCallback((selectedChapterId) => {
    if (nextChapterTimerRef.current) {
      clearTimeout(nextChapterTimerRef.current);
      nextChapterTimerRef.current = null;
    }
    const novelId = chapterData.novelId?._id?.toString() || chapterData.novelId?.toString();
    navigate(`/novels/${novelId}/chapter/${selectedChapterId}`);
  }, [chapterData, navigate]);

  // 정주행 완료 시 호출
  const handleBingeEnd = useCallback(() => {
    if (!nextChapterTimerRef.current) {
      console.log(`정주행 끝! ${NEXT_CHAPTER_DELAY / 1000}초 뒤 다음 화로 이동합니다.`);
      nextChapterTimerRef.current = setTimeout(() => {
        goToNextChapter();
      }, NEXT_CHAPTER_DELAY);
    }
  }, [goToNextChapter]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (nextChapterTimerRef.current) {
        clearTimeout(nextChapterTimerRef.current);
        nextChapterTimerRef.current = null;
      }
    };
  }, []);

  if (authLoading || isLoading) {
    return <div style={{ padding: "50px", textAlign: "center", fontSize: "18px" }}>로딩 중...</div>;
  }

  if (!chapterData || !novelData) {
    return <div style={{ padding: "50px", textAlign: "center", fontSize: "18px" }}>
      회차 또는 소설 데이터를 불러올 수 없습니다.
    </div>;
  }

  // chapterData.images[0]와 chapterData.bgm 절대경로 처리
  const chapterWithUrls = {
    ...chapterData,
    images: chapterData.images?.map(getFileUrl) || [],
    bgm: getFileUrl(chapterData.bgm)
  };

  return (
    <Viewer
      chapterData={chapterWithUrls}
      novelCoverImageUrl={getFileUrl(novelData.coverImage || novelData.bookCover)}
      onPrev={goToPrevChapter}
      onNext={goToNextChapter}
      onToList={goToNovelList}
      allChapters={chapters}
      onSelectChapter={handleSelectChapter}
      onBingeEnd={handleBingeEnd}
    />
  );
}
