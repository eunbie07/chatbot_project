// import React, { useState } from 'react';
// // import Layout from '../components/Layout';
// import BudgetCoach from '../components/BudgetCoach';
// import BudgetSummaryCard from '../components/BudgetSummaryCard';
// import SavingGoalCard from '../components/SavingGoalCard';
// import TipList from '../components/TipList';

// function BudgetPage() {
//   const income = 2500000;
//   const expense = 1980000;

//   const [aiResult, setAiResult] = useState({ saving_goal: null, tips: [] });

//   return (
//     <div style={{width:'100%', display:'flex'}}>
//     <BudgetSummaryCard income={income} expense={expense} />
//     <BudgetCoach onResult={setAiResult} />
//     {aiResult.saving_goal && <SavingGoalCard goal={aiResult.saving_goal} />}
//           <TipList tips={aiResult.tips} />
//     </div>
//     // <Layout
//     //   left={
//     //     <>
//     //       <BudgetSummaryCard income={income} expense={expense} />
//     //     </>
//     //   }
//     //   center={
//     //     <BudgetCoach userId="user_male" onResult={setAiResult} />
//     //   }
//     //   right={
//     //     <>
//     //       {aiResult.saving_goal && <SavingGoalCard goal={aiResult.saving_goal} />}
//     //       <TipList tips={aiResult.tips} />
//     //     </>
//     //   }
//     // />
//   );
// }

// export default BudgetPage;


// ✅ src/pages/BudgetPage.jsx (수정된 버전)
// pages/BudgetPage.jsx
import React, { useState } from 'react';
import BudgetSummaryCard from '../components/BudgetSummaryCard';
import BudgetCoach from '../components/BudgetCoach';
import SavingGoalCard from '../components/SavingGoalCard';
import TipList from '../components/TipList';

function BudgetPage() {
  const [aiResult, setAiResult] = useState({ saving_goal: null, tips: [] });

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'space-between',
      gap: '24px',
      padding: '40px 60px',
      backgroundColor: '#f9f9ff',
      boxSizing: 'border-box'
    }}>
      {/* 왼쪽 - 요약 */}
      <div style={{ flex: 1 }}>
        <CardWrapper>
          <BudgetSummaryCard />
        </CardWrapper>
      </div>

      {/* 가운데 - AI 소비 코치 */}
      <div style={{ flex: 1.6 }}>
        <CardWrapper>
          <BudgetCoach onResult={setAiResult} />
        </CardWrapper>
      </div>

      {/* 오른쪽 - 목표 + 절약 팁 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {aiResult.saving_goal && (
          <CardWrapper>
            <SavingGoalCard goal={aiResult.saving_goal} />
          </CardWrapper>
        )}
        <CardWrapper>
          <TipList tips={aiResult.tips} />
        </CardWrapper>
      </div>
    </div>
  );
}

// 공통 카드 스타일
function CardWrapper({ children }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '24px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      width: '100%',
      overflowX: 'auto'   // ✅ 그래프 잘림 방지
    }}>
      {children}
    </div>
  );
}

export default BudgetPage;
