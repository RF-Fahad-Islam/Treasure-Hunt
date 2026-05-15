---
name: Treasure Hunt Game System
colors:
  surface: '#f4fce8'
  surface-dim: '#d5ddca'
  surface-bright: '#f4fce8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef7e3'
  surface-container: '#e9f1dd'
  surface-container-high: '#e3ebd8'
  surface-container-highest: '#dde5d2'
  on-surface: '#171e12'
  on-surface-variant: '#3f4a36'
  inverse-surface: '#2b3326'
  inverse-on-surface: '#ecf4e0'
  outline: '#6f7b64'
  outline-variant: '#becbb1'
  surface-tint: '#2b6c00'
  primary: '#2b6c00'
  on-primary: '#ffffff'
  primary-container: '#58cc02'
  on-primary-container: '#1e5000'
  inverse-primary: '#6be026'
  secondary: '#006590'
  on-secondary: '#ffffff'
  secondary-container: '#2fb8ff'
  on-secondary-container: '#004666'
  tertiary: '#9a397a'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff8ed4'
  on-tertiary-container: '#7b1f60'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#87fe45'
  primary-fixed-dim: '#6be026'
  on-primary-fixed: '#082100'
  on-primary-fixed-variant: '#1f5100'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#88ceff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffd8eb'
  tertiary-fixed-dim: '#ffaedd'
  on-tertiary-fixed: '#3b002c'
  on-tertiary-fixed-variant: '#7d2061'
  background: '#f4fce8'
  on-background: '#171e12'
  surface-variant: '#dde5d2'
  reward-gold: '#FFC800'
  danger-red: '#FF4B4B'
  surface-background: '#F7F7F7'
  surface-card: '#FFFFFF'
  text-primary: '#2B2B2B'
  text-secondary: '#777777'
typography:
  timer-display:
    fontFamily: Lexend
    fontSize: 72px
    fontWeight: '800'
    lineHeight: 80px
    letterSpacing: -0.02em
  timer-display-mobile:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
  headline-xl:
    fontFamily: Nunito Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
  headline-xl-mobile:
    fontFamily: Nunito Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Lexend
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  xxl: 64px
  container-margin: 24px
  gutter: 16px
---

# Treasure Hunt Website — Design System
Version: 1.0

## Design Vision
The website should feel:
- Gamified
- Energetic
- Large UI
- Minimal but playful
- Competitive
- Fast and mobile-first
- Similar feel to Duolingo

## Color Palette
- Primary Green: #58CC02 (Success, Actions, Progress)
- Secondary Blue: #1CB0F6 (Information, Navigation, Hints)
- Gold / Reward: #FFC800 (Points, Badges, Achievements)
- Danger Red: #FF4B4B (Timer Urgency, Expired Clue)
- Background: #F7F7F7 (Very light gray)
- Card Background: #FFFFFF
- Text Primary: #2B2B2B
- Text Secondary: #777777

## Typography
- Style: Rounded & friendly (Poppins, Nunito, Inter)
- Heading: Bold, 32–48px
- Subheading: SemiBold, 20–28px
- Body: 16–18px
- Timer: 48–72px (Dominant element)

## Layout System
- Spacing: 8px system (8, 16, 24, 32, 48, 64)
- Border Radius: 24px (Large rounded corners)
- Shadows: Soft shadows

## Components
- Mission Card: Large rounded card, soft shadow, large title, large CTA.
- Primary Button: Rounded pill, large height (56-64px), thick shadow, bold text.
- Progress Tracker: Horizontal progress bar, gamified feeling.
- Team Score Card: Team name, score, rank (rank is big).
- Clue Card: Centered, very readable, large font.
- Live Leaderboard: Card-based, podium for top 3.