import esriConfig from '@arcgis/core/config';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import '@arcgis/map-components/components/arcgis-map';
import '@arcgis/map-components/components/arcgis-locate';
import '@arcgis/map-components/components/arcgis-layer-list';
import '@arcgis/map-components/components/arcgis-search';
import { useEffect, useRef, useState } from 'react';
import styles from './MapWidget.module.css';

esriConfig.assetsPath = `${import.meta.env.BASE_URL}assets`;

const contaminatedLandLayerUrl =
  'https://testarcgis02.miljodirektoratet.no/arcgis/rest/services/grunnforurensningutv/GrunnforurensningTemakart/MapServer';
const contaminatedLandLayerId = 'contaminated-land-layer';

type ArcgisMapElement = HTMLElement & {
  map?: {
    add: (layer: MapImageLayer) => void;
    remove: (layer: MapImageLayer) => void;
    findLayerById: (id: string) => MapImageLayer | undefined;
  };
  viewOnReady: () => Promise<void>;
};

function MapWidget() {
  const mapRef = useRef<ArcgisMapElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [layerStatus, setLayerStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    const mapElement = mapRef.current;

    if (!mapElement) {
      return;
    }
    const readyMapElement = mapElement;

    let cancelled = false;
    setMapStatus('loading');
    setLayerStatus('loading');

    async function initializeMap() {
      try {
        await readyMapElement.viewOnReady();
        if (cancelled) return;

        const map = readyMapElement.map;
        if (!map) throw new Error('The map is unavailable.');
        setMapStatus('ready');

        const existingLayer = map.findLayerById(contaminatedLandLayerId);
        if (existingLayer) map.remove(existingLayer);

        const layer = new MapImageLayer({
          id: contaminatedLandLayerId,
          title: 'Grunnforurensning',
          url: contaminatedLandLayerUrl,
        });
        map.add(layer);

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
    };
  }, [retryCount]);

  return (
    <div className={styles.mapContainer}>
      <arcgis-map
        id="contaminated-land-map"
        key={retryCount}
        ref={mapRef}
        className={styles.sceneView}
        basemap="dark-gray"
        center="9,60"
        zoom="8"
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
