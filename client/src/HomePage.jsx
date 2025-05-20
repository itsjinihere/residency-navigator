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

    
<div className="min-h-screen bg-[#c1e0c4] text-black font-sans px-4 py-8">
{quizCompleted && (
      <div className="h-1 w-full bg-green-500 animate-pulse transition-all duration-500 mb-6 rounded-full"></div>
    )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-[#154734] drop-shadow-lg">
  🏡 <span className="text-[#154734]">Residency Navigator</span>
</h1>

{!quizCompleted && (
  <>
<div className="p-4 text-sm text-[#154734] space-y-1">

  <p>Welcome! This tool will help you gather, verify, and submit the required documents for California residency reclassification.</p>
  <p>Start by answering a few short questions in the quiz below.</p>
</div>



<p className="text-[#154734] text-lg mt-2 leading-relaxed">
  Use this tool to prepare and track your CA residency reclassification application.
</p>
</>
)}

        </header>

        {/* Backend Status
        {status && (
          <div className="bg-[#1e1e1e] p-4 rounded-lg shadow-md">
            <p className="text-sm text-green-400 font-medium">{status.message}</p>
            <p className="text-xs text-gray-400">{new Date(status.timestamp).toLocaleString()}</p>
          </div>
        )} */}

        {/* Main Content */}
        {!quizCompleted ? (
          <div className="bg-[#c1e0c4] p-8 rounded-xl shadow-2xl">
          <Quiz
            onComplete={(determinedType, allAnswers) => {
              setResidencyType(determinedType);
              setQuizAnswers(allAnswers);
              setQuizCompleted(true);
            }}
          />
        </div>
        
        ) : (
          <div className="space-y-6">
            {residencyType === 'above19dependent-nonca' && (
              <div className="bg-[#1e1e1e] p-6 rounded-xl shadow-lg space-y-4">
                <h2 className="text-2xl font-semibold text-red-500">❌ Not Currently Eligible for California Residency</h2>
                <p>Because you are financially dependent on non-California parents, you do not meet eligibility requirements at this time.</p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-white">➡️ Ways you may become eligible in the future:</p>
                  <ul className="list-none pl-2 space-y-1 text-[#154734]">
                    <li>• Become financially independent</li>
                    <li>• Get married</li>
                    <li>• Your parents move to California</li>
                    <li>• Live independently for a year without being claimed on taxes</li>
                  </ul>
                </div>
              </div>
            )}

            {residencyType === 'above19dependent-ca' && (
              <div className="bg-[#1e1e1e] p-6 rounded-xl shadow-lg space-y-4">
                <h2 className="text-2xl font-semibold text-yellow-400">⚠️ Eligibility Depends on Parent's Residency</h2>
                <p>Please upload documents that show your parents’ California residency (e.g., lease, ID, tax returns).</p>
                {renderChecklistAndUpload()}
              </div>
            )}

            {residencyType !== 'above19dependent-nonca' &&
              residencyType !== 'above19dependent-ca' && (
                <>
                  {/* Uncomment if needed */}
                  {/* <QuizReview answers={quizAnswers} /> */}
                  {renderChecklistAndUpload()}
                </>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
