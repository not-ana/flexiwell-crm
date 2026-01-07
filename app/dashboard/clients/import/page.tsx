"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import {
  ArrowLeftIcon,
  UploadIcon,
  TrashIcon,
  FileIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CloseIcon,
} from "@/components/icons";

type ImportStep = "upload" | "preview" | "mapping" | "validation" | "importing" | "complete";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  progress: number;
}

interface ClientFile {
  id: string;
  name: string;
  size: string;
  dateUploaded: string;
  lastUpdated: string;
  recordCount: number;
  uploadedBy: {
    name: string;
    email: string;
    initials: string;
  };
}

interface ParsedCSV {
  headers: string[];
  rows: string[][];
  fileName: string;
  fileSize: string;
}

interface ColumnMapping {
  [csvColumn: string]: string;
}

interface ValidationError {
  row: number;
  column: string;
  value: string;
  message: string;
}

interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  total: number;
}

const systemFields = [
  { id: "name", label: "Name", required: true },
  { id: "email", label: "Email", required: true },
  { id: "phone", label: "Phone", required: false },
  { id: "status", label: "Status", required: false },
  { id: "notes", label: "Notes", required: false },
  { id: "skip", label: "Skip this column", required: false },
];

function DownloadIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default function ImportClientsPage() {
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch import history
  const fetchImportHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/imports");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error("Failed to fetch import history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImportHistory();
  }, [fetchImportHistory]);

  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>("preview");
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const parseCSV = (content: string): { headers: string[]; rows: string[][] } => {
    const lines = content.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
    return { headers, rows };
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const csvFiles = droppedFiles.filter(
      (file) => file.type === "text/csv" || file.name.endsWith(".csv")
    );

    if (csvFiles.length === 0) {
      alert("Please upload only CSV files.");
      return;
    }

    csvFiles.forEach((file) => processFile(file));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const csvFiles = Array.from(selectedFiles).filter(
      (file) => file.type === "text/csv" || file.name.endsWith(".csv")
    );

    if (csvFiles.length === 0) {
      alert("Please upload only CSV files.");
      return;
    }

    csvFiles.forEach((file) => processFile(file));
    e.target.value = "";
  }, []);

  const processFile = (file: File) => {
    const newUploadFile: UploadedFile = {
      id: String(Date.now() + Math.random()),
      name: file.name,
      size: formatFileSize(file.size),
      progress: 0,
    };

    setUploadedFiles((prev) => [...prev, newUploadFile]);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === newUploadFile.id ? { ...f, progress } : f))
      );
    }, 300);

    // Parse the file for import modal
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const { headers, rows } = parseCSV(content);

      setParsedData({
        headers,
        rows,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
      });

      // Auto-map columns
      const autoMapping: ColumnMapping = {};
      headers.forEach((header) => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes("name") || lowerHeader.includes("nome")) {
          autoMapping[header] = "name";
        } else if (lowerHeader.includes("email") || lowerHeader.includes("e-mail")) {
          autoMapping[header] = "email";
        } else if (lowerHeader.includes("phone") || lowerHeader.includes("telefone") || lowerHeader.includes("tel")) {
          autoMapping[header] = "phone";
        } else if (lowerHeader.includes("status")) {
          autoMapping[header] = "status";
        } else if (lowerHeader.includes("note") || lowerHeader.includes("obs")) {
          autoMapping[header] = "notes";
        } else {
          autoMapping[header] = "skip";
        }
      });
      setColumnMapping(autoMapping);
      setImportStep("preview");
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = "Name,Email,Phone,Status,Notes\nJohn Doe,john@example.com,+1 555 123 4567,active,VIP client\nJane Smith,jane@example.com,+1 555 987 6543,pending,New signup";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateData = () => {
    if (!parsedData) return;

    const errors: ValidationError[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const seenEmails = new Set<string>();

    const nameColumn = Object.entries(columnMapping).find(([, v]) => v === "name")?.[0];
    const emailColumn = Object.entries(columnMapping).find(([, v]) => v === "email")?.[0];

    parsedData.rows.forEach((row, rowIndex) => {
      if (nameColumn) {
        const nameIndex = parsedData.headers.indexOf(nameColumn);
        const nameValue = row[nameIndex]?.trim();
        if (!nameValue) {
          errors.push({
            row: rowIndex + 2,
            column: "Name",
            value: nameValue || "(empty)",
            message: "Name is required",
          });
        }
      }

      if (emailColumn) {
        const emailIndex = parsedData.headers.indexOf(emailColumn);
        const emailValue = row[emailIndex]?.trim().toLowerCase();

        if (!emailValue) {
          errors.push({
            row: rowIndex + 2,
            column: "Email",
            value: emailValue || "(empty)",
            message: "Email is required",
          });
        } else if (!emailRegex.test(emailValue)) {
          errors.push({
            row: rowIndex + 2,
            column: "Email",
            value: emailValue,
            message: "Invalid email format",
          });
        } else if (seenEmails.has(emailValue)) {
          errors.push({
            row: rowIndex + 2,
            column: "Email",
            value: emailValue,
            message: "Duplicate email in file",
          });
        } else {
          seenEmails.add(emailValue);
        }
      }
    });

    setValidationErrors(errors);
    setImportStep("validation");
  };

  const startImport = () => {
    if (!parsedData) return;

    setImportStep("importing");
    setImportProgress(0);

    const totalRows = parsedData.rows.length;
    let processed = 0;

    const interval = setInterval(() => {
      processed += Math.ceil(totalRows / 10);
      if (processed >= totalRows) {
        processed = totalRows;
        clearInterval(interval);

        const errorCount = validationErrors.length;
        const duplicateCount = validationErrors.filter((e) => e.message.includes("Duplicate")).length;

        setImportResult({
          success: totalRows - errorCount,
          errors: errorCount - duplicateCount,
          duplicates: duplicateCount,
          total: totalRows,
        });

        // Add to files list
        const newFile: ClientFile = {
          id: String(Date.now()),
          name: parsedData.fileName,
          size: parsedData.fileSize,
          dateUploaded: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          lastUpdated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          recordCount: totalRows - errorCount,
          uploadedBy: { name: "You", email: "you@flexiwell.com", initials: "YO" },
        };
        setFiles((prev) => [newFile, ...prev]);

        setImportStep("complete");
      }
      setImportProgress(Math.round((processed / totalRows) * 100));
    }, 200);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportStep("preview");
    setParsedData(null);
    setColumnMapping({});
    setValidationErrors([]);
    setImportProgress(0);
    setImportResult(null);
    setUploadedFiles([]);
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/clients" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Import clients</h1>
              <p className="text-gray-600 mt-1">
                Upload CSV files to import multiple clients at once.
              </p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
          >
            <DownloadIcon className="w-4 h-4" />
            Download template
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 mb-4 transition-colors ${
            isDragging
              ? "border-primary-500 bg-primary-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <UploadIcon className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-sm text-gray-600">
              <label className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium">
                Click to upload
                <input
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">CSV files only</p>
          </div>
        </div>

        {/* Uploaded Files (in progress) */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3 mb-6">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl"
              >
                <FileIcon type="csv" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <button
                      onClick={() => removeUploadedFile(file.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{file.size}</p>
                  {file.progress < 100 ? (
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="text-xs">Uploaded - Processing...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Import History */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Import history</h2>
            <p className="text-sm text-gray-600 mt-1">
              Files that have been imported previously.
            </p>
          </div>

          {files.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FileIcon type="csv" />
              </div>
              <p className="text-gray-500">No files imported yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Records
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date imported
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Imported by
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileIcon type="csv" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{file.size}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {file.recordCount} clients
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{file.dateUploaded}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700">
                            {file.uploadedBy.initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {file.uploadedBy.name}
                            </p>
                            <p className="text-xs text-gray-500">{file.uploadedBy.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="text-sm text-gray-600 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && parsedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeImportModal} />

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Import: {parsedData.fileName}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {parsedData.rows.length} records found
                  </p>
                </div>
                <button onClick={closeImportModal} className="p-2 text-gray-400 hover:text-gray-600">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-4 mt-4">
                {[
                  { id: "preview", label: "Preview" },
                  { id: "mapping", label: "Map columns" },
                  { id: "validation", label: "Validate" },
                  { id: "complete", label: "Import" },
                ].map((s, index, arr) => {
                  const stepOrder = ["preview", "mapping", "validation", "importing", "complete"];
                  const currentIndex = stepOrder.indexOf(importStep);
                  const thisIndex = stepOrder.indexOf(s.id);
                  const isActive = s.id === importStep || (importStep === "importing" && s.id === "complete");
                  const isCompleted = thisIndex < currentIndex;

                  return (
                    <div key={s.id} className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isCompleted
                              ? "bg-primary-600 text-white"
                              : isActive
                              ? "bg-primary-100 text-primary-700 border-2 border-primary-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        <span className={`text-sm ${isActive || isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                          {s.label}
                        </span>
                      </div>
                      {index < arr.length - 1 && (
                        <div className={`w-8 h-0.5 mx-2 ${isCompleted ? "bg-primary-600" : "bg-gray-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Preview Step */}
              {importStep === "preview" && (
                <>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                          {parsedData.headers.map((header) => (
                            <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {parsedData.rows.slice(0, 5).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500">{index + 2}</td>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-4 py-3 text-gray-900">
                                {cell || <span className="text-gray-400 italic">empty</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedData.rows.length > 5 && (
                    <p className="text-sm text-gray-500">Showing first 5 of {parsedData.rows.length} records</p>
                  )}
                </>
              )}

              {/* Mapping Step */}
              {importStep === "mapping" && (
                <div className="space-y-3">
                  {parsedData.headers.map((header) => (
                    <div key={header} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{header}</p>
                        <p className="text-xs text-gray-500">
                          Sample: {parsedData.rows[0]?.[parsedData.headers.indexOf(header)] || "—"}
                        </p>
                      </div>
                      <span className="text-gray-400">→</span>
                      <select
                        value={columnMapping[header] || "skip"}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [header]: e.target.value })}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        {systemFields.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.label}{field.required ? " *" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Validation Step */}
              {importStep === "validation" && (
                <>
                  {validationErrors.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-medium text-gray-900">All {parsedData.rows.length} records are valid!</h3>
                      <p className="text-sm text-gray-600 mt-1">Ready to import.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <AlertCircleIcon className="w-5 h-5 text-red-600" />
                        <span className="text-sm text-red-700">
                          Found {validationErrors.length} issues in {new Set(validationErrors.map(e => e.row)).size} rows
                        </span>
                      </div>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {validationErrors.slice(0, 10).map((error, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-gray-900">{error.row}</td>
                                <td className="px-4 py-2 text-gray-900">{error.column}</td>
                                <td className="px-4 py-2 text-gray-600 font-mono text-xs">{error.value}</td>
                                <td className="px-4 py-2 text-red-600">{error.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {validationErrors.length > 10 && (
                        <p className="text-sm text-gray-500 mt-2">+ {validationErrors.length - 10} more errors</p>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Importing Step */}
              {importStep === "importing" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-200" />
                      <circle
                        cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none"
                        className="text-primary-600"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - importProgress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
                      {importProgress}%
                    </span>
                  </div>
                  <p className="text-gray-600">Importing clients...</p>
                </div>
              )}

              {/* Complete Step */}
              {importStep === "complete" && importResult && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-4">Import complete!</h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xl font-semibold text-gray-900">{importResult.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xl font-semibold text-green-600">{importResult.success}</p>
                      <p className="text-xs text-gray-500">Imported</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-xl font-semibold text-red-600">{importResult.errors}</p>
                      <p className="text-xs text-gray-500">Errors</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xl font-semibold text-yellow-600">{importResult.duplicates}</p>
                      <p className="text-xs text-gray-500">Duplicates</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-between">
              {importStep === "preview" && (
                <>
                  <button onClick={closeImportModal} className="px-4 py-2 text-sm font-medium text-gray-700">
                    Cancel
                  </button>
                  <Button onClick={() => setImportStep("mapping")}>Continue to mapping</Button>
                </>
              )}
              {importStep === "mapping" && (
                <>
                  <button onClick={() => setImportStep("preview")} className="px-4 py-2 text-sm font-medium text-gray-700">
                    ← Back
                  </button>
                  <Button onClick={validateData}>Validate data</Button>
                </>
              )}
              {importStep === "validation" && (
                <>
                  <button onClick={() => setImportStep("mapping")} className="px-4 py-2 text-sm font-medium text-gray-700">
                    ← Back
                  </button>
                  <div className="flex gap-3">
                    {validationErrors.length > 0 && (
                      <Button variant="secondary" onClick={startImport}>
                        Skip errors & import
                      </Button>
                    )}
                    <Button onClick={startImport}>
                      {validationErrors.length === 0 ? "Start import" : `Import ${parsedData.rows.length - validationErrors.length} valid`}
                    </Button>
                  </div>
                </>
              )}
              {importStep === "complete" && (
                <>
                  <div />
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={closeImportModal}>
                      Import more
                    </Button>
                    <Link href="/dashboard/clients">
                      <Button>View clients</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
