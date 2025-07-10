# Font Provider Common Issues Guide

This guide covers common font-related issues in Next.js applications using Shadcn UI, Radix UI, and Google Fonts, along with their solutions.

## The Problem: Portal Elements Don't Inherit Fonts

### What Happens
When using UI libraries like Radix UI (which Shadcn UI is built on), certain components render their content in **portals**. Portals render elements outside the normal DOM tree, often directly under `<body>` or in a separate container.

Components that commonly use portals:
- `DropdownMenu`
- `AlertDialog`
- `Dialog`
- `Tooltip`
- `Popover`
- `Sheet`
- `Toast`

### The Root Cause
When CSS variables are scoped to a wrapper element (like a `FontProvider` div), portal elements can't access these variables because they render outside the wrapper's scope.

```tsx
// ❌ PROBLEMATIC APPROACH
export function FontProvider({ children }: FontProviderProps) {
  return (
    <div className={`${inter.variable} ${spaceMono.variable}`}>
      {children}
    </div>
  );
}
```

In this case, font variables are only available to elements inside the div wrapper, but portal elements render outside this scope.

## The Solution: Apply Font Variables to Document Root

### Implementation
Modify your `FontProvider` to apply CSS variables to the document root:

```tsx
'use client';

import { Inter, Space_Mono } from 'next/font/google';
import { useEffect } from 'react';

// Initialize the Inter font for titles and text
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Initialize the Space Mono font for monospace
export const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

interface FontProviderProps {
  children: React.ReactNode;
}

export function FontProvider({ children }: FontProviderProps) {
  useEffect(() => {
    // Apply semantic font variables to document root so they're available to portals
    document.documentElement.style.setProperty('--font-titles', inter.style.fontFamily);
    document.documentElement.style.setProperty('--font-text', inter.style.fontFamily);
    document.documentElement.style.setProperty('--font-mono', spaceMono.style.fontFamily);
  }, []);

  return (
    <div className={`${inter.variable} ${spaceMono.variable}`}>
      {children}
    </div>
  );
}
```

### CSS Configuration
Ensure your `globals.css` has comprehensive font rules:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-text), system-ui, sans-serif;
  }
  
  /* Typography - Semantic font assignment */
  
  /* Titles use title font */
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-titles), system-ui, sans-serif !important;
  }
  
  /* Text elements use text font */
  p, span, div, li, input, textarea, label, .font-sans {
    font-family: var(--font-text), system-ui, sans-serif !important;
  }
  
  /* Interactive elements use title font for emphasis */
  button, a {
    font-family: var(--font-titles), system-ui, sans-serif !important;
  }
  
  /* Radix UI portal elements that render outside normal DOM tree */
  [data-radix-portal] *, 
  [data-slot="dropdown-menu-content"] *, 
  [data-slot="alert-dialog-content"] *,
  [data-slot="dialog-content"] *,
  [data-slot="tooltip-content"] *,
  [data-slot="popover-content"] * {
    font-family: var(--font-text), system-ui, sans-serif !important;
  }
  
  /* Portal titles should use title font */
  [data-radix-portal] h1, [data-radix-portal] h2, [data-radix-portal] h3, 
  [data-radix-portal] h4, [data-radix-portal] h5, [data-radix-portal] h6,
  [data-slot="alert-dialog-content"] h1, [data-slot="alert-dialog-content"] h2,
  [data-slot="dialog-content"] h1, [data-slot="dialog-content"] h2 {
    font-family: var(--font-titles), system-ui, sans-serif !important;
  }
  
  /* Portal buttons should use title font */
  [data-radix-portal] button, [data-radix-portal] a,
  [data-slot="dropdown-menu-content"] button, [data-slot="dropdown-menu-content"] a,
  [data-slot="alert-dialog-content"] button, [data-slot="alert-dialog-content"] a {
    font-family: var(--font-titles), system-ui, sans-serif !important;
  }
  
  /* Monospace elements */
  .font-mono, code, pre {
    font-family: var(--font-mono), monospace !important;
  }
}
```

## Common Pitfalls and Solutions

### 1. CSS Variables Not Defined
**Problem**: Elements show fallback fonts (Times New Roman, etc.)
**Diagnosis**: Check if `var(--font-titles)` or `var(--font-text)` resolves to a valid font family
**Solution**: Ensure variables are applied to `:root` or `document.documentElement`

### 2. Portal Elements Still Using Wrong Fonts
**Problem**: Dropdown menus, dialogs still show system fonts
**Diagnosis**: Inspect element and check computed `font-family`
**Solution**: Add specific CSS rules for portal containers:

```css
/* Target all portal elements */
[data-radix-portal] * {
  font-family: var(--font-text), system-ui, sans-serif !important;
}

