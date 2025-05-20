import React, { useEffect, useState } from 'react';

const residencyRequirements = {
  independent: {
    listA: [
      "CA Driver's License or ID",
      'Lease or Rental Agreement',
      'Voter Registration',
      'Car Registration',
      'State Tax Returns',
    ],
    listB: [
      'Federal Tax Returns',
      'W2 or Pay Stubs',
      'Utility Bill',
      'Bank Account Statement (CA Address)',
    ],
  },
  under19: {
    listA: [
      "Parent's CA Driver's License",
      "Parent's Lease or Rental Agreement",
      "Parent's State Tax Returns",
    ],
    listB: [
      "Parent's Utility Bills",
      'High School Transcripts showing CA address',
    ],
  },
  military: {
    listA: ['Active Duty Military Orders', 'Military ID', 'Proof of CA Stationing'],
    listB: ['Military Spouse or Dependent Documentation', 'Utility Bill at CA address'],
  },
  above19dependentca: {
    listA: [
      "Parent's CA Driver's License",
      "Parent's Lease or Rental Agreement",
      "Parent's Voter Registration",
      "Parent's Car Registration",
    ],
    listB: [
      "Parent's State Tax Returns",
      "Parent's Utility Bills",
      "Parent's Bank Statement (showing CA address)",
      'High School or College Transcripts showing CA address',
    ],
  },
};

const getRequiredTaxYears = (petitionYear) => {
  if (!petitionYear) return [];
  const y = parseInt(petitionYear);
  return [y - 3, y - 2, y - 1].map(String);
};

