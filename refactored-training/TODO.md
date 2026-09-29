# Field Investigator Backlog

## Next Up

- [x] Add a clue-area navigation action that recenters or zooms the map without revealing the exact target. Random locations can be outside the initial map view.
- [x] Validate every target coordinate against the basemap and confirm clues identify public, land-based places accurately.
- [x] Avoid selecting the same three locations in consecutive rounds.
- [x] Add an optional hint after repeated misses or a time threshold, with a small score penalty.

## Gameplay

- [x] Add difficulty settings for hit radius, hint availability, and time bonus.
- [x] Show a round summary with notes found, elapsed time, base points, and time bonus.
- [x] Add location packs for other regions, with a clear region selector before a round starts.
- [x] Add a short tutorial mission that teaches clues, misses, distance feedback, and target markers.
- [x] Add a "Give up and show" button that reveals the active note, advances the clue, and applies a clear score penalty; giving up on the final note should complete the round.

## Accessibility And Quality

- [x] Provide keyboard-accessible map target selection as an alternative to clicking the map.
- [x] Check mission-panel and map-control layout at narrow mobile sizes and high zoom levels.
- [x] Add tests that verify every authored target is unique, has a clue, and uses valid geographic coordinates.
- [x] Add browser coverage for replaying with a different target set and for reduced-motion behavior.