"use client";

import { useState, useCallback, useMemo } from "react";
import Papa from "papaparse";
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

export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; email: string; error: string }[];
}

interface ColumnMapping {
  [csvColumn: string]: string; // csvColumn -> our field key
}

interface DataImportUploaderProps {
  platform: string;
  description: string;
  templateUrl: string;
  fields: ImportField[];
  onImport: (data: Record<string, string>[]) => Promise<ImportResult | void>;
  platformSelector?: React.ReactNode;
}

// Fuzzy match CSV headers to our field keys
function autoMapColumns(csvHeaders: string[], fields: ImportField[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalizedFields = fields.map((f) => ({
    ...f,
    normalized: f.key.toLowerCase().replace(/_/g, " "),
    labelNormalized: f.label.toLowerCase().replace(/_/g, " "),
  }));

  for (const header of csvHeaders) {
    const normalized = header.toLowerCase().replace(/[_-]/g, " ").trim();

    const exactKey = normalizedFields.find(
      (f) => f.key.toLowerCase() === normalized.replace(/ /g, "_")
    );
    if (exactKey) { mapping[header] = exactKey.key; continue; }

    const exactLabel = normalizedFields.find(
      (f) => f.labelNormalized === normalized
    );
    if (exactLabel) { mapping[header] = exactLabel.key; continue; }

    const partial = normalizedFields.find(
      (f) =>
        normalized.includes(f.normalized) ||
        f.normalized.includes(normalized) ||
        normalized.includes(f.labelNormalized) ||
        f.labelNormalized.includes(normalized)
    );
    if (partial) { mapping[header] = partial.key; continue; }

    const aliases: Record<string, string[]> = {
      email: ["e mail", "email address", "correo", "e-mail"],
      first_name: ["nome", "nombre", "first", "given name", "primeiro nome"],
      last_name: ["sobrenome", "apellido", "last", "surname", "family name", "ultimo nome"],
      client_name: ["name", "full name", "nome completo", "nombre completo", "client"],
      phone: ["tel", "telephone", "celular", "mobile", "whatsapp", "telefone", "telefono"],
      birth_date: ["birthday", "dob", "date of birth", "nascimento", "data nascimento", "fecha nacimiento"],
      gender: ["sex", "sexo", "genero"],
      address_line1: ["address", "endereco", "direccion", "street"],
      postal_code: ["zip", "zip code", "zipcode", "cep", "codigo postal"],
      class_title: ["class", "class name", "aula", "clase", "activity"],
      date: ["booking date", "data", "fecha"],
      time: ["booking time", "hora", "horario"],
      instructor: ["teacher", "professor", "profesor", "trainer"],
      status: ["booking status", "estado", "situacao"],
      external_id: ["id", "booking id", "reservation id", "codigo"],
      tax_id: ["cpf", "cnpj", "tax", "document", "documento"],
      city: ["cidade", "ciudad"],
      state: ["estado", "provincia", "uf"],
      country: ["pais", "country code"],
      member_status: ["status", "membership status", "client status", "active status", "situacao", "estado do membro"],
      pricing_option: ["pricing option", "plan", "plan type", "membership", "membership type", "package", "plan name", "tipo plano", "plano", "pacote"],
      payment_amount: ["payment amount", "amount", "price", "monthly price", "rate", "valor", "preco", "mensalidade"],
      join_date: ["join date", "joined", "start date", "signup date", "registration date", "created", "data cadastro", "data inicio"],
      next_autopay_date: ["next autopay date", "next payment", "next billing", "autopay date", "next charge", "proxima cobranca"],
      remaining_classes: ["remaining classes", "classes remaining", "classes left", "credits", "remaining", "aulas restantes", "creditos"],
    };

    const aliasMatch = Object.entries(aliases).find(([, aliasList]) =>
      aliasList.some((alias) => normalized === alias || normalized.includes(alias))
    );
    if (aliasMatch && normalizedFields.some((f) => f.key === aliasMatch[0])) {
      mapping[header] = aliasMatch[0];
    }
  }

  return mapping;
}

function validateMappedData(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  fields: ImportField[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  const reverseMapping: Record<string, string> = {};
  for (const [csv, field] of Object.entries(mapping)) {
    reverseMapping[field] = csv;
  }

  for (let i = 0; i < rows.length; i++) {
    for (const field of fields) {
      const csvCol = reverseMapping[field.key];
      const value = csvCol ? rows[i][csvCol]?.trim() : "";

      if (field.required && !value) {
        errors.push({ row: i + 1, field: field.label, message: `${field.label} is required` });
      }

      if (value) {
        if (field.type === "email" && !value.includes("@")) {
          errors.push({ row: i + 1, field: field.label, message: "Invalid email format" });
        }
        if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          errors.push({ row: i + 1, field: field.label, message: "Use YYYY-MM-DD format" });
        }
        if (field.type === "time" && !/^\d{2}:\d{2}$/.test(value)) {
          errors.push({ row: i + 1, field: field.label, message: "Use HH:MM format" });
        }
      }
    }
  }

  return errors;
}

export function DataImportUploader({
  platform,
  description,
  templateUrl,
  fields,
  onImport,
  platformSelector,
}: DataImportUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  interface ParsedData {
    headers: string[];
    rows: Record<string, string>[];
  }

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

  const handleFile = (newFile: File) => {
    if (!newFile.name.endsWith(".csv")) {
      setImportError("Please upload a CSV file");
      return;
    }
    setFile(newFile);
    setImportError(null);
    setImportResult(null);
    parseCSV(newFile);
  };

  const parseCSV = (csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });

      if (result.data.length === 0) {
        setImportError("File is empty");
        return;
      }

      const headers = result.meta.fields || [];
      const rows = result.data;
      setParsedData({ headers, rows });
      const autoMapping = autoMapColumns(headers, fields);
      setColumnMapping(autoMapping);
    };
    reader.readAsText(csvFile);
  };

  const mappedFieldKeys = useMemo(
    () => new Set(Object.values(columnMapping)),
    [columnMapping]
  );

  const requiredFieldsMapped = useMemo(() => {
    const requiredKeys = fields.filter((f) => f.required).map((f) => f.key);
    return requiredKeys.every((key) => mappedFieldKeys.has(key));
  }, [fields, mappedFieldKeys]);

  const validationErrors = useMemo(() => {
    if (!parsedData) return [];
    return validateMappedData(parsedData.rows, columnMapping, fields);
  }, [parsedData, columnMapping, fields]);

  const handleMappingChange = (csvColumn: string, fieldKey: string) => {
    setColumnMapping((prev) => {
      const updated = { ...prev };
      if (fieldKey === "") {
        delete updated[csvColumn];
      } else {
        for (const key in updated) {
          if (updated[key] === fieldKey) delete updated[key];
        }
        updated[csvColumn] = fieldKey;
      }
      return updated;
    });
  };

  const handleImport = async () => {
    if (!parsedData || validationErrors.length > 0) return;

    const transformedData = parsedData.rows.map((row) => {
      const mapped: Record<string, string> = {};
      for (const [csvCol, fieldKey] of Object.entries(columnMapping)) {
        mapped[fieldKey] = row[csvCol] || "";
      }
      return mapped;
    });

    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const result = await onImport(transformedData);
      if (result) setImportResult(result);
    } catch (error) {
      console.error("Import error:", error);
      const message = error instanceof Error ? error.message : "Import failed. Please try again.";
      setImportError(message);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setImportError(null);
    setFile(null);
    setParsedData(null);
    setColumnMapping({});
    setImportResult(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Determine current step for the progress bar
  const currentStep = !file ? 1 : !importResult ? 2 : 3;

  // Success state
  if (importResult) {
    const { success: imported, failed: skipped, errors: skippedErrors } = importResult;

    return (
      <div className="w-full">
        {/* Progress bar */}
        <ProgressBar current={4} steps={["Import Leads", "Map Fields", "Review", "Done"]} />

        <div className="max-w-lg mx-auto py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircleIcon className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import Complete!</h2>
          <p className="text-sm text-gray-600 mb-1">
            {imported} record{imported !== 1 ? "s" : ""} imported from {platform}
          </p>
          {skipped > 0 && (
            <p className="text-sm text-amber-600 mb-1">
              {skipped} skipped (already exist)
            </p>
          )}
          {skippedErrors.length > 0 && (
            <div className="mt-4 mb-4 text-left max-h-40 overflow-y-auto bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-800 mb-2">Skipped records:</p>
              {skippedErrors.map((err, i) => (
                <p key={i} className="text-xs text-amber-700">
                  Row {err.row}: {err.email} — {err.error}
                </p>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={reset}
              className="px-5 py-2.5 text-sm text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 font-medium transition-colors"
            >
              Import More
            </button>
            <a
              href="/admin/clients"
              className="px-5 py-2.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
            >
              View Clients
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress bar */}
      <ProgressBar
        current={currentStep}
        steps={["Import Leads", "Map Fields", "Review"]}
      />

      {/* Section 1: CSV File */}
      <SectionHeader number={1} title="CSV File" />
      <div className="mb-8">
        {!file ? (
          <>
            {/* Value proposition */}
            <div className="mb-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Save hours of manual data entry</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {description} We&apos;ll auto-detect your columns and map them for you.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive
                  ? "border-primary-500 bg-primary-50 scale-[1.01]"
                  : "border-gray-300 bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/30"
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
                <div className="w-14 h-14 mx-auto mb-3 bg-primary-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">Drop your CSV file here</h3>
                <p className="text-sm text-gray-500">
                  or <span className="text-primary-600 font-medium">click to browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">Any CSV file works — we&apos;ll help you map the columns</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Don&apos;t have a CSV?{" "}
                <a href={templateUrl} download className="text-primary-600 hover:text-primary-700 font-medium">
                  Download our template
                </a>
              </p>
              <p className="text-xs text-gray-400">Supported: .csv files up to 10MB</p>
            </div>
          </>
        ) : (
          /* File uploaded — show file info */
          <div className="border border-gray-200 rounded-xl p-4 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} · {parsedData?.rows.length ?? 0} records
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
              <label className="text-xs text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer">
                Reupload
                <input type="file" accept=".csv" onChange={handleChange} className="hidden" />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Platform (optional) */}
      {platformSelector && (
        <>
          <SectionHeader number={2} title="Source Platform" subtitle="Optional" />
          <div className="mb-8">{platformSelector}</div>
        </>
      )}

      {/* Section 3: Map Fields */}
      {parsedData && (
        <>
          <SectionHeader
            number={platformSelector ? 3 : 2}
            title="Map Fields"
            subtitle={`Map CSV columns to the variables you want to add on the import`}
          />
          <div className="mb-8">
            {/* Auto-match summary */}
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Auto-matched {Object.keys(columnMapping).length} of {parsedData.headers.length} columns
            </div>

            {/* Unmapped required fields warning */}
            {fields.filter((f) => f.required && !mappedFieldKeys.has(f.key)).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2.5">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Required fields not mapped: {fields.filter((f) => f.required && !mappedFieldKeys.has(f.key)).map((f) => f.label).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Two-column mapping table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              {/* Table header */}
              <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50">
                <div className="px-5 py-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CSV Column</span>
                </div>
                <div className="px-5 py-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">FlexiWell Field</span>
                </div>
              </div>

              {/* Mapping rows */}
              {parsedData.headers.map((header, index) => {
                const mappedTo = columnMapping[header] || "";
                return (
                  <div
                    key={header}
                    className={`grid grid-cols-2 items-center ${
                      index < parsedData.headers.length - 1 ? "border-b border-gray-100" : ""
                    } ${mappedTo ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <div className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-900">{header}</span>
                    </div>
                    <div className="px-5 py-3.5 flex items-center gap-2">
                      <select
                        value={mappedTo}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        className={`w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          mappedTo
                            ? "border-primary-300 bg-white text-gray-900 font-medium"
                            : "border-gray-200 text-gray-400"
                        }`}
                      >
                        <option value="">— Skip —</option>
                        {fields.map((f) => {
                          const alreadyMapped = mappedFieldKeys.has(f.key) && columnMapping[header] !== f.key;
                          return (
                            <option key={f.key} value={f.key} disabled={alreadyMapped}>
                              {f.label} {f.required ? "*" : ""} {alreadyMapped ? "(mapped)" : ""}
                            </option>
                          );
                        })}
                      </select>
                      {mappedTo && (
                        <button
                          onClick={() => handleMappingChange(header, "")}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors flex-shrink-0"
                          title="Clear mapping"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">
                    {validationErrors.length} validation error{validationErrors.length > 1 ? "s" : ""}
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto mt-2">
                    {validationErrors.slice(0, 8).map((error, index) => (
                      <div key={index} className="text-xs text-red-800 bg-red-100 rounded px-2.5 py-1.5">
                        <span className="font-semibold">Row {error.row}:</span> {error.field} — {error.message}
                      </div>
                    ))}
                    {validationErrors.length > 8 && (
                      <p className="text-xs text-red-600 font-medium">+{validationErrors.length - 8} more</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import error */}
          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-800 flex-1">{importError}</p>
              <button onClick={() => setImportError(null)} className="text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Import button — bottom right like SmartLeads */}
          <div className="flex items-center justify-end">
            <button
              onClick={handleImport}
              disabled={!requiredFieldsMapped || validationErrors.length > 0 || importing}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {importing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" strokeOpacity="0.25" fill="none" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" stroke="currentColor" strokeLinecap="round" fill="none" />
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  Import {parsedData.rows.length} Records
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Numbered section header like SmartLeads
function SectionHeader({ number, title, subtitle }: { number: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// Progress bar at top like SmartLeads
function ProgressBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;

        return (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isDone
                    ? "bg-primary-600 text-white"
                    : isActive
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  isDone || isActive ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isDone ? "bg-primary-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
