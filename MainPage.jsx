// src/pages/MainPage.jsx
import React from 'react';
import MainBanner from '../components/MainBanner.jsx';
import LiveRank from '../components/LiveRank.jsx';
import NewRank from '../components/NewRank.jsx';
import './MainPage.css';

export default function MainPage() {
  return (
    <>
      <MainBanner />
      <LiveRank title="실시간 랭킹" />
      <NewRank title="최근 업로드 신작" />
    </>
  );
}
