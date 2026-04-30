import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../api/axios';

/* ── colour tokens (matches Member 4) ─────────────────────────────────── */
const C = {
  bg:      '#0f0f0f',
  card:    '#181818',
  border:  '#303030',
  text:    '#ffffff',
  sub:     '#aaaaaa',
  hover:   '#272727',
  red:     '#ff0000',
  blue:    '#3ea6ff',
};

/* ── tiny shared input style ──────────────────────────────────────────── */
const inputStyle = {
  background: '#121212',
  border: `1px solid ${C.border}`,
  padding: '0.7rem',
  borderRadius: 6,
  color: C.text,
  width: '100%',
  boxSizing: 'border-box',
  fontSize: 14,
};

/* ═══════════════════════════════════════════════════════════════════════
   TAB 1 — Dashboard
═══════════════════════════════════════════════════════════════════════ */
function Dashboard() {
  const { user } = useAuth();

  /* mock analytics – replace with real API calls when backend is ready */
  const viewsData = [
    { day: 'Mon', views: 120 },
    { day: 'Tue', views: 340 },
    { day: 'Wed', views: 210 },
    { day: 'Thu', views: 480 },
    { day: 'Fri', views: 390 },
    { day: 'Sat', views: 620 },
    { day: 'Sun', views: 510 },
  ];

  const engagementData = [
    { label: 'Likes',    value: 284 },
    { label: 'Dislikes', value: 47  },
    { label: 'Comments', value: 132 },
    { label: 'Shares',   value: 91  },
  ];

  const stats = [
    { label: 'Total Views',   value: '2,670' },
    { label: 'Subscribers',   value: '184'   },
    { label: 'Videos',        value: '12'    },
    { label: 'Watch Hours',   value: '318'   },
  ];

  return (
    <div>
      {/* ── 4 stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '1.2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.red }}>{s.value}</div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Views Over Time */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1.2rem' }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Views Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={viewsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" stroke={C.sub} tick={{ fontSize: 12 }} />
              <YAxis stroke={C.sub} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }} />
              <Line type="monotone" dataKey="views" stroke={C.red} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '1.2rem' }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Engagement</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="label" stroke={C.sub} tick={{ fontSize: 12 }} />
              <YAxis stroke={C.sub} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }} />
              <Bar dataKey="value" fill={C.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 2 — Create Content (drag-and-drop upload)
═══════════════════════════════════════════════════════════════════════ */
function CreateContent() {
  const [file, setFile]         = useState(null);
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus]     = useState('idle'); // idle | uploading | done | error
  const [error, setError]       = useState('');
  const dropRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('video/')) setFile(dropped);
    else setError('Please drop a video file.');
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) { setError('Title and video file are required.'); return; }
    setError('');
    setStatus('uploading');
    setProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      await api.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      setStatus('done');
      setFile(null); setTitle(''); setDesc(''); setProgress(0);
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || 'Upload failed. Try again.');
    }
  };

  return (
    <div style={{ maxWidth: 620 }}>
      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput').click()}
        style={{
          border: `2px dashed ${dragging ? C.red : C.border}`,
          borderRadius: 12,
          padding: '2.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 20,
          background: dragging ? '#1a0000' : C.card,
          transition: 'all 0.2s',
        }}
      >
        <input
          id="fileInput"
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files[0])}
        />
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎬</div>
        {file
          ? <p style={{ color: C.blue }}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
          : <p style={{ color: C.sub }}>Drag & drop your video here, or <span style={{ color: C.red }}>browse</span></p>
        }
        <p style={{ color: C.sub, fontSize: 12, marginTop: 6 }}>MP4, MKV, MOV — up to 2 GB</p>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <input
          style={inputStyle}
          placeholder="Video title *"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          style={{ ...inputStyle, height: 90, resize: 'vertical' }}
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      {/* Progress bar */}
      {status === 'uploading' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: C.sub }}>Uploading…</span>
            <span style={{ color: C.red }}>{progress}%</span>
          </div>
          <div style={{ background: C.border, borderRadius: 999, height: 8, overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: C.red,
              borderRadius: 999,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {status === 'done' && (
        <div style={{ background: '#001a00', border: '1px solid #00cc00', borderRadius: 8, padding: '0.7rem', marginBottom: 16, color: '#00cc00', textAlign: 'center' }}>
          ✅ Video uploaded! Transcoding will begin shortly.
        </div>
      )}

      {error && (
        <div style={{ background: '#2a0000', border: '1px solid red', borderRadius: 8, padding: '0.7rem', marginBottom: 16, color: '#ff6666', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={status === 'uploading'}
        style={{
          background: status === 'uploading' ? '#550000' : C.red,
          color: C.text,
          padding: '0.7rem 2rem',
          borderRadius: 20,
          fontWeight: 600,
          fontSize: 15,
          cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
          border: 'none',
          width: '100%',
        }}
      >
        {status === 'uploading' ? `Uploading ${progress}%…` : 'Upload Video'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 3 — Report Us (grievance form)
═══════════════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  'Bug / Technical Issue',
  'Content Policy Violation',
  'Account Problem',
  'Upload / Transcoding Issue',
  'Other',
];

function ReportUs() {
  const [form, setForm]     = useState({ name: '', email: '', category: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent]     = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = 'Name is required';
    if (!form.email.trim())    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.category)        e.category = 'Please select a category';
    if (!form.message.trim())  e.message  = 'Please describe your issue';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    /* In production, POST to /api/reports or email service */
    setSent(true);
  };

  if (sent) return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '3rem',
      textAlign: 'center',
      maxWidth: 500,
    }}>
      <div style={{ fontSize: 50, marginBottom: 12 }}>📬</div>
      <h2 style={{ marginBottom: 8 }}>Report Received</h2>
      <p style={{ color: C.sub }}>Thanks! We'll review your report and get back to you at <strong>{form.email}</strong> within 48 hours.</p>
      <button
        onClick={() => { setSent(false); setForm({ name: '', email: '', category: '', message: '' }); }}
        style={{ marginTop: 20, background: C.red, color: '#fff', padding: '0.6rem 1.6rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600 }}
      >
        Submit Another
      </button>
    </div>
  );

  const field = (label, key, type = 'text') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, color: C.sub, marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        style={{ ...inputStyle, borderColor: errors[key] ? '#ff4444' : C.border }}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={label}
      />
      {errors[key] && <div style={{ color: '#ff6666', fontSize: 12, marginTop: 4 }}>{errors[key]}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ color: C.sub, marginBottom: 24, fontSize: 14 }}>
        Found a bug or have a concern? We read every report. Fill in the form below.
      </p>

      {field('Your Name', 'name')}
      {field('Email Address', 'email', 'email')}

      {/* Category select */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: C.sub, marginBottom: 6 }}>Category</label>
        <select
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          style={{
            ...inputStyle,
            borderColor: errors.category ? '#ff4444' : C.border,
            appearance: 'none',
          }}
        >
          <option value="">— Select a category —</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.category && <div style={{ color: '#ff6666', fontSize: 12, marginTop: 4 }}>{errors.category}</div>}
      </div>

      {/* Message */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, color: C.sub, marginBottom: 6 }}>Your Message</label>
        <textarea
          style={{ ...inputStyle, height: 130, resize: 'vertical', borderColor: errors.message ? '#ff4444' : C.border }}
          placeholder="Describe the issue in detail…"
          value={form.message}
          onChange={e => setForm({ ...form, message: e.target.value })}
        />
        {errors.message && <div style={{ color: '#ff6666', fontSize: 12, marginTop: 4 }}>{errors.message}</div>}
      </div>

      <button
        onClick={handleSubmit}
        style={{
          background: C.red,
          color: '#fff',
          padding: '0.75rem 2rem',
          borderRadius: 20,
          border: 'none',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Submit Report
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN — ProfilePage shell with gradient banner + tab nav
═══════════════════════════════════════════════════════════════════════ */
const TABS = ['Dashboard', 'Create Content', 'Report Us'];

export default function ProfilePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  if (!user) return (
    <div style={{ color: C.text, background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Please <a href="/login" style={{ color: C.red }}>log in</a> to view your profile.</p>
    </div>
  );

  const initials = user.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'ME';

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>

      {/* ── Gradient banner ── */}
      <div style={{
        height: 180,
        background: 'linear-gradient(135deg, #1a0000 0%, #3a0000 40%, #660000 70%, #ff0000 100%)',
        position: 'relative',
      }}>
        {/* Avatar */}
        <div style={{
          position: 'absolute',
          bottom: -44,
          left: 40,
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: '#222',
          border: `4px solid ${C.bg}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          fontWeight: 700,
          color: C.red,
          userSelect: 'none',
        }}>
          {initials}
        </div>
      </div>

      {/* ── Username / meta ── */}
      <div style={{ padding: '56px 40px 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{user.username || 'Creator'}</h2>
        <p style={{ color: C.sub, fontSize: 13 }}>{user.email}</p>
      </div>

      {/* ── Tab navigation ── */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '20px 40px 0',
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 32,
      }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              background: 'none',
              border: 'none',
              color: tab === i ? C.text : C.sub,
              fontWeight: tab === i ? 700 : 400,
              fontSize: 14,
              padding: '10px 18px',
              cursor: 'pointer',
              borderBottom: tab === i ? `2px solid ${C.red}` : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.2s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '0 40px 60px' }}>
        {tab === 0 && <Dashboard />}
        {tab === 1 && <CreateContent />}
        {tab === 2 && <ReportUs />}
      </div>
    </div>
  );
}