const Checklist = ({
  residencyType,
  completedItems,
  documentDates,
  setDocumentDates,
  onChecklistComplete,
  petitionYear,
  financialDocs = [],
  setFinancialDocs,
  showOnlyTaxDocs = false,
  showFinancialDocs = true,
}) => {
  const [editingItem, setEditingItem] = useState(null);
  if (!residencyType) return null;

  const cleanedResidencyType = residencyType.replace(/-/g, '').toLowerCase();
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
  const completedListA = listA.filter((item) => completedItems.includes(item));
  const completedListB = listB.filter((item) => completedItems.includes(item));
  const requiredTaxYears = petitionYear ? getRequiredTaxYears(petitionYear) : [];
  const completedTaxYears = petitionYear
    ? requiredTaxYears.filter((year) => financialDocs.includes(year))
    : [];

  const hasListARequirement = completedListA.length >= 1;
  const totalResidencyDocs = completedListA.length + completedListB.length;
  const residencyDocsComplete =
    hasListARequirement && totalResidencyDocs >= 3;

  const financialDocsComplete =
    cleanedResidencyType !== 'independent' ||
    completedTaxYears.length === requiredTaxYears.length;

    const checklistComplete =
    (showOnlyTaxDocs && financialDocsComplete) ||
    (!showOnlyTaxDocs && residencyDocsComplete && (!showFinancialDocs || financialDocsComplete));
  
  useEffect(() => {
    if (onChecklistComplete && petitionYear) {
      onChecklistComplete(checklistComplete);
    }
  }, [checklistComplete, onChecklistComplete, petitionYear]);

  // Progress logic adapted for step-by-step display
  const requiredResidencyDocs = 3;
  const requiredTaxDocs = 3;
  const residencyDocsCounted = Math.min(totalResidencyDocs, requiredResidencyDocs);
  const taxDocsCounted = Math.min(completedTaxYears.length, requiredTaxDocs);

  let progress = 0;
  if (showOnlyTaxDocs) {
    progress = Math.round((taxDocsCounted / requiredTaxDocs) * 100);
  } else if (!showFinancialDocs) {
    progress = Math.round((residencyDocsCounted / requiredResidencyDocs) * 100);
  } else {
    progress = Math.round(
      ((residencyDocsCounted + taxDocsCounted) / (requiredResidencyDocs + requiredTaxDocs)) * 100
    );
  }

  const formatToInputDate = (str) => {
    if (!str) return '';
    const [month, day, year] = str.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const formatToDisplay = (str) => str || '';

  const renderItem = (item) => {
    const isCompleted = completedItems.includes(item);
    const dateInfo = documentDates[item];
    const isRange = typeof dateInfo === 'object' && dateInfo !== null;

    const handleSaveDate = (field, value) => {
      setDocumentDates((prev) => ({
        ...prev,
        [item]: isRange
          ? { ...prev[item], [field]: value }
          : value,
      }));
    };

    return (
      <div
        key={item}
        className="bg-white rounded-md p-3 shadow flex flex-col sm:flex-row sm:items-center sm:justify-between text-[#154734]"
      >
        <span className="font-medium">
          {isCompleted ? '✅' : '⬜️'} {item}
        </span>
        {isCompleted && (
          <span className="text-sm text-gray-400 mt-2 sm:mt-0 sm:ml-4">
            {editingItem === item ? (
              <div className="flex gap-2 items-center">
                {isRange ? (
                  <>
                    <input
                      type="date"
                      className="rounded px-2 py-1 text-black"
                      value={formatToInputDate(dateInfo?.start)}
                      onChange={(e) =>
                        handleSaveDate(
                          'start',
                          new Date(e.target.value).toLocaleDateString('en-US')
                        )
                      }
                    />
                    <span className="text-black">to</span>
                    <input
                      type="date"
                      className="rounded px-2 py-1 text-black"
                      value={formatToInputDate(dateInfo?.end)}
                      onChange={(e) =>
                        handleSaveDate(
                          'end',
                          new Date(e.target.value).toLocaleDateString('en-US')
                        )
                      }
                    />
                  </>
                ) : (
                  <input
                    type="date"
                    className="rounded px-2 py-1 text-black"
                    value={formatToInputDate(dateInfo)}
                    onChange={(e) =>
                      handleSaveDate(
                        null,
                        new Date(e.target.value).toLocaleDateString('en-US')
                      )
                    }
                  />
                )}
                <button className="text-green-400" onClick={() => setEditingItem(null)}>
                  ✔️
                </button>
              </div>
            ) : (
              <span
                className="underline cursor-pointer hover:text-gray-600"
                onClick={() => setEditingItem(item)}
              >
                {isRange
                  ? `${formatToDisplay(dateInfo?.start)} to ${formatToDisplay(dateInfo?.end)}`
                  : formatToDisplay(dateInfo)}
              </span>
            )}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-8">
      <h3 className="text-xl font-semibold text-[#154734] mb-4">
        Checklist for {residencyType.charAt(0).toUpperCase() + residencyType.slice(1).replace(/-/g, ' ')} Student
      </h3>

      <div className="bg-white text-[#154734] rounded-xl p-6 mt-4 shadow-lg">
        {!showOnlyTaxDocs && (
          <>
            <h4 className="text-lg font-medium text-green-700 mt-2">
              ✅ List A (must have at least 1) <span className="cursor-help">❓</span>
            </h4>
            <div className="space-y-4 mt-2">{listA.map(renderItem)}</div>

            <h4 className="text-lg font-medium text-green-700 mt-6">
              📂 List B (choose additional documents) <span className="cursor-help">❓</span>
            </h4>
            <div className="space-y-4 mt-2">{listB.map(renderItem)}</div>
          </>
        )}

        {showFinancialDocs && cleanedResidencyType === 'independent' && petitionYear && (
          <>
            <h4 className="text-lg font-medium text-green-700 mt-6">📄 Financial Independence (Parent Tax Returns)</h4>
            <div className="space-y-2 mt-2">
              {requiredTaxYears.map((year) => (
                <div key={year} className="bg-white rounded-md p-3 shadow text-[#154734]">
                  {financialDocs.includes(year) ? '✅' : '⬜️'} Parent's Tax Return – {year}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 space-y-2">
        <div className="mb-2">
  {/* <div className="flex justify-between text-sm text-[#154734] mb-1">
    <span>Progress</span>
    <span>{progress}% complete</span>
  </div> */}
  <div className="h-3 bg-gray-300 rounded-full overflow-hidden shadow-inner">
    <div
      className="h-full bg-green-600 transition-all duration-500 ease-in-out rounded-full"
      style={{ width: `${progress}%` }}
    />
  </div>
</div>

{/* <p className="text-sm text-center mt-2 font-medium text-[#154734]">{progress}% complete</p> */}

          <p
            className={`font-semibold ${
              checklistComplete ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {checklistComplete
              ? '✅ Minimum checklist completed!'
              : '❌ Please upload required documents.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checklist;
