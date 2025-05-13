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
      <div>
        <h2>Review Your Answers</h2>
        <ul>
          {visibleQuestions.map((q) => {
            const value = answers[q.field];
            if (q.type === "nameGroup") {
              return (
                <li key={q.field} style={{ marginBottom: '1rem' }}>
                  <strong>{q.question}</strong><br />
                  {q.subfields.map((sf) => (
                    <input
                      key={sf}
                      type="text"
                      placeholder={sf.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                      value={answers[sf] || ''}
                      onChange={(e) =>
                        setAnswers({ ...answers, [sf]: e.target.value })
                      }
                      style={{ margin: '4px 6px 4px 0' }}
                    />
                  ))}
                </li>
              );
            }

            return (
              <li key={q.field} style={{ marginBottom: '1rem' }}>
                <label><strong>{q.question}</strong></label><br />
                {q.type === "boolean" ? (
                  <>
                    <button
                      onClick={() =>
                        setAnswers({ ...answers, [q.field]: true })
                      }
                      style={{
                        backgroundColor: value === true ? 'green' : '#444',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        marginRight: '6px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() =>
                        setAnswers({ ...answers, [q.field]: false })
                      }
                      style={{
                        backgroundColor: value === false ? 'red' : '#444',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                    >
                      No
                    </button>
                  </>
                ) : q.type === "date" ? (
                  <input
                    type="date"
                    value={value || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.field]: e.target.value })
                    }
                    style={{ padding: '4px' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={value || ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.field]: e.target.value })
                    }
                    style={{ padding: '4px', width: '60%' }}
                  />
                )}
              </li>
            );
          })}
        </ul>
        <button onClick={() => setReviewing(false)}>🔙 Go Back</button>
        <button onClick={() => determineStatus(answers)} style={{ marginLeft: '10px' }}>
          ✅ Submit
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Residency Quiz</h2>
      <p>{currentQuestion.question}</p>

      {currentQuestion.type === "boolean" && (
        <>
          <button onClick={() => handleAnswer(currentQuestion.field, true)}>Yes</button>
          <button onClick={() => handleAnswer(currentQuestion.field, false)} style={{ marginLeft: '10px' }}>
            No
          </button>
        </>
      )}

      {currentQuestion.type === "text" && (
        <>
          <input
            type="text"
            value={answers[currentQuestion.field] || ""}
            onChange={(e) =>
              setAnswers({ ...answers, [currentQuestion.field]: e.target.value })
            }
          />
          <br />
          <button
            onClick={() => {
              if (current < visibleQuestions.length - 1) {
                setCurrent(current + 1);
              } else {
                setReviewing(true);
              }
            }}
            disabled={!answers[currentQuestion.field]}
          >
            Next
          </button>
        </>
      )}

      {currentQuestion.type === "date" && (
        <>
          <input
            type="date"
            value={answers[currentQuestion.field] || ""}
            onChange={(e) =>
              setAnswers({ ...answers, [currentQuestion.field]: e.target.value })
            }
          />
          <br />
          <button
            onClick={() => {
              if (current < visibleQuestions.length - 1) {
                setCurrent(current + 1);
              } else {
                setReviewing(true);
              }
            }}
            disabled={!answers[currentQuestion.field]}
          >
            Next
          </button>
        </>
      )}

      {currentQuestion.type === "nameGroup" && (
        <>
          {currentQuestion.subfields.map((subfield) => (
            <div key={subfield} style={{ marginBottom: '0.5rem' }}>
              <label style={{ marginRight: '0.5rem' }}>
                {subfield.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
              </label>
              <input
                type="text"
                value={answers[subfield] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [subfield]: e.target.value })
                }
              />
            </div>
          ))}
          <button
            onClick={() => {
              if (current < visibleQuestions.length - 1) {
                setCurrent(current + 1);
              } else {
                setReviewing(true);
              }
            }}
          >
            Next
          </button>
        </>
      )}

      {current > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleBack}>⬅️ Back</button>
        </div>
      )}
    </div>
  );
}

export default Quiz;
