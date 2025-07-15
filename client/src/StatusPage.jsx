import React from 'react';

const statusInfoMap = {
  'military': {
    label: 'Military-Affiliated Student',
    description: `You may qualify for immediate in-state tuition under California Education Code §§68075.5 and 68075.7, depending on your status (active duty, dependent, recently discharged, etc.). You are not required to prove physical presence or financial independence.`,
  },
  'independent-over24': {
    label: 'Independent Student (Age 24+)',
    description: `Because you're 24 or older by the Residency Determination Date (RDD), you're automatically considered financially independent. However, you still need to prove physical presence in California for 365 days before your RDD and show intent to remain through documentation.`,
  },
  'independent': {
    label: 'Independent Student (Age 19–23)',
    description: `You must prove physical presence, intent to remain in California, and financial independence by submitting your parents' tax returns for the three years prior to your RDD.`,
  },
  'under19': {
    label: 'Under Age 19',
    description: `Students under 19 are considered minors and derive residency from their parents or guardians. You'll need to provide documentation from your parent(s) showing their physical presence and intent to remain in California.`,
  },
  'above19dependentca': {
    label: 'Dependent (Over 19, CA Parents)',
    description: `You are considered dependent on your parent(s), who must meet residency requirements. You must submit their documents to show CA residency, even if you're over 19.`,
  },
};

const StatusPage = ({ residencyType }) => {
  const cleanedType = residencyType?.toLowerCase().replace(/-/g, '');
  const statusData = statusInfoMap[cleanedType];

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white rounded-xl shadow-lg p-6 text-[#154734]">
      <h2 className="text-2xl font-bold mb-4">🧾 Residency Status</h2>
      {statusData ? (
        <>
          <h3 className="text-xl font-semibold">{statusData.label}</h3>
          <p className="mt-2">{statusData.description}</p>
        </>
      ) : (
        <p>Status explanation not available. Please complete the quiz first.</p>
      )}
    </div>
  );
};

export default StatusPage;