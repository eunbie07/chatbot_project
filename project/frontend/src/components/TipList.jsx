import React from 'react';

function TipList({ tips = [] }) {
  if (tips.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">📝 절약 팁</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
        {tips.map((tip, idx) => (
          <li key={idx}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}

export default TipList;

