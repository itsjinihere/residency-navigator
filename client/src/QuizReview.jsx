// src/QuizReview.jsx
import React from 'react';

const QuizReview = ({ answers }) => {
  return (
    <div id="quiz-answers" className="mt-8 px-4 sm:px-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">📋 Quiz Answer Review</h2>
      <div className="space-y-4">
        {Object.entries(answers).map(([key, value]) => (
          <div key={key} className="bg-[#1e1e1e] p-4 rounded-md shadow text-left">
            <strong className="text-green-300">{key}:</strong> <span className="text-white">{value?.toString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizReview;
