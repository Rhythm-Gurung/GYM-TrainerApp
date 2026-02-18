/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Page background ──────────────────────────────────────────────────
        'background': '#FBFBFB',

        // ── Brand ────────────────────────────────────────────────────────────
        // Use as: bg-primary, text-primary, border-primary
        'primary':      '#547792',
        'primary-dark': '#2C4F64',

        // ── Accent / Highlight ───────────────────────────────────────────────
        // Use as: bg-accent, text-accent
        'accent': '#F59E0B',

        // ── Surface ──────────────────────────────────────────────────────────
        // Use as: bg-surface, border-surface-border
        'surface':        '#F3F4F6',
        'surface-border': '#E5E7EB',

        // ── Status ───────────────────────────────────────────────────────────
        'status-new':       '#22C55E',
        'status-updated':   '#F97316',
        'status-cancelled': '#EF4444',

        // ── Legacy (keep for backwards compat) ───────────────────────────────
        'primary-btn':  '#73C2FB',
        'tab-active':   '#547792',
        'gray-light':   '#AAAAAA',

        // ── Text / Foreground hierarchy ───────────────────────────────────────
        // Mirrors theme.ts textPrimary → textSubtle scale.
        // Use as: text-foreground, text-foreground-2 … border-foreground-2
        'foreground':   '#111827',   // gray-900 – headings, strong labels
        'foreground-2': '#374151',   // gray-700 – form labels, menu items
        'foreground-3': '#4B5563',   // gray-600 – secondary / subtitle text
        'foreground-4': '#6B7280',   // gray-500 – muted text
        'foreground-5': '#9CA3AF',   // gray-400 – placeholders, inactive tabs, chevrons

        // ── Additional Surfaces ───────────────────────────────────────────────
        'surface-subtle': '#F9FAFB', // gray-50  – lightest bg (OTP cells, requirements box)
        'neutral':        '#D1D5DB', // gray-300 – avatar fallback bg, switch track (off)

        // ── Action (blue CTA – distinct from brand primary) ───────────────────
        // Use as: bg-action, text-action, border-action
        'action':       '#3B82F6',   // blue-500 – edit / save / subscribe buttons
        'action-dark':  '#2563EB',   // blue-600 – checkbox checked, darker variant
        'action-track': '#93C5FD',   // blue-300 – switch track (on state)
        'action-bg':    '#DBEAFE',   // blue-100 – icon container tint (info / forgot-pw)

        // ── Error / Danger ────────────────────────────────────────────────────
        // error value (#EF4444) equals status-cancelled — use either semantically
        'error':        '#EF4444',   // red-500 – error text, danger actions
        'error-light':  '#F87171',   // red-400 – error icon tint
        'error-border': '#FECACA',   // red-200 – error field border
        'error-bg':     '#FEF2F2',   // red-50  – error hover / button bg

        // ── Cancel (ghost / outline discard button) ───────────────────────────
        // cancel value (#F97316) equals status-updated — use either semantically
        'cancel':       '#F97316',   // orange-500 – cancel / discard actions

        // ── Form ─────────────────────────────────────────────────────────────
        'input-border': '#F7F8F8',   // near-white – default form field border

        // ── Status backgrounds (icon containers) ─────────────────────────────
        'status-new-bg': '#DCFCE7',  // green-100  – success icon container
        'system-bg':     '#F3E8FF',  // purple-100 – system / info icon container

        // ── Special ──────────────────────────────────────────────────────────
        'system':       '#6366F1',   // indigo-500 – system notification icons
        'heart-active': '#FCA5A5',   // red-300    – favorited / liked state
      },

      fontSize: {
        // Custom sizes that fall outside Tailwind's default scale.
        // Use as: text-badge, text-caption, text-body, text-section
        'badge':   10,   // notification count, micro-labels
        'caption': 11,   // small captions, sub-labels
        'body':    13,   // body / meta text  (between xs:12 and sm:14)
        'section': 15,   // section headings  (between sm:14 and base:16)

        // ── Semantic heading scale ─────────────────────────────────────────────
        // Replaces raw Tailwind text-{lg,xl,2xl,4xl} with meaningful names.
        // Use as: text-lead, text-sub-heading, text-title, text-heading
        'lead':        18,   // section headings, lead text       (= text-lg)
        'sub-heading': 20,   // sub-headings, button labels        (= text-xl)
        'title':       24,   // page-level headings ("My Profile") (= text-2xl)
        'heading':     36,   // auth main headings                 (= text-4xl)
      },
    },
  },
  plugins: [],
};
