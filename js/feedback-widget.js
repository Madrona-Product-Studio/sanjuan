// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK WIDGET — vanilla JS, structured sentiment + tags + open text
// Sends feedback via Resend API (lilatrips.com/api/send-feedback)
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  const FEEDBACK_API = 'https://www.lilatrips.com/api/send-feedback';
  const SOURCE = 'San Juan Trip';

  const TAG_SETS = {
    loved: { label: 'What stood out?', tags: ['It was easy', 'It felt thoughtful', 'Saved me time', 'Looked great', 'Something else'] },
    okay:  { label: 'What could be better?', tags: ['A step felt clunky', 'Content quality', 'The look & feel', 'I had an idea', 'Something else'] },
    off:   { label: 'What got in the way?', tags: ['Something broke', 'Confusing flow', 'Wrong result', 'Not for me', 'Something else'] },
  };
  const PROMPTS = {
    loved: { label: 'What made it land?', placeholder: "e.g. 'the trip guide was exactly what I needed'" },
    okay:  { label: 'What would push this further?', placeholder: "e.g. 'would love more restaurant recommendations'" },
    off:   { label: 'What got in the way?', placeholder: "e.g. 'a link was broken on the day 3 page'" },
  };
  const THANKS = {
    loved: { title: 'Thank you', body: "We're glad it landed. We'll keep pulling on what's working." },
    okay:  { title: 'Thank you', body: "Noted. We'll sit with this and you'll see what changed in our next update." },
    off:   { title: 'Thank you — truly', body: 'This is exactly what we need to hear. We read every one of these and it shapes what we work on next.' },
  };
  const LABELS = { loved: 'Loved it', okay: 'It was okay', off: 'Felt off' };
  const FACES = {
    loved: '<path d="M8.5 14.5c0 0 1.5 2 3.5 2s3.5-2 3.5-2"/>',
    okay: '<path d="M8.5 15h7"/>',
    off: '<path d="M8.5 16c0 0 1.5-2 3.5-2s3.5 2 3.5 2"/>',
  };

  const INK = '#1C1917';
  const INK_60 = 'rgba(28,25,23,0.6)';
  const INK_35 = 'rgba(28,25,23,0.35)';
  const INK_12 = 'rgba(28,25,23,0.12)';
  const FONT = "'Quicksand', system-ui, sans-serif";

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #mps-fb-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9000;
      width: 44px; height: 44px; border-radius: 50%;
      border: none;
      background: #2c3e50; color: white;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
      transition: opacity 0.25s, transform 0.2s, background 0.2s;
    }
    #mps-fb-btn:hover { transform: translateY(-1px); background: #3d5265; }
    #mps-fb-overlay {
      position: fixed; inset: 0; z-index: 9500;
      background: rgba(0,0,0,0.08); backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
      display: flex; align-items: flex-end; justify-content: flex-end;
      padding: 16px 24px 80px;
    }
    #mps-fb-card {
      background: white; border-radius: 12px; width: 100%; max-width: 400px;
      border: 0.5px solid ${INK_12}; box-shadow: 0 12px 48px rgba(0,0,0,0.12);
      animation: mps-fb-up 0.35s cubic-bezier(0.16,1,0.3,1);
      font-family: ${FONT};
    }
    @keyframes mps-fb-up { from { transform: translateY(8px) scale(0.98); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
    .mps-fb-sentbtn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 10px 8px; border-radius: 8px; border: 0.5px solid transparent;
      background: rgba(28,25,23,0.03); color: ${INK_60}; cursor: pointer;
      font-family: ${FONT}; font-size: 12px; font-weight: 500; transition: all 0.15s;
    }
    .mps-fb-sentbtn:hover { background: white; border-color: ${INK_12}; color: ${INK}; }
    .mps-fb-sentbtn.sel { background: white; border-color: ${INK_35}; color: ${INK}; }
    .mps-fb-tag {
      padding: 6px 12px; font-size: 13px; font-family: ${FONT}; font-weight: 500;
      border-radius: 14px; border: 0.5px solid ${INK_12}; background: transparent;
      color: ${INK_60}; cursor: pointer; transition: all 0.15s;
    }
    .mps-fb-tag:hover { border-color: ${INK_35}; color: ${INK}; }
    .mps-fb-tag.sel { background: ${INK}; color: white; border-color: ${INK}; }
    .mps-fb-textarea {
      width: 100%; min-height: 76px; padding: 11px 13px; border: 0.5px solid ${INK_12};
      border-radius: 8px; resize: vertical; font-family: ${FONT}; font-size: 14px;
      line-height: 1.6; color: ${INK}; background: white; outline: none; box-sizing: border-box;
    }
    .mps-fb-textarea:focus { border-color: ${INK_35}; }
    .mps-fb-actbtn {
      flex: 1; padding: 10px 0; border-radius: 8px; font-family: ${FONT};
      font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
  `;
  document.head.appendChild(style);

  // FAB
  const btn = document.createElement('button');
  btn.id = 'mps-fb-btn';
  btn.setAttribute('aria-label', 'Share feedback');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4v4c0 2.2-1.8 4-4 4h-3.5l-3 2.5v-2.5H9c-2.2 0-4-1.8-4-4V9Z"/></svg>';
  document.body.appendChild(btn);

  let selectedSentiment = null;
  let selectedTag = null;

  btn.addEventListener('click', openModal);

  function faceIcon(type) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="0.75" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="0.75" fill="currentColor" stroke="none"/>${FACES[type]}</svg>`;
  }

  function openModal() {
    btn.style.opacity = '0'; btn.style.pointerEvents = 'none';
    selectedSentiment = null; selectedTag = null;

    const overlay = document.createElement('div');
    overlay.id = 'mps-fb-overlay';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { closeModal(overlay); document.removeEventListener('keydown', escHandler); }
    });

    overlay.innerHTML = `<div id="mps-fb-card">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px 16px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:${INK_35}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4v4c0 2.2-1.8 4-4 4h-3.5l-3 2.5v-2.5H9c-2.2 0-4-1.8-4-4V9Z"/></svg></span>
          <span style="font-size:15px;font-weight:500;color:${INK}">Share a thought</span>
        </div>
        <button id="mps-fb-close" style="background:none;border:none;cursor:pointer;padding:4px;color:${INK_35}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>
      </div>
      <div style="padding:0 24px 20px">
        <div style="font-size:14px;color:${INK_60};margin-bottom:16px;line-height:1.5">Your thoughts help us shape what comes next.</div>
        <div style="font-size:14px;color:${INK};font-weight:500;margin-bottom:10px">How was this?</div>
        <div id="mps-fb-sentiments" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:4px">
          ${['loved','okay','off'].map(k => `<button class="mps-fb-sentbtn" data-val="${k}">${faceIcon(k)}<span>${LABELS[k]}</span></button>`).join('')}
        </div>
        <div id="mps-fb-followup" style="max-height:0;opacity:0;overflow:hidden;transition:max-height 0.3s ease,opacity 0.3s ease;margin-top:0"></div>
        <div id="mps-fb-error" style="font-size:12px;color:#C4875A;margin-top:8px;display:none"></div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button id="mps-fb-cancel" class="mps-fb-actbtn" style="border:0.5px solid ${INK_12};background:none;color:${INK_60}">Cancel</button>
          <button id="mps-fb-send" class="mps-fb-actbtn" style="border:none;background:rgba(28,25,23,0.15);color:rgba(28,25,23,0.3);opacity:0.4;cursor:not-allowed" disabled>Send</button>
        </div>
      </div>
    </div>`;

    document.body.appendChild(overlay);

    // Wire sentiment buttons
    overlay.querySelectorAll('.mps-fb-sentbtn').forEach(b => {
      b.addEventListener('click', () => {
        selectedSentiment = b.dataset.val; selectedTag = null;
        overlay.querySelectorAll('.mps-fb-sentbtn').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
        const send = document.getElementById('mps-fb-send');
        send.disabled = false; send.style.background = INK; send.style.color = 'white'; send.style.opacity = '1'; send.style.cursor = 'pointer';
        showFollowup(overlay, selectedSentiment);
      });
    });

    document.getElementById('mps-fb-close').addEventListener('click', () => closeModal(overlay));
    document.getElementById('mps-fb-cancel').addEventListener('click', () => closeModal(overlay));
    document.getElementById('mps-fb-send').addEventListener('click', () => submitFeedback(overlay));
  }

  function showFollowup(overlay, sentiment) {
    const fu = document.getElementById('mps-fb-followup');
    const ts = TAG_SETS[sentiment];
    const pr = PROMPTS[sentiment];
    fu.innerHTML = `
      <div style="font-size:14px;color:${INK};font-weight:500;margin-bottom:8px">${ts.label} <span style="opacity:0.5;font-weight:400">(optional)</span></div>
      <div id="mps-fb-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
        ${ts.tags.map(t => `<button class="mps-fb-tag" data-tag="${t}">${t}</button>`).join('')}
      </div>
      <label style="display:block;font-size:14px;color:${INK};font-weight:500;margin-bottom:6px">${pr.label}</label>
      <textarea id="mps-fb-text" class="mps-fb-textarea" placeholder="${pr.placeholder}"></textarea>
      <div style="font-size:12px;font-style:italic;color:${INK_60};margin-top:4px">We read every response.</div>
    `;
    fu.style.maxHeight = '500px'; fu.style.opacity = '1'; fu.style.marginTop = '16px';

    fu.querySelectorAll('.mps-fb-tag').forEach(t => {
      t.addEventListener('click', () => {
        const wasSelected = t.classList.contains('sel');
        fu.querySelectorAll('.mps-fb-tag').forEach(x => x.classList.remove('sel'));
        if (!wasSelected) { t.classList.add('sel'); selectedTag = t.dataset.tag; }
        else { selectedTag = null; }
      });
    });
  }

  async function submitFeedback(overlay) {
    if (!selectedSentiment) return;
    const send = document.getElementById('mps-fb-send');
    const errEl = document.getElementById('mps-fb-error');
    send.disabled = true; send.textContent = 'Sending…'; send.style.opacity = '0.6';
    errEl.style.display = 'none';

    const textEl = document.getElementById('mps-fb-text');
    const text = textEl ? textEl.value.trim() : '';

    try {
      const res = await fetch(FEEDBACK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: SOURCE,
          sentiment: selectedSentiment,
          tag: selectedTag,
          text: text,
          pathname: window.location.pathname,
        }),
      });
      const result = await res.json();

      if (result.success) {
        const card = document.getElementById('mps-fb-card');
        const th = THANKS[selectedSentiment];
        card.innerHTML = `<div style="padding:32px 24px 28px;text-align:center;font-family:${FONT}">
          <div style="width:32px;height:32px;margin:0 auto 12px;color:${INK_35}"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9c0-2.2 1.8-4 4-4h6c2.2 0 4 1.8 4 4v4c0 2.2-1.8 4-4 4h-3.5l-3 2.5v-2.5H9c-2.2 0-4-1.8-4-4V9Z"/></svg></div>
          <div style="font-size:15px;font-weight:500;color:${INK};margin-bottom:6px">${th.title}</div>
          <div style="font-size:13px;color:${INK_60};line-height:1.6;max-width:300px;margin:0 auto 20px">${th.body}</div>
          <button id="mps-fb-done" style="background:none;border:0.5px solid ${INK_12};border-radius:8px;padding:8px 20px;font-family:${FONT};font-size:13px;font-weight:500;color:${INK_60};cursor:pointer">Close</button>
        </div>`;
        document.getElementById('mps-fb-done').addEventListener('click', () => closeModal(overlay));
        setTimeout(() => closeModal(overlay), 4000);
      } else {
        send.textContent = 'Send'; send.disabled = false; send.style.opacity = '1';
        errEl.textContent = 'Could not send. Please try again.'; errEl.style.display = 'block';
      }
    } catch {
      send.textContent = 'Send'; send.disabled = false; send.style.opacity = '1';
      errEl.textContent = 'Could not send. Please try again.'; errEl.style.display = 'block';
    }
  }

  function closeModal(overlay) {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
  }
})();
