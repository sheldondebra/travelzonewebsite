"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Headphones,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  articlesForCategory,
  filterSupportContent,
  popularTopics,
  supportArticles,
  supportCategories,
  supportFaqs as fallbackFaqs,
  type SupportArticle,
  type SupportCategoryId,
  type SupportFaq,
} from "@/lib/support-data";
import {
  createSupportTicket,
  fetchSupportTickets,
  formatTicketDate,
  ticketStatusStyle,
  type SupportTicket,
} from "@/services/support-tickets";
import { fetchPublicFaqs } from "@/services/admin-faqs";
import { getApiErrorMessage } from "@/lib/auth-errors";
import { toast as notify } from "sonner";

function ArticlesModal({
  open,
  title,
  articles,
  onClose,
}: {
  open: boolean;
  title: string;
  articles: SupportArticle[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<SupportArticle | null>(null);

  useEffect(() => {
    if (open) setSelected(articles[0] ?? null);
  }, [open, articles]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[12px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E5EAF2] px-5 py-4">
          <h3 className="text-[17px] font-bold text-[#002B7F]">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#002B7F]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 md:grid-cols-[200px_1fr]">
          <ul className="overflow-y-auto border-b border-[#E5EAF2] p-2 md:border-b-0 md:border-r">
            {articles.map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => setSelected(article)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-[12px] ${
                    selected?.id === article.id
                      ? "bg-[#EBF2FF] font-medium text-[#0057FF]"
                      : "text-[#374151] hover:bg-[#F7F9FC]"
                  }`}
                >
                  {article.title}
                </button>
              </li>
            ))}
          </ul>
          <div className="overflow-y-auto p-5">
            {selected ? (
              <>
                <h4 className="text-[15px] font-semibold text-[#002B7F]">{selected.title}</h4>
                <p className="mt-3 text-[13px] leading-relaxed text-[#374151]">{selected.body}</p>
              </>
            ) : (
              <p className="text-[13px] text-[#6B7280]">No articles in this category.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (subject: string, message: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setSubject("");
      setMessage("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[#002B7F]">Contact Support</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(subject, message);
          }}
        >
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#374151]">Subject</label>
            <input
              className="ed-input w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#374151]">Message</label>
            <textarea
              className="min-h-[120px] w-full rounded-[10px] border border-[#E5EAF2] px-3 py-2 text-sm focus:border-[#0057FF] focus:outline-none focus:ring-2 focus:ring-[#0057FF]/20"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="ed-btn-primary w-full">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateTicketModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (subject: string, description: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setSubject("");
      setDescription("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[#002B7F]">Create New Ticket</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate(subject, description);
          }}
        >
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#374151]">Issue subject</label>
            <input
              className="ed-input w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#374151]">Description</label>
            <textarea
              className="min-h-[120px] w-full rounded-[10px] border border-[#E5EAF2] px-3 py-2 text-sm focus:border-[#0057FF] focus:outline-none focus:ring-2 focus:ring-[#0057FF]/20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="ed-btn-primary w-full gap-2">
            <Plus className="h-4 w-4" />
            Submit Ticket
          </button>
        </form>
      </div>
    </div>
  );
}

function LiveChatModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ from: "user" | "agent"; text: string }[]>([
    { from: "agent", text: "Hi! How can we help you today?" },
  ]);
  const [draft, setDraft] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/20 p-4 sm:items-center sm:justify-center">
      <div className="flex h-[420px] w-full max-w-sm flex-col overflow-hidden rounded-[12px] bg-white shadow-xl">
        <div className="flex items-center justify-between bg-[#0057FF] px-4 py-3 text-white">
          <p className="text-[14px] font-semibold">Live Chat Support</p>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] ${
                m.from === "user" ? "ml-auto bg-[#0057FF] text-white" : "bg-[#F7F9FC] text-[#374151]"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <form
          className="flex gap-2 border-t border-[#E5EAF2] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            setMessages((prev) => [
              ...prev,
              { from: "user", text: draft },
              {
                from: "agent",
                text: "Thanks for your message. A support agent will respond shortly during business hours (Mon–Fri, 9 AM–6 PM EST).",
              },
            ]);
            setDraft("");
          }}
        >
          <input
            className="ed-input flex-1"
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="ed-btn-primary px-3">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const categoryIcons = {
  account: UserCog,
  courses: BookOpen,
  payments: CreditCard,
  certificates: Award,
};

export function SupportPageView() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ articles: SupportArticle[]; faqs: SupportFaq[] } | null>(
    null,
  );
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<SupportFaq[]>(fallbackFaqs);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [articlesModal, setArticlesModal] = useState<{ title: string; articles: SupportArticle[] } | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setTicketsLoading(true);
    fetchSupportTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false));

    fetchPublicFaqs()
      .then((items) => {
        if (items.length > 0) {
          setFaqs(items as SupportFaq[]);
          setExpandedFaq(items[0]?.id ?? null);
        }
      })
      .catch(() => {
        setFaqs(fallbackFaqs);
        setExpandedFaq(fallbackFaqs[0]?.id ?? null);
      });
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const results = filterSupportContent(query);
    setSearchResults(results);
    if (query.trim() && results.articles.length === 0 && results.faqs.length === 0) {
      showToast("No results found. Try different keywords or contact support.");
    }
  }

  function openCategory(category: SupportCategoryId) {
    const cat = supportCategories.find((c) => c.id === category);
    setArticlesModal({
      title: cat?.title ?? "Help Articles",
      articles: articlesForCategory(category),
    });
  }

  async function createTicket(subject: string, description: string) {
    try {
      const res = await createSupportTicket({
        subject,
        message: description,
        category: "general",
      });
      setTickets((prev) => [res.ticket, ...prev]);
      setTicketOpen(false);
      showToast(res.message);
    } catch (error) {
      notify.error(getApiErrorMessage(error, "Failed to submit ticket. Please try again."));
    }
  }

  function handleContactSubmit(subject: string, message: string) {
    createTicket(subject, message);
    setContactOpen(false);
  }

  const visibleFaqs = showAllFaqs ? faqs : faqs.slice(0, 3);
  const visibleTickets = showAllTickets ? tickets : tickets.slice(0, 1);

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-[10px] bg-[#002B7F] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#002B7F]">Help & Support</h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          We&apos;re here to help you with any questions or issues.
        </p>
      </div>

      {/* Hero search */}
      <div className="ed-card mb-6 overflow-hidden bg-[#EBF2FF] p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center justify-center lg:w-28">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0057FF]/10">
              <Headphones className="h-12 w-12 text-[#0057FF]" strokeWidth={1.5} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-bold text-[#002B7F]">How can we help you?</h2>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              Search our knowledge base for answers or contact our support team.
            </p>
            <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={runSearch}>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  className="ed-input w-full pl-9"
                  placeholder="Search for help articles..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value.trim()) setSearchResults(null);
                  }}
                />
              </div>
              <button type="submit" className="ed-btn-primary shrink-0 px-6">
                Search
              </button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
              <span className="text-[#6B7280]">Popular topics:</span>
              {popularTopics.map((topic) => (
                <button
                  key={topic.category}
                  type="button"
                  onClick={() => openCategory(topic.category)}
                  className="font-medium text-[#0057FF] hover:underline"
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>
          <div className="shrink-0 border-[#E5EAF2] lg:border-l lg:pl-6">
            <p className="text-[13px] font-semibold text-[#002B7F]">Need immediate help?</p>
            <p className="mt-1 max-w-[200px] text-[12px] text-[#6B7280]">
              Our team typically responds within 24 hours.
            </p>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="ed-btn-outline mt-3 gap-2 text-[13px]"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </button>
          </div>
        </div>

        {searchResults && (
          <div className="mt-5 rounded-[10px] border border-[#E5EAF2] bg-white p-4">
            <p className="mb-3 text-[13px] font-semibold text-[#002B7F]">
              Search results for &quot;{query}&quot;
            </p>
            {searchResults.articles.length === 0 && searchResults.faqs.length === 0 ? (
              <p className="text-[13px] text-[#6B7280]">No matches found.</p>
            ) : (
              <ul className="space-y-2">
                {searchResults.articles.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setArticlesModal({ title: a.title, articles: [a] })}
                      className="text-left text-[13px] text-[#0057FF] hover:underline"
                    >
                      {a.title}
                    </button>
                  </li>
                ))}
                {searchResults.faqs.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchResults(null);
                        setExpandedFaq(f.id);
                        document.getElementById("popular-questions")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="text-left text-[13px] text-[#0057FF] hover:underline"
                    >
                      {f.question}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Quick help cards */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {supportCategories.map((cat) => {
              const Icon = categoryIcons[cat.id];
              return (
                <div key={cat.id} className="ed-card p-4">
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: cat.iconBg, color: cat.accent }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="text-[14px] font-semibold text-[#002B7F]">{cat.title}</p>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#6B7280]">
                    {cat.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => openCategory(cat.id)}
                    className="mt-3 flex items-center gap-0.5 text-[12px] font-medium text-[#0057FF] hover:underline"
                  >
                    View Articles
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* FAQs */}
          <div id="popular-questions" className="ed-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#002B7F]">Popular Questions</h3>
              <button
                type="button"
                onClick={() => setShowAllFaqs((v) => !v)}
                className="text-[12px] font-medium text-[#0057FF] hover:underline"
              >
                {showAllFaqs ? "Show Less" : "View All FAQs"}
                <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" />
              </button>
            </div>
            <ul>
              {visibleFaqs.map((faq) => {
                const open = expandedFaq === faq.id;
                return (
                  <li key={faq.id} className="border-b border-[#E5EAF2] last:border-0">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(open ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                    >
                      <span className="text-[13px] font-medium text-[#374151]">{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#6B7280] transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {open && (
                      <p className="pb-4 text-[13px] leading-relaxed text-[#6B7280]">{faq.answer}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {/* Contact us */}
          <div className="ed-card p-5">
            <h3 className="mb-4 text-[15px] font-semibold text-[#002B7F]">Contact Us</h3>
            <ul className="space-y-1">
              {[
                {
                  icon: Mail,
                  title: "Email Support",
                  detail: "support@edamad.com",
                  sub: "Replies within 24 hours",
                  href: "mailto:support@edamad.com",
                },
                {
                  icon: MessageCircle,
                  title: "Live Chat",
                  detail: "Mon – Fri, 9:00 AM – 6:00 PM (EST)",
                  action: () => setChatOpen(true),
                },
                {
                  icon: Phone,
                  title: "Phone Support",
                  detail: "+1 (555) 123-4567",
                  sub: "Mon – Fri, 9:00 AM – 6:00 PM (EST)",
                  href: "tel:+15551234567",
                },
                {
                  icon: Users,
                  title: "Community Forum",
                  detail: "Ask questions and learn from other students",
                  action: () =>
                    showToast("Community forum opens soon. Use Live Chat or email for now."),
                },
              ].map((item) => {
                const Icon = item.icon;
                const inner = (
                  <>
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#0057FF]" strokeWidth={1.75} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#002B7F]">{item.title}</p>
                      <p className="text-[12px] text-[#374151]">{item.detail}</p>
                      {item.sub && <p className="text-[11px] text-[#9CA3AF]">{item.sub}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                  </>
                );
                return (
                  <li key={item.title}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="flex items-start gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-[#F7F9FC]"
                      >
                        {inner}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={item.action}
                        className="flex w-full items-start gap-3 rounded-lg px-1 py-3 text-left transition-colors hover:bg-[#F7F9FC]"
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Tickets */}
          <div className="ed-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#002B7F]">My Support Tickets</h3>
              <button
                type="button"
                onClick={() => setShowAllTickets((v) => !v)}
                className="text-[12px] font-medium text-[#0057FF] hover:underline"
              >
                {showAllTickets ? "Show Less" : "View All Tickets"}
                <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" />
              </button>
            </div>
            <ul className="space-y-3">
              {ticketsLoading ? (
                <li className="text-[13px] text-[#6B7280]">Loading your tickets...</li>
              ) : visibleTickets.length === 0 ? (
                <li className="text-[13px] text-[#6B7280]">No tickets yet. Create one if you need help.</li>
              ) : (
                visibleTickets.map((ticket) => (
                  <li key={ticket.id} className="rounded-[10px] border border-[#E5EAF2] p-3.5">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ticketStatusStyle(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <p className="mt-2 text-[13px] font-semibold text-[#002B7F]">{ticket.subject}</p>
                    <p className="mt-1 text-[11px] text-[#9CA3AF]">{ticket.number}</p>
                    {ticket.message ? (
                      <p className="mt-2 line-clamp-2 text-[12px] text-[#6B7280]">{ticket.message}</p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-[#6B7280]">
                      Created {formatTicketDate(ticket.created_at)} · Updated {formatTicketDate(ticket.updated_at)}
                    </p>
                  </li>
                ))
              )}
            </ul>
            <button
              type="button"
              onClick={() => setTicketOpen(true)}
              className="ed-btn-outline mt-4 w-full gap-2 text-[13px]"
            >
              <Plus className="h-4 w-4" />
              Create New Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Footer banner */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-[#FEF9C3] px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDE047]/50 text-[#854D0E]">
            <HelpCircle className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#002B7F]">Need more help?</p>
            <p className="mt-0.5 text-[13px] text-[#6B7280]">
              Can&apos;t find what you&apos;re looking for? Our support team is ready to assist you.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className="ed-btn-outline shrink-0 gap-2 bg-white text-[13px]"
        >
          <Headphones className="h-4 w-4" />
          Contact Support
        </button>
      </div>

      <ArticlesModal
        open={!!articlesModal}
        title={articlesModal?.title ?? ""}
        articles={articlesModal?.articles ?? []}
        onClose={() => setArticlesModal(null)}
      />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} onSubmit={handleContactSubmit} />
      <CreateTicketModal open={ticketOpen} onClose={() => setTicketOpen(false)} onCreate={createTicket} />
      <LiveChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
