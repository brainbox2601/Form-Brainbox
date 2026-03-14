import { useState, useEffect } from “react”;

// ─── TELEGRAM CONFIG ──────────────────────────────────────────────────────────
const TELEGRAM_TOKEN = “8715967501:AAHUijzf69CwgoatHLjoIcVRP1lJcrGKbwk”;
const TELEGRAM_CHAT_ID = “8651111132”;

const sendToTelegram = async (formTitle, formFields, values) => {
const lines = [`📋 *New Response: ${formTitle}*`, `⏰ ${new Date().toLocaleString()}`, “”];
formFields.forEach(field => {
const val = values[field.id];
if (val !== undefined && val !== “” && val !== false) {
const display = field.type === “checkbox” ? (val ? “✅ Yes” : “❌ No”) : field.type === “rating” ? “⭐”.repeat(val) : String(val);
lines.push(`*${field.label}:*\n${display}`);
}
});
const text = lines.join(”\n”);
try {
await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: “Markdown” }),
});
} catch (e) { console.error(“Telegram error:”, e); }
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
if (!window._fc) window._fc = { forms: [], responses: {} };
const db = {
getForms: () => window._fc.forms,
saveForm: (form) => {
const idx = window._fc.forms.findIndex(f => f.id === form.id);
if (idx >= 0) window._fc.forms[idx] = form;
else window._fc.forms.unshift(form);
},
deleteForm: (id) => { window._fc.forms = window._fc.forms.filter(f => f.id !== id); },
getResponses: (formId) => window._fc.responses[formId] || [],
addResponse: (formId, resp) => {
if (!window._fc.responses[formId]) window._fc.responses[formId] = [];
window._fc.responses[formId].unshift(resp);
},
};

