import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BudgetComparisonChart = ({ budgets = {}, actuals = {} }) => {
  // 예산 + 실제 소비 항목 통합
  const categories = Array.from(new Set([...Object.keys(budgets), ...Object.keys(actuals)]));

  const data = {
    labels: categories,
    datasets: [
      {
        label: "예산",
        data: categories.map(cat => Number(budgets[cat] ?? 0)),
        backgroundColor: "rgba(54, 162, 235, 0.6)"
      },
      {
        label: "실제 소비",
        data: categories.map(cat => {
          const value = Number(actuals[cat] ?? 0);
          console.log(`실제 소비 - ${cat}:`, value);
          return value;
        }),
        backgroundColor: "rgba(255, 99, 132, 0.6)"
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "카테고리별 예산 vs 실제 소비" }
    },
    scales: {
      y: {
        max: 1000000,  // ✅ 상한선 고정
        beginAtZero: true,
        ticks: {
          callback: value => value.toLocaleString() + "원"
        }
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <Bar data={data} options={options} />
    </div>
  );
};

export default BudgetComparisonChart;
