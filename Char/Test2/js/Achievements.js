// =============================================
// Achievements.js — succès hors-ligne (inspirés du portage SSF2T HD Remix :
// 12 succès, débloqués localement, overlay F7, notification toast).
// Tout reste dans localStorage, aucune connexion.
// =============================================

export const ACHIEVEMENTS = [
    { id: 'first_ko',    name: 'Premier Sang',          desc: 'Remporter un round' },
    { id: 'perfect',     name: 'Sans une Égratignure',  desc: 'Gagner un round à 100 % de PV' },
    { id: 'specialist',  name: 'Spécialiste',          desc: 'Toucher avec un coup spécial' },
    { id: 'cancel',      name: 'Annulation Royale',    desc: 'Couper un coup normal par un coup spécial' },
    { id: 'throw',       name: 'Projection Implacable', desc: 'Projeter l\u2019adversaire malgré sa garde' },
    { id: 'throw360',    name: 'Plein Tour',           desc: 'Réussir une projection 360°' },
    { id: 'counter',     name: '\u0152il du Tigre',     desc: 'Absorber un coup et riposter avec un contre' },
    { id: 'ice_break',   name: 'Brise-Glace',          desc: 'Se libérer du gel de Rosaline' },
    { id: 'double_jump', name: 'Acrobatie',            desc: 'Réussir un double saut en plein vol' },
    { id: 'timeout',     name: 'Contre la Montre',     desc: 'Gagner un round au Time Up' },
    { id: 'champion',    name: 'Champion',             desc: 'Gagner un match complet' },
    { id: 'veteran',     name: 'Vétéran',              desc: 'Terminer 5 matchs' }
];

const STORAGE_KEY = 'dfproto_achievements_v1';