// ─── FIELD TYPES ──────────────────────────────────────────────────────────────
const FIELD_TYPES = [
{ type: “short_text”, label: “Short Text”, icon: “▤” },
{ type: “long_text”, label: “Long Text”, icon: “≡” },
{ type: “email”, label: “Email”, icon: “✉” },
{ type: “number”, label: “Number”, icon: “#” },
{ type: “phone”, label: “Phone”, icon: “☏” },
{ type: “dropdown”, label: “Dropdown”, icon: “▾” },
{ type: “multiple_choice”, label: “Multiple Choice”, icon: “◉” },
{ type: “checkbox”, label: “Checkbox”, icon: “☑” },
{ type: “date”, label: “Date”, icon: “📅” },
{ type: “rating”, label: “Rating”, icon: “★” },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const newField = (type) => ({
id: uid(), type,
label: FIELD_TYPES.find(f => f.type === type)?.label || “Field”,
placeholder: “”, required: false,
options: [“dropdown”, “multiple_choice”].includes(type) ? [“Option 1”, “Option 2”, “Option 3”] : undefined,
});
const newForm = () => ({ id: uid(), title: “Untitled Form”, description: “”, fields: [], accent: “#6C63FF”, createdAt: new Date().toISOString() });

const FontLoader = () => (

  <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
const [screen, setScreen] = useState(“dashboard”);
const [forms, setForms] = useState(() => db.getForms());
const [activeForm, setActiveForm] = useState(null);

const refresh = () => setForms([…db.getForms()]);
const createForm = () => { const f = newForm(); db.saveForm(f); setActiveForm({ …f }); setScreen(“builder”); refresh(); };
const openBuilder = (form) => { setActiveForm({ …form }); setScreen(“builder”); };
const openFill = (form) => { setActiveForm({ …form }); setScreen(“fill”); };
const openResponses = (form) => { setActiveForm({ …form }); setScreen(“responses”); };
const saveForm = (form) => { db.saveForm(form); setActiveForm(form); refresh(); };
const deleteForm = (id) => { db.deleteForm(id); refresh(); setScreen(“dashboard”); };

return (
<div style={{ fontFamily: “‘DM Sans’, sans-serif”, minHeight: “100vh”, background: “#f5f4ff” }}>
<FontLoader />
{screen === “dashboard” && <Dashboard forms={forms} onCreate={createForm} onEdit={openBuilder} onFill={openFill} onResponses={openResponses} onDelete={deleteForm} />}
{screen === “builder” && activeForm && <Builder form={activeForm} onSave={saveForm} onBack={() => setScreen(“dashboard”)} onFill={() => openFill(activeForm)} />}
{screen === “fill” && activeForm && <FillForm form={activeForm} onBack={() => setScreen(“dashboard”)} onSubmit={async (resp) => { db.addResponse(activeForm.id, resp); await sendToTelegram(activeForm.title, activeForm.fields, resp.values); }} />}
{screen === “responses” && activeForm && <Responses form={activeForm} responses={db.getResponses(activeForm.id)} onBack={() => setScreen(“dashboard”)} />}
</div>
);
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ forms, onCreate, onEdit, onFill, onResponses, onDelete }) {
return (
<div style={{ minHeight: “100vh”, background: “#f5f4ff” }}>
<nav style={{ background: “#fff”, borderBottom: “1px solid #ece9ff”, padding: “0 28px”, height: 60, display: “flex”, alignItems: “center”, justifyContent: “space-between”, position: “sticky”, top: 0, zIndex: 100, boxShadow: “0 2px 12px #6C63FF0a” }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 10 }}>
<div style={{ width: 34, height: 34, background: “linear-gradient(135deg,#6C63FF,#a78bfa)”, borderRadius: 9, display: “flex”, alignItems: “center”, justifyContent: “center”, color: “#fff”, fontWeight: 900, fontSize: 17, fontFamily: “Nunito” }}>B</div>
<span style={{ fontFamily: “Nunito”, fontWeight: 800, fontSize: 19, color: “#1a1a2e” }}>Brainbox Forms</span>
</div>
<div style={{ display: “flex”, alignItems: “center”, gap: 10 }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 6, background: “#f0fdf4”, border: “1px solid #bbf7d0”, borderRadius: 20, padding: “5px 12px” }}>
<div style={{ width: 7, height: 7, borderRadius: “50%”, background: “#22c55e” }} />
<span style={{ fontSize: 12, color: “#16a34a”, fontWeight: 600 }}>Telegram Connected</span>
</div>
<button onClick={onCreate} style={btnStyle(”#6C63FF”)}>+ New Form</button>
</div>
</nav>

```
  <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
    {forms.length === 0 ? (
      <div style={{ textAlign: "center", padding: "70px 20px 40px" }}>
        <div style={{ fontFamily: "Nunito", fontSize: 40, fontWeight: 900, color: "#6C63FF", lineHeight: 1.2, marginBottom: 8 }}>Online form builder</div>
        <div style={{ fontFamily: "Nunito", fontSize: 30, fontWeight: 800, color: "#1a1a2e", marginBottom: 20 }}>that gets more responses</div>
        <p style={{ color: "#888", fontSize: 15, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>Build engaging forms and get instant Telegram notifications every time someone submits.</p>
        <div style={{ background: "#fff", border: "1px solid #ece9ff", borderRadius: 16, padding: "20px 28px", maxWidth: 360, margin: "0 auto 32px", textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6C63FF", marginBottom: 10 }}>🤖 Telegram Bot Active</div>
          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>Responses from <strong>@Brainform_bot</strong> will be sent directly to your Telegram the moment someone submits a form.</div>
        </div>
        <button onClick={onCreate} style={{ ...btnStyle("#6C63FF"), fontSize: 15, padding: "13px 36px", borderRadius: 12 }}>Create Your First Form →</button>
      </div>
    ) : (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 22, color: "#1a1a2e", margin: 0 }}>My Forms</h2>
          <button onClick={onCreate} style={btnStyle("#6C63FF")}>+ New Form</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {forms.map(form => <FormCard key={form.id} form={form} onEdit={onEdit} onFill={onFill} onResponses={onResponses} onDelete={onDelete} />)}
        </div>
      </>
    )}
  </div>
</div>
```

);
}

function FormCard({ form, onEdit, onFill, onResponses, onDelete }) {
const [menu, setMenu] = useState(false);
const respCount = db.getResponses(form.id).length;
return (
<div style={{ background: “#fff”, borderRadius: 16, border: “1px solid #ece9ff”, overflow: “hidden”, boxShadow: “0 2px 12px #6C63FF0d”, transition: “box-shadow 0.2s” }}
onMouseEnter={e => e.currentTarget.style.boxShadow = “0 8px 30px #6C63FF22”}
onMouseLeave={e => e.currentTarget.style.boxShadow = “0 2px 12px #6C63FF0d”}>
<div style={{ height: 5, background: form.accent || “#6C63FF” }} />
<div style={{ padding: “20px 20px 16px” }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “flex-start” }}>
<div style={{ fontFamily: “Nunito”, fontWeight: 800, fontSize: 16, color: “#1a1a2e”, marginBottom: 6, flex: 1 }}>{form.title}</div>
<div style={{ position: “relative” }}>
<button onClick={() => setMenu(m => !m)} style={{ background: “none”, border: “none”, cursor: “pointer”, color: “#bbb”, fontSize: 20, padding: “0 4px”, lineHeight: 1 }}>⋯</button>
{menu && (
<div style={{ position: “absolute”, right: 0, top: 26, background: “#fff”, border: “1px solid #ece9ff”, borderRadius: 12, boxShadow: “0 8px 24px #0002”, zIndex: 10, minWidth: 150, overflow: “hidden” }}>
{[[“✏️ Edit”, () => onEdit(form)], [“▶️ Open Form”, () => onFill(form)], [“📥 Responses”, () => onResponses(form)], [“🗑️ Delete”, () => { onDelete(form.id); setMenu(false); }]].map(([label, fn]) => (
<button key={label} onClick={() => { fn(); setMenu(false); }}
style={{ display: “block”, width: “100%”, padding: “11px 16px”, background: “none”, border: “none”, textAlign: “left”, cursor: “pointer”, fontSize: 13, color: label.includes(“Delete”) ? “#ef4444” : “#333”, fontFamily: “inherit” }}
onMouseEnter={e => e.currentTarget.style.background = “#f5f4ff”}
onMouseLeave={e => e.currentTarget.style.background = “none”}>
{label}
</button>
))}
</div>
)}
</div>
</div>
<div style={{ fontSize: 12, color: “#aaa”, marginBottom: 16 }}>{form.fields.length} fields · {respCount} response{respCount !== 1 ? “s” : “”}</div>
<div style={{ display: “flex”, gap: 8 }}>
<button onClick={() => onFill(form)} style={{ …btnStyle(form.accent || “#6C63FF”), flex: 1, padding: “9px 12px”, fontSize: 13 }}>Open Form</button>
<button onClick={() => onEdit(form)} style={{ flex: 1, padding: “9px 12px”, fontSize: 13, background: “#f5f4ff”, border: “none”, borderRadius: 8, cursor: “pointer”, color: “#6C63FF”, fontWeight: 600, fontFamily: “inherit” }}>Edit</button>
</div>
</div>
</div>
);
}

// ─── BUILDER ──────────────────────────────────────────────────────────────────
function Builder({ form, onSave, onBack, onFill }) {
const [f, setF] = useState(form);
const [selected, setSelected] = useState(null);

const update = (updates) => { const updated = { …f, …updates }; setF(updated); onSave(updated); };
const updateField = (id, updates) => update({ fields: f.fields.map(fi => fi.id === id ? { …fi, …updates } : fi) });
const addField = (type) => { const field = newField(type); update({ fields: […f.fields, field] }); setSelected(field.id); };
const removeField = (id) => { update({ fields: f.fields.filter(fi => fi.id !== id) }); if (selected === id) setSelected(null); };
const sel = f.fields.find(fi => fi.id === selected);

return (
<div style={{ minHeight: “100vh”, background: “#f5f4ff”, display: “flex”, flexDirection: “column” }}>
<nav style={{ background: “#fff”, borderBottom: “1px solid #ece9ff”, padding: “0 20px”, height: 56, display: “flex”, alignItems: “center”, justifyContent: “space-between”, position: “sticky”, top: 0, zIndex: 100 }}>
<div style={{ display: “flex”, alignItems: “center”, gap: 12 }}>
<button onClick={onBack} style={{ background: “none”, border: “none”, cursor: “pointer”, color: “#888”, fontSize: 22 }}>←</button>
<input value={f.title} onChange={e => update({ title: e.target.value })}
style={{ border: “none”, outline: “none”, fontFamily: “Nunito”, fontWeight: 800, fontSize: 17, color: “#1a1a2e”, background: “transparent”, minWidth: 160 }} />
</div>
<div style={{ display: “flex”, gap: 8 }}>
<button onClick={onFill} style={{ …btnStyle(”#fff”), color: “#6C63FF”, border: “1.5px solid #6C63FF”, padding: “8px 18px” }}>Preview</button>
<button onClick={() => { onSave(f); onBack(); }} style={btnStyle(”#6C63FF”)}>Save & Close</button>
</div>
</nav>
<div style={{ display: “flex”, flex: 1 }}>
{/* Left */}
<div style={{ width: 210, background: “#fff”, borderRight: “1px solid #ece9ff”, padding: 16, overflowY: “auto”, flexShrink: 0 }}>
<div style={sideLabel}>Add Field</div>
{FIELD_TYPES.map(ft => (
<button key={ft.type} onClick={() => addField(ft.type)}
style={{ display: “flex”, alignItems: “center”, gap: 10, width: “100%”, padding: “10px 12px”, background: “none”, border: “1px solid #ece9ff”, borderRadius: 8, cursor: “pointer”, color: “#555”, fontSize: 13, fontFamily: “inherit”, marginBottom: 6, textAlign: “left”, transition: “all 0.15s” }}
onMouseEnter={e => { e.currentTarget.style.background = “#f5f4ff”; e.currentTarget.style.borderColor = “#a78bfa”; e.currentTarget.style.color = “#6C63FF”; }}
onMouseLeave={e => { e.currentTarget.style.background = “none”; e.currentTarget.style.borderColor = “#ece9ff”; e.currentTarget.style.color = “#555”; }}>
<span style={{ fontSize: 15 }}>{ft.icon}</span> {ft.label}
</button>
))}
<div style={{ marginTop: 20, borderTop: “1px solid #ece9ff”, paddingTop: 16 }}>
<div style={sideLabel}>Accent Color</div>
<input type=“color” value={f.accent} onChange={e => update({ accent: e.target.value })}
style={{ width: “100%”, height: 38, borderRadius: 8, border: “1px solid #ece9ff”, padding: 2, cursor: “pointer”, background: “none” }} />
</div>
</div>
{/* Center */}
<div style={{ flex: 1, overflowY: “auto”, padding: “28px 20px” }}>
<div style={{ maxWidth: 560, margin: “0 auto”, background: “#fff”, borderRadius: 20, border: “1px solid #ece9ff”, boxShadow: “0 4px 24px #6C63FF0d”, overflow: “hidden” }}>
<div style={{ height: 5, background: f.accent }} />
<div style={{ padding: “24px 28px 18px”, borderBottom: “1px solid #f0eeff” }}>
<input value={f.title} onChange={e => update({ title: e.target.value })}
style={{ border: “none”, outline: “none”, fontFamily: “Nunito”, fontWeight: 900, fontSize: 22, color: “#1a1a2e”, width: “100%”, marginBottom: 8, background: “transparent” }} placeholder=“Form title…” />
<input value={f.description} onChange={e => update({ description: e.target.value })}
style={{ border: “none”, outline: “none”, fontSize: 14, color: “#999”, width: “100%”, background: “transparent”, fontFamily: “inherit” }} placeholder=“Add a description…” />
</div>
<div style={{ padding: “18px 28px 28px” }}>
{f.fields.length === 0 && <div style={{ textAlign: “center”, padding: “36px 0”, color: “#ccc”, fontSize: 14 }}>← Add fields from the left panel</div>}
{f.fields.map(field => (
<div key={field.id} onClick={() => setSelected(field.id)}
style={{ padding: 14, borderRadius: 12, border: `2px solid ${selected === field.id ? f.accent : "#f0eeff"}`, marginBottom: 10, cursor: “pointer”, background: selected === field.id ? f.accent + “08” : “#fafafe”, transition: “border-color 0.15s” }}>
<div style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center” }}>
<div style={{ fontSize: 13, fontWeight: 600, color: “#333” }}>{field.label}{field.required && <span style={{ color: f.accent, marginLeft: 3 }}>*</span>}</div>
<button onClick={e => { e.stopPropagation(); removeField(field.id); }}
style={{ background: “none”, border: “none”, color: “#ddd”, cursor: “pointer”, fontSize: 16 }}
onMouseEnter={e => e.currentTarget.style.color = “#ef4444”}
onMouseLeave={e => e.currentTarget.style.color = “#ddd”}>✕</button>
</div>
<div style={{ fontSize: 11, color: “#bbb”, marginTop: 3 }}>{FIELD_TYPES.find(t => t.type === field.type)?.label}</div>
</div>
))}
</div>
</div>
</div>
{/* Right */}
<div style={{ width: 240, background: “#fff”, borderLeft: “1px solid #ece9ff”, padding: 20, overflowY: “auto”, flexShrink: 0 }}>
{sel ? (
<>
<div style={sideLabel}>Field Settings</div>
<PropInput label=“Label” value={sel.label} onChange={v => updateField(sel.id, { label: v })} />
{![“checkbox”, “dropdown”, “multiple_choice”, “rating”].includes(sel.type) && (
<PropInput label=“Placeholder” value={sel.placeholder || “”} onChange={v => updateField(sel.id, { placeholder: v })} />
)}
{[“dropdown”, “multiple_choice”].includes(sel.type) && (
<div style={{ marginBottom: 14 }}>
<label style={propLabelStyle}>Options (one per line)</label>
<textarea value={(sel.options || []).join(”\n”)} onChange={e => updateField(sel.id, { options: e.target.value.split(”\n”) })}
style={{ …inputStyle, minHeight: 90, resize: “vertical” }} />
</div>
)}
<div style={{ display: “flex”, alignItems: “center”, justifyContent: “space-between”, marginTop: 4 }}>
<label style={{ …propLabelStyle, margin: 0 }}>Required</label>
<Toggle on={sel.required} onToggle={() => updateField(sel.id, { required: !sel.required })} accent={f.accent} />
</div>
</>
) : (
<div style={{ color: “#ccc”, fontSize: 13, textAlign: “center”, paddingTop: 40 }}>Click a field to configure it</div>
)}
</div>
</div>
</div>
);
}

// ─── FILL FORM ────────────────────────────────────────────────────────────────
function FillForm({ form, onBack, onSubmit }) {
const [values, setValues] = useState({});
const [errors, setErrors] = useState({});
const [done, setDone] = useState(false);
const [sending, setSending] = useState(false);

const set = (id, val) => { setValues(v => ({ …v, [id]: val })); setErrors(e => ({ …e, [id]: null })); };

const submit = async () => {
const errs = {};
form.fields.forEach(f => { if (f.required && !values[f.id] && values[f.id] !== false) errs[f.id] = “Required”; });
if (Object.keys(errs).length) { setErrors(errs); return; }
setSending(true);
await onSubmit({ id: uid(), submittedAt: new Date().toISOString(), values });
setSending(false);
setDone(true);
};

if (done) return (
<div style={{ minHeight: “100vh”, background: “#f5f4ff”, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 24 }}>
<div style={{ textAlign: “center”, background: “#fff”, borderRadius: 24, padding: “48px 40px”, border: “1px solid #ece9ff”, maxWidth: 400, width: “100%”, boxShadow: “0 4px 30px #6C63FF0d” }}>
<div style={{ width: 64, height: 64, borderRadius: “50%”, background: “#f0fdf4”, display: “flex”, alignItems: “center”, justifyContent: “center”, margin: “0 auto 20px”, fontSize: 30 }}>✅</div>
<div style={{ fontFamily: “Nunito”, fontWeight: 900, fontSize: 24, color: “#1a1a2e”, marginBottom: 8 }}>Response Submitted!</div>
<p style={{ color: “#888”, fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>Your answers have been recorded.</p>
<div style={{ background: “#f0fdf4”, border: “1px solid #bbf7d0”, borderRadius: 10, padding: “10px 16px”, fontSize: 13, color: “#16a34a”, marginBottom: 24 }}>
📱 Notification sent to Telegram
</div>
<div style={{ display: “flex”, gap: 10, justifyContent: “center” }}>
<button onClick={() => { setValues({}); setDone(false); }} style={btnStyle(form.accent)}>Submit Another</button>
<button onClick={onBack} style={{ padding: “10px 20px”, background: “#f5f4ff”, border: “none”, borderRadius: 10, cursor: “pointer”, color: “#666”, fontWeight: 600, fontFamily: “inherit” }}>Dashboard</button>
</div>
</div>
</div>
);

return (
<div style={{ minHeight: “100vh”, background: “#f5f4ff”, display: “flex”, alignItems: “flex-start”, justifyContent: “center”, padding: “40px 24px” }}>
<div style={{ width: “100%”, maxWidth: 560 }}>
<button onClick={onBack} style={{ background: “none”, border: “none”, cursor: “pointer”, color: “#888”, fontSize: 14, marginBottom: 20, display: “flex”, alignItems: “center”, gap: 6, fontFamily: “inherit” }}>← Back</button>
<div style={{ background: “#fff”, borderRadius: 20, border: “1px solid #ece9ff”, overflow: “hidden”, boxShadow: “0 4px 30px #6C63FF0d” }}>
<div style={{ height: 5, background: form.accent }} />
<div style={{ padding: “28px 32px 20px”, borderBottom: “1px solid #f0eeff” }}>
<div style={{ fontFamily: “Nunito”, fontWeight: 900, fontSize: 24, color: “#1a1a2e”, marginBottom: 6 }}>{form.title}</div>
{form.description && <div style={{ fontSize: 14, color: “#888”, lineHeight: 1.6 }}>{form.description}</div>}
</div>
<div style={{ padding: “24px 32px 32px” }}>
{form.fields.length === 0 && <div style={{ color: “#ccc”, textAlign: “center”, padding: “20px 0”, fontSize: 14 }}>This form has no fields yet.</div>}
{form.fields.map(field => (
<div key={field.id} style={{ marginBottom: 22 }}>
<label style={{ display: “block”, fontSize: 14, fontWeight: 600, color: “#333”, marginBottom: 8 }}>
{field.label} {field.required && <span style={{ color: form.accent }}>*</span>}
</label>
<FieldInput field={field} value={values[field.id]} accent={form.accent} onChange={v => set(field.id, v)} />
{errors[field.id] && <div style={{ fontSize: 12, color: “#ef4444”, marginTop: 5 }}>This field is required</div>}
</div>
))}
{form.fields.length > 0 && (
<button onClick={submit} disabled={sending}
style={{ …btnStyle(form.accent), width: “100%”, padding: 14, fontSize: 15, borderRadius: 12, marginTop: 8, opacity: sending ? 0.7 : 1 }}>
{sending ? “Sending…” : “Submit →”}
</button>
)}
</div>
</div>
</div>
</div>
);
}

function FieldInput({ field, value, accent, onChange }) {
const base = { width: “100%”, border: “1.5px solid #e8e4ff”, borderRadius: 10, padding: “11px 14px”, fontSize: 14, fontFamily: “inherit”, outline: “none”, boxSizing: “border-box”, transition: “border-color 0.15s”, background: “#fafafe”, color: “#333” };
const onFocus = e => e.target.style.borderColor = accent;
const onBlur = e => e.target.style.borderColor = “#e8e4ff”;
if (field.type === “long_text”) return <textarea style={{ …base, minHeight: 100, resize: “vertical” }} placeholder={field.placeholder} value={value || “”} onChange={e => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur} />;
if (field.type === “dropdown”) return (
<select style={{ …base, cursor: “pointer” }} value={value || “”} onChange={e => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur}>
<option value="">Select…</option>
{(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
</select>
);
if (field.type === “multiple_choice”) return (
<div style={{ display: “flex”, flexDirection: “column”, gap: 10 }}>
{(field.options || []).map(o => (
<label key={o} style={{ display: “flex”, alignItems: “center”, gap: 10, cursor: “pointer”, fontSize: 14, color: “#444” }}>
<div style={{ width: 18, height: 18, borderRadius: “50%”, border: `2px solid ${value === o ? accent : "#d4d0f0"}`, background: value === o ? accent : “#fff”, flexShrink: 0, transition: “all 0.15s”, cursor: “pointer” }} onClick={() => onChange(o)} />
{o}
</label>
))}
</div>
);
if (field.type === “checkbox”) return (
<label style={{ display: “flex”, alignItems: “center”, gap: 10, cursor: “pointer” }}>
<div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${value ? accent : "#d4d0f0"}`, background: value ? accent : “#fff”, display: “flex”, alignItems: “center”, justifyContent: “center”, cursor: “pointer”, transition: “all 0.15s” }} onClick={() => onChange(!value)}>
{value && <span style={{ color: “#fff”, fontSize: 12, fontWeight: 700 }}>✓</span>}
</div>
<span style={{ fontSize: 14, color: “#555” }}>Yes</span>
</label>
);
if (field.type === “rating”) return (
<div style={{ display: “flex”, gap: 8 }}>
{[1, 2, 3, 4, 5].map(n => (
<button key={n} onClick={() => onChange(n)}
style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${(value || 0) >= n ? accent : "#e8e4ff"}`, background: (value || 0) >= n ? accent + “22” : “#fafafe”, cursor: “pointer”, fontSize: 20, transition: “all 0.15s” }}>★</button>
))}
</div>
);
return <input style={base} type={field.type === “phone” ? “tel” : field.type === “email” ? “email” : field.type === “number” ? “number” : field.type === “date” ? “date” : “text”} placeholder={field.placeholder} value={value || “”} onChange={e => onChange(e.target.value)} onFocus={onFocus} onBlur={onBlur} />;
}

// ─── RESPONSES ────────────────────────────────────────────────────────────────
function Responses({ form, responses, onBack }) {
return (
<div style={{ minHeight: “100vh”, background: “#f5f4ff” }}>
<nav style={{ background: “#fff”, borderBottom: “1px solid #ece9ff”, padding: “0 24px”, height: 56, display: “flex”, alignItems: “center”, gap: 16, position: “sticky”, top: 0, zIndex: 100 }}>
<button onClick={onBack} style={{ background: “none”, border: “none”, cursor: “pointer”, color: “#888”, fontSize: 22 }}>←</button>
<div style={{ fontFamily: “Nunito”, fontWeight: 800, fontSize: 17, color: “#1a1a2e” }}>{form.title} — Responses</div>
<div style={{ marginLeft: “auto”, background: form.accent + “22”, color: form.accent, borderRadius: 20, padding: “4px 14px”, fontSize: 12, fontWeight: 700 }}>{responses.length} total</div>
</nav>
<div style={{ maxWidth: 720, margin: “0 auto”, padding: “32px 24px” }}>
{responses.length === 0 ? (
<div style={{ textAlign: “center”, padding: “80px 20px” }}>
<div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
<div style={{ fontSize: 16, color: “#bbb” }}>No responses yet</div>
<div style={{ fontSize: 13, color: “#ccc”, marginTop: 6 }}>You’ll get a Telegram notification the moment someone submits</div>
</div>
) : responses.map((r, i) => (
<div key={r.id} style={{ background: “#fff”, borderRadius: 16, border: “1px solid #ece9ff”, padding: “20px 24px”, marginBottom: 12, boxShadow: “0 2px 10px #6C63FF08” }}>
<div style={{ fontSize: 11, color: “#bbb”, marginBottom: 14, letterSpacing: “0.06em” }}>#{responses.length - i} · {new Date(r.submittedAt).toLocaleString()}</div>
{form.fields.map(field => r.values[field.id] !== undefined && r.values[field.id] !== “” && (
<div key={field.id} style={{ marginBottom: 12 }}>
<div style={{ fontSize: 11, fontWeight: 700, color: “#bbb”, textTransform: “uppercase”, letterSpacing: “0.1em”, marginBottom: 3 }}>{field.label}</div>
<div style={{ fontSize: 14, color: “#444” }}>
{field.type === “checkbox” ? (r.values[field.id] ? “✅ Yes” : “❌ No”) : field.type === “rating” ? “⭐”.repeat(r.values[field.id]) : String(r.values[field.id])}
</div>
</div>
))}
</div>
))}
</div>
</div>
);
}

// ─── SHARED ───────────────────────────────────────────────────────────────────
const sideLabel = { fontSize: 11, fontWeight: 700, color: “#aaa”, letterSpacing: “0.12em”, marginBottom: 12, textTransform: “uppercase” };
const propLabelStyle = { display: “block”, fontSize: 11, fontWeight: 700, color: “#aaa”, letterSpacing: “0.1em”, textTransform: “uppercase”, marginBottom: 6 };
const inputStyle = { width: “100%”, background: “#fafafe”, border: “1.5px solid #e8e4ff”, borderRadius: 8, padding: “8px 10px”, fontSize: 13, fontFamily: “inherit”, outline: “none”, color: “#333”, boxSizing: “border-box” };

function PropInput({ label, value, onChange }) {
return (
<div style={{ marginBottom: 14 }}>
<label style={propLabelStyle}>{label}</label>
<input style={inputStyle} value={value} onChange={e => onChange(e.target.value)}
onFocus={e => e.target.style.borderColor = “#6C63FF”}
onBlur={e => e.target.style.borderColor = “#e8e4ff”} />
</div>
);
}

function Toggle({ on, onToggle, accent }) {
return (
<button onClick={onToggle} style={{ width: 40, height: 22, borderRadius: 11, background: on ? accent : “#e8e4ff”, border: “none”, cursor: “pointer”, position: “relative”, transition: “background 0.2s”, flexShrink: 0 }}>
<div style={{ position: “absolute”, top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: “50%”, background: “#fff”, transition: “left 0.2s”, boxShadow: “0 1px 4px #0002” }} />
</button>
);
}

function btnStyle(bg) {
return { background: bg, border: “none”, borderRadius: 10, padding: “10px 20px”, color: bg === “#fff” ? “#6C63FF” : “#fff”, fontWeight: 700, fontSize: 14, cursor: “pointer”, fontFamily: “inherit”, transition: “opacity 0.15s” };
}
