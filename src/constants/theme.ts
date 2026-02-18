/**
 * Central design-system tokens for GymJam.
 *
 * Usage:
 *   import { colors, fontSize, radius, shadow, gradientColors } from '@/constants/theme';
 *
 *   style={{ color: colors.primary }}          ← inline style
 *   className="text-primary bg-surface"        ← NativeWind class (defined in tailwind.config.js)
 */

// ─── Colors ─────────────────────────────────────────────────────────────────

export const colors = {
    // Brand
    primary: '#547792',
    primaryDark: '#2C4F64',

    // Primary with opacity – backgrounds, borders, tints
    primarySubtle: 'rgba(84,119,146,0.08)',
    primaryMuted: 'rgba(84,119,146,0.10)',
    primaryLight: 'rgba(84,119,146,0.12)',
    primaryBorderSm: 'rgba(84,119,146,0.15)',
    primaryBorder: 'rgba(84,119,146,0.20)',

    // Accent / Highlights
    accent: '#F59E0B', // amber – stars, badges, sparkle icons
    primaryBtn: '#73C2FB', // light-blue – CTA buttons, selected pills (= tailwind primary-btn)

    // Status
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F97316',

    // Text scale
    textPrimary: '#111827', // headings, card titles        (gray-900)
    textSecondary: '#374151', // body text, labels            (gray-700)
    textMuted: '#6B7280', // secondary labels, captions   (gray-500)
    textSubtle: '#9CA3AF', // placeholders, tertiary info  (gray-400)
    textDisabled: '#D1D5DB', // inactive icons, dividers     (gray-300)

    // Surface
    surface: '#F3F4F6', // chip / tag bg, icon containers  (gray-100)
    surfaceBorder: '#E5E7EB', // card borders, row dividers       (gray-200)
    surfaceSubtle: '#F9FAFB', // lightest bg – OTP cells, req box (gray-50)
    // Solid brand-tinted surface — use instead of rgba primary tints on Android
    // (elevation + semi-transparent bg causes black corner artifacts on Android)
    primarySurface: '#EEF2F6', // solid equivalent of rgba(84,119,146,0.08) on white
    white: '#FFFFFF',
    background: '#FBFBFB', // page background

    // Action (blue CTA — distinct from brand primary)
    action: '#3B82F6', // blue-500 – edit / save / subscribe buttons
    actionBg: '#DBEAFE', // blue-100 – icon container tint, focused OTP cell bg
    actionTrack: '#93C5FD', // blue-300 – switch track (on state)

    // Error tints (semi-transparent, for icon containers / badge bgs)
    errorBg: 'rgba(239,68,68,0.10)', // error icon container bg
    // Accent tints
    accentBg: 'rgba(245,158,11,0.10)', // accent icon container bg

    // System / notifications
    system: '#6366F1', // indigo-500 – system notification icon
    systemBg: 'rgba(99,102,241,0.10)', // system icon container bg

    // Status backgrounds (solid, for light-mode icon containers)
    statusNewBg: '#DCFCE7', // green-100 – success icon container

    // Form
    inputBorder: '#F7F8F8', // near-white – default form field border

    // Neutral (gray-300 — avatar fallback bg, switch track off)
    neutral: '#D1D5DB', // same value as textDisabled, semantic alias for backgrounds

    // Liked / favorited state
    heartActive: '#FCA5A5', // red-300 – favorited heart icon

    // White overlays – for use on the gradient header
    white15: 'rgba(255,255,255,0.15)', // icon / button bg on gradient
    white18: 'rgba(255,255,255,0.18)', // search bar bg on gradient
    white55: 'rgba(255,255,255,0.55)', // placeholder text on gradient
    white60: 'rgba(255,255,255,0.60)', // icon color on gradient
    white65: 'rgba(255,255,255,0.65)', // sub-heading text on gradient
} as const;

// ─── Gradient presets ────────────────────────────────────────────────────────

export const gradientColors = {
    primary: [colors.primary, colors.primaryDark] as [string, string],
} as const;

// ─── Font sizes ──────────────────────────────────────────────────────────────
// Named after their semantic role, not their raw pixel value.

export const fontSize = {
    badge: 10, // notification count, tiny micro-labels
    caption: 11, // small captions, sub-row labels
    tag: 12, // chips, category pills, secondary action text
    body: 13, // primary body text, search input, card meta
    card: 14, // card sub-titles, item labels, initials
    section: 15, // section headings, trainer names
    icon: 16, // standard icon size reference, row text
    stat: 18, // stat values ("500+", "2.4K")
    hero: 20, // hero sub-titles, large avatar initials
    header: 22, // gradient header title ("Find Your Trainer")
    pageTitle: 24, // page-level heading ("My Profile")
} as const;

// ─── Border radius ───────────────────────────────────────────────────────────

export const radius = {
    sm: 10, // icon containers, small buttons
    md: 12, // chips, category tags
    icon: 14, // notification bell, avatar overlay buttons
    card: 16, // avatar images, photo containers
    hero: 32, // gradient hero section bottom corners
    full: 999, // pill badges, progress bars, status dots
} as const;

// ─── Shadow presets ──────────────────────────────────────────────────────────
// Spread these into inline styles: style={{ ...shadow.card }}

export const shadow = {
    /** Standard card – TrainerCard, StatsCard */
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
    },
    /** Elevated card – Profile card */
    cardStrong: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    /** Subtle card – Menu container */
    cardSubtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    /** Primary-tinted – camera button, primary FABs */
    primary: {
        shadowColor: '#547792',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.40,
        shadowRadius: 4,
        elevation: 3,
    },
} as const;
