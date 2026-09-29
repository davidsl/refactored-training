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
import type { ClickEvent } from '@arcgis/core/views/input/types';
import '@arcgis/map-components/components/arcgis-map';
import '@arcgis/map-components/components/arcgis-locate';
import '@arcgis/map-components/components/arcgis-search';
import { useEffect, useRef, useState } from 'react';
import styles from './MapWidget.module.css';
import {
  calculateMissionScore,
  createMissionTargets,
  FIELD_NOTE_LOCATIONS,
  formatDistance,
  getNearestTargetDistanceMeters,
  isWithinHitRadius,
  MISSION_BEST_SCORE_KEY,
} from './missionLogic';

esriConfig.assetsPath = `${import.meta.env.BASE_URL}assets`;

const fieldNotesLayerId = 'field-notes-found-layer';

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
  const foundNotesLayerRef = useRef<GraphicsLayer | null>(null);
  const missionStatusRef = useRef<'briefing' | 'active' | 'completed'>('briefing');
  const foundTargetIdsRef = useRef<string[]>([]);
  const elapsedSecondsRef = useRef(0);
  const bestScoreRef = useRef<number | null>(null);
  const clickPulseIdRef = useRef(0);
  const [retryCount, setRetryCount] = useState(0);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [missionStatus, setMissionStatus] = useState<'briefing' | 'active' | 'completed'>('briefing');
  const [missionTargets, setMissionTargets] = useState(createMissionTargets);
  const missionTargetsRef = useRef(missionTargets);
  const [foundTargetIds, setFoundTargetIds] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(readBestScore);
  const [missionFeedback, setMissionFeedback] = useState('Start the investigation when you are ready.');
  const [clickPulse, setClickPulse] = useState<{ id: number; x: number; y: number } | null>(null);
  if (bestScoreRef.current === null) bestScoreRef.current = bestScore;

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
        FIELD_NOTE_LOCATIONS.forEach(target => {
          targetPoints.set(target.id, geographicToWebMercator(new Point({
            longitude: target.longitude,
            latitude: target.latitude,
          })) as Point);
        });

        const clickHandle = view.on('click', (event: ClickEvent) => {
          if (missionStatusRef.current !== 'active') return;

          const roundTargets = missionTargetsRef.current;
          const activeTargetIndex = foundTargetIdsRef.current.length;
          const activeTarget = roundTargets[activeTargetIndex];
          const targetPoint = activeTarget ? targetPoints.get(activeTarget.id) : undefined;
          if (!activeTarget || !targetPoint) return;

          const pulseId = ++clickPulseIdRef.current;
          setClickPulse({ id: pulseId, x: event.x, y: event.y });

          const targetScreenPoint = view.toScreen(targetPoint);
          if (!targetScreenPoint || !isWithinHitRadius({ x: event.x, y: event.y }, targetScreenPoint)) {
            const clickLocation = webMercatorToGeographic(event.mapPoint) as Point;
            const remainingTargets = roundTargets.filter(target =>
              !foundTargetIdsRef.current.includes(target.id)
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
            setMissionFeedback(`No field note here. ${distanceHint} Follow the clue and try another spot.`);
            return;
          }

          if (foundTargetIdsRef.current.includes(activeTarget.id)) return;

          const nextFoundIds = [...foundTargetIdsRef.current, activeTarget.id];
          foundTargetIdsRef.current = nextFoundIds;
          setFoundTargetIds(nextFoundIds);
          foundNotesLayer.add(new Graphic({
            geometry: targetPoint,
            symbol: new SimpleMarkerSymbol({
              color: '#dc8b43',
              size: 38,
              outline: { color: '#ffffff', width: 3 },
            }),
            attributes: { id: activeTarget.id },
          }));

          const nextScore = nextFoundIds.length * 100;
          setScore(nextScore);

          if (nextFoundIds.length === roundTargets.length) {
            const finalScore = calculateMissionScore(nextFoundIds.length, elapsedSecondsRef.current);
            missionStatusRef.current = 'completed';
            setMissionStatus('completed');
            setScore(finalScore);
            setMissionFeedback(`Case closed. Final score: ${finalScore} points.`);
            const nextBestScore = Math.max(bestScoreRef.current ?? 0, finalScore);
            bestScoreRef.current = nextBestScore;
            setBestScore(nextBestScore);
            try {
              window.localStorage.setItem(MISSION_BEST_SCORE_KEY, String(nextBestScore));
            } catch {
              setMissionFeedback(`Case closed. Final score: ${finalScore} points. Best score could not be saved.`);
            }
          } else {
            setMissionFeedback(`Field note recovered. ${roundTargets.length - nextFoundIds.length} remaining.`);
          }
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
      const viewMap = readyMapElement.view?.map;
      if (foundNotesLayerRef.current && viewMap) viewMap.remove(foundNotesLayerRef.current);
      foundNotesLayerRef.current = null;
    };
  }, [retryCount]);

  function beginOrResetMission() {
    const resettingActiveRound = missionStatus === 'active';
    if (resettingActiveRound || missionStatus === 'completed') {
      const nextTargets = createMissionTargets();
      missionTargetsRef.current = nextTargets;
      setMissionTargets(nextTargets);
    }
    const nextStatus = resettingActiveRound ? 'briefing' : 'active';
    missionStatusRef.current = nextStatus;
    foundTargetIdsRef.current = [];
    elapsedSecondsRef.current = 0;
    setClickPulse(null);
    foundNotesLayerRef.current?.removeAll();
    setFoundTargetIds([]);
    setElapsedSeconds(0);
    setScore(0);
    setMissionStatus(nextStatus);
    setMissionFeedback(resettingActiveRound ? 'Investigation reset. Start again when you are ready.' : 'Find the location described in your first clue.');
  }

  const activeTarget = missionTargets[foundTargetIds.length];
  const formattedTime = `${Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className={styles.mapContainer}>
      <arcgis-map
        id="field-investigator-map"
        key={retryCount}
        ref={mapRef}
        className={styles.sceneView}
        basemap="dark-gray"
        center="10.7,59.9"
        zoom="9"
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
        <p className={styles.missionEyebrow}>Field Investigator / Mission 01</p>
        <h1 id="mission-title">The missing field notes</h1>
        <p className={styles.missionObjective}>
          Search the Oslofjord shoreline and recover three field notes.
        </p>
        <p className={styles.missionClue}>
          {activeTarget ? `Clue ${foundTargetIds.length + 1}: ${activeTarget.clue}` : 'All field notes have been recovered.'}
        </p>
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
        <p className={styles.missionStatus} role="status" aria-live="polite">
          {missionStatus === 'active' ? 'Investigation in progress' : missionStatus === 'completed' ? 'Case closed' : 'Mission briefing'}
        </p>
        <p className={styles.missionFeedback} aria-live="polite">{missionFeedback}</p>
        <p className={styles.missionNote}>Field notes are fictional; locations mark public places.</p>
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
