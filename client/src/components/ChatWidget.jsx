import React, { useEffect, useRef, useState } from "react";
import api from "../api"; // ✅ axios instance

const SUPPORT_PHONE = "9121991113";
const BOT_AVATAR = "/logo.png";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");
  const [context, setContext] = useState(null);
  const [ticketDraft, setTicketDraft] = useState({
    userName: "",
    mobile: "",
    orderId: "",
    issue: "",
  });
  const [online, setOnline] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [tickets, setTickets] = useState([]); // ✅ show created tickets
  const listRef = useRef(null);

  /* ----------------- Effects ----------------- */
  useEffect(() => {
    if (open && messages.length === 0) initialBotGreeting();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, tickets]);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  /* ----------------- Helpers ----------------- */
  function pushUser(text) {
    setMessages((m) => [...m, { from: "user", text, ts: Date.now() }]);
  }

  async function pushBot(text, delay = 450) {
    setIsTyping(true);
    await wait(delay);
    setIsTyping(false);
    setMessages((m) => [...m, { from: "bot", text, ts: Date.now() }]);
  }

  function pushBotActions(actions = [], flow = null) {
    setMessages((m) => [
      ...m,
      { from: "bot-actions", actions, flow, ts: Date.now() },
    ]);
  }

  function pushBotInput(placeholder, step) {
    setMessages((m) => [
      ...m,
      { from: "bot-input", placeholder, step, ts: Date.now() },
    ]);
  }

  async function initialBotGreeting() {
    await pushBot("👋 Hi! I'm Saka Support.");
    await pushBot("I can help you with:");
    await pushBotActions(
      [
        "🧺 Services",
        "📦 Pickup / Order status",
        "⚠️ Problem",
        "💬 Chat with Support Team",
      ],
      "main"
    );
  }

  /* ----------------- Action Handler ----------------- */
  async function handleAction(action, flow) {
    pushUser(action);

    if (flow === "main") {
      if (action.includes("Services")) {
        await pushBot("✨ Our services:");
        await wait(200);
        await pushBot("🧺 Wash & Fold — fresh & folded.");
        await pushBot("👕 Wash & Iron — ready-to-wear.");
        await pushBot("👗 Dry Clean — delicate care.");
        pushBotActions(["📞 Call Us", "📝 Raise Ticket"], "services");
      } else if (action.includes("Pickup")) {
        await pushBot("📦 Enter your Booking Order ID:");
        setContext({ flow: "pickup", step: "await_order_id" });
      } else if (action.includes("Problem")) {
        await pushBot("😟 Sorry to hear that. Please describe your issue:");
        setContext({ flow: "problem", step: "await_description" });
      } else if (action.includes("Chat with Support")) {
        await startSupportChat();
      }
    } else if (flow === "services") {
      if (action.includes("Call")) {
        window.open(`tel:${SUPPORT_PHONE}`);
        await pushBot(`📞 Dialing ${SUPPORT_PHONE}...`);
      } else {
        await startTicketFlow();
      }
    } else if (flow === "problem-confirm") {
      if (action.toLowerCase().includes("yes")) await startTicketFlow();
      else
        await pushBot(
          "👍 Okay — if you need anything else, message me anytime."
        );
    }
  }

  /* ----------------- Support Chat ----------------- */
  const agentNames = ["Varun", "Eshwar", "Surya", "Amar", "Irfan", "Teja", "Amit", "Santosh"];

  async function startSupportChat() {
    const randomName = agentNames[Math.floor(Math.random() * agentNames.length)];
    await showAgentTyping(randomName);
    await pushBot(`Hi, I'm ${randomName} from Saka Laundry. How can I help you?`);
    setContext({ flow: "support", step: "await_problem", agent: randomName });
  }

  async function showAgentTyping(agentName) {
    setMessages((m) => [...m, { from: "agent-typing", agent: agentName, ts: Date.now() }]);
    await wait(1500);
    setMessages((m) => m.filter((msg) => msg.from !== "agent-typing"));
  }

  /* ----------------- Send Text ----------------- */
  async function onSendText(raw) {
    const text = (raw || "").trim();
    if (!text) return;
    pushUser(text);
    setInput("");

    if (context?.flow === "support" && context.step === "await_problem") {
      await showAgentTyping(context.agent);
      await pushBot("Okay, I noted your problem.");
      await showAgentTyping(context.agent);
      await pushBot("🙏 Please raise a ticket so our team can call you and help further.");
      pushBotActions(["Yes, Raise Ticket", "No"], "problem-confirm");
      setContext(null);
      return;
    }

    if (context?.flow === "ticket") {
      if (context.step === "ask_name") {
        setTicketDraft((d) => ({ ...d, userName: text }));
        await pushBot(`Thanks ${text}! 📛 Now enter your mobile number:`);
        pushBotInput("Enter mobile number", "ask_mobile");
        setContext({ flow: "ticket", step: "ask_mobile" });
        return;
      }
      if (context.step === "ask_mobile") {
        setTicketDraft((d) => ({ ...d, mobile: text }));
        await pushBot("Got it! 📦 Please provide your Order ID (or type 'None'):");
        pushBotInput("Enter Order ID", "ask_order");
        setContext({ flow: "ticket", step: "ask_order" });
        return;
      }
      if (context.step === "ask_order") {
        setTicketDraft((d) => ({ ...d, orderId: text === "None" ? "" : text }));
        await pushBot("Lastly, please describe your issue ✍️:");
        pushBotInput("Describe your issue", "ask_issue");
        setContext({ flow: "ticket", step: "ask_issue" });
        return;
      }
      if (context.step === "ask_issue") {
        const finalTicket = { ...ticketDraft, issue: text };

        try {
          const res = await api.post("/api/tickets", finalTicket);
          await pushBot("✅ Ticket created successfully! Our team will reach out soon.");
          setTickets((t) => [res.data, ...t]);
        } catch (err) {
          console.error("Ticket save failed:", err);
          await pushBot("⚠️ Sorry, there was an error saving your ticket. Please try again.");
        }

        setTicketDraft({ userName: "", mobile: "", orderId: "", issue: "" });
        setContext(null);
        return;
      }
    }

    await pushBot("🤖 You can pick an option below:");
    pushBotActions(
      ["🧺 Services", "📦 Pickup / Order status", "⚠️ Problem", "💬 Chat with Support Team"],
      "main"
    );
  }

  async function startTicketFlow() {
    setTicketDraft({ userName: "", mobile: "", orderId: "", issue: "" });
    await pushBot("📝 Let's raise a ticket. What's your full name?");
    pushBotInput("Enter your name", "ask_name");
    setContext({ flow: "ticket", step: "ask_name" });
  }

  /* ----------------- Render ----------------- */
  function renderMessage(m, idx) {
    if (m.from === "bot-actions") {
      return (
        <div key={idx} className="cw-msg bot-actions">
          {m.actions.map((a, i) => (
            <button key={i} className="cw-action" onClick={() => handleAction(a, m.flow)}>
              {a}
            </button>
          ))}
        </div>
      );
    }

    if (m.from === "bot-input") {
      return (
        <div key={idx} className="cw-msg cw-bot">
          <img src={BOT_AVATAR} alt="Bot" className="cw-avatar" />
          <input
            className="cw-input-bubble"
            placeholder={m.placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSendText(e.target.value);
              }
            }}
          />
        </div>
      );
    }

    if (m.from === "agent-typing") {
      return (
        <div key={idx} className="cw-agent-typing">
          <span className="typing-label">{m.agent} is typing</span>
          <span className="t-dot" />
          <span className="t-dot" />
          <span className="t-dot" />
        </div>
      );
    }

    const isUser = m.from === "user";
    return (
      <div key={idx} className={`cw-msg ${isUser ? "cw-user" : "cw-bot"}`}>
        {!isUser && <img src={BOT_AVATAR} alt="Bot" className="cw-avatar" />}
        <div className="cw-bubble">{m.text}</div>
      </div>
    );
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendText(input);
    }
  }

  return (
    <>
      <div className="cw-root">
        {open && (
          <div className="cw-panel">
            <div className="cw-header">
              <div className="cw-left">
                <img src={BOT_AVATAR} alt="Saka" className="cw-avatar-big" />
                <div className="cw-meta">
                  <div className="cw-title">Saka Support</div>
                  <div className="cw-status">
                    <span className={`cw-dot ${online ? "online" : "offline"}`} />
                    {online ? "Online" : "Leave a message"}
                  </div>
                </div>
              </div>
              <button className="cw-close" onClick={() => setOpen(false)}>✖</button>
            </div>

            <div className="cw-body">
              {messages.map((m, i) => renderMessage(m, i))}
              {isTyping && (
                <div className="cw-msg cw-bot">
                  <img src={BOT_AVATAR} alt="Bot" className="cw-avatar" />
                  <div className="cw-bubble cw-typing">
                    <span className="t-dot" />
                    <span className="t-dot" />
                    <span className="t-dot" />
                  </div>
                </div>
              )}

              {tickets.length > 0 && (
                <div className="cw-ticket-list">
                  <h4>📑 Your Tickets</h4>
                  {tickets.map((t) => (
                    <div key={t._id} className="cw-ticket">
                      <div><strong>ID:</strong> {t._id}</div>
                      <div><strong>Issue:</strong> {t.issue}</div>
                      <div><strong>Status:</strong> {t.status}</div>
                    </div>
                  ))}
                </div>
              )}

              <div ref={listRef} />
            </div>

            <form className="cw-input" onSubmit={(e) => { e.preventDefault(); onSendText(input); }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="cw-textarea"
              />
              <button type="submit" className="cw-send">➤</button>
            </form>
          </div>
        )}

        {!open && (
          <div className="cw-mini-wrap" onClick={() => setOpen(true)}>
            {showTooltip && <div className="cw-tooltip">Need help? 👋</div>}
            <div className="cw-mini-icon pulse">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                <path d="M2 3h20v14H6l-4 4V3z" />
              </svg>
            </div>
            <div className="cw-mini-label">Customer Support</div>
          </div>
        )}
      </div>

      {/* === Styles === */}
      <style>{`
        .cw-root { position: fixed; left: 16px; bottom: 16px; z-index: 99999; font-family: Inter, system-ui; }
        .cw-panel { width: 340px; max-width: calc(100vw - 32px); min-height: 360px; max-height: 520px;
          display:flex; flex-direction:column; border-radius:14px; overflow:hidden;
          background:#fff; box-shadow:0 18px 40px rgba(12,20,44,0.2); }
        .cw-header { padding:10px 14px; background:#fff; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; }
        .cw-left { display:flex; gap:8px; align-items:center; }
        .cw-avatar-big { width:40px; height:40px; border-radius:50%; object-fit:cover; }
        .cw-meta { line-height:1.2; }
        .cw-title { font-weight:600; }
        .cw-status { font-size:12px; color:#555; display:flex; align-items:center; gap:6px; }
        .cw-dot { width:8px; height:8px; border-radius:50%; }
        .cw-dot.online { background:#34d399; }
        .cw-dot.offline { background:#ccc; }
        .cw-close { background:none; border:none; cursor:pointer; font-size:16px; }
        .cw-body { flex:1; padding:12px; overflow-y:auto; background:#f9fafb; display:flex; flex-direction:column; gap:8px; }
        .cw-msg { display:flex; align-items:flex-end; gap:6px; }
        .cw-user { justify-content:flex-end; }
        .cw-bot { justify-content:flex-start; }
        .cw-avatar { width:26px; height:26px; border-radius:50%; }
        .cw-bubble { padding:8px 12px; border-radius:12px; max-width:70%; font-size:14px; }
        .cw-user .cw-bubble { background:linear-gradient(90deg,#6d28d9,#7c3aed); color:white; border-bottom-right-radius:4px; }
        .cw-bot .cw-bubble { background:white; border:1px solid #eee; color:#111; border-bottom-left-radius:4px; }
        .cw-input-bubble { border:1px solid #ccc; padding:6px 10px; border-radius:10px; font-size:13px; outline:none; width:200px; }
        .bot-actions { display:flex; gap:6px; flex-wrap:wrap; }
        .cw-action { border:1px solid #ddd; background:white; padding:6px 10px; border-radius:999px; font-size:13px; cursor:pointer; }
        .cw-input { padding:8px; border-top:1px solid #eee; display:flex; gap:6px; }
        .cw-textarea { flex:1; resize:none; padding:8px 10px; border:1px solid #ddd; border-radius:10px; font-size:14px; }
        .cw-send { background:linear-gradient(90deg,#6d28d9,#7c3aed); color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; }
        .cw-mini-wrap { display:flex; gap:8px; align-items:center; cursor:pointer; position:relative; }
        .cw-mini-icon { width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,#7c3aed,#6366f1); display:flex; align-items:center; justify-content:center; position:relative; }
        .cw-mini-label { background:white; padding:8px 10px; border-radius:8px; font-weight:600; font-size:13px; box-shadow:0 4px 10px rgba(0,0,0,0.1); }
        .pulse::after { content:""; position:absolute; top:0; left:0; width:100%; height:100%; border-radius:50%; background:rgba(124,58,237,0.4); animation:pulse 1.6s infinite; }
        @keyframes pulse { from { transform:scale(1); opacity:0.8; } to { transform:scale(1.6); opacity:0; } }
        .cw-agent-typing { align-self:center; background:rgba(0,0,0,0.65); color:#fff;
          padding:6px 10px; border-radius:12px; font-size:12px; display:flex; align-items:center; gap:6px; }
        .typing-label { font-size:12px; color:#eee; }
        .cw-typing { display:flex; gap:4px; align-items:center; }
                .t-dot { width:6px; height:6px; border-radius:50%; background:#999; animation:blink 1.4s infinite; }
        .t-dot:nth-child(2) { animation-delay:0.2s; }
        .t-dot:nth-child(3) { animation-delay:0.4s; }
        @keyframes blink { 0%,80%,100% { opacity:0.2; } 40% { opacity:1; } }

        /* === Ticket list styles === */
        .cw-ticket-list { background:#fff; border:1px solid #eee; border-radius:10px; padding:10px; font-size:13px; margin-top:10px; }
        .cw-ticket-list h4 { margin:0 0 6px; font-size:14px; font-weight:600; }
        .cw-ticket { border-top:1px solid #f3f3f3; padding:6px 0; }
        .cw-ticket:first-child { border-top:none; }
        .cw-ticket strong { color:#111; }
      `}</style>
    </>
  );
}
