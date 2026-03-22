"use client";

import { useState, useCallback, useMemo } from "react";
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
}

interface ColumnMapping {
  [csvColumn: string]: string; // csvColumn -> our field key
}

interface DataImportUploaderProps {
  platform: string;
  description: string;
  templateUrl: string;
  fields: ImportField[];
  onImport: (data: Record<string, string>[]) => Promise<void>;
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

    // Exact key match
    const exactKey = normalizedFields.find(
      (f) => f.key.toLowerCase() === normalized.replace(/ /g, "_")
    );
    if (exactKey) {
      mapping[header] = exactKey.key;
      continue;
    }

    // Exact label match
    const exactLabel = normalizedFields.find(
      (f) => f.labelNormalized === normalized
    );
    if (exactLabel) {
      mapping[header] = exactLabel.key;
      continue;
    }

    // Partial match (header contains field name or vice versa)
    const partial = normalizedFields.find(
      (f) =>
        normalized.includes(f.normalized) ||
        f.normalized.includes(normalized) ||
        normalized.includes(f.labelNormalized) ||
        f.labelNormalized.includes(normalized)
    );
    if (partial) {
      mapping[header] = partial.key;
      continue;
    }

    // Common aliases
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
        errors.push({
          row: i + 1,
          field: field.label,
          message: `${field.label} is required`,
        });
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
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<"upload" | "map" | "preview" | "success">("upload");

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

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
      const rows: Record<string, string>[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Handle quoted CSV values
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map((v) =>
          v.trim().replace(/^"|"$/g, "")
        ) || lines[i].split(",").map((v) => v.trim());

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        rows.push(row);
      }

      setParsedData({ headers, rows });

