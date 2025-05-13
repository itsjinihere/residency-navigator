// src/QuizReview.jsx
import React from 'react';

const QuizReview = ({ answers }) => {
  return (
    <div id="quiz-answers" style={{ marginTop: '2rem' }}>
      <h2>📋 Quiz Answer Review</h2>
      <ul style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
        {Object.entries(answers).map(([key, value]) => (
          <li key={key}>
            <strong>{key}:</strong> {value?.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuizReview;
