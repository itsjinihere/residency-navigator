import React from 'react';

const FileUploadArea = ({
  selectedFile,
  setSelectedFile,
  handleAnalyzeFile,
  currentSelectedDate,
  setCurrentSelectedDate,
  extractedDates,
  confirmUpload,
  documentTypes,
  leaseStartDate,
  leaseEndDate,
  setLeaseStartDate,
  setLeaseEndDate,
  analysisInfo,
  rddValidationMessage,
  crossCheckMessage,
  uploadMessage
}) => {
  return (
    <div className="mt-6 space-y-4">
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          setSelectedFile(file);
          handleAnalyzeFile(file);
        }}
      />

      {selectedFile && (
        <>
          {/* Lease date pickers */}
          {documentTypes.isLease && (
            <>
              <label>Start Date:</label>
              <input type="date" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} />
              <label>End Date:</label>
              <input type="date" value={leaseEndDate} onChange={(e) => setLeaseEndDate(e.target.value)} />
            </>
          )}

          {/* Tax Year Dropdown */}
          {documentTypes.isTaxReturn && (
            <>
              <label>Select tax year:</label>
              <select
                value={currentSelectedDate}
                onChange={(e) => setCurrentSelectedDate(e.target.value)}
              >
                <option value="">-- Select tax year --</option>
                {analysisInfo?.taxYears?.map((year, idx) => (
                  <option key={idx} value={year}>{year}</option>
                ))}
              </select>
            </>
          )}

          {/* Standard date picker */}
          {!documentTypes.isTaxReturn && (
            <>
              <label>Select issue date:</label>
              <select
                value={currentSelectedDate}
                onChange={(e) => setCurrentSelectedDate(e.target.value)}
                disabled={extractedDates.length === 0}
              >
                <option value="">-- Select a date --</option>
                {extractedDates.map((date, idx) => (
                  <option key={idx} value={date}>{date}</option>
                ))}
              </select>
              <p className="text-sm mt-2">Or enter manually:</p>
              <input
                type="date"
                onChange={(e) => {
                  const [y, m, d] = e.target.value.split('-');
                  setCurrentSelectedDate(`${parseInt(m)}/${parseInt(d)}/${y}`);
                }}
              />
            </>
          )}

          <button
            onClick={confirmUpload}
            className="bg-green-700 text-white px-4 py-2 rounded mt-3"
            disabled={
              !currentSelectedDate ||
              (documentTypes.isLease && (!leaseStartDate || !leaseEndDate))
            }
          >
            Upload This Document
          </button>
        </>
      )}

      {rddValidationMessage && (
        <p className="text-sm font-semibold" style={{ color: rddValidationMessage.includes('⚠️') ? 'red' : 'green' }}>
          {rddValidationMessage}
        </p>
      )}
      {crossCheckMessage && (
        <p className="text-sm font-semibold text-red-600">{crossCheckMessage}</p>
      )}
      {uploadMessage && (
        <p className={`text-sm font-bold ${uploadMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {uploadMessage}
        </p>
      )}
    </div>
  );
};

export default FileUploadArea;
