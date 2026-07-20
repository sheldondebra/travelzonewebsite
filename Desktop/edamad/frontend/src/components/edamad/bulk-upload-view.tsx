"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  CloudUpload,
  Database,
  Download,
  ExternalLink,
  FileText,
  History,
  Image,
  Lightbulb,
  List,
  Shield,
  X,
} from "lucide-react";
import { toast as notify } from "sonner";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { Breadcrumbs } from "@/components/edamad/breadcrumbs";
import {
  MAX_UPLOAD_BYTES,
  downloadAkqTemplate,
  loadUploadHistory,
  saveUploadHistory,
  validateAkqFile,
  type AkqFile,
  type UploadRecord,
} from "@/lib/bulk-upload-data";
import { importAssessmentQuestions } from "@/services/admin-assessments";

function UploadHistoryModal({
  open,
  records,
  onClose,
}: {
  open: boolean;
  records: UploadRecord[];
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-[12px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E5EAF2] px-5 py-4">
          <h3 className="text-[17px] font-bold text-[#002B7F]">Upload History</h3>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-[#6B7280]" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {records.length === 0 ? (
            <p className="text-[13px] text-[#6B7280]">No uploads yet.</p>
          ) : (
            <ul className="space-y-3">
              {records.map((r) => (
                <li key={r.id} className="rounded-[10px] border border-[#E5EAF2] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold text-[#002B7F]">{r.fileName}</p>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        r.status === "Success"
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : r.status === "Failed"
                            ? "bg-[#FEE2E2] text-[#991B1B]"
                            : "bg-[#EBF2FF] text-[#0057FF]"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[#6B7280]">
                    {r.questionCount} questions · {r.uploadedAt}
                  </p>
                  {r.message && <p className="mt-1 text-[11px] text-[#9CA3AF]">{r.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[#002B7F]">Aikims Upload Guide</h3>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-[#6B7280]" />
          </button>
        </div>
        <div className="space-y-3 text-[13px] leading-relaxed text-[#374151]">
          <p>1. Download the Aikims template (.akq) and open it in a text editor.</p>
          <p>2. Each question must include question_text, options (A–D), and correct_answer.</p>
          <p>3. Optional explanation fields improve review quality after import.</p>
          <p>4. Save the file with the .akq extension and upload via drag-and-drop or Browse Files.</p>
          <p>5. Files are validated before import. Maximum size is 50MB.</p>
        </div>
        <button type="button" onClick={onClose} className="ed-btn-primary mt-5 w-full">
          Got it
        </button>
      </div>
    </div>
  );
}

export function BulkUploadView() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadUploadHistory());
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".akq")) {
      showToast("Only .akq files are supported.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast("File exceeds the 50MB limit.");
      return;
    }

    setUploading(true);
    setSelectedFile(file.name);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AkqFile;
      const validation = validateAkqFile(parsed);

      if (!validation.valid) {
        const failed: UploadRecord = {
          id: `up-${Date.now()}`,
          fileName: file.name,
          uploadedAt: new Date().toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          questionCount: 0,
          status: "Failed",
          message: validation.error,
        };
        const next = [failed, ...history];
        setHistory(next);
        saveUploadHistory(next);
        notify.error(validation.error ?? "Upload failed.");
        return;
      }

      const result = await importAssessmentQuestions(parsed);

      const record: UploadRecord = {
        id: `up-${Date.now()}`,
        fileName: file.name,
        uploadedAt: new Date().toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        questionCount: result.imported,
        status: "Success",
        message: result.message,
      };

      const next = [record, ...history];
      setHistory(next);
      saveUploadHistory(next);
      notify.success(result.message);
    } catch (error) {
      const record: UploadRecord = {
        id: `up-${Date.now()}`,
        fileName: file.name,
        uploadedAt: new Date().toLocaleString(),
        questionCount: 0,
        status: "Failed",
        message: getApiErrorMessage(error, "Invalid file format or import failed."),
      };
      const next = [record, ...history];
      setHistory(next);
      saveUploadHistory(next);
      notify.error(getApiErrorMessage(error, "Import failed."));
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-[10px] bg-[#002B7F] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <Breadcrumbs
        items={[
          { label: "Help & Support", href: "/support" },
          { label: "Bulk Question Upload" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">Bulk Question Upload</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Upload multiple questions at once using the Aikims format.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="ed-btn-outline gap-2 text-[13px]"
        >
          <History className="h-4 w-4" />
          View Upload History
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex min-h-[320px] flex-col items-center justify-center rounded-[12px] border-2 border-dashed bg-white p-10 transition-colors ${
            dragging ? "border-[#0057FF] bg-[#EBF2FF]/50" : "border-[#0057FF]"
          }`}
        >
          <CloudUpload className="h-16 w-16 text-[#0057FF]" strokeWidth={1.25} />
          <p className="mt-4 text-[15px] font-medium text-[#002B7F]">
            Drag & drop your Aikims file here or
          </p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="ed-btn-primary mt-4 px-8"
          >
            {uploading ? "Uploading..." : "Browse Files"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".akq"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void processFile(file);
              e.target.value = "";
            }}
          />
          {selectedFile && !uploading && (
            <p className="mt-3 text-[12px] font-medium text-[#0057FF]">Last file: {selectedFile}</p>
          )}
          <p className="mt-4 text-[12px] text-[#6B7280]">
            Supported format: <span className="font-medium">.akq</span>
          </p>
          <p className="text-[12px] text-[#6B7280]">Maximum file size: 50MB</p>
        </div>

        <div className="space-y-4">
          <div className="ed-card p-4">
            <h3 className="text-[14px] font-semibold text-[#002B7F]">Aikims Format</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-[#6B7280]">
              Your file must follow the Aikims question format (.akq) to ensure successful upload.
            </p>
            <button
              type="button"
              onClick={downloadAkqTemplate}
              className="ed-btn-outline mt-4 w-full gap-2 text-[13px]"
            >
              <Download className="h-4 w-4" />
              Download Aikims Template
            </button>
          </div>
          <div className="ed-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[#F59E0B]" />
              <h3 className="text-[14px] font-semibold text-[#002B7F]">Need Help?</h3>
            </div>
            <p className="text-[12px] leading-relaxed text-[#6B7280]">
              Learn how to format your questions correctly with our guide.
            </p>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="ed-btn-outline mt-4 w-full gap-2 text-[13px]"
            >
              <ExternalLink className="h-4 w-4" />
              View Upload Guide
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            icon: FileText,
            title: "File Format",
            desc: "Upload files in .akq format only.",
          },
          {
            icon: List,
            title: "Structure",
            desc: "Follow the Aikims question structure exactly.",
          },
          {
            icon: CheckCircle2,
            title: "Validation",
            desc: "All questions will be validated before import.",
          },
          {
            icon: Image,
            title: "Media Files",
            desc: "Images and media should be included in the .akq file.",
          },
          {
            icon: Database,
            title: "File Size",
            desc: "Maximum file size allowed is 50MB.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="ed-card p-4 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#EBF2FF]">
              <Icon className="h-5 w-5 text-[#0057FF]" strokeWidth={1.75} />
            </div>
            <p className="text-[13px] font-semibold text-[#002B7F]">{title}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#6B7280]">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-[12px] bg-[#EBF2FF] p-4">
        <Shield className="h-5 w-5 shrink-0 text-[#0057FF]" strokeWidth={1.75} />
        <div>
          <p className="text-[14px] font-semibold text-[#002B7F]">Before You Upload</p>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">
            Please ensure your file follows the Aikims format to avoid errors. Incorrect format may
            result in upload failure.
          </p>
        </div>
      </div>

      <UploadHistoryModal open={historyOpen} records={history} onClose={() => setHistoryOpen(false)} />
      <UploadGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}
