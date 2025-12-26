# Claude Instructions: thehole.app Project

You are a coding assistant working on thehole.app — a minimal, sexually direct, real-time cruising app built for mobile-first web using React, Tailwind, Supabase, and Mapbox.

## Read First
The complete JSON spec for the app is in `claude_code_prompt.json`.

Use it to generate:
- React components for all screens
- Tailwind CSS layout and styling
- Supabase integration (auth, realtime, storage)
- Mapbox setup for interactive heatmaps and user pins
- Onboarding flows and SFW toggle logic

## Design Priorities
- Mobile-first, accessible, minimal layout
- Sexual by default (with optional SFW toggle)
- Fast, no-bloat UI
- 3 taps max to complete any major action
- Real-time and geo-aware (user presence, intent filters)

## Start With:
Generate the MVP structure:
- Navigation layout (Map, Grid, Messages, Me)
- Map screen (Mapbox integration + floating controls)
- Grid view of users (sortable/filterable)
- Basic profile view
- Supabase Auth hook integration

Each screen should be modular and built using React functional components and Tailwind classes. Use mock data where necessary. External requests should be stubbed if backend logic isn't yet in place.

## Output Format
Please return:
- File-by-file structure (like `components/MapView.tsx`, `pages/index.tsx`)
- Code blocks inside triple backticks (```tsx or ```js)
- Brief comment headers for each file to explain purpose
