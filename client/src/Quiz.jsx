import { useState } from 'react';

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

function Quiz({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [reviewing, setReviewing] = useState(false);

  const visibleQuestions = questions.filter(q => !q.showIf || q.showIf(answers));
  const currentQuestion = visibleQuestions[current];
  const progress = Math.round(((current + 1) / visibleQuestions.length) * 100);

  const baseButtonStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  };

  const handleAnswer = (field, value) => {
    const newAnswers = { ...answers, [field]: value };
    setAnswers(newAnswers);

    if (current < visibleQuestions.length - 1) {
      setCurrent(current + 1);
    } else {
      setReviewing(true);
    }
  };

  const determineStatus = (a) => {
    if (a.dob) {
      const ageCutoff = new Date();
      ageCutoff.setFullYear(ageCutoff.getFullYear() - 19);
      const userDOB = new Date(a.dob);
      a.isUnder19 = userDOB > ageCutoff;
    } else {
      a.isUnder19 = false;
    }

    let status = "";
    if (a.isMilitary) {
      status = "military";
    } else if (
      a.isOver24 ||
      a.isMarried ||
      a.hasDependents ||
      (a.isSelfSupporting && !a.claimedByParents) ||
      a.wasInFosterCare
    ) {
      status = "independent";
    } else if (a.claimedByParents) {
      status = a.parentsInCA ? "above19dependent-ca" : "above19dependent-nonca";
    } else {
      status = "unknown";
    }

    onComplete(status, answers);
  };

  const handleBack = () => {
    if (current > 0) setCurrent(current - 1);
  };

  if (reviewing) {
    return (
      <div style={{ padding: '2rem', backgroundColor: '#ffffffdd', borderRadius: '12px', maxWidth: '700px', margin: '2rem auto' }}>
        <h2 style={{ color: '#154734', fontSize: '1.75rem', fontWeight: '600', textAlign: 'center', marginBottom: '1.5rem' }}>Review Your Answers</h2>
  
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {visibleQuestions.map((q) => {
            const value = answers[q.field];
  
            return (
              <li key={q.field} style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: '600', color: '#154734', marginBottom: '0.5rem' }}>{q.question}</label>
  
                {q.type === 'boolean' ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setAnswers({ ...answers, [q.field]: true })}
                      style={{
                        ...baseButtonStyle,
                        backgroundColor: value === true ? '#28a745' : '#e0e0e0',
                        color: value === true ? 'white' : '#333'
                      }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setAnswers({ ...answers, [q.field]: false })}
                      style={{
                        ...baseButtonStyle,
                        backgroundColor: value === false ? '#dc3545' : '#e0e0e0',
                        color: value === false ? 'white' : '#333'
                      }}
                    >
                      No
                    </button>
                  </div>
                ) : q.type === 'date' ? (
                  <input
                    type="date"
                    value={value || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.field]: e.target.value })}
                    style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                ) : q.type === 'nameGroup' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {q.subfields.map((sf) => (
                      <input
                        key={sf}
                        type="text"
                        value={answers[sf] || ''}
                        onChange={(e) => setAnswers({ ...answers, [sf]: e.target.value })}
                        placeholder={sf}
                        style={{ flex: 1, minWidth: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                      />
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.field]: e.target.value })}
                    style={{ padding: '8px', width: '100%', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                )}
              </li>
            );
          })}
        </ul>
  
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button
            onClick={() => setReviewing(false)}
            style={{ ...baseButtonStyle, backgroundColor: '#f8f9fa', color: '#154734', border: '1px solid #ccc' }}
          >
            🔙 Go Back
          </button>
          <button
            onClick={() => determineStatus(answers)}
            style={{ ...baseButtonStyle, backgroundColor: '#007bff', color: 'white' }}
          >
            ✅ Submit
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      backgroundColor: '#ffffffdd',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      maxWidth: '700px',
      margin: '2rem auto'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>📝</div>
      <h2 style={{ color: '#154734', textAlign: 'center', fontSize: '1.75rem', marginBottom: '1rem' }}>Residency Quiz</h2>

      {visibleQuestions.length > 1 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#154734' }}>
            <span>Question {current + 1} of {visibleQuestions.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div style={{
            height: '12px',
            backgroundColor: '#e0e0e0',
            borderRadius: '6px',
            marginTop: '6px',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
          }}>
            <div
              style={{
                width: `${progress}%`,
                backgroundColor: '#154734',
                height: '100%',
                transition: 'width 0.5s ease-in-out'
              }}
              title={`${progress}% complete`}
            ></div>
          </div>
        </div>
      )}

      <div key={current} style={{ animation: 'fadeIn 0.3s ease-in' }}>
        <p style={{ color: '#154734', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          {currentQuestion.question}
        </p>

        {currentQuestion.type === 'boolean' && (
          <div>
            <button
              onClick={() => handleAnswer(currentQuestion.field, true)}
              style={{
                ...baseButtonStyle,
                backgroundColor: answers[currentQuestion.field] === true ? '#28a745' : '#e0e0e0',
                color: answers[currentQuestion.field] === true ? 'white' : '#333',
                marginRight: '10px'
              }}
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer(currentQuestion.field, false)}
              style={{
                ...baseButtonStyle,
                backgroundColor: answers[currentQuestion.field] === false ? '#dc3545' : '#e0e0e0',
                color: answers[currentQuestion.field] === false ? 'white' : '#333'
              }}
            >
              No
            </button>
          </div>
        )}

        {currentQuestion.type === 'text' && (
          <>
            <input
              type="text"
              value={answers[currentQuestion.field] || ""}
              onChange={(e) => setAnswers({ ...answers, [currentQuestion.field]: e.target.value })}
              style={{ padding: '8px', width: '100%', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <button
              onClick={() => current < visibleQuestions.length - 1 ? setCurrent(current + 1) : setReviewing(true)}
              disabled={!answers[currentQuestion.field]}
              style={{ ...baseButtonStyle, backgroundColor: '#007bff', color: 'white' }}
            >
              Next
            </button>
          </>
        )}

        {currentQuestion.type === 'date' && (
          <>
            <input
              type="date"
              value={answers[currentQuestion.field] || ""}
              onChange={(e) => setAnswers({ ...answers, [currentQuestion.field]: e.target.value })}
              style={{ padding: '8px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <button
              onClick={() => current < visibleQuestions.length - 1 ? setCurrent(current + 1) : setReviewing(true)}
              disabled={!answers[currentQuestion.field]}
              style={{ ...baseButtonStyle, backgroundColor: '#007bff', color: 'white' }}
            >
              Next
            </button>
          </>
        )}

        {currentQuestion.type === 'nameGroup' && (
          <>
            {currentQuestion.subfields.map((subfield) => (
              <div key={subfield} style={{ marginBottom: '0.75rem' }}>
                <label style={{ marginRight: '0.5rem', color: '#154734', fontWeight: '500' }}>
                  {subfield.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </label>
                <input
                  type="text"
                  value={answers[subfield] || ""}
                  onChange={(e) => setAnswers({ ...answers, [subfield]: e.target.value })}
                  style={{ padding: '6px', width: '100%', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </div>
            ))}
            <button
              onClick={() => current < visibleQuestions.length - 1 ? setCurrent(current + 1) : setReviewing(true)}
              style={{ ...baseButtonStyle, backgroundColor: '#007bff', color: 'white' }}
            >
              Next
            </button>
          </>
        )}

        {current > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={handleBack}
              style={{
                ...baseButtonStyle,
                backgroundColor: '#f8f9fa',
                color: '#154734',
                border: '1px solid #ccc'
              }}
            >
              ⬅️ Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;