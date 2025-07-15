import { useNavigate } from 'react-router-dom';

const descriptions = {
  'independent-over24': 'As an independent student age 24 or older, you may reclassify without providing your parents\' documentation.',
  'independent': 'Independent students under 24 must provide proof of financial independence and may need parent documents.',
  military: 'Military-affiliated students qualify for in-state tuition with fewer residency documents.',
  'above19dependent-ca': 'Because your parents are California residents, you must submit their residency documents to qualify.',
  'above19dependent-nonca': 'With non-California parents claiming you, you are not currently eligible for residency reclassification.',
  under19: 'Students under 19 rely on their parents\' residency. Provide parent documents and show physical presence.',
  unknown: 'Your answers did not match a specific residency category.'
};

export default function StatusPage({ residencyType }) {
  const navigate = useNavigate();
  const desc = descriptions[residencyType] || descriptions.unknown;

  return (
    <div className="px-4 py-8 min-h-screen bg-[#c1e0c4] text-[#154734]">
      <div className="max-w-3xl mx-auto space-y-6 text-center">
        <h1 className="text-3xl font-bold">Your Residency Status</h1>
        <p className="text-xl font-semibold capitalize">{residencyType || 'Unknown'}</p>
        <p className="mt-4">{desc}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-4 py-2 bg-[#28a745] text-white rounded-md"
        >
          ← Back Home
        </button>
      </div>
    </div>
  );
}