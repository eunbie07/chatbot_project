// ✅ src/components/BudgetSummaryCard.jsx (동적 데이터 버전)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const BudgetSummaryCard = () => {
  const { user } = useUser();
  const userId = user?.username || "";
  
  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchSummary = async () => {
      if (!userId) {
        setSummary(prev => ({ ...prev, loading: false, error: "로그인이 필요합니다" }));
        return;
      }

      try {
        setSummary(prev => ({ ...prev, loading: true, error: null }));
        
        // 새로운 summary API 호출
        const response = await axios.get(`https://eunbie.site/api/summary/${userId}`);
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }

        setSummary({
          income: response.data.total_income || 0,
          expense: response.data.total_expense || 0,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Summary fetch error:', error);
        setSummary({
          income: 0,
          expense: 0,
          loading: false,
          error: error.message || "데이터를 가져오는 중 오류가 발생했습니다"
        });
      }
    };

    fetchSummary();
  }, [userId]);

  const balance = summary.income - summary.expense;

  if (summary.loading) {
    return (
      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="text-lg font-semibold mb-2">📊 이번 달 요약</h3>
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (summary.error) {
    return (
      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="text-lg font-semibold mb-2">📊 이번 달 요약</h3>
        <div className="text-red-500 text-sm">
          {summary.error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-semibold mb-2">📊 이번 달 요약</h3>
      <p>총 수입: <span className="font-semibold text-green-600">{summary.income.toLocaleString()}원</span></p>
      <p>총 지출: <span className="font-semibold text-red-500">{summary.expense.toLocaleString()}원</span></p>
      <p className={`font-bold ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
        잔액: {balance.toLocaleString()}원
      </p>
      {balance < 0 && (
        <p className="text-sm text-orange-500 mt-1">⚠️ 이번 달 지출이 수입을 초과했습니다</p>
      )}
    </div>
  );
};

export default BudgetSummaryCard;