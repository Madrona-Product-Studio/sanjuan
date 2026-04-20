// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK WIDGET — vanilla JS, no dependencies
// Sends feedback via Web3Forms to feedback@madronaproduct.com
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  const WEB3FORMS_KEY = '0d48df75-d380-4710-817b-4bf6c56b7386';
  const SOURCE = 'San Juan Trip';

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #mps-feedback-btn {
      position: fixed; bottom: 20px; right: 20px; z-index: 9000;
      width: 44px; height: 44px; border-radius: 50%; border: none;
      background: rgba(28,25,23,0.75); backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px); color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15); transition: opacity 0.2s;
    }
    #mps-feedback-overlay {
      position: fixed; inset: 0; z-index: 9500;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex; align-items: flex-end; justify-content: center;
      padding: 16px;
    }
    #mps-feedback-modal {
      background: #F7F4EE; border-radius: 14px; width: 100%;
      max-width: 400px; box-shadow: 0 12px 48px rgba(0,0,0,0.2);
      margin-bottom: 8px; animation: mps-slide-up 0.25s ease-out;
      font-family: 'Quicksand', system-ui, sans-serif;
    }
    @keyframes mps-slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    #mps-feedback-modal textarea {
      width: 100%; height: 100px; padding: 10px 12px;
      border: 1px solid rgba(28,25,23,0.12); border-radius: 8px;
      resize: none; font-family: inherit; font-size: 14px;
      color: #1C1917; background: white; outline: none; box-sizing: border-box;
    }
    .mps-btn { flex: 1; padding: 10px 0; border-radius: 8px; font-family: inherit;
      font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .mps-btn-cancel { border: 1px solid rgba(28,25,23,0.12); background: none; color: rgba(28,25,23,0.5); }
    .mps-btn-send { border: none; background: #1C1917; color: white; }
    .mps-btn-send:disabled { background: rgba(28,25,23,0.15); color: rgba(28,25,23,0.3); cursor: not-allowed; }
  `;
  document.head.appendChild(style);

  // Create button
  const btn = document.createElement('button');
  btn.id = 'mps-feedback-btn';
  btn.setAttribute('aria-label', 'Send feedback');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  document.body.appendChild(btn);

  btn.addEventListener('click', openModal);

  function openModal() {
    btn.style.opacity = '0';
    btn.style.pointerEvents = 'none';

    const overlay = document.createElement('div');
    overlay.id = 'mps-feedback-overlay';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });

    overlay.innerHTML = `
      <div id="mps-feedback-modal">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:0.5px solid rgba(28,25,23,0.08)">
          <div style="font-size:15px;font-weight:700;color:#1C1917">Share feedback</div>
          <button id="mps-close" style="background:none;border:none;cursor:pointer;padding:4px;color:#8C7B6B">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
          </button>
        </div>
        <form id="mps-form" style="padding:16px 20px 20px">
          <p style="font-size:13px;color:rgba(28,25,23,0.5);margin:0 0 12px;line-height:1.5">
            Thoughts, suggestions, or issues — we'd love to hear from you.
          </p>
          <textarea id="mps-text" placeholder="What's on your mind?"></textarea>
          <div style="display:flex;gap:10px;margin-top:12px">
            <button type="button" class="mps-btn mps-btn-cancel" id="mps-cancel">Cancel</button>
            <button type="submit" class="mps-btn mps-btn-send" id="mps-send" disabled>Send</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const textarea = document.getElementById('mps-text');
    const sendBtn = document.getElementById('mps-send');
    textarea.addEventListener('input', () => { sendBtn.disabled = !textarea.value.trim(); });
    document.getElementById('mps-close').addEventListener('click', () => closeModal(overlay));
    document.getElementById('mps-cancel').addEventListener('click', () => closeModal(overlay));

    document.getElementById('mps-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!textarea.value.trim()) return;
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';

      try {
        const fd = new FormData();
        fd.append('access_key', WEB3FORMS_KEY);
        fd.append('subject', SOURCE + ' — User Feedback');
        fd.append('message', textarea.value);
        fd.append('from_name', SOURCE + ' User');

        const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
        const result = await res.json();

        if (result.success) {
          const modal = document.getElementById('mps-feedback-modal');
          modal.innerHTML = '<div style="padding:32px 20px;text-align:center"><div style="width:48px;height:48px;border-radius:50%;background:rgba(74,155,159,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 12px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A9B9F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div style="font-size:15px;font-weight:600;color:#1C1917">Thank you!</div><div style="font-size:13px;color:rgba(28,25,23,0.5);margin-top:4px">Your feedback has been sent.</div></div>';
          setTimeout(() => closeModal(overlay), 2000);
        } else {
          sendBtn.textContent = 'Send';
          sendBtn.disabled = false;
        }
      } catch {
        sendBtn.textContent = 'Send';
        sendBtn.disabled = false;
      }
    });
  }

  function closeModal(overlay) {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  }
})();