/* Target specific component slots */
[data-slot="dropdown-menu-content"] *,
[data-slot="alert-dialog-content"] *,
[data-slot="dialog-content"] * {
  font-family: var(--font-text), system-ui, sans-serif !important;
}

/* Ensure portal titles use title font */
[data-radix-portal] h1, [data-radix-portal] h2, [data-radix-portal] h3,
[data-radix-portal] h4, [data-radix-portal] h5, [data-radix-portal] h6 {
  font-family: var(--font-titles), system-ui, sans-serif !important;
}
```

### 3. Font Variables Not Available During SSR
**Problem**: Fonts work in development but not in production
**Solution**: Use `useEffect` to apply variables client-side and ensure CSS fallbacks:

```css
/* Always provide fallbacks */
body {
  font-family: var(--font-text), system-ui, sans-serif;
}
```

### 4. Third-Party Components Override Fonts
**Problem**: Some components have their own font declarations
**Solution**: Use `!important` in your CSS rules or increase specificity:

```css
/* High specificity for component libraries */
.my-app [data-radix-portal] *,
.my-app [role="dialog"] *,
.my-app [role="menu"] * {
  font-family: var(--font-text), system-ui, sans-serif !important;
}
```

## Debugging Font Issues

### 1. Inspect Element Method
1. Right-click on the problematic element
2. Select "Inspect Element"
3. Check the "Computed" tab for `font-family`
4. Look for CSS variable resolution

### 2. Console Debugging
```javascript
// Check if CSS variables are defined
getComputedStyle(document.documentElement).getPropertyValue('--font-titles')
getComputedStyle(document.documentElement).getPropertyValue('--font-text')
getComputedStyle(document.documentElement).getPropertyValue('--font-mono')

// Check computed font on specific element
getComputedStyle(document.querySelector('[data-radix-portal]')).fontFamily
```

### 3. Common Indicators
- **Times New Roman**: CSS variable not defined or not accessible
- **Arial/Helvetica**: System font fallback working
- **Correct font name**: Everything working properly

## Prevention Checklist

- [ ] Font variables applied to `:root` or `document.documentElement`
- [ ] CSS includes rules for `[data-radix-portal] *`
- [ ] All portal-based components tested (dropdowns, dialogs, tooltips)
- [ ] Fallback fonts specified in CSS
- [ ] Font loading tested in production build
- [ ] Mobile devices tested (different font rendering)

## Component-Specific Solutions

### Dropdown Menus
```css
[data-slot="dropdown-menu-content"] * {
  font-family: var(--font-text), system-ui, sans-serif !important;
}
```

### Alert Dialogs
```css
[data-slot="alert-dialog-content"] * {
  font-family: var(--font-text), system-ui, sans-serif !important;
}

/* Dialog titles should use title font */
[data-slot="alert-dialog-content"] h1,
[data-slot="alert-dialog-content"] h2 {
  font-family: var(--font-titles), system-ui, sans-serif !important;
}
```

### Toasts
```css
[data-sonner-toast] * {
  font-family: var(--font-text), system-ui, sans-serif !important;
}
```

## Final Notes

- Always test font inheritance in portal-based components
- Use `!important` sparingly but don't hesitate when dealing with third-party overrides
- Consider using CSS custom properties at the root level for better accessibility
- Test on different devices and browsers as font rendering can vary
- Keep fallback fonts in your CSS for better user experience during font loading

This approach ensures consistent typography across your entire application, including components that render outside the normal DOM tree.