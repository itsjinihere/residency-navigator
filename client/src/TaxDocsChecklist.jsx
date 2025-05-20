import React from 'react';
import Checklist from './Checklist';

const TaxDocsChecklist = ({
  residencyType,
  petitionYear,
  financialDocs,
  setFinancialDocs,
  onChecklistComplete = () => {}
}) => {
  return (
    <Checklist
      residencyType={residencyType}
      completedItems={[]}                  // ✅ No residency docs needed
      documentDates={{}}                   // ✅ No document dates needed
      setDocumentDates={() => {}}          // ✅ No-op setter
      petitionYear={petitionYear}
      financialDocs={financialDocs}
      setFinancialDocs={setFinancialDocs}
      onChecklistComplete={onChecklistComplete}
      showOnlyTaxDocs={true}               // ✅ Only show tax checklist
      showFinancialDocs={true}             // ✅ Explicitly show tax section
    />
  );
};

export default TaxDocsChecklist;