export class Achievements {
    constructor() {
        this.unlocked = {};
        this.matches = 0;
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            this.unlocked = raw.unlocked || {};
            this.matches = raw.matches || 0;
        } catch { /* première visite */ }
        this._lastToast = null;
        this._buildDom();
    }

    // ---------- persistance ----------
    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                unlocked: this.unlocked, matches: this.matches
            }));
        } catch { /* stockage indisponible */ }
    }

    isUnlocked(id) { return !!this.unlocked[id]; }
    get count() { return Object.keys(this.unlocked).length; }

    unlock(id) {
        if (this.unlocked[id]) return;
        const def = ACHIEVEMENTS.find(a => a.id === id);
        if (!def) return;
        this.unlocked[id] = Date.now();
        this._save();
        this._toast(def);
    }

    // ---------- événements du jeu ----------
    track(event, data = {}) {
        switch (event) {
            case 'ko':
                this.unlock('first_ko');
                if (data.timeout) this.unlock('timeout');
                if (data.winnerHp !== undefined && data.winnerHp >= 1000) this.unlock('perfect');
                break;
            case 'special_hit': this.unlock('specialist'); break;
            case 'cancel':      this.unlock('cancel'); break;
            case 'throw':       this.unlock('throw'); break;
            case 'throw360':    this.unlock('throw360'); break;
            case 'counter':     this.unlock('counter'); break;
            case 'ice_break':   this.unlock('ice_break'); break;
            case 'double_jump': this.unlock('double_jump'); break;
            case 'match':
                this.matches++;
                this._save();
                if (data.winnerId) this.unlock('champion');
                if (this.matches >= 5) this.unlock('veteran');
                break;
        }
    }

    // ---------- interface ----------
    _buildDom() {
        if (document.getElementById('ach-toast')) return;
        const css = document.createElement('style');
        css.textContent = `
#ach-toast{position:fixed;top:18px;right:18px;z-index:200;display:flex;gap:12px;align-items:center;
 background:linear-gradient(135deg,#1a1a3e,#5b3a7e);border:2px solid #e8b04a;border-radius:10px;
 padding:12px 18px;color:#fff;font-family:'Segoe UI',sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5);
 opacity:0;transform:translateX(30px);transition:opacity .3s,transform .3s;pointer-events:none}
#ach-toast.visible{opacity:1;transform:translateX(0)}
#ach-toast .badge{width:36px;height:36px;border-radius:50%;background:#e8b04a;color:#1a1a3e;
 display:flex;align-items:center;justify-content:center;font-size:20px}
#ach-toast .t{font-size:13px;color:#e8b04a;letter-spacing:1px}
#ach-toast .n{font-size:16px;font-weight:600}
#ach-overlay{position:fixed;inset:0;z-index:190;background:rgba(10,8,26,.93);display:none;
 color:#fff;font-family:'Segoe UI',sans-serif;overflow:auto;padding:40px 20px}
#ach-overlay.visible{display:block}
#ach-overlay h2{color:#e8b04a;letter-spacing:2px;margin:0 0 4px;text-align:center}
#ach-overlay .sub{color:#aaa;text-align:center;margin-bottom:24px}
#ach-overlay .bar{width:280px;height:10px;background:#2c2340;border-radius:5px;margin:0 auto 28px;overflow:hidden}
#ach-overlay .bar i{display:block;height:100%;background:linear-gradient(90deg,#e8b04a,#ff8c42)}
#ach-overlay .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
 gap:12px;max-width:900px;margin:0 auto}
#ach-overlay .card{background:#1a1a3e;border:1px solid #3b2f52;border-radius:8px;padding:14px;
 display:flex;gap:12px;align-items:center;opacity:.45}
#ach-overlay .card.on{opacity:1;border-color:#e8b04a;background:linear-gradient(135deg,#1a1a3e,#2c2340)}
#ach-overlay .card .ic{width:40px;height:40px;border-radius:8px;display:flex;align-items:center;
 justify-content:center;font-size:22px;background:#2c2340;flex:none}
#ach-overlay .card.on .ic{background:#e8b04a;color:#1a1a3e}
#ach-overlay .card .nm{font-weight:600}
#ach-overlay .card .ds{font-size:12px;color:#aaa}
#ach-overlay .hint{text-align:center;color:#777;font-size:12px;margin-top:28px}`;
        document.head.appendChild(css);

        const toast = document.createElement('div');
        toast.id = 'ach-toast';
        toast.innerHTML = `<div class="badge">🏆</div><div><div class="t">SUCCÈS DÉBLOQUÉ</div><div class="n"></div></div>`;
        document.body.appendChild(toast);

        const ov = document.createElement('div');
        ov.id = 'ach-overlay';
        ov.innerHTML = `<h2>SUCCÈS</h2><div class="sub"></div><div class="bar"><i></i></div>
<div class="grid"></div><div class="hint">F7 ou Échap pour fermer</div>`;
        document.body.appendChild(ov);
    }

    _toast(def) {
        const t = document.getElementById('ach-toast');
        if (!t) return;
        t.querySelector('.n').textContent = def.name;
        t.classList.add('visible');
        clearTimeout(this._lastToast);
        this._lastToast = setTimeout(() => t.classList.remove('visible'), 2600);
    }

    showOverlay() {
        const ov = document.getElementById('ach-overlay');
        if (!ov) return;
        const n = this.count, total = ACHIEVEMENTS.length;
        ov.querySelector('.sub').textContent = `${n}/${total} succès débloqués`;
        ov.querySelector('.bar i').style.width = `${100 * n / total}%`;
        const grid = ov.querySelector('.grid');
        grid.innerHTML = ACHIEVEMENTS.map(a => `
<div class="card ${this.isUnlocked(a.id) ? 'on' : ''}">
  <div class="ic">${this.isUnlocked(a.id) ? '🏆' : '🔒'}</div>
  <div><div class="nm">${a.name}</div><div class="ds">${a.desc}</div></div>
</div>`).join('');
        ov.classList.add('visible');
    }

    hideOverlay() {
        document.getElementById('ach-overlay')?.classList.remove('visible');
    }

    get overlayVisible() {
        return document.getElementById('ach-overlay')?.classList.contains('visible');
    }
}
