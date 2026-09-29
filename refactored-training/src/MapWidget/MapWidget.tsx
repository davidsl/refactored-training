import esriConfig from '@arcgis/core/config';
import Graphic from '@arcgis/core/Graphic';
import {
  geographicToWebMercator,
  webMercatorToGeographic,
} from '@arcgis/core/geometry/support/webMercatorUtils';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import type MapView from '@arcgis/core/views/MapView';
import type { ImmediateClickEvent } from '@arcgis/core/views/input/types';
import '@arcgis/map-components/components/arcgis-map';
import '@arcgis/map-components/components/arcgis-locate';
import '@arcgis/map-components/components/arcgis-search';
import { useEffect, useRef, useState } from 'react';
import styles from './MapWidget.module.css';
import {
  calculateMissionScoreBreakdown,
  createMissionTargets,
  DEFAULT_MISSION_DIFFICULTY,
  FIELD_NOTE_LOCATION_PACKS,
  formatDistance,
  GIVE_UP_SCORE_PENALTY,
  getCompassDirection,
  getNearestTargetDistanceMeters,
  isWithinHitRadius,
  MISSION_DIFFICULTIES,
  MISSION_BEST_SCORE_KEY,
  type MissionDifficulty,
  type LocationPackId,
  type MissionScoreBreakdown,
} from './missionLogic';

esriConfig.assetsPath = `${import.meta.env.BASE_URL}assets`;

const fieldNotesLayerId = 'field-notes-found-layer';
const allFieldNoteLocations = Object.values(FIELD_NOTE_LOCATION_PACKS).flatMap(pack => pack.locations);

function readBestScore(): number {
  try {
    const savedScore = Number(window.localStorage.getItem(MISSION_BEST_SCORE_KEY));
    return Number.isSafeInteger(savedScore) && savedScore > 0 ? savedScore : 0;
  } catch {
    return 0;
  }
}

type ArcgisMapElement = HTMLElement & {
  view?: MapView;
  viewOnReady: () => Promise<void>;
};

