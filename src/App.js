import { useState, useEffect } from "react";

const SUPABASE_URL = "https://hoeizcwpmyftklutbbed.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZWl6Y3dwbXlmdGtsdXRiYmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDU0MTIsImV4cCI6MjA4OTY4MTQxMn0.KHgkPnRSKU9qpLSnE1d6GL-Hr1sKCNzEmeiJfknr55c";

const HEADERS = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" };

const db = {
  getForms: async () => {
    const r = await fetch(SUPABASE_URL + "/rest/v1/forms?select=*&order=created_at.desc", { headers: HEADERS });
    return r.json();
  },
  saveForm: async (form) => {
    await fetch(SUPABASE_URL + "/rest/v1/forms", {
      method: "POST",
      headers: Object.assign({}, HEADERS, { Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify({ id: form.id, title: form.title, description: form.description, fields: form.fields, accent: form.accent, created_at: form.created_at })
    });
  },
  updateForm: async (form) => {
    await fetch(SUPABASE_URL + "/rest/v1/forms?id=eq." + form.id, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify({ title: form.title, description: form.description, fields: form.fields, accent: form.accent })
    });
  },
  deleteForm: async (id) => {
    await fetch(SUPABASE_URL + "/rest/v1/responses?form_id=eq." + id, { method: "DELETE", headers: HEADERS });
    await fetch(SUPABASE_URL + "/rest/v1/forms?id=eq." + id, { method: "DELETE", headers: HEADERS });
  },
  getResponses: async (formId) => {
    const r = await fetch(SUPABASE_URL + "/rest/v1/responses?form_id=eq." + formId + "&order=submitted_at.desc", { headers: HEADERS });
    return r.json();
  },
  addResponse: async (formId, values) => {
    await fetch(SUPABASE_URL + "/rest/v1/responses", {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ id: uid(), form_id: formId, values: values, submitted_at: new Date().toISOString() })
    });
  }
};

const FIELD_TYPES = [
  { type: "short_text", label: "Short Text" },
  { type: "long_text", label: "Long Text" },
  { type: "email", label: "Email" },
  { type: "number", label: "Number" },
  { type: "phone", label: "Phone" },
  { type: "dropdown", label: "Dropdown" },
  { type: "multiple_choice", label: "Multiple Choice" },
  { type: "checkbox", label: "Checkbox" },
  { type: "date", label: "Date" },
  { type: "rating", label: "Rating" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

function newField(type) {
  return {
    id: uid(), type: type,
    label: (FIELD_TYPES.find(function(f) { return f.type === type; }) || {}).label || "Field",
    placeholder: "", required: false,
    options: (type === "dropdown" || type === "multiple_choice") ? ["Option 1", "Option 2", "Option 3"] : undefined
  };
}

function newForm() {
  return { id: uid(), title: "Untitled Form", description: "", fields: [], accent: "#6C63FF", created_at: new Date().toISOString() };
}

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const [forms, setForms] = useState([]);
  const [activeForm, setActiveForm] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadForms() {
    setLoading(true);
    const data = await db.getForms();
    setForms(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(function() { loadForms(); }, []);

  async function createForm() {
    const f = newForm();
    await db.saveForm(f);
    setActiveForm(f);
    setScreen("builder");
    loadForms();
  }

  async function handleSave(form) {
    await db.updateForm(form);
    setActiveForm(form);
    loadForms();
  }

  async function handleDelete(id) {
    await db.deleteForm(id);
    loadForms();
    setScreen("dashboard");
  }

  async function handleSubmit(formId, values) {
    await db.addResponse(formId, values);
  }

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", minHeight: "100vh", background: "#f5f4ff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      {screen === "dashboard" && (
        <Dashboard
          forms={forms} loading={loading} onCreate={createForm}
          onEdit={function(f) { setActiveForm(f); setScreen("builder"); }}
          onFill={function(f) { setActiveForm(f); setScreen("fill"); }}
          onResponses={function(f) { setActiveForm(f); setScreen("responses"); }}
          onDelete={handleDelete}
        />
      )}
      {screen === "builder" && activeForm && (
        <Builder form={activeForm} onSave={handleSave}
          onBack={function() { loadForms(); setScreen("dashboard"); }}
          onPreview={function() { setScreen("fill"); }}
        />
      )}
      {screen === "fill" && activeForm && (
        <FillForm form={activeForm}
          onBack={function() { setScreen("dashboard"); }}
          onSubmit={function(values) { return handleSubmit(activeForm.id, values); }}
        />
      )}
      {screen === "responses" && activeForm && (
        <Responses form={activeForm} onBack={function() { setScreen("dashboard"); }} />
      )}
    </div>
  );
}

