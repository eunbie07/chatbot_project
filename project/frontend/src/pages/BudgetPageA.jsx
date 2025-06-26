import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// 카테고리 정규화 함수
const normalizeCategory = (category) => {
  const categoryMap = {
    "점심식사": "식비", "카페": "식비", "식당": "식비", "배달": "식비",
    "스트레스 쇼핑": "쇼핑", "패션": "쇼핑", "의류": "쇼핑", "온라인쇼핑": "쇼핑",
    "업무비품": "기타", "생활용품": "기타", "교통": "기타", "의료": "기타"
  };
  return categoryMap[category] || category;
};

// API 호출 함수들
const fetchData = async (endpoint, userId) => {
  const response = await fetch(`https://eunbie.site/api/${endpoint}/${userId}`);
  if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

// 포맷팅 함수
const formatCurrency = (value) => `${value.toLocaleString()}원`;

const COLORS = ['#FFB6C1', '#DDA0DD', '#98D8E8', '#F0E68C', '#FFE4B5', '#D8BFD8'];

// 요약 카드 컴포넌트
const SummaryCards = ({ totalIncome, totalExpense, balance, savingGoal, savingsRate }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <SummaryCard 
      title="총 지출" 
      value={formatCurrency(totalExpense)} 
      subtitle="이번 달 지출액"
      icon="💸" 
      color="red" 
    />
    <SummaryCard 
      title="총 수입" 
      value={formatCurrency(totalIncome)} 
      subtitle="이번 달 수입액"
      icon="💰" 
      color="purple" 
    />
    <SummaryCard 
      title="잔액" 
      value={formatCurrency(balance)} 
      subtitle={`저축률: ${savingsRate}%`}
      icon={balance >= 0 ? '📈' : '📉'} 
      color={balance >= 0 ? 'green' : 'red'} 
    />
    <SummaryCard 
      title="저축 목표" 
      value={formatCurrency(savingGoal)} 
      subtitle={`달성률: ${savingGoal > 0 ? Math.min(100, ((balance / savingGoal) * 100)).toFixed(0) : 0}%`}
      icon="🎯" 
      color="orange" 
    />
  </div>
);

const SummaryCard = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    red: 'border-red-300 text-red-400',
    purple: 'border-purple-300 text-purple-600',
    green: 'border-green-300 text-green-400',
    orange: 'border-orange-300 text-orange-400'
  };

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-xl border-l-4 ${colorClasses[color].split(' ')[0]} hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[color].split(' ')[1]}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
};

// 차트 컴포넌트들
const CategoryPieChart = ({ data }) => (
  <div className="bg-white p-8 rounded-2xl shadow-xl">
    <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">카테고리별 소비 분포</h3>
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => percent > 5 ? `${name}\n${(percent * 100).toFixed(0)}%` : ''}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={({ active, payload }) => {
          if (active && payload && payload.length) {
            const data = payload[0];
            const total = payload[0].payload.value;
            return (
              <div className="bg-white p-4 border rounded-lg shadow-lg">
                <p className="font-bold text-gray-800">{data.name}</p>
                <p className="text-sm text-gray-600">{formatCurrency(data.value)}</p>
              </div>
            );
          }
          return null;
        }} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

