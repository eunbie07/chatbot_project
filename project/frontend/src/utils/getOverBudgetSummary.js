// ✅ 예산 초과 항목 분석 함수
export default function getOverBudgetSummary(budgets = {}, actuals = {}) {
  const overCategories = [];

  for (const category of Object.keys(budgets)) {
    const budget = Number(budgets[category] || 0);
    const actual = Number(actuals[category] || 0);

    if (actual > budget) {
      overCategories.push(category);
    }
  }

  if (overCategories.length === 0) {
    return "이번 달 소비는 예산 범위 내에서 잘 관리되고 있어요!";
  }

  if (overCategories.length === 1) {
    return `이번 달 ${overCategories[0]} 지출이 예산을 초과했어요. 조절이 필요해요!`;
  }

  const joined = overCategories.slice(0, 2).join(', ') + (overCategories.length > 2 ? " 등" : "");
  return `이번 달 ${joined} 지출이 예산보다 높아요. 조절이 필요해요!`;
}
