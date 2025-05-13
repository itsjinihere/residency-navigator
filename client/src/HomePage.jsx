// src/HomePage.jsx
import Quiz from './Quiz';
import Checklist from './Checklist';
import QuizReview from './QuizReview';

const HomePage = ({
  status,
  quizCompleted,
  residencyType,
  quizAnswers,
  setResidencyType,
  setQuizAnswers,
  setQuizCompleted,
  renderChecklistAndUpload
}) => {
  return (
    <div>
      <h1 id="home">Residency Navigator</h1>
      <p>Welcome to the prototype!</p>

      <div id="status" style={{ marginTop: '2rem' }}>
        {status ? (
          <div>
            <p><strong>{status.message}</strong></p>
            <p>{status.timestamp}</p>
          </div>
        ) : (
          <p>Checking backend status...</p>
        )}
      </div>

      <hr />

      {!quizCompleted ? (
        <Quiz
          onComplete={(determinedType, allAnswers) => {
            setResidencyType(determinedType);
            setQuizAnswers(allAnswers);
            setQuizCompleted(true);
          }}
        />
      ) : (
        <>
          {residencyType === 'above19dependent-nonca' ? (
            <div style={{ marginTop: '2rem' }}>
              <h2>❌ Based on your answers, you are currently NOT eligible for California residency.</h2>
              <p>Because you are financially dependent on non-California parents, you are not considered a CA resident.</p>
              <h4>➡️ Ways you may become eligible in the future:</h4>
              <ul>
                <li>Become financially independent</li>
                <li>Get married</li>
                <li>Your parents move to California</li>
                <li>Live independently for a year without being claimed on taxes</li>
              </ul>
            </div>
          ) : residencyType === 'above19dependent-ca' ? (
            <div style={{ marginTop: '2rem' }}>
              <h2>⚠️ Your eligibility depends on your parents' California residency.</h2>
              <p>Please upload documents showing their CA status (tax returns, lease, ID, etc).</p>
              {renderChecklistAndUpload()}
            </div>
          ) : (
            <>
              {/* <QuizReview answers={quizAnswers} /> */}
              {renderChecklistAndUpload()}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
