import React from 'react';
import Checklist from './Checklist';

const ResidencyDocsChecklist = ({
  residencyType,
  completedItems,
  documentDates,
  setDocumentDates,
  petitionYear,
  onChecklistComplete
}) => {
  return (
    <Checklist
      residencyType={residencyType}
      completedItems={completedItems}
      documentDates={documentDates}
      setDocumentDates={setDocumentDates}
      petitionYear={petitionYear}
      financialDocs={[]} // 👈 force to empty
      setFinancialDocs={() => {}} // 👈 no-op
      onChecklistComplete={onChecklistComplete}
      showFinancialDocs={false} // 👈 optional flag
    />
  );
};

export default ResidencyDocsChecklist;
