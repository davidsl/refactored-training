import esriConfig from '@arcgis/core/config';
import Graphic from '@arcgis/core/Graphic';
import {
  geographicToWebMercator,
  webMercatorToGeographic,
} from '@arcgis/core/geometry/support/webMercatorUtils';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import type MapView from '@arcgis/core/views/MapView';
import type { ClickEvent } from '@arcgis/core/views/input/types';
import '@arcgis/map-components/components/arcgis-map';
import '@arcgis/map-components/components/arcgis-locate';
import '@arcgis/map-components/components/arcgis-layer-list';
import '@arcgis/map-components/components/arcgis-search';
import { useEffect, useRef, useState } from 'react';
import styles from './MapWidget.module.css';
import {
  calculateMissionScore,
  FIELD_NOTE_TARGETS,
  formatDistance,
  getNearestTargetDistanceMeters,
  isWithinHitRadius,
  MISSION_BEST_SCORE_KEY,
} from './missionLogic';

esriConfig.assetsPath = `${import.meta.env.BASE_URL}assets`;

const contaminatedLandLayerUrl =
  'https://testarcgis02.miljodirektoratet.no/arcgis/rest/services/grunnforurensningutv/GrunnforurensningTemakart/MapServer';
const contaminatedLandLayerId = 'contaminated-land-layer';
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
  map?: {
    add: (layer: MapImageLayer) => void;
    remove: (layer: MapImageLayer) => void;
    findLayerById: (id: string) => MapImageLayer | undefined;
  };
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
  const [retryCount, setRetryCount] = useState(0);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [layerStatus, setLayerStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [missionStatus, setMissionStatus] = useState<'briefing' | 'active' | 'completed'>('briefing');
  const [foundTargetIds, setFoundTargetIds] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(readBestScore);
  const [missionFeedback, setMissionFeedback] = useState('Start the investigation when you are ready.');
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
    setLayerStatus('loading');

    async function initializeMap() {
      try {
        await readyMapElement.viewOnReady();
        if (cancelled) return;

        const map = readyMapElement.map;
        const view = readyMapElement.view;
        const viewMap = view?.map;
        if (!map || !view || !viewMap) throw new Error('The map is unavailable.');
        setMapStatus('ready');

        const existingLayer = map.findLayerById(contaminatedLandLayerId);
        if (existingLayer) map.remove(existingLayer);

        const layer = new MapImageLayer({
          id: contaminatedLandLayerId,
          title: 'Grunnforurensning',
          url: contaminatedLandLayerUrl,
        });
        map.add(layer);

        const foundNotesLayer = new GraphicsLayer({
          id: fieldNotesLayerId,
          title: 'Recovered field notes',
          listMode: 'hide',
        });
        viewMap.add(foundNotesLayer);
        foundNotesLayerRef.current = foundNotesLayer;

        const targetPoints = FIELD_NOTE_TARGETS.map(target =>
          geographicToWebMercator(new Point({
            longitude: target.longitude,
            latitude: target.latitude,
          })) as Point
        );

        const clickHandle = view.on('click', (event: ClickEvent) => {
          if (missionStatusRef.current !== 'active') return;

          const activeTargetIndex = foundTargetIdsRef.current.length;
          const activeTarget = FIELD_NOTE_TARGETS[activeTargetIndex];
          const targetPoint = targetPoints[activeTargetIndex];
          if (!activeTarget || !targetPoint) return;

          const targetScreenPoint = view.toScreen(targetPoint);
          if (!targetScreenPoint || !isWithinHitRadius({ x: event.x, y: event.y }, targetScreenPoint)) {
            const clickLocation = webMercatorToGeographic(event.mapPoint) as Point;
            const remainingTargets = FIELD_NOTE_TARGETS.filter(target =>
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
              size: 15,
              outline: { color: '#ffffff', width: 2 },
            }),
            attributes: { id: activeTarget.id },
          }));

          const nextScore = nextFoundIds.length * 100;
          setScore(nextScore);

          if (nextFoundIds.length === FIELD_NOTE_TARGETS.length) {
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
            setMissionFeedback(`Field note recovered. ${FIELD_NOTE_TARGETS.length - nextFoundIds.length} remaining.`);
          }
        });
        removeMapClickHandler = () => clickHandle.remove();

        try {
          await layer.load();
          if (!cancelled) setLayerStatus('loaded');
        } catch {
          if (!cancelled) setLayerStatus('error');
        }
      } catch {
        if (!cancelled) setMapStatus('error');
      }
    }

    void initializeMap();
    return () => {
      cancelled = true;
      removeMapClickHandler?.();
      const foundNotesLayer = foundNotesLayerRef.current;
      const viewMap = readyMapElement.view?.map;
      if (foundNotesLayer && viewMap) viewMap.remove(foundNotesLayer);
      foundNotesLayerRef.current = null;
    };
  }, [retryCount]);

  function beginOrResetMission() {
    const startsNewRound = missionStatus !== 'active';
    const nextStatus = startsNewRound ? 'active' : 'briefing';
    missionStatusRef.current = nextStatus;
    foundTargetIdsRef.current = [];
    elapsedSecondsRef.current = 0;
    foundNotesLayerRef.current?.removeAll();
    setFoundTargetIds([]);
    setElapsedSeconds(0);
    setScore(0);
    setMissionStatus(nextStatus);
    setMissionFeedback(startsNewRound ? 'Find the location described in your first clue.' : 'Investigation reset. Start again when you are ready.');
  }

  const activeTarget = FIELD_NOTE_TARGETS[foundTargetIds.length];
  const formattedTime = `${Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className={styles.mapContainer}>
      <arcgis-map
        id="contaminated-land-map"
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
        <arcgis-layer-list
          slot="top-right"
          show-heading="true"
          visibility-appearance="checkbox"
        />
      </arcgis-map>
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
          <div className={styles.missionProgress} aria-label={`Field notes found: ${foundTargetIds.length} of ${FIELD_NOTE_TARGETS.length}`}>
            <span>Field notes</span>
            <strong>{foundTargetIds.length} / {FIELD_NOTE_TARGETS.length}</strong>
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
        <p className={styles.missionNote}>Game locations are fictional and unrelated to contamination records.</p>
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
      {mapStatus === 'ready' && layerStatus === 'loading' && (
        <div className={styles.mapStatus} role="status">Loading contamination layer...</div>
      )}
      {mapStatus === 'ready' && layerStatus === 'error' && (
        <div className={styles.mapStatus} role="alert">
          <p>The contamination layer could not be loaded.</p>
          <button type="button" onClick={() => setRetryCount(count => count + 1)}>Retry layer</button>
        </div>
      )}
    </div>
  );
}

export default MapWidget;
