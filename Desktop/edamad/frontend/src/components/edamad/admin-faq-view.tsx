"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/auth-errors";
import {
  createAdminFaq,
  deleteAdminFaq,
  fetchAdminFaqs,
  updateAdminFaq,
  type AdminFaq,
  type AdminFaqPayload,
} from "@/services/admin-faqs";

const categories = [
  { value: "account", label: "Account" },
  { value: "courses", label: "Courses" },
  { value: "payments", label: "Payments" },
  { value: "certificates", label: "Certificates" },
  { value: "general", label: "General" },
] as const;

const emptyForm: AdminFaqPayload = {
  category: "general",
  question: "",
  answer: "",
  is_active: true,
  sort_order: 0,
};

export function AdminFaqView() {
  const [faqs, setFaqs] = useState<AdminFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminFaq | null>(null);
  const [form, setForm] = useState<AdminFaqPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchAdminFaqs({ search: search || undefined, category: categoryFilter })
      .then(setFaqs)
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Unable to load FAQs."));
        setFaqs([]);
      })
      .finally(() => setLoading(false));
  }, [search, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: faqs.length + 1 });
    setModalOpen(true);
  }

  function openEdit(faq: AdminFaq) {
    setEditing(faq);
    setForm({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer are required.");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const res = await updateAdminFaq(editing.id, form);
        toast.success(res.message);
      } else {
        const res = await createAdminFaq(form);
        toast.success(res.message);
      }
      setModalOpen(false);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save FAQ."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(faq: AdminFaq) {
    if (!window.confirm(`Delete FAQ "${faq.question}"?`)) return;
    try {
      const res = await deleteAdminFaq(faq.id);
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete FAQ."));
    }
  }

  async function toggleActive(faq: AdminFaq) {
    try {
      const res = await updateAdminFaq(faq.id, { is_active: !faq.is_active });
      toast.success(res.message);
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update FAQ."));
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#002B7F]">FAQ Management</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Manage FAQs shown on the student support page.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/support" className="ed-btn-outline text-[13px]">
            Preview Support Page
          </Link>
          <button type="button" onClick={openCreate} className="ed-btn-primary gap-2 text-[13px]">
            <Plus className="h-4 w-4" />
            Add FAQ
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="ed-input w-full pl-9"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <select className="ed-input w-auto min-w-[140px]" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={load} className="ed-btn-outline text-[13px]">
          Search
        </button>
      </div>

      {loading ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">Loading FAQs...</div>
      ) : faqs.length === 0 ? (
        <div className="ed-card p-8 text-center text-[#6B7280]">No FAQs found.</div>
      ) : (
        <div className="ed-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-[13px]">
              <thead>
                <tr className="border-b border-[#E5EAF2] bg-[#F7F9FC] text-left text-[#6B7280]">
                  <th className="px-5 py-3 font-medium">Question</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq) => (
                  <tr key={faq.id} className="border-b border-[#E5EAF2] last:border-0 hover:bg-[#F7F9FC]/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#002B7F]">{faq.question}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-[#9CA3AF]">{faq.answer}</p>
                    </td>
                    <td className="px-3 py-3 capitalize text-[#374151]">{faq.category}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${faq.is_active ? "bg-[#DCFCE7] text-[#166534]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                        {faq.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-0.5">
                        <button type="button" onClick={() => openEdit(faq)} className="rounded-lg p-2 text-[#0057FF] hover:bg-[#EBF2FF]" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => void toggleActive(faq)} className="rounded-lg p-2 text-[#D97706] hover:bg-[#FFFBEB]" title="Toggle visibility">
                          {faq.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button type="button" onClick={() => void handleDelete(faq)} className="rounded-lg p-2 text-[#DC2626] hover:bg-[#FEF2F2]" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[12px] bg-white shadow-xl">
            <div className="border-b border-[#E5EAF2] px-5 py-4">
              <h2 className="text-[17px] font-bold text-[#002B7F]">{editing ? "Edit FAQ" : "Add FAQ"}</h2>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Category</label>
                <select className="ed-input w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AdminFaqPayload["category"] }))}>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Question</label>
                <input className="ed-input w-full" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-semibold text-[#002B7F]">Answer</label>
                <textarea className="ed-input min-h-[120px] w-full resize-y py-2" value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="h-4 w-4 rounded" />
                <span className="text-[13px] text-[#374151]">Visible on support page</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#E5EAF2] px-5 py-4">
              <button type="button" onClick={() => setModalOpen(false)} className="ed-btn-outline text-[13px]" disabled={submitting}>Cancel</button>
              <button type="button" onClick={() => void handleSubmit()} className="ed-btn-primary text-[13px]" disabled={submitting}>{submitting ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