const CategoryBreakdown = ({ normalizedActuals, normalizedBudgets }) => (
  <div className="bg-white p-8 rounded-2xl shadow-xl">
    <h3 className="text-2xl font-bold mb-6 text-gray-800">카테고리별 소비 현황</h3>
    <div className="space-y-4">
      {Object.entries(normalizedActuals).map(([category, amount], index) => {
        const totalExpense = Object.values(normalizedActuals).reduce((sum, val) => sum + val, 0);
        const percentage = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0;
        const budget = normalizedBudgets[category] || 0;
        const isOverBudget = amount > budget && budget > 0;
                
        return (
          <div key={category} className={`p-4 rounded-xl transition-all duration-200 hover:scale-102 ${
            isOverBudget ? 'bg-purple-50 hover:bg-purple-100' : 'bg-gray-50 hover:bg-gray-100'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div 
                  className="w-6 h-6 rounded-full mr-4 shadow-sm"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <span className="font-semibold text-gray-700">{category}</span>
                  {budget > 0 && (
                    <div className="text-xs text-gray-500">
                      예산: {formatCurrency(budget)} 
                      {isOverBudget && <span className="text-purple-500 ml-1">초과!</span>}
                    </div>
                  )}
                </div>
              </div>
              <span className={`font-bold text-lg ${isOverBudget ? 'text-purple-400' : 'text-gray-800'}`}>
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500`}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: isOverBudget ? '#a855f7' : COLORS[index % COLORS.length]
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {percentage}% of total
              {budget > 0 && (
                <span className="ml-2">
                  (예산 대비 {((amount / budget) * 100).toFixed(0)}%)
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  </div>
);

const BudgetComparisonChart = ({ data }) => (
  <div className="bg-white p-8 rounded-2xl shadow-xl">
    <h3 className="text-2xl font-bold mb-8 text-center text-gray-800">카테고리별 예산 vs 실제 소비</h3>
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#666" />
        <YAxis 
          tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
          tick={{ fontSize: 12 }}
          stroke="#666"
        />
        <Tooltip content={({ active, payload, label }) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-white p-4 border rounded-lg shadow-lg border-gray-200">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index) => (
                  <p key={index} className="text-sm" style={{ color: entry.color }}>
                    {entry.dataKey}: {formatCurrency(entry.value)}
                  </p>
                ))}
              </div>
            );
          }
          return null;
        }} />
        <Legend 
          wrapperStyle={{
            paddingTop: '20px',
            color: '#000000',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        />
        <Bar dataKey="예산" fill="#C4B5FD" radius={[4, 4, 0, 0]} name="예산" />
        <Bar dataKey="실제소비" fill="#F472B6" radius={[4, 4, 0, 0]} name="실제 소비" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const BudgetAnalysisTab = ({ budgetAnalysis }) => (
  <div className="bg-white p-8 rounded-2xl shadow-xl">
    <h3 className="text-2xl font-bold mb-8 text-gray-800">📊 예산 대비 소비 상세 분석</h3>
    <div className="grid gap-6">
      {budgetAnalysis.map((item) => (
        <div key={item.category} className={`p-6 rounded-xl border-l-4 transition-all duration-200 hover:scale-102 ${
          item.status === 'over' 
            ? 'bg-purple-50 border-purple-400 hover:bg-purple-100'
            : 'bg-green-50 border-green-400 hover:bg-green-100'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className={`text-xl font-bold mb-2 ${
                item.status === 'over' ? 'text-purple-800' : 'text-green-800'
              }`}>
                {item.category}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">예산: </span>
                  <span className="font-semibold">{formatCurrency(item.budget)}</span>
                </div>
                <div>
                  <span className="text-gray-600">실제: </span>
                  <span className="font-semibold">{formatCurrency(item.actual)}</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      item.status === 'over' ? 'bg-purple-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="text-right ml-6">
              <div className={`text-2xl font-bold ${
                item.status === 'over' ? 'text-purple-400' : 'text-green-600'
              }`}>
                {item.status === 'over' ? '+' : ''}{formatCurrency(Math.abs(item.difference))}
              </div>
              <div className={`text-lg font-semibold ${
                item.status === 'over' ? 'text-purple-500' : 'text-green-500'
              }`}>
                {item.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {item.status === 'over' ? '예산 초과' : '예산 절약'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AITipsTab = ({ tips, balance, totalIncome, savingsRate, budgetAnalysis, savingGoal }) => (
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
    <div className="bg-white p-8 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">🧠 AI 맞춤 조언</h3>
      <div className="space-y-4">
        {tips.map((tip, index) => (
          <div key={index} className="p-4 bg-purple-50 rounded-xl border-l-4 border-purple-400 hover:bg-purple-100 transition-all duration-200">
            <p className="text-purple-800 font-medium">💡 {tip}</p>
          </div>
        ))}
        {tips.length === 0 && (
          <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500">
            <div className="text-4xl mb-2">🤖</div>
            <p>AI 조언을 불러오는 중입니다...</p>
          </div>
        )}
      </div>
    </div>

    <div className="bg-white p-8 rounded-2xl shadow-xl">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">📈 종합 평가</h3>
      <div className="space-y-6">
        {/* 저축률 분석 */}
        <div className="p-6 bg-green-50 rounded-xl">
          <h4 className="font-bold text-green-800 mb-4">저축률 분석</h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-700">현재 저축률</span>
            <span className="font-bold text-2xl text-green-800">{savingsRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-400 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(0, Math.min(100, parseFloat(savingsRate)))}%` }}
            />
          </div>
          <p className="text-sm text-green-600 mt-2">
            {parseFloat(savingsRate) >= 20 ? '훌륭한 저축률입니다!' : 
             parseFloat(savingsRate) >= 10 ? '평균적인 저축률입니다' : 
             '저축률을 높여보세요'}
          </p>
        </div>

        {/* 목표 달성률 */}
        <div className="p-6 bg-yellow-50 rounded-xl">
          <h4 className="font-bold text-yellow-800 mb-4">목표 달성률</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-yellow-700">저축 목표</span>
              <span className="font-semibold">{formatCurrency(savingGoal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-700">현재 저축</span>
              <span className="font-semibold">{formatCurrency(Math.max(0, balance))}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-yellow-400 h-3 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${savingGoal > 0 ? Math.min(100, (Math.max(0, balance) / savingGoal) * 100) : 0}%` 
                }}
              />
            </div>
            <p className="text-sm text-orange-400">
              달성률: {savingGoal > 0 ? Math.min(100, ((Math.max(0, balance) / savingGoal) * 100)).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        {/* 종합 평가 */}
        <div className="p-6 bg-indigo-50 rounded-xl border border-indigo-200">
          <h4 className="font-bold text-indigo-800 mb-3">이번 달 종합 평가</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-2xl mr-2">
                {balance >= savingGoal ? '🎉' : balance >= 0 ? '👍' : '⚠️'}
              </span>
              <p className="text-indigo-700 font-medium">
                {balance >= savingGoal 
                  ? "목표를 초과 달성했습니다! 훌륭해요!" 
                  : balance >= 0 
                  ? "수입 범위 내에서 잘 관리하고 계시네요" 
                  : "지출 관리에 더 신경 써보세요"}
              </p>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-2">💡 개선 포인트</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {budgetAnalysis.filter(item => item.status === 'over').length > 0 && (
                  <li>• 예산 초과 카테고리: {budgetAnalysis.filter(item => item.status === 'over').map(item => item.category).join(', ')}</li>
                )}
                {parseFloat(savingsRate) < 10 && (
                  <li>• 저축률을 10% 이상으로 높여보세요</li>
                )}
                <li>• 고정비와 변동비를 구분하여 관리해보세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 메인 컴포넌트
const BudgetPageA = () => {
  // const { user } = useUser(); // 임시로 주석 처리
  const userId = "soyeon123"; // 임시로 하드코딩
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 데이터 상태
  const [budgets, setBudgets] = useState({});
  const [actuals, setActuals] = useState({});
  const [savingGoal, setSavingGoal] = useState(0);
  const [tips, setTips] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // 데이터 로드 함수
  const loadData = async () => {
    if (!userId) {
      setError("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [coachData, actualData, summaryData] = await Promise.all([
        fetchData('coach', userId),
        fetchData('actuals', userId).then(data => data.actuals || {}),
        fetchData('summary', userId)
      ]);

      setBudgets(coachData.budgets || {});
      setActuals(actualData);
      setSavingGoal(coachData.saving_goal || 0);
      setTips(coachData.tips || []);
      setTotalIncome(summaryData.total_income || 0);
      setTotalExpense(summaryData.total_expense || 0);

    } catch (err) {
      setError(`데이터를 불러올 수 없습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && Object.keys(actuals).length === 0) {
      loadData();
    }
  }, [userId]);

  // 계산된 데이터
  const normalizedActuals = useMemo(() => {
    const normalized = {};
    Object.entries(actuals).forEach(([category, amount]) => {
      const normalizedCat = normalizeCategory(category);
      normalized[normalizedCat] = (normalized[normalizedCat] || 0) + amount;
    });
    return normalized;
  }, [actuals]);

  const normalizedBudgets = useMemo(() => {
    const normalized = {};
    Object.entries(budgets).forEach(([category, amount]) => {
      const normalizedCat = normalizeCategory(category);
      normalized[normalizedCat] = (normalized[normalizedCat] || 0) + amount;
    });
    return normalized;
  }, [budgets]);

  const budgetComparisonData = useMemo(() => {
    const allCategories = new Set([...Object.keys(normalizedBudgets), ...Object.keys(normalizedActuals)]);
    return Array.from(allCategories).map(category => ({
      name: category,
      예산: normalizedBudgets[category] || 0,
      실제소비: normalizedActuals[category] || 0
    }));
  }, [normalizedBudgets, normalizedActuals]);

  const categoryPieData = useMemo(() => {
    return Object.entries(normalizedActuals).map(([name, value]) => ({
      name, value
    }));
  }, [normalizedActuals]);

  const budgetAnalysis = useMemo(() => {
    const analysis = [];
    const allCategories = new Set([...Object.keys(normalizedBudgets), ...Object.keys(normalizedActuals)]);
    
    allCategories.forEach(category => {
      const budget = normalizedBudgets[category] || 0;
      const actual = normalizedActuals[category] || 0;
      const difference = actual - budget;
      const percentage = budget > 0 ? ((actual / budget) * 100) : (actual > 0 ? 999 : 0);
      
      if (budget > 0 || actual > 0) {
        analysis.push({
          category, budget, actual, difference, percentage,
          status: difference > 0 ? 'over' : 'under'
        });
      }
    });
    return analysis.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
  }, [normalizedBudgets, normalizedActuals]);

  // 실제 카테고리별 지출 합계 계산
  const calculatedTotalExpense = Object.values(normalizedActuals).reduce((sum, amount) => sum + amount, 0);
  
  // 실제 계산된 지출을 사용 (API 데이터가 불일치할 경우)
  const actualTotalExpense = calculatedTotalExpense || totalExpense;
  const balance = totalIncome - actualTotalExpense;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

  const tabs = [
    { id: 'overview', label: '개요', icon: '📊' },
    { id: 'budget', label: '예산 비교', icon: '💹' },
    { id: 'analysis', label: '상세 분석', icon: '🔍' },
    { id: 'tips', label: 'AI 조언', icon: '🧠' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <div className="text-4xl mb-4 text-center">⚠️</div>
          <p className="font-semibold text-red-800 mb-2 text-center">오류 발생</p>
          <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
          <button 
            onClick={loadData}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Budget & Spending Tracker 
          </h1>
          {/* <p className="text-gray-600 text-lg">실제 데이터 기반 소비 분석</p>
           */}
          <button 
            onClick={loadData}
            disabled={loading}
            className="mt-6 px-6 py-3 bg-purple-300 text-white rounded-full hover:bg-purple-400 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
          >
            🔄 데이터 새로고침
          </button>
        </div>

        {/* 데이터가 있을 때만 표시 */}
        {(Object.keys(normalizedActuals).length > 0 || actualTotalExpense > 0) && (
          <>
            <SummaryCards 
              totalIncome={totalIncome}
              totalExpense={actualTotalExpense}
              balance={balance}
              savingGoal={savingGoal}
              savingsRate={savingsRate}
            />

            {/* 탭 네비게이션 */}
            <div className="mb-8">
              <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-lg border">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-purple-300 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:bg-gray-100 hover:scale-102'
                    }`}
                  >
                    <span className="mr-2 text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="space-y-8">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <CategoryPieChart data={categoryPieData} />
                  <CategoryBreakdown 
                    normalizedActuals={normalizedActuals}
                    normalizedBudgets={normalizedBudgets}
                  />
                </div>
              )}

              {activeTab === 'budget' && (
                <BudgetComparisonChart data={budgetComparisonData} />
              )}

              {activeTab === 'analysis' && (
                <BudgetAnalysisTab budgetAnalysis={budgetAnalysis} />
              )}

              {activeTab === 'tips' && (
                <AITipsTab 
                  tips={tips}
                  balance={balance}
                  totalIncome={totalIncome}
                  savingsRate={savingsRate}
                  budgetAnalysis={budgetAnalysis}
                  savingGoal={savingGoal}
                />
              )}
            </div>
          </>
        )}

        {/* 데이터 없을 때 안내 */}
        {Object.keys(normalizedActuals).length === 0 && actualTotalExpense === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-8">📊</div>
            <h3 className="text-3xl font-bold text-gray-600 mb-4">분석할 데이터가 없습니다</h3>
            <p className="text-gray-500 text-lg mb-8">소비 기록을 추가한 후 다시 시도해주세요.</p>
            <div className="space-x-4">
              <button 
                onClick={loadData}
                className="px-8 py-4 bg-purple-300 text-white rounded-xl hover:bg-purple-400 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🔄 데이터 새로고침
              </button>
              <button 
                onClick={() => window.location.href = '/diary'}
                className="px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📝 소비 기록하기
              </button>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="mt-16 text-center py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            💡 이 분석은 실제 데이터를 기반으로 생성되었습니다.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetPageA;