# Skill Badge Customization Guide

This guide explains how to customize the appearance of skill badges in the application, including colors for borders, fills, and text.

## Overview

Skill badges in the application support two display modes:
1. **Progress fill badges** - Used for `technical_skill`, `role`, `technology_domain`, and `industry` types
2. **Simple badges** - Used for `soft_skill` and `certification` types

## Color Customization

All skill badge colors are controlled via CSS variables defined in `/app/globals.css`. You can easily customize these variables to match your design requirements.

### CSS Variables

The following CSS variables control the skill badge appearance:

```css
/* Light mode (default) */
--skill-badge-border: hsl(var(--primary) / 0.3);        /* Border color - 30% opacity of primary */
--skill-badge-border-hover: hsl(var(--primary) / 0.5);  /* Border hover - 50% opacity of primary */
--skill-badge-fill: hsl(var(--primary) / 0.4);          /* Progress fill - 40% opacity of primary */
--skill-badge-background: transparent;                   /* Background (usually transparent) */
--skill-badge-text: hsl(var(--primary));                /* Text color - primary color */
--skill-badge-text-filled: hsl(var(--primary-foreground)); /* Text when fill reaches it */

/* Dark mode */
/* Same variables with slightly different opacity values */
```

### Current Default Values

The skill badge colors are linked to the application's primary color:
- **Light mode primary**: `0 0% 9%` (very dark gray/black)
- **Dark mode primary**: `0 0% 98%` (very light gray/white)

## How to Customize

### Method 1: Change Primary Colors
Modify the primary color in `globals.css` to affect all skill badges:

```css
:root {
  --primary: 220 90% 50%; /* Example: blue primary color */
}
```

### Method 2: Custom Skill Badge Colors
Override the skill badge variables directly for independent control:

```css
:root {
  /* Custom blue theme */
  --skill-badge-border: hsl(220 90% 60%);
  --skill-badge-border-hover: hsl(220 90% 70%);
  --skill-badge-fill: hsl(220 90% 85%);
  --skill-badge-background: hsl(220 90% 98%);
  --skill-badge-text: hsl(220 90% 30%);
  --skill-badge-text-filled: hsl(0 0% 100%);
}

.dark {
  /* Custom blue theme for dark mode */
  --skill-badge-border: hsl(220 90% 40%);
  --skill-badge-border-hover: hsl(220 90% 50%);
  --skill-badge-fill: hsl(220 90% 25%);
  --skill-badge-background: hsl(220 90% 10%);
  --skill-badge-text: hsl(220 90% 80%);
  --skill-badge-text-filled: hsl(220 90% 95%);
}
```

## Example Themes

### Professional Blue
```css
--skill-badge-border: hsl(210 100% 50%);
--skill-badge-border-hover: hsl(210 100% 60%);
--skill-badge-fill: hsl(210 100% 85%);
--skill-badge-text: hsl(210 100% 30%);
```

### Elegant Purple
```css
--skill-badge-border: hsl(270 60% 50%);
--skill-badge-border-hover: hsl(270 60% 60%);
--skill-badge-fill: hsl(270 60% 85%);
--skill-badge-text: hsl(270 60% 30%);
```

### Modern Green
```css
--skill-badge-border: hsl(140 70% 45%);
--skill-badge-border-hover: hsl(140 70% 55%);
--skill-badge-fill: hsl(140 70% 85%);
--skill-badge-text: hsl(140 70% 25%);
```

## Skill Types Reference

Skills that display with progress fill:
- `technical_skill` - Technical skills (React, Python, etc.)
- `role` - Job roles
- `technology_domain` - Technology domains
- `industry` - Industry experience

Skills that display as simple badges:
- `soft_skill` - Soft skills (Communication, Leadership, etc.)
- `certification` - Professional certifications

## Implementation Location

The skill badge component is located at `/components/ui/skill-badge.tsx` and uses these CSS variables to style the badges dynamically based on proficiency levels:
- `beginner` - 33% fill
- `advanced` - 66% fill
- `expert` - 100% fill

## Notes

- The `technical` type is deprecated and should not be used. Use `technical_skill` instead.
- Changes to CSS variables will affect all skill badges across the application.
- Consider maintaining sufficient contrast ratios for accessibility when customizing colors.