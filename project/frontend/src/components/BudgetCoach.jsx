import React, { useState } from 'react';
import axios from 'axios';
import BudgetComparisonChart from './BudgetComparisonChart';
import getOverBudgetSummary from '../utils/getOverBudgetSummary';

function BudgetCoach({ userId = "user_male", onResult }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actuals, setActuals] = useState({});
  const [summaryMessage, setSummaryMessage] = useState('');

  const getCoaching = async () => {
    setLoading(true);
    setError('');
    setData(null);
    setActuals({});
    setSummaryMessage('');

    try {
      const res = await axios.get(`https://eunbie.site/api/coach/${userId}`);
      if (res.data.error) {
        setError(res.data.error);
        return;
      }
      setData(res.data);

      const actualRes = await axios.get(`https://eunbie.site/api/actuals/${userId}`);
      const actualData = actualRes.data.actuals || {};
      setActuals(actualData);

      // ✅ 요약 메시지 생성
      const summary = getOverBudgetSummary(res.data.budgets, actualData);
      setSummaryMessage(summary);

      // ✅ 부모 컴포넌트로 전달
      onResult?.({
        saving_goal: res.data.saving_goal,
        tips: res.data.tips
      });

    } catch (err) {
      console.error(err);
      setError("AI 코치를 불러오는 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow rounded max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">💰 AI 소비 코치</h2>

      <button
        onClick={getCoaching}
        disabled={loading}
        className={`w-full px-4 py-2 mb-4 rounded font-semibold transition-colors 
          ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-400 hover:bg-yellow-500 text-black"}`}
      >
        {loading ? (
          <span className="animate-pulse">분석 중...</span>
        ) : (
          "소비 습관 분석 받기"
        )}
      </button>

      {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}

      {data && !error && (
        <div className="space-y-6 mt-6">

          {/* 예산안 */}
          {data.budgets && (
            <div className="bg-gray-50 p-4 rounded shadow">
              <h3 className="font-bold mb-2">📦 카테고리별 예산안</h3>
              <ul className="text-sm grid grid-cols-2 gap-x-6 gap-y-1">
                {Object.entries(data.budgets).map(([category, amount]) => (
                  <li key={category}> {category}: {amount.toLocaleString()}원 </li>
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
          {data.budgets && (
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
