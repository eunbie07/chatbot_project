// src/components/SavingGoalCard.jsx
import React from 'react';

const SavingGoalCard = ({ goal = 500000 }) => {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-semibold">💡 저축 목표</h3>
      <p>이번 달 목표: {goal.toLocaleString()}원</p>
      <p className="text-sm text-gray-600">수입의 20% 이상 저축해보세요.</p>
    </div>
  );
};

export default SavingGoalCard; // ✅ 꼭 추가!