      // Auto-map columns
      const autoMapping = autoMapColumns(headers, fields);
      setColumnMapping(autoMapping);
      setStep("map");
    };
    reader.readAsText(file);
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
    if (!parsedData || step !== "preview") return [];
    return validateMappedData(parsedData.rows, columnMapping, fields);
  }, [parsedData, columnMapping, fields, step]);

  const handleMappingChange = (csvColumn: string, fieldKey: string) => {
    setColumnMapping((prev) => {
      const updated = { ...prev };
      if (fieldKey === "") {
        delete updated[csvColumn];
      } else {
        // Remove any existing mapping to this field
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

    // Transform data using mapping
    const transformedData = parsedData.rows.map((row) => {
      const mapped: Record<string, string> = {};
      for (const [csvCol, fieldKey] of Object.entries(columnMapping)) {
        mapped[fieldKey] = row[csvCol] || "";
      }
      return mapped;
    });

    setImporting(true);
    try {
      await onImport(transformedData);
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
    setColumnMapping({});
    setStep("upload");
  };

  const stepNumber = step === "upload" ? 1 : step === "map" ? 2 : step === "preview" ? 3 : 4;

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      {[
        { num: 1, label: "Upload" },
        { num: 2, label: "Map Columns" },
        { num: 3, label: "Review" },
      ].map((s, i) => (
        <div key={s.num} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              stepNumber >= s.num
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {stepNumber > s.num ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              s.num
            )}
          </div>
          <span
            className={`text-sm font-medium ${
              stepNumber >= s.num ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {s.label}
          </span>
          {i < 2 && <div className={`w-12 h-0.5 mx-1 ${stepNumber > s.num ? "bg-primary-600" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );

  // Step 1: Upload
  if (step === "upload") {
    return (
      <div className="w-full">
        {platformSelector && <div className="mb-6">{platformSelector}</div>}

        <StepIndicator />

        {/* Value proposition */}
        <div className="mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Save hours of manual data entry
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {description} We&apos;ll auto-detect your columns and map them for you.
              </p>
            </div>
          </div>
        </div>

        {/* Upload Area - Full width, prominent */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all ${
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
            <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Drop your CSV file here
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              or <span className="text-primary-600 font-medium">click to browse</span>
            </p>
            <p className="text-xs text-gray-400">
              Any CSV file works — we&apos;ll help you map the columns
            </p>
          </div>
        </div>

        {/* Quick help */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Don&apos;t have a CSV?{" "}
            <a href={templateUrl} download className="text-primary-600 hover:text-primary-700 font-medium">
              Download our template
            </a>
          </p>
          <p className="text-xs text-gray-400">
            Supported: .csv files up to 10MB
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Column Mapping
  if (step === "map" && parsedData) {
    const unmappedRequired = fields
      .filter((f) => f.required && !mappedFieldKeys.has(f.key));

    return (
      <div className="w-full">
        <StepIndicator />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Map Your Columns</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              We auto-matched {Object.keys(columnMapping).length} of {parsedData.headers.length} columns.
              Adjust any that don&apos;t look right.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{file?.name}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{parsedData.rows.length} rows</span>
          </div>
        </div>

        {/* Unmapped required fields warning */}
        {unmappedRequired.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">
                {unmappedRequired.length} required field{unmappedRequired.length > 1 ? "s" : ""} not mapped yet
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {unmappedRequired.map((f) => f.label).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Mapping table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-[1fr,auto,1fr,1fr] gap-0 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
            <div className="px-4 py-3">Your CSV Column</div>
            <div className="px-2 py-3"></div>
            <div className="px-4 py-3">Maps To</div>
            <div className="px-4 py-3">Sample Data</div>
          </div>

          {parsedData.headers.map((header) => {
            const mappedTo = columnMapping[header] || "";
            const sampleValues = parsedData.rows
              .slice(0, 3)
              .map((r) => r[header])
              .filter(Boolean);

            return (
              <div
                key={header}
                className="grid grid-cols-[1fr,auto,1fr,1fr] gap-0 items-center border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50"
              >
                <div className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{header}</span>
                </div>
                <div className="px-2 py-3">
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <div className="px-4 py-3">
                  <select
                    value={mappedTo}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                    className={`w-full text-sm px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      mappedTo
                        ? "border-primary-200 bg-primary-50/50 text-primary-800"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    <option value="">— Skip this column —</option>
                    {fields.map((f) => {
                      const alreadyMapped = mappedFieldKeys.has(f.key) && columnMapping[header] !== f.key;
                      return (
                        <option key={f.key} value={f.key} disabled={alreadyMapped}>
                          {f.label} {f.required ? "*" : ""} {alreadyMapped ? "(mapped)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {sampleValues.map((v, i) => (
                      <span key={i} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[140px]">
                        {v}
                      </span>
                    ))}
                    {sampleValues.length === 0 && (
                      <span className="text-xs text-gray-300 italic">empty</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Choose Different File
          </button>
          <button
            onClick={() => setStep("preview")}
            disabled={!requiredFieldsMapped}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            Continue to Review
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Preview
  if (step === "preview" && parsedData) {
    const hasErrors = validationErrors.length > 0;
    const errorsByRow = validationErrors.reduce((acc, error) => {
      if (!acc[error.row]) acc[error.row] = [];
      acc[error.row].push(error);
      return acc;
    }, {} as Record<number, ValidationError[]>);

    // Build preview using mapped columns
    const mappedHeaders = Object.entries(columnMapping)
      .map(([csv, fieldKey]) => ({
        csv,
        fieldKey,
        label: fields.find((f) => f.key === fieldKey)?.label || fieldKey,
      }));

    return (
      <div className="w-full">
        <StepIndicator />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Review & Import</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {parsedData.rows.length} records ready from {file?.name}
            </p>
          </div>
          <button
            onClick={() => setStep("map")}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to Mapping
          </button>
        </div>

        {/* Validation Summary */}
        {hasErrors ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">
                  {validationErrors.length} validation error{validationErrors.length > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-red-700 mt-1 mb-3">
                  Fix the issues below, or go back and adjust the column mapping.
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {validationErrors.slice(0, 8).map((error, index) => (
                    <div key={index} className="text-xs text-red-800 bg-red-100 rounded px-2.5 py-1.5">
                      <span className="font-semibold">Row {error.row}:</span> {error.field} — {error.message}
                    </div>
                  ))}
                  {validationErrors.length > 8 && (
                    <p className="text-xs text-red-600 font-medium">
                      +{validationErrors.length - 8} more errors
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-900">All validations passed</p>
                <p className="text-xs text-green-700">
                  Your data looks good. Review below and click Import.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Preview */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/50">
            <p className="text-sm font-medium text-gray-700">
              Preview — first {Math.min(10, parsedData.rows.length)} of {parsedData.rows.length} rows
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-4 font-semibold text-gray-500 text-xs border-b">#</th>
                  {mappedHeaders.map((h) => (
                    <th key={h.fieldKey} className="text-left py-2 px-4 font-semibold text-gray-500 text-xs border-b">
                      {h.label}
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
                      className={rowErrors ? "bg-red-50" : index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                    >
                      <td className="py-2 px-4 border-b text-gray-400 text-xs">{index + 1}</td>
                      {mappedHeaders.map((h) => {
                        const hasError = rowErrors?.some((e) => e.field === h.label);
                        return (
                          <td
                            key={h.fieldKey}
                            className={`py-2 px-4 border-b text-sm ${hasError ? "text-red-600 font-medium" : "text-gray-900"}`}
                          >
                            {row[h.csv] || <span className="text-gray-300">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={hasErrors || importing}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Success
  if (step === "success" && parsedData) {
    return (
      <div className="w-full max-w-lg mx-auto py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircleIcon className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import Complete!</h2>
          <p className="text-sm text-gray-600 mb-8">
            {parsedData.rows.length} records imported from {platform}
          </p>
          <div className="flex items-center justify-center gap-3">
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

  return null;
}
