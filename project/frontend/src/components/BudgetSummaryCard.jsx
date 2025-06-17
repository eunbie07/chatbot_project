// src/components/BudgetSummaryCard.jsx

import React from 'react';

const BudgetSummaryCard = ({ income, expense }) => {
  const balance = income - expense;

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-semibold mb-2">📊 이번 달 요약</h3>
      <p>총 수입: {income.toLocaleString()}원</p>
      <p>총 지출: {expense.toLocaleString()}원</p>
      <p className={balance >= 0 ? "text-green-600" : "text-red-500"}>
        잔액: {balance.toLocaleString()}원
      </p>
    </div>
  );
};

export default BudgetSummaryCard; // ✅ default export 필수!
