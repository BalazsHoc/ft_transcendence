# Development-only pages and components

The files in this directory are retained as temporary API and design-system
references. They are intentionally excluded from the production router in
`src/app/App.tsx` and should not be linked from the application UI.

If a developer needs them locally, add a separate dev-only route or import
them from a local development entrypoint. Do not add them back to the main
production route tree without an explicit review.