function MapWidget() {
  const mapRef = useRef<ArcgisMapElement>(null);
  const submitMapGuessRef = useRef<(point: Point, screenX: number, screenY: number) => void>(() => {});
  const foundNotesLayerRef = useRef<GraphicsLayer | null>(null);
  const missionStatusRef = useRef<'briefing' | 'active' | 'completed'>('briefing');
  const foundTargetIdsRef = useRef<string[]>([]);
  const resolvedTargetIdsRef = useRef<string[]>([]);
  const givenUpTargetIdsRef = useRef<string[]>([]);
  const missCountRef = useRef(0);
  const scorePenaltyRef = useRef(0);
  const hintUsedForTargetRef = useRef(false);
  const finishRoundRef = useRef<(foundCount: number) => void>(() => {});
  const tutorialModeRef = useRef(false);
  const elapsedSecondsRef = useRef(0);
  const bestScoreRef = useRef<number | null>(null);
  const clickPulseIdRef = useRef(0);
  const [retryCount, setRetryCount] = useState(0);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [missionStatus, setMissionStatus] = useState<'briefing' | 'active' | 'completed'>('briefing');
  const [tutorialMode, setTutorialMode] = useState(false);
  const [locationPackId, setLocationPackId] = useState<LocationPackId>('oslofjord');
  const [difficulty, setDifficulty] = useState<MissionDifficulty>(DEFAULT_MISSION_DIFFICULTY);
  const difficultyRef = useRef<MissionDifficulty>(DEFAULT_MISSION_DIFFICULTY);
  const [missionTargets, setMissionTargets] = useState(() =>
    createMissionTargets(Math.random, [], FIELD_NOTE_LOCATION_PACKS.oslofjord.locations)
  );
  const missionTargetsRef = useRef(missionTargets);
  const [foundTargetIds, setFoundTargetIds] = useState<string[]>([]);
  const [resolvedTargetIds, setResolvedTargetIds] = useState<string[]>([]);
  const [givenUpTargetIds, setGivenUpTargetIds] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<MissionScoreBreakdown | null>(null);
  const [hintAvailable, setHintAvailable] = useState(false);
  const [bestScore, setBestScore] = useState(readBestScore);
  const [missionFeedback, setMissionFeedback] = useState('Start the investigation when you are ready.');
  const [clickPulse, setClickPulse] = useState<{ id: number; x: number; y: number } | null>(null);
  if (bestScoreRef.current === null) bestScoreRef.current = bestScore;

  useEffect(() => {
    finishRoundRef.current = foundCount => {
      const activeRules = MISSION_DIFFICULTIES[difficultyRef.current];
      const breakdown = calculateMissionScoreBreakdown(
        foundCount,
        elapsedSecondsRef.current,
        scorePenaltyRef.current,
        activeRules.timeBonusMultiplier
      );
      setScoreBreakdown(breakdown);
      missionStatusRef.current = 'completed';
      setMissionStatus('completed');
      setScore(breakdown.total);
      setHintAvailable(false);
      setMissionFeedback(tutorialModeRef.current
        ? 'Tutorial complete: you followed a clue, used distance feedback, and recovered the marker.'
        : `Case closed. Final score: ${breakdown.total} points.`);
      const nextBestScore = Math.max(bestScoreRef.current ?? 0, breakdown.total);
      bestScoreRef.current = nextBestScore;
      setBestScore(nextBestScore);
      try {
        window.localStorage.setItem(MISSION_BEST_SCORE_KEY, String(nextBestScore));
      } catch {
        setMissionFeedback(`Case closed. Final score: ${breakdown.total} points. Best score could not be saved.`);
      }
    };
  });

  useEffect(() => {
    if (missionStatus !== 'active') return;

    const timerId = window.setInterval(() => {
      setElapsedSeconds(current => {
        const nextSeconds = current + 1;
        elapsedSecondsRef.current = nextSeconds;
        return nextSeconds;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [missionStatus]);

  useEffect(() => {
    bestScoreRef.current = bestScore;
  }, [bestScore]);

  useEffect(() => {
    const mapElement = mapRef.current;

    if (!mapElement) {
      return;
    }
    const readyMapElement = mapElement;

    let cancelled = false;
    let removeMapClickHandler: (() => void) | null = null;
    setMapStatus('loading');

    async function initializeMap() {
      try {
        await readyMapElement.viewOnReady();
        if (cancelled) return;

        const view = readyMapElement.view;
        const viewMap = view?.map;
        if (!view || !viewMap) throw new Error('The map is unavailable.');
        setMapStatus('ready');

        const foundNotesLayer = new GraphicsLayer({
          id: fieldNotesLayerId,
          title: 'Recovered field notes',
          listMode: 'hide',
        });
        viewMap.add(foundNotesLayer);
        foundNotesLayerRef.current = foundNotesLayer;

        const targetPoints = new Map<string, Point>();
        allFieldNoteLocations.forEach(target => {
          targetPoints.set(target.id, geographicToWebMercator(new Point({
            longitude: target.longitude,
            latitude: target.latitude,
          })) as Point);
        });

        const submitMapGuess = (mapPoint: Point, screenX: number, screenY: number) => {
          if (missionStatusRef.current !== 'active') return;

          const activeRules = MISSION_DIFFICULTIES[difficultyRef.current];
          const roundTargets = missionTargetsRef.current;
          const activeTargetIndex = resolvedTargetIdsRef.current.length;
          const activeTarget = roundTargets[activeTargetIndex];
          const targetPoint = activeTarget ? targetPoints.get(activeTarget.id) : undefined;
          if (!activeTarget || !targetPoint) return;

          const pulseId = ++clickPulseIdRef.current;
          setClickPulse({ id: pulseId, x: screenX, y: screenY });

          const targetScreenPoint = view.toScreen(targetPoint);
          if (!targetScreenPoint || !isWithinHitRadius({ x: screenX, y: screenY }, targetScreenPoint, activeRules.hitRadius)) {
            const clickLocation = webMercatorToGeographic(mapPoint) as Point;
            const remainingTargets = roundTargets.filter(target =>
              !resolvedTargetIdsRef.current.includes(target.id)
            );
            const nearestDistance = clickLocation.longitude == null || clickLocation.latitude == null
              ? null
              : getNearestTargetDistanceMeters(
                { longitude: clickLocation.longitude, latitude: clickLocation.latitude },
                remainingTargets
              );
            const distanceHint = nearestDistance === null
              ? 'No field note here.'
              : `The closest remaining field note is ${formatDistance(nearestDistance)} away.`;
            const nextMissCount = missCountRef.current + 1;
            missCountRef.current = nextMissCount;
            const canUseHint = nextMissCount >= activeRules.hintAfterMisses && !hintUsedForTargetRef.current;
            if (canUseHint) setHintAvailable(true);
            const hintPrompt = canUseHint ? ` A directional hint is available for ${activeRules.hintPenalty} points.` : '';
            const tutorialPrompt = tutorialModeRef.current
              ? ' Tutorial step 2 of 3: use the distance feedback, then follow the clue to the note.'
              : '';
            setMissionFeedback(`No field note here. ${distanceHint} Follow the clue and try another spot.${hintPrompt}${tutorialPrompt}`);
            return;
          }

          if (resolvedTargetIdsRef.current.includes(activeTarget.id)) return;

          missCountRef.current = 0;
          hintUsedForTargetRef.current = false;
          setHintAvailable(false);
          const nextFoundIds = [...foundTargetIdsRef.current, activeTarget.id];
          const nextResolvedIds = [...resolvedTargetIdsRef.current, activeTarget.id];
          foundTargetIdsRef.current = nextFoundIds;
          resolvedTargetIdsRef.current = nextResolvedIds;
          setFoundTargetIds(nextFoundIds);
          setResolvedTargetIds(nextResolvedIds);
          foundNotesLayer.add(new Graphic({
            geometry: targetPoint,
            symbol: new SimpleMarkerSymbol({
              color: '#dc8b43',
              size: 38,
              outline: { color: '#ffffff', width: 3 },
            }),
            attributes: { id: activeTarget.id },
          }));

          const nextScore = Math.max(0, nextFoundIds.length * 100 - scorePenaltyRef.current);
          setScore(nextScore);

          if (nextResolvedIds.length === roundTargets.length) {
            finishRoundRef.current(nextFoundIds.length);
          } else {
            setMissionFeedback(`Field note recovered. ${roundTargets.length - nextResolvedIds.length} clues remaining.`);
          }
        };
        submitMapGuessRef.current = submitMapGuess;
        const clickHandle = view.on('immediate-click', (event: ImmediateClickEvent) => {
          submitMapGuess(event.mapPoint, event.x, event.y);
        });
        removeMapClickHandler = () => clickHandle.remove();
      } catch {
        if (!cancelled) setMapStatus('error');
      }
    }

    void initializeMap();
    return () => {
      cancelled = true;
      removeMapClickHandler?.();
      submitMapGuessRef.current = () => {};
      const viewMap = readyMapElement.view?.map;
      if (foundNotesLayerRef.current && viewMap) viewMap.remove(foundNotesLayerRef.current);
      foundNotesLayerRef.current = null;
    };
  }, [retryCount]);

  function chooseDifficulty(nextDifficulty: MissionDifficulty) {
    if (missionStatus === 'active') return;
    difficultyRef.current = nextDifficulty;
    setDifficulty(nextDifficulty);
  }

  function chooseLocationPack(nextPackId: LocationPackId) {
    if (missionStatus === 'active' || nextPackId === locationPackId) return;

    const pack = FIELD_NOTE_LOCATION_PACKS[nextPackId];
    const previousTargetIds = missionTargetsRef.current.map(target => target.id);
    const nextTargets = createMissionTargets(Math.random, previousTargetIds, pack.locations);
    missionTargetsRef.current = nextTargets;
    setMissionTargets(nextTargets);
    setLocationPackId(nextPackId);
    setFoundTargetIds([]);
    setResolvedTargetIds([]);
    resolvedTargetIdsRef.current = [];
    setGivenUpTargetIds([]);
    givenUpTargetIdsRef.current = [];
    foundTargetIdsRef.current = [];
    setScore(0);
    setScoreBreakdown(null);
    tutorialModeRef.current = false;
    setTutorialMode(false);
    setMissionFeedback(`${pack.name} selected. Start the investigation when you are ready.`);

    if (missionStatus === 'completed') {
      missionStatusRef.current = 'briefing';
      setMissionStatus('briefing');
    }

    const view = mapRef.current?.view;
    if (view) {
      const center = geographicToWebMercator(new Point(pack.center)) as Point;
      void view.goTo({ center, zoom: pack.zoom }).catch(() => {
        setMissionFeedback(`Map could not move to ${pack.name}.`);
      });
    }
  }

  function beginOrResetMission() {
    const resettingActiveRound = missionStatus === 'active';
    tutorialModeRef.current = false;
    setTutorialMode(false);
    if (resettingActiveRound || missionStatus === 'completed') {
      const previousTargetIds = missionTargetsRef.current.map(target => target.id);
      const nextTargets = createMissionTargets(
        Math.random,
        previousTargetIds,
        FIELD_NOTE_LOCATION_PACKS[locationPackId].locations
      );
      missionTargetsRef.current = nextTargets;
      setMissionTargets(nextTargets);
    }
    const nextStatus = resettingActiveRound ? 'briefing' : 'active';
    missionStatusRef.current = nextStatus;
    foundTargetIdsRef.current = [];
    resolvedTargetIdsRef.current = [];
    givenUpTargetIdsRef.current = [];
    missCountRef.current = 0;
    scorePenaltyRef.current = 0;
    hintUsedForTargetRef.current = false;
    elapsedSecondsRef.current = 0;
    setClickPulse(null);
    setHintAvailable(false);
    foundNotesLayerRef.current?.removeAll();
    setFoundTargetIds([]);
    setResolvedTargetIds([]);
    setGivenUpTargetIds([]);
    setElapsedSeconds(0);
    setScore(0);
    setScoreBreakdown(null);
    setMissionStatus(nextStatus);
    setMissionFeedback(resettingActiveRound ? 'Investigation reset. Start again when you are ready.' : 'Find the location described in your first clue.');
  }

  function startTutorial() {
    const tutorialTarget = FIELD_NOTE_LOCATION_PACKS[locationPackId].locations[0];
    const tutorialTargets = [tutorialTarget];
    missionTargetsRef.current = tutorialTargets;
    setMissionTargets(tutorialTargets);
    tutorialModeRef.current = true;
    setTutorialMode(true);
    missionStatusRef.current = 'active';
    foundTargetIdsRef.current = [];
    resolvedTargetIdsRef.current = [];
    givenUpTargetIdsRef.current = [];
    missCountRef.current = 0;
    scorePenaltyRef.current = 0;
    hintUsedForTargetRef.current = false;
    elapsedSecondsRef.current = 0;
    setClickPulse(null);
    setHintAvailable(false);
    foundNotesLayerRef.current?.removeAll();
    setFoundTargetIds([]);
    setResolvedTargetIds([]);
    setGivenUpTargetIds([]);
    setElapsedSeconds(0);
    setScore(0);
    setScoreBreakdown(null);
    setMissionStatus('active');
    setMissionFeedback('Tutorial step 1 of 3: read the clue and use Show clue area, then click a different spot to practice a miss.');
  }

  function giveUpAndShow() {
    if (missionStatus !== 'active' || tutorialMode || !activeTarget) return;

    const point = geographicToWebMercator(new Point({
      longitude: activeTarget.longitude,
      latitude: activeTarget.latitude,
    })) as Point;
    const nextResolvedIds = [...resolvedTargetIdsRef.current, activeTarget.id];
    const nextGivenUpIds = [...givenUpTargetIdsRef.current, activeTarget.id];
    resolvedTargetIdsRef.current = nextResolvedIds;
    givenUpTargetIdsRef.current = nextGivenUpIds;
    setResolvedTargetIds(nextResolvedIds);
    setGivenUpTargetIds(nextGivenUpIds);
    foundNotesLayerRef.current?.add(new Graphic({
      geometry: point,
      symbol: new SimpleMarkerSymbol({
        style: 'diamond',
        color: '#be4149',
        size: 38,
        outline: { color: '#ffffff', width: 3 },
      }),
      attributes: { id: activeTarget.id, revealed: true },
    }));

    missCountRef.current = 0;
    hintUsedForTargetRef.current = false;
    scorePenaltyRef.current += GIVE_UP_SCORE_PENALTY;
    setHintAvailable(false);
    setScore(Math.max(0, foundTargetIdsRef.current.length * 100 - scorePenaltyRef.current));

    const remaining = missionTargets.length - nextResolvedIds.length;
    if (remaining === 0) {
      finishRoundRef.current(foundTargetIdsRef.current.length);
    } else {
      setMissionFeedback(`Note revealed. ${remaining} clues remain. ${GIVE_UP_SCORE_PENALTY} points deducted.`);
    }
  }

  const activeTarget = missionTargets[resolvedTargetIds.length];
  const selectedPack = FIELD_NOTE_LOCATION_PACKS[locationPackId];
  const formattedTime = `${Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  function showClueArea() {
    if (!activeTarget) return;

    const view = mapRef.current?.view;
    if (!view) return;

    const clueAreaPoint = geographicToWebMercator(new Point({
      longitude: activeTarget.clueArea.longitude,
      latitude: activeTarget.clueArea.latitude,
    })) as Point;

    void view.goTo({ center: clueAreaPoint, zoom: 12 }).then(() => {
      setMissionFeedback('You are viewing the clue area. The exact note is not marked.');
    }).catch(() => {
      setMissionFeedback('Could not move the map to the clue area.');
    });
  }

  function useHint() {
    if (!activeTarget || !hintAvailable || hintUsedForTargetRef.current) return;

    const hintPenalty = MISSION_DIFFICULTIES[difficulty].hintPenalty;
    hintUsedForTargetRef.current = true;
    setHintAvailable(false);
    scorePenaltyRef.current += hintPenalty;

    const distance = getNearestTargetDistanceMeters(activeTarget.clueArea, [activeTarget]);
    const direction = getCompassDirection(activeTarget.clueArea, activeTarget);
    const nextScore = Math.max(0, foundTargetIdsRef.current.length * 100 - scorePenaltyRef.current);
    setScore(nextScore);
    setMissionFeedback(
      `Hint: the note is about ${formatDistance(distance ?? 0)} ${direction} of the clue area. ${hintPenalty} points deducted.`
    );
  }

  function panMap(horizontal: -1 | 0 | 1, vertical: -1 | 0 | 1) {
    const view = mapRef.current?.view;
    const center = view?.center;
    const extent = view?.extent;
    if (!view || !center || !extent) return;

    const nextCenter = new Point({
      x: center.x + extent.width * horizontal * 0.25,
      y: center.y + extent.height * vertical * 0.25,
      spatialReference: view.spatialReference,
    });
    void view.goTo({ center: nextCenter, zoom: view.zoom });
  }

  function checkMapCenter() {
    const view = mapRef.current?.view;
    const center = view?.center;
    if (!view || !center) return;

    const screenCenter = view.toScreen(center);
    if (screenCenter) submitMapGuessRef.current(center, screenCenter.x, screenCenter.y);
  }

  return (
    <div className={styles.mapContainer}>
      <arcgis-map
        id="field-investigator-map"
        key={retryCount}
        ref={mapRef}
        className={styles.sceneView}
        basemap="dark-gray"
        center={`${selectedPack.center.longitude},${selectedPack.center.latitude}`}
        zoom={selectedPack.zoom}
      >
        <arcgis-search
          slot="top-left"
          all-placeholder="Search addresses and places"
          label="Search map locations"
        />
        <arcgis-locate slot="top-left" label="Use my location" />
      </arcgis-map>
      {clickPulse && (
        <span
          key={clickPulse.id}
          data-testid="map-click-pulse"
          aria-hidden="true"
          className={styles.clickPulse}
          style={{ left: clickPulse.x, top: clickPulse.y }}
          onAnimationEnd={() => setClickPulse(current => current?.id === clickPulse.id ? null : current)}
        />
      )}
      <section className={styles.missionPanel} aria-labelledby="mission-title">
        <p className={styles.missionEyebrow}>
          Field Investigator / {tutorialMode ? 'Tutorial' : selectedPack.name} / Mission 01
        </p>
        <h1 id="mission-title">The missing field notes</h1>
        <p className={styles.missionObjective}>
          {tutorialMode
            ? 'Practice clues, misses, distance feedback, and recovered markers.'
            : `Search ${selectedPack.name} and recover three field notes.`}
        </p>
        {missionStatus !== 'active' && (
          <>
            <label className={styles.locationPackSelector} htmlFor="mission-location-pack">Region</label>
            <select
              id="mission-location-pack"
              className={styles.locationPackSelect}
              value={locationPackId}
              onChange={event => chooseLocationPack(event.target.value as LocationPackId)}
            >
              {Object.values(FIELD_NOTE_LOCATION_PACKS).map(pack => (
                <option key={pack.id} value={pack.id}>{pack.name}</option>
              ))}
            </select>
            <fieldset className={styles.difficultySelector}>
              <legend>Difficulty</legend>
              <div className={styles.difficultyOptions}>
                {(Object.keys(MISSION_DIFFICULTIES) as MissionDifficulty[]).map(level => (
                  <label key={level} className={styles.difficultyOption}>
                    <input
                      type="radio"
                      name="mission-difficulty"
                      value={level}
                      checked={difficulty === level}
                      onChange={() => chooseDifficulty(level)}
                    />
                    <span>{MISSION_DIFFICULTIES[level].label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="button" className={styles.clueAreaButton} onClick={startTutorial}>
              Start tutorial
            </button>
          </>
        )}
        <p className={styles.missionClue}>
          {activeTarget ? `Clue ${resolvedTargetIds.length + 1}: ${activeTarget.clue}` : 'All field notes have been resolved.'}
        </p>
        {missionStatus === 'active' && activeTarget && (
          <button type="button" className={styles.clueAreaButton} onClick={showClueArea}>
            Show clue area
          </button>
        )}
        {missionStatus === 'active' && activeTarget && (
          <div className={styles.keyboardMapControls} role="group" aria-label="Keyboard map controls">
            <div className={styles.mapPanControls} role="group" aria-label="Pan map">
              <button type="button" onClick={() => panMap(0, 1)} aria-label="Pan map north">North</button>
              <button type="button" onClick={() => panMap(-1, 0)} aria-label="Pan map west">West</button>
              <button type="button" onClick={() => panMap(1, 0)} aria-label="Pan map east">East</button>
              <button type="button" onClick={() => panMap(0, -1)} aria-label="Pan map south">South</button>
            </div>
            <button type="button" className={styles.clueAreaButton} onClick={checkMapCenter}>
              Check map center
            </button>
          </div>
        )}
        {missionStatus === 'active' && activeTarget && hintAvailable && (
          <button type="button" className={styles.clueAreaButton} onClick={useHint}>
            Use hint (-{MISSION_DIFFICULTIES[difficulty].hintPenalty} points)
          </button>
        )}
        {missionStatus === 'active' && activeTarget && !tutorialMode && (
          <button type="button" className={styles.clueAreaButton} onClick={giveUpAndShow}>
            Give up and show (-{GIVE_UP_SCORE_PENALTY} points)
          </button>
        )}
        <div className={styles.missionStats}>
          <div className={styles.missionProgress} aria-label={`Field notes found: ${foundTargetIds.length} of ${missionTargets.length}`}>
            <span>Field notes</span>
            <strong>{foundTargetIds.length} / {missionTargets.length}</strong>
          </div>
          <div className={styles.missionProgress}>
            <span>Time</span>
            <strong>{formattedTime}</strong>
          </div>
          <div className={styles.missionProgress}>
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div className={styles.missionProgress}>
            <span>Best</span>
            <strong>{bestScore}</strong>
          </div>
        </div>
        {missionStatus === 'completed' && scoreBreakdown && (
          <section className={styles.roundSummary} aria-labelledby="round-summary-title">
            <h2 id="round-summary-title">Round summary</h2>
            <dl>
              <div>
                <dt>Notes found</dt>
                <dd data-testid="summary-found">{foundTargetIds.length} / {missionTargets.length}</dd>
              </div>
              {givenUpTargetIds.length > 0 && (
                <div>
                  <dt>Notes revealed</dt>
                  <dd data-testid="summary-given-up">{givenUpTargetIds.length}</dd>
                </div>
              )}
              <div>
                <dt>Elapsed time</dt>
                <dd data-testid="summary-elapsed">{formattedTime}</dd>
              </div>
              <div>
                <dt>Base points</dt>
                <dd data-testid="summary-base">{scoreBreakdown.basePoints}</dd>
              </div>
              <div>
                <dt>Time bonus</dt>
                <dd data-testid="summary-time-bonus">+{scoreBreakdown.timeBonus}</dd>
              </div>
              {scoreBreakdown.penalties > 0 && (
                <div>
                  <dt>Penalties</dt>
                  <dd data-testid="summary-penalties">-{scoreBreakdown.penalties}</dd>
                </div>
              )}
              <div className={styles.roundSummaryTotal}>
                <dt>Final score</dt>
                <dd data-testid="summary-total">{scoreBreakdown.total}</dd>
              </div>
            </dl>
          </section>
        )}
        <p className={styles.missionStatus} role="status" aria-live="polite">
          {missionStatus === 'active' ? 'Investigation in progress' : missionStatus === 'completed' ? 'Case closed' : 'Mission briefing'}
        </p>
        <p className={styles.missionFeedback} aria-live="polite">{missionFeedback}</p>
        <p className={styles.missionNote}>
          Field notes are fictional; public locations checked with{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap contributors
          </a>.
        </p>
        <button
          type="button"
          className={styles.missionButton}
          onClick={beginOrResetMission}
        >
          {missionStatus === 'active' ? 'Reset mission' : missionStatus === 'completed' ? 'Play again' : 'Start investigation'}
        </button>
      </section>
      {mapStatus === 'loading' && (
        <div className={styles.mapStatus} role="status">Loading map...</div>
      )}
      {mapStatus === 'error' && (
        <div className={styles.mapStatus} role="alert">
          <p>The map could not be loaded.</p>
          <button type="button" onClick={() => setRetryCount(count => count + 1)}>Retry map</button>
        </div>
      )}
    </div>
  );
}

export default MapWidget;
