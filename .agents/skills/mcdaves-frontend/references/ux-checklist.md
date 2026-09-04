# UX Design Checklist

Use this checklist when building or reviewing any user-facing feature.

## Accessibility
- [ ] All interactive elements have ARIA labels.
- [ ] Focus states are visible on all interactive elements.
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for large text).
- [ ] Keyboard navigation works (Tab, Enter, Escape).
- [ ] Screen reader announces meaningful content.

## Responsiveness
- [ ] Tested at 375px (mobile).
- [ ] Tested at 768px (tablet).
- [ ] Tested at 1280px (desktop).
- [ ] Touch targets are at least 44×44px on mobile.
- [ ] No horizontal scrolling on any viewport.

## States
- [ ] Loading state defined and implemented.
- [ ] Error state defined and implemented (with actionable message).
- [ ] Empty state defined and implemented (with call-to-action).
- [ ] Disabled state for buttons/inputs when appropriate.

## Brand Consistency
- Use the "Sightly by McDaves" premium aesthetic: dark modes, glassmorphism, vibrant accents.
- Follow the Tailwind design scale — no arbitrary pixel values.
- Prefer `lucide-react` icons (already in project dependencies).

## Forms
- [ ] Validation feedback is inline and immediate.
- [ ] Submit button shows loading state during submission.
- [ ] Error messages are specific and actionable.
- [ ] Success confirmation is clear.
