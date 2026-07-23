import { useEffect, useRef } from 'react';
import esriConfig from '@arcgis/core/config';
import SceneView from '@arcgis/core/views/SceneView';
import Map from '@arcgis/core/Map';
import styles from './MapWidget.module.css';

esriConfig.assetsPath = `${import.meta.env.BASE_URL}assets`;

function MapWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<SceneView | null>(null);

  useEffect(() => {
    if (!containerRef.current || viewRef.current) return;

    // const scene = new WebScene({
    //   basemap: 'satellite',
    //   ground: 'world-elevation',
    // });

    const map = new Map({
      basemap: 'hybrid',
    });

    const view = new SceneView({
      container: containerRef.current,
      map: map,
      camera: {
        position: {
          longitude: 9,
          latitude: 60,
          z: 120000,
        },
        tilt: 25,
      },
      environment: {
        lighting: {
          date: new Date(),
          directShadowsEnabled: true,
        },
      },
      ui: {
        components: ['zoom', 'compass', 'navigation-toggle'],
      },
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div className={styles.mapContainer}>
      <div ref={containerRef} className={styles.sceneView} />
    </div>
  );
}

export default MapWidget;
