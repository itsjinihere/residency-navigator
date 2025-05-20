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
    return <p className="p-6 text-center">No quiz answers found. Please complete the quiz first.</p>;
  }

  return (
    <div className="px-4 py-8 min-h-screen bg-[#c1e0c4] text-[#154734]">
      <div className="max-w-3xl mx-auto text-center mb-6">
        <h1 className="text-3xl font-bold">🏡 Residency Navigator</h1>
        <p className="text-md mt-2">
          Review your answers below and edit anything you need to before submitting.
        </p>
      </div>

      <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-3xl mx-auto text-[#154734]">
        <h2 className="text-2xl font-semibold text-center mb-6">📋 Review Your Answers</h2>

        <ul className="space-y-6">
          {visibleQuestions.map((q) => (
            <li key={q.field}>
            <div className="w-full flex flex-col items-center text-center">
              <label className="font-semibold mb-2">{q.question}</label>
          
              {q.type === 'boolean' ? (
                <div
                className="flex space-x-4 mt-2"
                style={{ marginLeft: '80%' }}
              >
                  <button
                    onClick={() => handleChange(q.field, true)}
                    className={`px-4 py-2 rounded-md font-semibold ${localAnswers[q.field] === true ? 'bg-green-600 text-white' : 'bg-gray-300 text-black'}`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleChange(q.field, false)}
                    className={`px-4 py-2 rounded-md font-semibold ${localAnswers[q.field] === false ? 'bg-red-600 text-white' : 'bg-gray-300 text-black'}`}
                  >
                    No
                  </button>
                </div>
              ) : q.type === 'date' ? (
                <input
                  type="date"
                  value={localAnswers[q.field] || ''}
                  onChange={(e) => handleChange(q.field, e.target.value)}
                  className="p-2 rounded-md border w-full mt-2"
                />
              ) : q.type === 'nameGroup' ? (
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {q.subfields.map((sf) => (
                    <input
                      key={sf}
                      type="text"
                      value={localAnswers[sf] || ''}
                      onChange={(e) => handleChange(sf, e.target.value)}
                      placeholder={sf}
                      className="flex-1 min-w-[100px] p-2 border rounded-md"
                    />
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={localAnswers[q.field] || ''}
                  onChange={(e) => handleChange(q.field, e.target.value)}
                  className="p-2 rounded-md border w-full mt-2"
                />
              )}
            </div>
          </li>
          
          ))}
        </ul>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            🏠 Back to Home
          </button>
          <button
            onClick={handleSave}
            className="bg-[#007bff] text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            ✅ Save Changes
          </button>
        </div>

        {showToast && (
          <div className="mt-4 p-3 bg-green-500 text-white text-center rounded-md">
            ✅ Answers updated successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizReviewPage;
