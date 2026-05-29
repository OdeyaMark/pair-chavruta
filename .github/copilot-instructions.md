This is a Wix Dashboard App built with React. It uses @wix/dashboard and @wix/data packages only.
It does NOT use $w() selectors, onReady() events, or any other Wix APIs.

When reviewing code changes, focus on:

## @wix/dashboard usage
- dashboard.showToast() calls have valid type ("success" | "error" | "warning") and message
- dashboard.navigate() is called with a valid pageId
- dashboard.observeState() is cleaned up properly (unsubscribed in useEffect cleanup)
- showModal() and closeModal() are balanced — no modals left open on unmount

## @wix/data usage
- Every wixData query/insert/update/remove call is properly awaited
- .query() chains always end with .find() or .get()
- dataCollectionId strings were not accidentally changed or typo'd during refactoring
- Filters and sorting applied in the correct order on query chains
- Error handling (try/catch) is present on all data mutation calls (insert, update, remove)

## React integrity
- useEffect dependency arrays are complete — missing deps cause stale data
- No hooks called conditionally or inside loops
- Components are not missing props that existed before the refactor
- Cleanup functions in useEffect unsubscribe from any @wix/dashboard observers

## Module reorganization risks
- Named exports that were renamed still have all consumers updated
- Barrel files (index.js) re-export everything they used to
- No circular imports introduced by the reorganization
- Relative import paths are correct after files were moved
- Shared utility functions that were extracted still receive all the data they need