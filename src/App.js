import { useState, useEffect } from "react";

var SUPABASE_URL = "https://hoeizcwpmyftklutbbed.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZWl6Y3dwbXlmdGtsdXRiYmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDU0MTIsImV4cCI6MjA4OTY4MTQxMn0.KHgkPnRSKU9qpLSnE1d6GL-Hr1sKCNzEmeiJfknr55c";
var H = { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" };

function uid() { return Math.random().toString(36).slice(2, 9); }

var db = {
  getForms: function() {
    return fetch(SUPABASE_URL + "/rest/v1/forms?select=*&order=created_at.desc", { headers: H }).then(function(r) { return r.json(); });
  },
  insertForm: function(form) {
    return fetch(SUPABASE_URL + "/rest/v1/forms", { method: "POST", headers: Object.assign({}, H, { Prefer: "resolution=merge-duplicates" }), body: JSON.stringify(form) });
  },
  updateForm: function(form) {
    return fetch(SUPABASE_URL + "/rest/v1/forms?id=eq." + form.id, { method: "PATCH", headers: H, body: JSON.stringify({ title: form.title, description: form.description, fields: form.fields, accent: form.accent, published: form.published }) });
  },
  deleteForm: function(id) {
    return fetch(SUPABASE_URL + "/rest/v1/responses?form_id=eq." + id, { method: "DELETE", headers: H }).then(function() {
      return fetch(SUPABASE_URL + "/rest/v1/forms?id=eq." + id, { method: "DELETE", headers: H });
    });
  },
  getResponses: function(formId) {
    return fetch(SUPABASE_URL + "/rest/v1/responses?form_id=eq." + formId + "&order=submitted_at.desc", { headers: H }).then(function(r) { return r.json(); });
  },
  addResponse: function(formId, values) {
    return fetch(SUPABASE_URL + "/rest/v1/responses", { method: "POST", headers: H, body: JSON.stringify({ id: uid(), form_id: formId, values: values, submitted_at: new Date().toISOString() }) });
  }
};

var FIELD_TYPES = [
  { type: "short_text", label: "Short Text" },
  { type: "long_text", label: "Long Text" },
  { type: "email", label: "Email" },
  { type: "number", label: "Number" },
  { type: "phone", label: "Phone" },
  { type: "dropdown", label: "Dropdown" },
  { type: "multiple_choice", label: "Multiple Choice" },
  { type: "checkbox", label: "Checkbox" },
  { type: "date", label: "Date" },
  { type: "rating", label: "Rating" }
];

function newField(type) {
  return { id: uid(), type: type, label: (FIELD_TYPES.find(function(f) { return f.type === type; }) || {}).label || "Field", placeholder: "", required: false, options: (type === "dropdown" || type === "multiple_choice") ? ["Option 1", "Option 2", "Option 3"] : undefined };
}

function newForm() {
  return { id: uid(), title: "Untitled Form", description: "", fields: [], accent: "#6C63FF", published: false, created_at: new Date().toISOString() };
}

function getPublicUrl(formId) {
  return window.location.origin + window.location.pathname + "?form=" + formId;
}

export default function App() {
  var params = new URLSearchParams(window.location.search);
  var publicFormId = params.get("form");

  var [screen, setScreen] = useState(publicFormId ? "public" : "dashboard");
  var [forms, setForms] = useState([]);
  var [activeForm, setActiveForm] = useState(null);
  var [loading, setLoading] = useState(true);
  var [publicForm, setPublicForm] = useState(null);

  function loadForms() {
    setLoading(true);
    db.getForms().then(function(data) {
      var list = Array.isArray(data) ? data : [];
      setForms(list);
      setLoading(false);
      if (publicFormId) {
        var found = list.find(function(f) { return f.id === publicFormId; });
        if (found) setPublicForm(found);
      }
    });
  }

  useEffect(function() { loadForms(); }, []);

  async function createForm() {
    var f = newForm();
    await db.insertForm(f);
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

  if (screen === "public") {
    return (
      <div style={{ fontFamily: "DM Sans, sans-serif", minHeight: "100vh", background: "#f5f4ff" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
        {publicForm ? (
          <FillForm form={publicForm} onBack={null} onSubmit={function(values) { return handleSubmit(publicForm.id, values); }} isPublic={true} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#bbb", fontSize: 16 }}>
            {loading ? "Loading form..." : "Form not found or not published."}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "DM Sans, sans-serif", minHeight: "100vh", background: "#f5f4ff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      {screen === "dashboard" && (
        <Dashboard forms={forms} loading={loading} onCreate={createForm}
          onEdit={function(f) { setActiveForm(f); setScreen("builder"); }}
          onFill={function(f) { setActiveForm(f); setScreen("fill"); }}
          onResponses={function(f) { setActiveForm(f); setScreen("responses"); }}
          onDelete={handleDelete} onSave={handleSave}
        />
      )}
      {screen === "builder" && activeForm && (
        <Builder form={activeForm} onSave={handleSave}
          onBack={function() { loadForms(); setScreen("dashboard"); }}
          onPreview={function() { setScreen("fill"); }}
        />
      )}
      {screen === "fill" && activeForm && (
        <FillForm form={activeForm} onBack={function() { setScreen("builder"); }} onSubmit={function(values) { return handleSubmit(activeForm.id, values); }} isPublic={false} />
      )}
      {screen === "responses" && activeForm && (
        <Responses form={activeForm} onBack={function() { setScreen("dashboard"); }} />
      )}
    </div>
  );
}

function Dashboard({ forms, loading, onCreate, onEdit, onFill, onResponses, onDelete, onSave }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ece9ff", padding: "0 28px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(108,99,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#6C63FF,#a78bfa)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 17, fontFamily: "Nunito,sans-serif" }}>B</div>
          <span style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 19, color: "#1a1a2e" }}>Brainbox Forms</span>
        </div>
        <button onClick={onCreate} style={BS("#6C63FF")}>+ New Form</button>
      </nav>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#bbb" }}>Loading your forms...</div>
        ) : forms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px" }}>
            <div style={{ fontFamily: "Nunito,sans-serif", fontSize: 38, fontWeight: 900, color: "#6C63FF", marginBottom: 8 }}>Online form builder</div>
            <div style={{ fontFamily: "Nunito,sans-serif", fontSize: 28, fontWeight: 800, color: "#1a1a2e", marginBottom: 20 }}>that gets more responses</div>
            <p style={{ color: "#888", fontSize: 15, maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.7 }}>Build engaging forms, share a link with clients, and collect responses permanently.</p>
            <button onClick={onCreate} style={Object.assign({}, BS("#6C63FF"), { fontSize: 15, padding: "13px 36px", borderRadius: 12 })}>Create Your First Form</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 22, color: "#1a1a2e", margin: 0 }}>My Forms</h2>
              <button onClick={onCreate} style={BS("#6C63FF")}>+ New Form</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 }}>
              {forms.map(function(form) {
                return <FormCard key={form.id} form={form} onEdit={onEdit} onFill={onFill} onResponses={onResponses} onDelete={onDelete} onSave={onSave} />;
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FormCard({ form, onEdit, onFill, onResponses, onDelete, onSave }) {
  var [menu, setMenu] = useState(false);
  var [copied, setCopied] = useState(false);
  var [respCount, setRespCount] = useState(0);
  var fields = form.fields || [];

  useEffect(function() {
    db.getResponses(form.id).then(function(data) {
      setRespCount(Array.isArray(data) ? data.length : 0);
    });
  }, [form.id]);

  function copyLink() {
    navigator.clipboard.writeText(getPublicUrl(form.id));
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }

  async function togglePublish() {
    var updated = Object.assign({}, form, { published: !form.published });
    await onSave(updated);
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ece9ff", overflow: "hidden", boxShadow: "0 2px 12px rgba(108,99,255,0.05)", transition: "box-shadow 0.2s" }}
      onMouseEnter={function(e) { e.currentTarget.style.boxShadow = "0 8px 30px rgba(108,99,255,0.13)"; }}
      onMouseLeave={function(e) { e.currentTarget.style.boxShadow = "0 2px 12px rgba(108,99,255,0.05)"; }}>
      <div style={{ height: 5, background: form.accent || "#6C63FF" }} />
      <div style={{ padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 15, color: "#1a1a2e", flex: 1 }}>{form.title}</div>
          <div style={{ position: "relative" }}>
            <button onClick={function() { setMenu(function(m) { return !m; }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 18, padding: "0 4px", lineHeight: 1 }}>...</button>
            {menu && (
              <div style={{ position: "absolute", right: 0, top: 26, background: "#fff", border: "1px solid #ece9ff", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 10, minWidth: 160, overflow: "hidden" }}>
                {[["Edit", function() { onEdit(form); }], ["Preview", function() { onFill(form); }], ["Responses", function() { onResponses(form); }], ["Delete", function() { onDelete(form.id); }]].map(function(item) {
                  return (
                    <button key={item[0]} onClick={function() { item[1](); setMenu(false); }}
                      style={{ display: "block", width: "100%", padding: "11px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 13, color: item[0] === "Delete" ? "#ef4444" : "#333", fontFamily: "inherit" }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = "#f5f4ff"; }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = "none"; }}>
                      {item[0]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>{fields.length} fields &nbsp;|&nbsp; {respCount} response{respCount !== 1 ? "s" : ""}</div>

        <div style={{ background: "#f8f7ff", borderRadius: 10, padding: "10px 12px", marginBottom: 12, border: "1px solid #ece9ff" }}>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Responder Link</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#888", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getPublicUrl(form.id)}</div>
            <button onClick={copyLink} style={{ background: copied ? "#6C63FF" : "#fff", border: "1.5px solid " + (copied ? "#6C63FF" : "#ece9ff"), borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: copied ? "#fff" : "#6C63FF", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={function() { onEdit(form); }} style={Object.assign({}, BS(form.accent || "#6C63FF"), { flex: 1, padding: "9px 12px", fontSize: 13 })}>Edit Form</button>
          <button onClick={togglePublish}
            style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", background: form.published ? "#f0fdf4" : "#fef2f2", color: form.published ? "#16a34a" : "#dc2626" }}>
            {form.published ? "Published" : "Unpublished"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Builder({ form, onSave, onBack, onPreview }) {
  var [f, setF] = useState(Object.assign({}, form, { fields: form.fields || [] }));
  var [selected, setSelected] = useState(null);
  var [tab, setTab] = useState("questions");
  var [responses, setResponses] = useState([]);
  var [copied, setCopied] = useState(false);

  useEffect(function() {
    if (tab === "responses") {
      db.getResponses(f.id).then(function(data) { setResponses(Array.isArray(data) ? data : []); });
    }
  }, [tab, f.id]);

  function update(updates) {
    var updated = Object.assign({}, f, updates);
    setF(updated);
    onSave(updated);
  }

  function updateField(id, updates) {
    update({ fields: f.fields.map(function(fi) { return fi.id === id ? Object.assign({}, fi, updates) : fi; }) });
  }

  function addField(type) {
    var field = newField(type);
    update({ fields: f.fields.concat([field]) });
    setSelected(field.id);
  }

  function removeField(id) {
    update({ fields: f.fields.filter(function(fi) { return fi.id !== id; }) });
    if (selected === id) setSelected(null);
  }

  function copyLink() {
    navigator.clipboard.writeText(getPublicUrl(f.id));
    setCopied(true);
    setTimeout(function() { setCopied(false); }, 2000);
  }

  var sel = f.fields.find(function(fi) { return fi.id === selected; });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f4ff" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ece9ff", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, fontFamily: "inherit" }}>Back</button>
          <input value={f.title} onChange={function(e) { update({ title: e.target.value }); }}
            style={{ border: "none", outline: "none", fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 17, color: "#1a1a2e", background: "transparent", minWidth: 160 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={copyLink} style={{ background: copied ? "#6C63FF" : "#f5f4ff", border: "1.5px solid " + (copied ? "#6C63FF" : "#ece9ff"), borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: copied ? "#fff" : "#6C63FF", fontFamily: "inherit" }}>
            {copied ? "Link Copied!" : "Copy Link"}
          </button>
          <button onClick={function() { update({ published: !f.published }); }}
            style={{ background: f.published ? "#f0fdf4" : "#fef2f2", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: f.published ? "#16a34a" : "#dc2626", fontFamily: "inherit" }}>
            {f.published ? "Published" : "Unpublished"}
          </button>
          <button onClick={function() { onSave(f); onBack(); }} style={BS("#6C63FF")}>Save</button>
        </div>
      </nav>

      <div style={{ display: "flex", justifyContent: "center", background: "#fff", borderBottom: "1px solid #ece9ff" }}>
        {["questions", "responses", "settings"].map(function(t) {
          return (
            <button key={t} onClick={function() { setTab(t); }}
              style={{ padding: "14px 28px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: tab === t ? 700 : 400, color: tab === t ? "#6C63FF" : "#888", borderBottom: tab === t ? "2px solid #6C63FF" : "2px solid transparent", textTransform: "capitalize" }}>
              {t}
            </button>
          );
        })}
      </div>

      {tab === "questions" && (
        <div style={{ display: "flex", flex: 1 }}>
          <div style={{ width: 200, background: "#fff", borderRight: "1px solid #ece9ff", padding: 16, overflowY: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.12em", marginBottom: 12, textTransform: "uppercase" }}>Add Field</div>
            {FIELD_TYPES.map(function(ft) {
              return (
                <button key={ft.type} onClick={function() { addField(ft.type); }}
                  style={{ display: "block", width: "100%", padding: "9px 12px", background: "none", border: "1px solid #ece9ff", borderRadius: 8, cursor: "pointer", color: "#555", fontSize: 13, fontFamily: "inherit", marginBottom: 6, textAlign: "left" }}
                  onMouseEnter={function(e) { e.currentTarget.style.background = "#f5f4ff"; e.currentTarget.style.color = "#6C63FF"; }}
                  onMouseLeave={function(e) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#555"; }}>
                  {ft.label}
                </button>
              );
            })}
            <div style={{ marginTop: 16, borderTop: "1px solid #ece9ff", paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>Color</div>
              <input type="color" value={f.accent} onChange={function(e) { update({ accent: e.target.value }); }}
                style={{ width: "100%", height: 36, borderRadius: 8, border: "1px solid #ece9ff", cursor: "pointer" }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "28px 20px" }}>
            <div style={{ maxWidth: 560, margin: "0 auto", background: "#fff", borderRadius: 20, border: "1px solid #ece9ff", overflow: "hidden" }}>
              <div style={{ height: 5, background: f.accent }} />
              <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #f0eeff" }}>
                <input value={f.title} onChange={function(e) { update({ title: e.target.value }); }}
                  style={{ border: "none", outline: "none", fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: 22, color: "#1a1a2e", width: "100%", marginBottom: 8, background: "transparent" }} placeholder="Form title..." />
                <input value={f.description} onChange={function(e) { update({ description: e.target.value }); }}
                  style={{ border: "none", outline: "none", fontSize: 14, color: "#999", width: "100%", background: "transparent", fontFamily: "inherit" }} placeholder="Form description..." />
              </div>
              <div style={{ padding: "18px 28px 28px" }}>
                {f.fields.length === 0 && <div style={{ textAlign: "center", padding: "36px 0", color: "#ccc", fontSize: 14 }}>Add fields from the left panel</div>}
                {f.fields.map(function(field) {
                  return (
                    <div key={field.id} onClick={function() { setSelected(field.id); }}
                      style={{ padding: 14, borderRadius: 12, border: "2px solid " + (selected === field.id ? f.accent : "#f0eeff"), marginBottom: 10, cursor: "pointer", background: selected === field.id ? f.accent + "08" : "#fafafe" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{field.label}{field.required && <span style={{ color: f.accent }}> *</span>}</div>
                        <button onClick={function(e) { e.stopPropagation(); removeField(field.id); }} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontFamily: "inherit", fontSize: 16 }}
                          onMouseEnter={function(e) { e.currentTarget.style.color = "#ef4444"; }}
                          onMouseLeave={function(e) { e.currentTarget.style.color = "#ddd"; }}>x</button>
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
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Label</label>
                  <input value={sel.label} onChange={function(e) { updateField(sel.id, { label: e.target.value }); }} style={IS} />
                </div>
                {sel.type !== "checkbox" && sel.type !== "dropdown" && sel.type !== "multiple_choice" && sel.type !== "rating" && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Placeholder</label>
                    <input value={sel.placeholder || ""} onChange={function(e) { updateField(sel.id, { placeholder: e.target.value }); }} style={IS} />
                  </div>
                )}
                {(sel.type === "dropdown" || sel.type === "multiple_choice") && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Options (one per line)</label>
                    <textarea value={(sel.options || []).join("\n")} onChange={function(e) { updateField(sel.id, { options: e.target.value.split("\n") }); }} style={Object.assign({}, IS, { minHeight: 90, resize: "vertical" })} />
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em" }}>Required</span>
                  <button onClick={function() { updateField(sel.id, { required: !sel.required }); }}
                    style={{ width: 40, height: 22, borderRadius: 11, background: sel.required ? f.accent : "#e8e4ff", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 3, left: sel.required ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: "#ccc", fontSize: 13, textAlign: "center", paddingTop: 40 }}>Click a field to configure it</div>
            )}
          </div>
        </div>
      )}

      {tab === "responses" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px", width: "100%" }}>
          <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 24, color: "#1a1a2e", marginBottom: 4 }}>{responses.length} responses</div>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 24 }}>{responses.length === 0 ? "No responses yet. Please check back later." : "All responses shown below."}</div>
          {responses.map(function(r, i) {
            var vals = typeof r.values === "string" ? JSON.parse(r.values) : (r.values || {});
            return (
              <div key={r.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #ece9ff", padding: "20px 24px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#bbb", marginBottom: 14 }}>#{responses.length - i} - {new Date(r.submitted_at).toLocaleString()}</div>
                {f.fields.map(function(field) {
                  if (vals[field.id] === undefined || vals[field.id] === "") return null;
                  return (
                    <div key={field.id} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{field.label}</div>
                      <div style={{ fontSize: 14, color: "#333" }}>{field.type === "checkbox" ? (vals[field.id] ? "Yes" : "No") : String(vals[field.id])}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {tab === "settings" && (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px", width: "100%" }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ece9ff", padding: "24px 28px", marginBottom: 16 }}>
            <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 16 }}>Form Link</div>
            <div style={{ background: "#f8f7ff", border: "1px solid #ece9ff", borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Share this link with your clients:</div>
              <div style={{ fontSize: 13, color: "#6C63FF", wordBreak: "break-all" }}>{getPublicUrl(f.id)}</div>
            </div>
            <button onClick={function() { navigator.clipboard.writeText(getPublicUrl(f.id)); setCopied(true); setTimeout(function() { setCopied(false); }, 2000); }}
              style={Object.assign({}, BS("#6C63FF"), { width: "100%" })}>
              {copied ? "Copied!" : "Copy Responder Link"}
            </button>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ece9ff", padding: "24px 28px", marginBottom: 16 }}>
            <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 6 }}>Responses</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Manage how responses are collected and protected</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>Accept Responses</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>Toggle to open or close this form</div>
              </div>
              <button onClick={function() { update({ published: !f.published }); }}
                style={{ width: 44, height: 24, borderRadius: 12, background: f.published ? "#6C63FF" : "#e8e4ff", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 4, left: f.published ? 23 : 4, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </button>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ece9ff", padding: "24px 28px" }}>
            <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 6 }}>Presentation</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Manage how the form and responses are presented</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Form Title</label>
              <input value={f.title} onChange={function(e) { update({ title: e.target.value }); }} style={IS} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Description</label>
              <textarea value={f.description} onChange={function(e) { update({ description: e.target.value }); }} style={Object.assign({}, IS, { minHeight: 80, resize: "vertical" })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FillForm({ form, onBack, onSubmit, isPublic }) {
  var [values, setValues] = useState({});
  var [errors, setErrors] = useState({});
  var [done, setDone] = useState(false);
  var [sending, setSending] = useState(false);
  var fields = form.fields || [];

  function set(id, val) {
    setValues(function(v) { return Object.assign({}, v, { [id]: val }); });
    setErrors(function(e) { return Object.assign({}, e, { [id]: null }); });
  }

  async function submit() {
    var errs = {};
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
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28, color: "#16a34a", fontWeight: 900 }}>ok</div>
        <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: 24, color: "#1a1a2e", marginBottom: 8 }}>Response Submitted!</div>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>Your answers have been recorded successfully.</p>
        {!isPublic && (
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={function() { setValues({}); setDone(false); }} style={BS(form.accent)}>Submit Another</button>
            <button onClick={onBack} style={{ padding: "10px 20px", background: "#f5f4ff", border: "none", borderRadius: 10, cursor: "pointer", color: "#666", fontWeight: 600, fontFamily: "inherit" }}>Back</button>
          </div>
        )}
        {isPublic && (
          <button onClick={function() { setValues({}); setDone(false); }} style={BS(form.accent)}>Submit Another Response</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f4ff", display: "flex", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        {!isPublic && onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, marginBottom: 20, fontFamily: "inherit" }}>Back</button>
        )}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #ece9ff", overflow: "hidden", boxShadow: "0 4px 30px rgba(108,99,255,0.05)" }}>
          <div style={{ height: 5, background: form.accent }} />
          <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #f0eeff" }}>
            <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 900, fontSize: 24, color: "#1a1a2e", marginBottom: 6 }}>{form.title}</div>
            {form.description && <div style={{ fontSize: 14, color: "#888", lineHeight: 1.6 }}>{form.description}</div>}
          </div>
          <div style={{ padding: "24px 32px 32px" }}>
            {fields.length === 0 && <div style={{ color: "#ccc", textAlign: "center", padding: "20px 0" }}>This form has no fields yet.</div>}
            {fields.map(function(field) {
              return (
                <div key={field.id} style={{ marginBottom: 22 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#333", marginBottom: 8 }}>
                    {field.label}{field.required && <span style={{ color: form.accent }}> *</span>}
                  </label>
                  <FieldInput field={field} value={values[field.id]} accent={form.accent} onChange={function(v) { set(field.id, v); }} />
                  {errors[field.id] && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 5 }}>This field is required</div>}
                </div>
              );
            })}
            {fields.length > 0 && (
              <button onClick={submit} disabled={sending} style={Object.assign({}, BS(form.accent), { width: "100%", padding: 14, fontSize: 15, borderRadius: 12, opacity: sending ? 0.7 : 1 })}>
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
  var base = { width: "100%", border: "1.5px solid #e8e4ff", borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fafafe", color: "#333", transition: "border-color 0.15s" };
  function focus(e) { e.target.style.borderColor = accent; }
  function blur(e) { e.target.style.borderColor = "#e8e4ff"; }

  if (field.type === "long_text") return <textarea style={Object.assign({}, base, { minHeight: 100, resize: "vertical" })} placeholder={field.placeholder} value={value || ""} onChange={function(e) { onChange(e.target.value); }} onFocus={focus} onBlur={blur} />;

  if (field.type === "dropdown") return (
    <select style={Object.assign({}, base, { cursor: "pointer" })} value={value || ""} onChange={function(e) { onChange(e.target.value); }} onFocus={focus} onBlur={blur}>
      <option value="">Select...</option>
      {(field.options || []).map(function(o) { return <option key={o} value={o}>{o}</option>; })}
    </select>
  );

  if (field.type === "multiple_choice") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {(field.options || []).map(function(o) {
        return (
          <label key={o} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#444" }}>
            <div onClick={function() { onChange(o); }} style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid " + (value === o ? accent : "#d4d0f0"), background: value === o ? accent : "#fff", flexShrink: 0, cursor: "pointer", transition: "all 0.15s" }} />
            {o}
          </label>
        );
      })}
    </div>
  );

  if (field.type === "checkbox") return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div onClick={function() { onChange(!value); }} style={{ width: 20, height: 20, borderRadius: 5, border: "2px solid " + (value ? accent : "#d4d0f0"), background: value ? accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}>
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
            style={{ width: 44, height: 44, borderRadius: 10, border: "2px solid " + ((value || 0) >= n ? accent : "#e8e4ff"), background: (value || 0) >= n ? accent + "22" : "#fafafe", cursor: "pointer", fontSize: 20, fontFamily: "inherit", transition: "all 0.15s" }}>
            *
          </button>
        );
      })}
    </div>
  );

  var t = field.type === "phone" ? "tel" : field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text";
  return <input style={base} type={t} placeholder={field.placeholder} value={value || ""} onChange={function(e) { onChange(e.target.value); }} onFocus={focus} onBlur={blur} />;
}

function Responses({ form, onBack }) {
  var [responses, setResponses] = useState([]);
  var [loading, setLoading] = useState(true);
  var fields = form.fields || [];

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
        <div style={{ fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: 17, color: "#1a1a2e" }}>{form.title} - Responses</div>
        <div style={{ marginLeft: "auto", background: (form.accent || "#6C63FF") + "22", color: form.accent || "#6C63FF", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>{responses.length} total</div>
      </nav>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}>Loading...</div>
        ) : responses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>empty</div>
            <div style={{ color: "#bbb" }}>No responses yet. Please check back later.</div>
          </div>
        ) : responses.map(function(r, i) {
          var vals = typeof r.values === "string" ? JSON.parse(r.values) : (r.values || {});
          return (
            <div key={r.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #ece9ff", padding: "20px 24px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#bbb", marginBottom: 14 }}>#{responses.length - i} - {new Date(r.submitted_at).toLocaleString()}</div>
              {fields.map(function(field) {
                if (vals[field.id] === undefined || vals[field.id] === "") return null;
                return (
                  <div key={field.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{field.label}</div>
                    <div style={{ fontSize: 14, color: "#333" }}>{field.type === "checkbox" ? (vals[field.id] ? "Yes" : "No") : String(vals[field.id])}</div>
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

var IS = { width: "100%", background: "#fafafe", border: "1.5px solid #e8e4ff", borderRadius: 8, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#333", boxSizing: "border-box" };

function BS(bg) {
  return { background: bg, border: "none", borderRadius: 10, padding: "10px 20px", color: bg === "#fff" ? "#6C63FF" : "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };
}
