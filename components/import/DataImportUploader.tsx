"use client";

import { useState, useCallback } from "react";
import { CheckCircleIcon } from "@/components/icons";

export interface ImportField {
  key: string;
  label: string;
  required: boolean;
  type: "text" | "email" | "phone" | "date" | "time" | "number" | "boolean";
  example: string;
  description?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  validationErrors: ValidationError[];
}

interface DataImportUploaderProps {
  platform: string;
  platformLogo?: string;
  platformColor?: string;
  description: string;
  docsUrl: string;
  templateUrl: string;
  fields: ImportField[];
  onImport: (data: Record<string, string>[]) => Promise<void>;
  platformSelector?: React.ReactNode;
}

export function DataImportUploader({
  platform,
  platformLogo,
  platformColor = "bg-primary-600",
  description,
  docsUrl,
  templateUrl,
  fields,
  onImport,
  platformSelector,
}: DataImportUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    setFile(file);
    parseCSV(file);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        alert("File is empty");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const rows: Record<string, string>[] = [];
      const validationErrors: ValidationError[] = [];

      // Parse rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        // Validate required fields
        fields.forEach((field) => {
          if (field.required && !row[field.key]) {
            validationErrors.push({
              row: i,
              field: field.key,
              message: `${field.label} is required`,
            });
          }

          // Basic type validation
          if (row[field.key]) {
            if (field.type === "email" && !row[field.key].includes("@")) {
              validationErrors.push({
                row: i,
                field: field.key,
                message: `Invalid email format`,
              });
            }
            if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(row[field.key])) {
              validationErrors.push({
                row: i,
                field: field.key,
                message: `Invalid date format (use YYYY-MM-DD)`,
              });
            }
            if (field.type === "time" && !/^\d{2}:\d{2}$/.test(row[field.key])) {
              validationErrors.push({
                row: i,
                field: field.key,
                message: `Invalid time format (use HH:MM)`,
              });
            }
          }
        });

        rows.push(row);
      }

      setParsedData({ headers, rows, validationErrors });
      setStep("preview");
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.validationErrors.length > 0) {
      return;
    }

    setImporting(true);
    try {
      await onImport(parsedData.rows);
      setStep("success");
    } catch (error) {
      console.error("Import error:", error);
      alert("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParsedData(null);
    setStep("upload");
  };

  // Upload Step
  if (step === "upload") {
    return (
      <div className="w-full">
        {/* Platform Selector (if provided) */}
        {platformSelector && <div className="mb-6">{platformSelector}</div>}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            {platformLogo && (
              <div className={`w-16 h-16 ${platformColor} rounded-xl flex items-center justify-center`}>
                <span className="text-white text-2xl font-bold">{platformLogo}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Import from {platform}</h1>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>
          </div>
        </div>

        {/* Instructions and Upload - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Before You Start</h2>
            <ol className="space-y-2 text-sm text-blue-800 mb-4">
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">1.</span>
                <span>Download our template and review the required format</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">2.</span>
                <span>Export your data from {platform}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">3.</span>
                <span>Map your data to our template format</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold min-w-[20px]">4.</span>
                <span>Upload the completed CSV file</span>
              </li>
            </ol>
            <div className="flex items-center gap-2">
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Documentation
              </a>
              <a
                href={templateUrl}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Template
              </a>
            </div>
          </div>

          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="pointer-events-none">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <p className="text-xs text-gray-400">Only .csv files are supported</p>
            </div>
          </div>
        </div>

        {/* Expected Format - Full Width */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expected Format</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Field</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Required</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700">Example</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field.key} className="border-b border-gray-100">
                    <td className="py-2 px-4">
                      <span className="font-medium text-gray-900">{field.label}</span>
                      {field.description && (
                        <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {field.required ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-gray-600">{field.type}</td>
                    <td className="py-2 px-4 text-gray-500 font-mono text-xs">{field.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Preview Step
  if (step === "preview" && parsedData) {
    const hasErrors = parsedData.validationErrors.length > 0;
    const errorsByRow = parsedData.validationErrors.reduce((acc, error) => {
      if (!acc[error.row]) acc[error.row] = [];
      acc[error.row].push(error);
      return acc;
    }, {} as Record<number, ValidationError[]>);

    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Preview Import Data</h1>
              <p className="text-gray-600 mt-1">
                {parsedData.rows.length} records found • {file?.name}
              </p>
            </div>
            <button
              onClick={reset}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Choose Different File
            </button>
          </div>
        </div>

        {/* Validation Summary */}
        {hasErrors ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  {parsedData.validationErrors.length} Validation Error{parsedData.validationErrors.length > 1 ? "s" : ""} Found
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Please fix the errors below before importing. You can download the file, fix the issues, and upload again.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {parsedData.validationErrors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm text-red-800 bg-red-100 rounded p-2">
                      <span className="font-semibold">Row {error.row}:</span> {error.field} - {error.message}
                    </div>
                  ))}
                  {parsedData.validationErrors.length > 10 && (
                    <p className="text-sm text-red-600">
                      ...and {parsedData.validationErrors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">All Validations Passed!</h3>
                <p className="text-sm text-green-700">
                  Your data looks good. Review the preview below and click Import to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Preview */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Data Preview (first 10 rows)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-4 font-semibold text-gray-700 border-b">Row</th>
                  {parsedData.headers.map((header) => (
                    <th key={header} className="text-left py-2 px-4 font-semibold text-gray-700 border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.rows.slice(0, 10).map((row, index) => {
                  const rowErrors = errorsByRow[index + 1];
                  return (
                    <tr
                      key={index}
                      className={rowErrors ? "bg-red-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="py-2 px-4 border-b text-gray-500">{index + 1}</td>
                      {parsedData.headers.map((header) => {
                        const hasError = rowErrors?.some((e) => e.field === header);
                        return (
                          <td
                            key={header}
                            className={`py-2 px-4 border-b ${hasError ? "text-red-600 font-medium" : "text-gray-900"}`}
                          >
                            {row[header] || <span className="text-gray-400">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {parsedData.rows.length > 10 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Showing 10 of {parsedData.rows.length} rows
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={hasErrors || importing}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />
                </svg>
                Importing...
              </>
            ) : (
              <>
                Import {parsedData.rows.length} Records
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Success Step
  if (step === "success" && parsedData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Successful!</h2>
          <p className="text-gray-600 mb-8">
            Successfully imported {parsedData.rows.length} records from {platform}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={reset}
              className="px-6 py-3 text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 font-medium"
            >
              Import More Data
            </button>
            <a
              href="/admin/clients"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              View Imported Data
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
