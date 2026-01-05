import React, { useState } from 'react';
import './AdminPage.css';

import AdminDashboard from '../components/admin/AdminDashboard';
import UsersTab from '../components/admin/UsersTab';
import ReportsTab from '../components/admin/ReportsTab';
import SettlementsTab from '../components/admin/SettlementsTab';
import RevenueTab from '../components/admin/RevenueTab';
import SupportTab from '../components/admin/SupportTab';
import UncountedTab from '../components/admin/UncountedTab';
import EmailTab from '../components/admin/EmailTab';
import BannerTab from '../components/admin/BannerTab';
import BannerPagesTab from '../components/admin/BannerPagesTab';

export default function AdminPage() {
  const [tab, setTab] = useState('stats');

  return (
    <div className="admin-page admin-layout">
      <aside className="sidebar">
        <h2>관리자 메뉴</h2>
        <ul>
          <li className={tab==='stats'?'active':''} onClick={()=>setTab('stats')}>📊 통계 대시보드</li>
          <li className={tab==='users'?'active':''} onClick={()=>setTab('users')}>👤 사용자 관리</li>
          <li className={tab==='reports'?'active':''} onClick={()=>setTab('reports')}>🚨 신고 관리</li>
          <li className={tab==='settlements'?'active':''} onClick={()=>setTab('settlements')}>💰 정산 관리</li>
          <li className={tab==='revenue'?'active':''} onClick={()=>setTab('revenue')}>📈 작가 수익 리포트</li>
          <li className={tab==='support'?'active':''} onClick={()=>setTab('support')}>🎁 후원 내역</li>
          <li className={tab==='uncounted'?'active':''} onClick={()=>setTab('uncounted')}>⚠️ 정산 누락</li>
          <li className={tab==='email'?'active':''} onClick={()=>setTab('email')}>✉️ 이메일 발송</li>
          <li className={tab==='banner'?'active':''} onClick={()=>setTab('banner')}>🖼 배너 관리</li>
          <li className={tab==='bannerPages'?'active':''} onClick={()=>setTab('bannerPages')}>📄 배너 페이지 관리</li>

        </ul>
      </aside>

      <main className="content">
        {tab==='stats' && <AdminDashboard />}
        {tab==='users' && <UsersTab />}
        {tab==='reports' && <ReportsTab />}
        {tab==='settlements' && <SettlementsTab />}
        {tab==='revenue' && <RevenueTab />}
        {tab==='support' && <SupportTab />}
        {tab==='uncounted' && <UncountedTab />}
        {tab==='email' && <EmailTab />}
        {tab==='banner' && <BannerTab />}
        {tab==='bannerPages' && <BannerPagesTab />}
      </main>
    </div>
  );
}
