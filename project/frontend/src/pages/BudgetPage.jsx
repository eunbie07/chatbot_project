import React, { useState } from 'react';
import Layout from '../components/Layout';
import BudgetCoach from '../components/BudgetCoach';
import BudgetSummaryCard from '../components/BudgetSummaryCard';
import SavingGoalCard from '../components/SavingGoalCard';
import TipList from '../components/TipList';

function BudgetPage() {
  const income = 2500000;
  const expense = 1980000;

  const [aiResult, setAiResult] = useState({ saving_goal: null, tips: [] });

  return (
    <Layout
      left={
        <>
          <BudgetSummaryCard income={income} expense={expense} />
        </>
      }
      center={
        <BudgetCoach userId="user_male" onResult={setAiResult} />
      }
      right={
        <>
          {aiResult.saving_goal && <SavingGoalCard goal={aiResult.saving_goal} />}
          <TipList tips={aiResult.tips} />
        </>
      }
    />
  );
}

export default BudgetPage;
