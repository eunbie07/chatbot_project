import React, { useState } from 'react';
import axios from 'axios';
import BudgetComparisonChart from './BudgetComparisonChart';
import getOverBudgetSummary from '../utils/getOverBudgetSummary';
import { useUser } from '../contexts/UserContext';

function formatCurrency(value) {
  return `${Number(value).toLocaleString()}원`;
}

function BudgetCoach({ onResult }) {
  const { user } = useUser();
  const userId = user?.username || "";

  const [data, setData] = useState(null);
  const [actuals, setActuals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summaryMessage, setSummaryMessage] = useState('');

  // 초기화
  const resetState = () => {
    setData(null);
    setActuals({});
    setError('');
    setSummaryMessage('');
  };

  // 코칭 데이터 가져오기
  const fetchCoachingData = async () => {
    const res = await axios.get(`https://eunbie.site/api/coach/${userId}`);
    
    // ✅ HTTP 상태 코드도 체크
    if (res.status !== 200) {
      throw new Error(`서버 오류: ${res.status}`);
    }
    
    if (res.data.error) {
      throw new Error(res.data.error);
    }
    
    return res.data;
  };

  // 실제 소비 데이터 가져오기
  const fetchActualsData = async () => {
    const res = await axios.get(`https://eunbie.site/api/actuals/${userId}`);
    
    // ✅ HTTP 상태 코드도 체크
    if (res.status !== 200) {
      throw new Error(`서버 오류: ${res.status}`);
    }
    
    if (res.data.error) {
      throw new Error(res.data.error);
    }
    
    return res.data.actuals || {};
  };

  // 전체 분석 시작
  const getCoaching = async () => {
    if (!userId) {
      setError("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    resetState();

    try {
      // ✅ 순차적으로 호출하여 더 명확한 에러 메시지 제공
      console.log(`Fetching coaching data for user: ${userId}`);
      const coachData = await fetchCoachingData();
      
      console.log(`Fetching actuals data for user: ${userId}`);
      const actualData = await fetchActualsData();

      setData(coachData);
      setActuals(actualData);

      // ✅ budgets 존재 여부 확인
      if (coachData.budgets) {
        const summary = getOverBudgetSummary(coachData.budgets, actualData);
        setSummaryMessage(summary);
      }

      onResult?.({
        saving_goal: coachData.saving_goal,
        tips: coachData.tips,
      });

    } catch (err) {
      console.error('BudgetCoach Error:', err);
      
      // ✅ 더 구체적인 에러 메시지
      if (err.response) {
        // HTTP 에러 응답이 있는 경우
        const status = err.response.status;
        const message = err.response.data?.error || err.message;
        
        if (status === 404) {
          setError("소비 데이터를 찾을 수 없습니다. 소비 기록을 먼저 추가해주세요.");
        } else if (status === 500) {
          setError(`서버 오류가 발생했습니다: ${message}`);
        } else {
          setError(`오류가 발생했습니다 (${status}): ${message}`);
        }
      } else if (err.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        setError("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
      } else {
        // 기타 오류
        setError(err.message || "AI 코치를 불러오는 중 오류가 발생했어요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow rounded max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">💰 AI 소비 코치</h2>

      <button
        onClick={getCoaching}
        disabled={loading || !userId}
        className={`w-full px-4 py-2 mb-4 rounded font-semibold transition-colors 
          ${loading || !userId 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-yellow-400 hover:bg-yellow-500 text-black"}`}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <span>분석 중...</span>
          </div>
        ) : !userId ? (
          "로그인이 필요합니다"
        ) : (
          "소비 습관 분석 받기"
        )}
      </button>

      {error && (
        <div className="text-red-500 text-sm text-center mt-2 p-3 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {data && !error && (
        <div className="space-y-6 mt-6">

          {/* 예산안 */}
          {data.budgets && (
            <div className="bg-gray-50 p-4 rounded shadow">
              <h3 className="font-bold mb-2">📦 카테고리별 예산안</h3>
              <ul className="text-sm grid grid-cols-2 gap-x-6 gap-y-1">
                {Object.entries(data.budgets).map(([category, amount]) => (
                  <li key={category}>
                    {category}: {formatCurrency(amount)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 요약 메시지 */}
          {summaryMessage && (
            <div className="mt-4 text-center text-sm font-semibold text-green-700 bg-green-100 border border-green-300 p-3 rounded shadow-sm">
              {summaryMessage}
            </div>
          )}

          {/* 예산 vs 실제 소비 차트 */}
          {data.budgets && Object.keys(actuals).length > 0 && (
            <>
              <h3 className="text-lg font-bold mt-4 text-center border-b pb-1">
                📊 예산 vs 실제 소비
              </h3>
              <BudgetComparisonChart budgets={data.budgets} actuals={actuals} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default BudgetCoach;