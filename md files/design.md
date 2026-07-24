# SketchFlow Design Guide

## Vision
SketchFlow combines the simplicity of Linear, the structure of Notion, and the infinite canvas of FigJam.
The interface should disappear into the background so users can focus on creating and collaborating.

### Design Principles
- Minimal and professional
- Fast and keyboard-friendly
- Spacious but efficient
- Consistent throughout the application
- Smooth, subtle animations
- No unnecessary gradients or visual noise

## Theme
SketchFlow supports both **Dark Mode** and **Light Mode**.
Dark Mode is the primary experience and should receive the most design attention.
Light Mode should maintain the same spacing, hierarchy, and components while adapting colors for readability.
Users can switch themes at any time.

## Color System
### Primary
- Indigo (#6E56CF)

### Accent
- Cyan (#38BDF8)

### Semantic Colors
- Success → Emerald
- Warning → Amber
- Danger → Rose

Use neutral slate colors for surfaces instead of pure black or gray.
Avoid colorful backgrounds.
Accent colors should only highlight interactions.

## Typography
### Primary Font
- Inter Variable

### Monospace
- JetBrains Mono

Typography should feel similar to:
- Linear
- Notion
- GitHub

Use a clear visual hierarchy.
Prefer 14px body text with comfortable line spacing.

## Spacing
Use a 4px spacing system.

Common spacing:
- 4
- 8
- 12
- 16
- 24
- 32
- 48
- 64

Layouts should have generous whitespace without feeling empty.

## Border Radius
Use subtle rounding.
- Buttons → 4px
- Cards → 8px
- Panels → 12px
- Pills → Fully rounded

Avoid excessive rounding.

## Shadows
Use soft shadows.
Only floating elements should have larger elevation.
Canvas itself should remain flat.

## Motion
Animations should be quick and subtle.
- Hover → ~120ms
- Layout changes → ~200ms
- Dragging should feel smooth and natural

Avoid flashy animations.

## Components
All components should follow a consistent style.
Includes:
- Buttons
- Inputs
- Dropdowns
- Cards
- Sidebar
- Navbar
- Toolbar
- Modals
- Toasts
- Tooltips
- Tabs
- Kanban Cards
- Sticky Notes
- Context Menus
- Chat Components

Maintain consistent spacing, typography, colors, and interaction states.

## Whiteboard
The whiteboard is the product's primary focus.
UI should never distract from the canvas.
Floating controls should use subtle glassmorphism with light blur.
Selection, cursors, comments, and collaboration indicators should be clearly visible without overwhelming the workspace.

## Layout
- Sidebar → Collapsible
- Top Navigation → Fixed
- Canvas → Infinite
- Floating Toolbar → Draggable
- Panels → Resizable where appropriate

Maintain consistent alignment throughout the application.

## Accessibility
- Ensure sufficient color contrast.
- Visible keyboard focus.
- Support keyboard navigation.
- Do not rely on color alone to communicate state.

## Responsive Design
Desktop is the primary experience.
Tablet should remain fully functional.
Mobile should support essential viewing and management features.

## Icons
Use Lucide Icons.
Keep icon sizes consistent.
Prefer outlined icons over filled icons.

## Overall Style
The final product should feel like a combination of:
- Linear
- Notion
- Figma
- FigJam
- Raycast

Keywords:
- Professional
- Minimal
- Calm
- Modern
- Precise
- Fast
- Collaborative
- Content-first

Never prioritize decoration over usability.