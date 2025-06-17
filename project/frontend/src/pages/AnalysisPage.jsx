import React from 'react';
import Layout from '../components/Layout';
import EmotionChart from '../components/EmotionChart';

export default function AnalysisPage() {
  return (
    <Layout
      left={<EmotionChart />}
      center={
        <div style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '22px', color: '#555', marginBottom: '12px' }}> 감정별 소비 분석</h2>
          <p style={{ fontSize: '15px', color: '#555', marginBottom: '20px' }}>
            이 페이지에서는 감정에 따른 소비 패턴을 시각적으로 분석하고, 사용자의 감정 흐름을 파악할 수 있습니다.
          </p>
        </div>
      }
      right={<div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#444' }}>💡 분석 팁</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          스트레스나 우울한 감정에서 소비가 반복된다면, 감정을 다른 방식으로 전환하는 루틴을 만들어보세요.
        </p>
      </div>}
    />
  );
}
