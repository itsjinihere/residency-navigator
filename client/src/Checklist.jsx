// src/Checklist.jsx
import React, { useEffect } from 'react';

const residencyRequirements = {
  independent: {
    listA: [
      'CA Driver\'s License or ID',
      'Lease or Rental Agreement',
      'Voter Registration',
      'Car Registration',
      'State Tax Returns'
    ],
    listB: [
      'Federal Tax Returns',
      'W2 or Pay Stubs',
      'Utility Bill',
      'Bank Account Statement (CA Address)'
    ]
  },
  under19: {
    listA: [
      'Parent\'s CA Driver\'s License',
      'Parent\'s Lease or Rental Agreement',
      'Parent\'s State Tax Returns'
    ],
    listB: [
      'Parent\'s Utility Bills',
      'High School Transcripts showing CA address'
    ]
  },
  military: {
    listA: [
      'Active Duty Military Orders',
      'Military ID',
      'Proof of CA Stationing'
    ],
    listB: [
      'Military Spouse or Dependent Documentation',
      'Utility Bill at CA address'
    ]
  },
  above19dependentca: {
    listA: [
      'Parent\'s CA Driver\'s License',
      'Parent\'s Lease or Rental Agreement',
      'Parent\'s Voter Registration',
      'Parent\'s Car Registration'
    ],
    listB: [
      'Parent\'s State Tax Returns',
      'Parent\'s Utility Bills',
      'Parent\'s Bank Statement (showing CA address)',
      'High School or College Transcripts showing CA address'
    ]
  }
};

const Checklist = ({ residencyType, completedItems, onChecklistComplete }) => {
  if (!residencyType) return null;

  const cleanedResidencyType = residencyType.replace(/-/g, '').toLowerCase(); // make it flexible
  const requirements = residencyRequirements[cleanedResidencyType];

  if (!requirements) {
    return (
      <div>
        <h3>No checklist available for your student type.</h3>
        <p>Please proceed according to university instructions.</p>
      </div>
    );
  }

  const { listA, listB } = requirements;

  const completedListA = listA.filter(item => completedItems.includes(item));
  const completedListB = listB.filter(item => completedItems.includes(item));

  const hasListARequirement = completedListA.length >= 1;
  const totalDocumentsUploaded = completedListA.length + completedListB.length;
  const enoughDocumentsUploaded = totalDocumentsUploaded >= 3;

  const checklistComplete = hasListARequirement && enoughDocumentsUploaded;
  const progressPercent = Math.min(
    Math.round((totalDocumentsUploaded / 3) * 100),
    100
  );

  useEffect(() => {
    if (onChecklistComplete) {
      onChecklistComplete(checklistComplete);
    }
  }, [checklistComplete, onChecklistComplete]);

  const renderItem = (item) => (
    <li key={item}>
      {completedItems.includes(item) ? '✅' : '⬜️'} {item}
    </li>
  );

  return (
    <div>
      <h3>Checklist for {residencyType.charAt(0).toUpperCase() + residencyType.slice(1).replace(/-/g, ' ')} Student</h3>

      <h4>✅ List A (must have at least 1)</h4>
      <ul>
        {listA.map(renderItem)}
      </ul>

      <h4>📂 List B (choose additional documents)</h4>
      <ul>
        {listB.map(renderItem)}
      </ul>

      {/* Progress bar */}
      <div style={{ marginTop: '20px' }}>
        <p><strong>Progress:</strong> {progressPercent}% complete</p>
        <div style={{
          height: '10px',
          width: '100%',
          backgroundColor: '#eee',
          borderRadius: '5px',
          marginBottom: '10px'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: checklistComplete ? 'green' : '#007bff',
            borderRadius: '5px'
          }} />
        </div>

        {checklistComplete ? (
          <p style={{ color: 'green', fontWeight: 'bold' }}>
            ✅ Minimum checklist completed!
          </p>
        ) : (
          <p style={{ color: 'red', fontWeight: 'bold' }}>
            ❌ Please upload required documents.
          </p>
        )}
      </div>
    </div>
  );
};

export default Checklist;
