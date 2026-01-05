import React, { useEffect, useState } from 'react';
import ColorThief from 'colorthief';
import { getBannerPage } from '../api/bannerPage';
import { useParams } from 'react-router-dom';

export default function BannerPageDetailPage() {
  const { id } = useParams();
  const [page, setPage] = useState(null);
  const [bgColor, setBgColor] = useState('#fff');

  useEffect(() => {
    (async () => {
      const res = await getBannerPage(id);
      setPage(res.data);
    })();
  }, [id]);

  const handleImageLoad = (img) => {
    try {
      const colorThief = new ColorThief();
      const [r, g, b] = colorThief.getColor(img);
      setBgColor(`rgb(${r}, ${g}, ${b})`);
    } catch (e) {
      console.log('Color extraction failed', e);
    }
  };

  if (!page) return <div>페이지를 불러오는 중...</div>;

  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: bgColor,
        transition: 'background-color 0.5s',
      }}
    >
      <div
        className="banner-content"
        style={{ textAlign: 'center' }}
        dangerouslySetInnerHTML={{ __html: page.content }}
      />

      {/* ColorThief 적용을 위해 hidden 이미지 로드 */}
      {page.content &&
        Array.from(
          new DOMParser().parseFromString(page.content, 'text/html').images
        ).map((img, idx) => (
          <img
            key={idx}
            src={img.src}
            onLoad={(e) => handleImageLoad(e.target)}
            crossOrigin="anonymous"
            style={{ display: 'none' }}
            alt=""
          />
        ))}

      <style>{`
        .banner-content img {
          width: 1000px;
          height: auto;
          display: block;
          margin: 20px auto;
        }
      `}</style>
    </div>
  );
}