function Dashboard({ forms, loading, onCreate, onEdit, onFill, onResponses, onDelete }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ece9ff", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg, #6C63FF, #a78bfa)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 17, fontFamily: "Nunito, sans-serif" }}>B</div>
          <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 19, color: "#1a1a2e" }}>Brainbox Forms</span>
        </div>
        <button onClick={onCreate} style={btnStyle("#6C63FF")}>+ New Form</button>
      </nav>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#bbb" }}>Loading...</div>
        ) : forms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 38, fontWeight: 900, color: "#6C63FF", marginBottom: 8 }}>Online form builder</div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 28, fontWeight: 800, color: "#1a1a2e", marginBottom: 20 }}>that gets more responses</div>
            <p style={{ color: "#888", fontSize: 15, maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.7 }}>Build engaging forms and collect responses permanently. All data stored securely.</p>
            <button onClick={onCreate} style={Object.assign({}, btnStyle("#6C63FF"), { fontSize: 15, padding: "13px 36px", borderRadius: 12 })}>Create Your First Form</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 22, color: "#1a1a2e", margin: 0 }}>My Forms</h2>
              <button onClick={onCreate} style={btnStyle("#6C63FF")}>+ New Form</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {forms.map(function(form) {
                return <FormCard key={form.id} form={form} onEdit={onEdit} onFill={onFill} onResponses={onResponses} onDelete={onDelete} />;
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FormCard({ form, onEdit, onFill, onResponses, onDelete }) {
  const [menu, setMenu] = useState(false);
  const fields = form.fields || [];
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ece9ff", overflow: "hidden", boxShadow: "0 2px 12px rgba(108,99,255,0.05)" }}>
      <div style={{ height: 5, background: form.accent || "#6C63FF" }} />
      <div style={{ padding: "20px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 6, flex: 1 }}>{form.title}</div>
          <div style={{ position: "relative" }}>
            <button onClick={function() { setMenu(function(m) { return !m; }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 18, padding: "0 4px" }}>...</button>
            {menu && (
              <div style={{ position: "absolute", right: 0, top: 26, background: "#fff", border: "1px solid #ece9ff", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 10, minWidth: 150, overflow: "hidden" }}>
                {[["Edit", function() { onEdit(form); }], ["Open Form", function() { onFill(form); }], ["Responses", function() { onResponses(form); }], ["Delete", function() { onDelete(form.id); setMenu(false); }]].map(function(item) {
                  return (
                    <button key={item[0]} onClick={function() { item[1](); setMenu(false); }}
                      style={{ display: "block", width: "100%", padding: "11px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: item[0] === "Delete" ? "#ef4444" : "#333", fontFamily: "inherit" }}>
                      {item[0]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 16 }}>{fields.length} fields</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() { onFill(form); }} style={Object.assign({}, btnStyle(form.accent || "#6C63FF"), { flex: 1, padding: "9px 12px", fontSize: 13 })}>Open Form</button>
          <button onClick={function() { onEdit(form); }} style={{ flex: 1, padding: "9px 12px", fontSize: 13, background: "#f5f4ff", border: "none", borderRadius: 8, cursor: "pointer", color: "#6C63FF", fontWeight: 600, fontFamily: "inherit" }}>Edit</button>
        </div>
      </div>
    </div>
  );
}

function Builder({ form, onSave, onBack, onPreview }) {
  const [f, setF] = useState(Object.assign({}, form, { fields: form.fields || [] }));
  const [selected, setSelected] = useState(null);

  function update(updates) {
    const updated = Object.assign({}, f, updates);
    setF(updated);
    onSave(updated);
  }

  function updateField(id, updates) {
    update({ fields: f.fields.map(function(fi) { return fi.id === id ? Object.assign({}, fi, updates) : fi; }) });
  }

  function addField(type) {
    const field = newField(type);
    update({ fields: f.fields.concat([field]) });
    setSelected(field.id);
  }

  function removeField(id) {
    update({ fields: f.fields.filter(function(fi) { return fi.id !== id; }) });
    if (selected === id) setSelected(null);
  }

  const sel = f.fields.find(function(fi) { return fi.id === selected; });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ece9ff", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, fontFamily: "inherit" }}>Back</button>
          <input value={f.title} onChange={function(e) { update({ title: e.target.value }); }}
            style={{ border: "none", outline: "none", fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 17, color: "#1a1a2e", background: "transparent" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onPreview} style={Object.assign({}, btnStyle("#fff"), { color: "#6C63FF", border: "1.5px solid #6C63FF" })}>Preview</button>
          <button onClick={function() { onSave(f); onBack(); }} style={btnStyle("#6C63FF")}>Save</button>
        </div>
      </nav>
      <div style={{ display: "flex", flex: 1, background: "#f5f4ff" }}>
        <div style={{ width: 210, background: "#fff", borderRight: "1px solid #ece9ff", padding: 16, overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>Add Field</div>
          {FIELD_TYPES.map(function(ft) {
            return (
              <button key={ft.type} onClick={function() { addField(ft.type); }}
                style={{ display: "block", width: "100%", padding: "10px 12px", background: "none", border: "1px solid #ece9ff", borderRadius: 8, cursor: "pointer", color: "#555", fontSize: 13, fontFamily: "inherit", marginBottom: 6, textAlign: "left" }}>
                {ft.label}
              </button>
            );
          })}
          <div style={{ marginTop: 20, borderTop: "1px solid #ece9ff", paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>Accent Color</div>
            <input type="color" value={f.accent} onChange={function(e) { update({ accent: e.target.value }); }}
              style={{ width: "100%", height: 38, borderRadius: 8, border: "1px solid #ece9ff", padding: 2, cursor: "pointer" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 20px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 20, border: "1px solid #ece9ff", overflow: "hidden" }}>
            <div style={{ height: 5, background: f.accent }} />
            <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #f0eeff" }}>
              <input value={f.title} onChange={function(e) { update({ title: e.target.value }); }}
                style={{ border: "none", outline: "none", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 22, color: "#1a1a2e", width: "100%", marginBottom: 8, background: "transparent" }} placeholder="Form title..." />
              <input value={f.description} onChange={function(e) { update({ description: e.target.value }); }}
                style={{ border: "none", outline: "none", fontSize: 14, color: "#999", width: "100%", background: "transparent", fontFamily: "inherit" }} placeholder="Add a description..." />
            </div>
            <div style={{ padding: "18px 28px 28px" }}>
              {f.fields.length === 0 && <div style={{ textAlign: "center", padding: "36px 0", color: "#ccc", fontSize: 14 }}>Add fields from the left panel</div>}
              {f.fields.map(function(field) {
                return (
                  <div key={field.id} onClick={function() { setSelected(field.id); }}
                    style={{ padding: 14, borderRadius: 12, border: "2px solid " + (selected === field.id ? f.accent : "#f0eeff"), marginBottom: 10, cursor: "pointer", background: selected === field.id ? f.accent + "08" : "#fafafe" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{field.label}{field.required && <span style={{ color: f.accent }}> *</span>}</div>
                      <button onClick={function(e) { e.stopPropagation(); removeField(field.id); }} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontFamily: "inherit" }}>x</button>
                    </div>
                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>{(FIELD_TYPES.find(function(t) { return t.type === field.type; }) || {}).label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ width: 240, background: "#fff", borderLeft: "1px solid #ece9ff", padding: 20, overflowY: "auto" }}>
          {sel ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.12em", marginBottom: 16, textTransform: "uppercase" }}>Field Settings</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Label</label>
                <input value={sel.label} onChange={function(e) { updateField(sel.id, { label: e.target.value }); }}
                  style={{ width: "100%", background: "#fafafe", border: "1.5px solid #e8e4ff", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#333", boxSizing: "border-box" }} />
              </div>
              {sel.type !== "checkbox" && sel.type !== "dropdown" && sel.type !== "multiple_choice" && sel.type !== "rating" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Placeholder</label>
                  <input value={sel.placeholder || ""} onChange={function(e) { updateField(sel.id, { placeholder: e.target.value }); }}
                    style={{ width: "100%", background: "#fafafe", border: "1.5px solid #e8e4ff", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#333", boxSizing: "border-box" }} />
                </div>
              )}
              {(sel.type === "dropdown" || sel.type === "multiple_choice") && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Options (one per line)</label>
                  <textarea value={(sel.options || []).join("\n")} onChange={function(e) { updateField(sel.id, { options: e.target.value.split("\n") }); }}
                    style={{ width: "100%", background: "#fafafe", border: "1.5px solid #e8e4ff", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#333", boxSizing: "border-box", minHeight: 90, resize: "vertical" }} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em" }}>Required</span>
                <button onClick={function() { updateField(sel.id, { required: !sel.required }); }}
                  style={{ width: 40, height: 22, borderRadius: 11, background: sel.required ? f.accent : "#e8e4ff", border: "none", cursor: "pointer", position: "relative" }}>
                  <div style={{ position: "absolute", top: 3, left: sel.required ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", paddingTop: 40 }}>Click a field to configure it</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FillForm({ form, onBack, onSubmit }) {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const fields = form.fields || [];

  function set(id, val) {
    setValues(function(v) { return Object.assign({}, v, { [id]: val }); });
    setErrors(function(e) { return Object.assign({}, e, { [id]: null }); });
  }

  async function submit() {
    const errs = {};
    fields.forEach(function(f) { if (f.required && !values[f.id] && values[f.id] !== false) errs[f.id] = "Required"; });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSending(true);
    await onSubmit(values);
    setSending(false);
    setDone(true);
  }

  if (done) return (
    <div style={{ minHeight: "100vh", background: "#f5f4ff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", background: "#fff", borderRadius: 24, padding: "48px 40px", border: "1px solid #ece9ff", maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>:)</div>
        <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 24, color: "#1a1a2e", marginBottom: 8 }}>Submitted!</div>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Your response has been recorded.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={function() { setValues({}); setDone(false); }} style={btnStyle(form.accent)}>Submit Another</button>
          <button onClick={onBack} style={{ padding: "10px 20px", background: "#f5f4ff", border: "none", borderRadius: 10, cursor: "pointer", color: "#666", fontWeight: 600, fontFamily: "inherit" }}>Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4ff", display: "flex", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, marginBottom: 20, fontFamily: "inherit" }}>Back</button>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ece9ff", overflow: "hidden" }}>
          <div style={{ height: 5, background: form.accent }} />
          <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #f0eeff" }}>
            <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 24, color: "#1a1a2e", marginBottom: 6 }}>{form.title}</div>
            {form.description && <div style={{ fontSize: 14, color: "#888" }}>{form.description}</div>}
          </div>
          <div style={{ padding: "24px 32px 32px" }}>
            {fields.length === 0 && <div style={{ color: "#ccc", textAlign: "center", padding: "20px 0" }}>No fields yet.</div>}
            {fields.map(function(field) {
              return (
                <div key={field.id} style={{ marginBottom: 22 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 8 }}>
                    {field.label} {field.required && <span style={{ color: form.accent }}>*</span>}
                  </label>
                  <FieldInput field={field} value={values[field.id]} accent={form.accent} onChange={function(v) { set(field.id, v); }} />
                  {errors[field.id] && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 5 }}>This field is required</div>}
                </div>
              );
            })}
            {fields.length > 0 && (
              <button onClick={submit} disabled={sending}
                style={Object.assign({}, btnStyle(form.accent), { width: "100%", padding: 14, fontSize: 15, borderRadius: 12, opacity: sending ? 0.7 : 1 })}>
                {sending ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, accent, onChange }) {
  var base = { width: "100%", border: "1.5px solid #e8e4ff", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fafafe", color: "#333" };

  if (field.type === "long_text") return <textarea style={Object.assign({}, base, { minHeight: 100, resize: "vertical" })} placeholder={field.placeholder} value={value || ""} onChange={function(e) { onChange(e.target.value); }} />;

  if (field.type === "dropdown") return (
    <select style={Object.assign({}, base, { cursor: "pointer" })} value={value || ""} onChange={function(e) { onChange(e.target.value); }}>
      <option value="">Select...</option>
      {(field.options || []).map(function(o) { return <option key={o} value={o}>{o}</option>; })}
    </select>
  );

  if (field.type === "multiple_choice") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {(field.options || []).map(function(o) {
        return (
          <label key={o} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#444" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + (value === o ? accent : "#d4d0f0"), background: value === o ? accent : "#fff", cursor: "pointer" }} onClick={function() { onChange(o); }} />
            {o}
          </label>
        );
      })}
    </div>
  );

  if (field.type === "checkbox") return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid " + (value ? accent : "#d4d0f0"), background: value ? accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={function() { onChange(!value); }}>
        {value && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>v</span>}
      </div>
      <span style={{ fontSize: 14, color: "#555" }}>Yes</span>
    </label>
  );

  if (field.type === "rating") return (
    <div style={{ display: "flex", gap: 8 }}>
      {[1, 2, 3, 4, 5].map(function(n) {
        return (
          <button key={n} onClick={function() { onChange(n); }}
            style={{ width: 44, height: 44, borderRadius: 10, border: "2px solid " + ((value || 0) >= n ? accent : "#e8e4ff"), background: (value || 0) >= n ? accent + "22" : "#fafafe", cursor: "pointer", fontSize: 18, fontFamily: "inherit" }}>
            *
          </button>
        );
      })}
    </div>
  );

  var t = field.type === "phone" ? "tel" : field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
  return <input style={base} type={t} placeholder={field.placeholder} value={value || ""} onChange={function(e) { onChange(e.target.value); }} />;
}

function Responses({ form, onBack }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const fields = form.fields || [];

  useEffect(function() {
    db.getResponses(form.id).then(function(data) {
      setResponses(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [form.id]);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4ff" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ece9ff", padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontFamily: "inherit" }}>Back</button>
        <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 17, color: "#1a1a2e" }}>{form.title} - Responses</div>
        <div style={{ marginLeft: "auto", background: (form.accent || "#6C63FF") + "22", color: form.accent || "#6C63FF", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>{responses.length} total</div>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}>Loading...</div>
        ) : responses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#bbb" }}>No responses yet.</div>
        ) : responses.map(function(r, i) {
          var vals = typeof r.values === "string" ? JSON.parse(r.values) : (r.values || {});
          return (
            <div key={r.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #ece9ff", padding: "20px 24px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#bbb", marginBottom: 14 }}>#{responses.length - i} - {new Date(r.submitted_at).toLocaleString()}</div>
              {fields.map(function(field) {
                if (vals[field.id] === undefined || vals[field.id] === "") return null;
                return (
                  <div key={field.id} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{field.label}</div>
                    <div style={{ fontSize: 14, color: "#444" }}>
                      {field.type === "checkbox" ? (vals[field.id] ? "Yes" : "No") : String(vals[field.id])}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function btnStyle(bg) {
  return { background: bg, border: "none", borderRadius: 10, padding: "10px 20px", color: bg === "#fff" ? "#6C63FF" : "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };
}
