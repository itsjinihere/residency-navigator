import { useState } from 'react';

const questions = [
  { question: "Will you be 24 years or older by the start of the reclassification quarter?", field: "isOver24" },
  { question: "Are you married?", field: "isMarried" },
  { question: "Do you have dependents (children or others) you financially support?", field: "hasDependents" },
  { question: "Are you a U.S. military veteran or active-duty service member?", field: "isMilitary" },
  { question: "Have you been financially self-supporting for the past year?", field: "isSelfSupporting" },
  { question: "Are you currently or were you previously in foster care after the age of 13?", field: "wasInFosterCare" },
  { question: "Are your parent(s)/guardian(s) California residents?", field: "parentsInCA" },
  { question: "Will your parent(s)/guardian(s) claim you as a dependent on their taxes?", field: "claimedByParents" },
  { question: "Have you lived continuously in California for at least one year?", field: "livedInCA" },
  { question: "Do you have a California Driver’s License or State ID?", field: "hasCAID" }
];

function Quiz({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (field, value) => {
    const newAnswers = { ...answers, [field]: value };
    setAnswers(newAnswers);

    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      determineStatus(newAnswers);
    }
  };

  const determineStatus = (a) => {
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
      if (a.parentsInCA) {
        status = "above19dependent-ca";   // ✅ Dependent, parents in CA
      } else {
        status = "above19dependent-nonca"; // ❌ Dependent, parents NOT in CA
      }
    } else {
      status = "unknown"; // fallback
    }

    setFinished(true);
    onComplete(status);
  };

  if (finished) {
    return (
      <div>
        <h2>Thank you! Classifying your student type...</h2>
      </div>
    );
  }

  const currentQuestion = questions[current];

  return (
    <div>
      <h2>Residency Quiz</h2>
      <p>{currentQuestion.question}</p>
      <button onClick={() => handleAnswer(currentQuestion.field, true)}>Yes</button>
      <button onClick={() => handleAnswer(currentQuestion.field, false)} style={{ marginLeft: '10px' }}>
        No
      </button>
    </div>
  );
}

export default Quiz;
