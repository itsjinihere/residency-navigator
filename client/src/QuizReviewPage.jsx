// src/QuizReviewPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const questions = [
  {
    question: "What is your full legal name?",
    field: "fullName",
    type: "nameGroup",
    subfields: ["firstName", "middleName", "lastName"]
  },
  {
    question: "What is your parent or guardian’s name?",
    field: "parent1Name",
    type: "nameGroup",
    subfields: ["parent1First", "parent1Middle", "parent1Last"]
  },
  {
    question: "Would you like to enter a second parent or guardian?",
    field: "addSecondParent",
    type: "boolean"
  },
  {
    question: "Second parent or guardian's name:",
    field: "parent2Name",
    type: "nameGroup",
    subfields: ["parent2First", "parent2Middle", "parent2Last"],
    showIf: (a) => a.addSecondParent
  },
  {
    question: "What is your date of birth?",
    field: "dob",
    type: "date"
  },
  { question: "Are you a U.S. military veteran or active-duty service member?", field: "isMilitary", type: "boolean" },
  { question: "Please specify your base or current station", field: "militaryBase", type: "text", showIf: (a) => a.isMilitary },
  { question: "Will you be 24 years or older by the start of the reclassification quarter?", field: "isOver24", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "Are you married?", field: "isMarried", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "Do you have dependents (children or others) you financially support?", field: "hasDependents", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "Have you been financially self-supporting for the past year?", field: "isSelfSupporting", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "Are you currently or were you previously in foster care after the age of 13?", field: "wasInFosterCare", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "Will your parent(s)/guardian(s) claim you as a dependent on their taxes?", field: "claimedByParents", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "Are your parent(s)/guardian(s) California residents?", field: "parentsInCA", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "Have you lived continuously in California for at least one year?", field: "livedInCA", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "Do you have a California Driver’s License or State ID?", field: "hasCAID", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "Did you attend high school in California?", field: "wentToCAHighSchool", type: "boolean", showIf: (a) => !a.isMilitary },
  { question: "What was the name of your California high school?", field: "highSchoolName", type: "text", showIf: (a) => a.wentToCAHighSchool }
];

const QuizReviewPage = ({ quizAnswers, setQuizAnswers }) => {
  const navigate = useNavigate();
  const [localAnswers, setLocalAnswers] = useState({ ...quizAnswers });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (showToast) {
      const timeout = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [showToast]);

  const handleChange = (field, value) => {
    setLocalAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (setQuizAnswers) {
      setQuizAnswers(localAnswers);
      setShowToast(true);
    }
  };

  const visibleQuestions = questions.filter(q => !q.showIf || q.showIf(localAnswers));

  if (!quizAnswers || Object.keys(quizAnswers).length === 0) {
    return <p style={{ padding: '2rem' }}>No quiz answers found. Please complete the quiz first.</p>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '2rem auto' }}>
      <h2>📋 Review Your Answers</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {visibleQuestions.map((q) => (
          <li key={q.field} style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }} title={q.question}>
              {q.question}
            </label>

            {q.type === 'boolean' ? (
              <>
                <button
                  onClick={() => handleChange(q.field, true)}
                  style={{
                    backgroundColor: localAnswers[q.field] === true ? 'green' : '#444',
                    color: 'white',
                    border: 'none',
                    padding: '4px 10px',
                    marginRight: '6px',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleChange(q.field, false)}
                  style={{
                    backgroundColor: localAnswers[q.field] === false ? 'red' : '#444',
                    color: 'white',
                    border: 'none',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  No
                </button>
              </>
            ) : q.type === 'date' ? (
              <input
                type="date"
                value={localAnswers[q.field] || ''}
                onChange={(e) => handleChange(q.field, e.target.value)}
                style={{
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            ) : q.type === 'nameGroup' ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {q.subfields.map((sf) => (
                  <input
                    key={sf}
                    type="text"
                    placeholder={sf.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                    value={localAnswers[sf] || ''}
                    onChange={(e) => handleChange(sf, e.target.value)}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      flex: '1 1 30%'
                    }}
                  />
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={localAnswers[q.field] || ''}
                onChange={(e) => handleChange(q.field, e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc'
                }}
              />
            )}
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🏠 Back to Home
        </button>

        <button
          onClick={handleSave}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ✅ Save Changes
        </button>
      </div>

      {showToast && (
        <div style={{
          marginTop: '1rem',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          ✅ Answers updated successfully!
        </div>
      )}
    </div>
  );
};

export default QuizReviewPage;
