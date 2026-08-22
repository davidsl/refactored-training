import esriConfig from '@arcgis/core/config';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import '@arcgis/map-components/components/arcgis-map';
import '@arcgis/map-components/components/arcgis-layer-list';
import { useEffect, useRef } from 'react';
import styles from './MapWidget.module.css';

esriConfig.assetsPath = `${import.meta.env.BASE_URL}assets`;

const contaminatedLandLayerUrl =
  'https://testarcgis02.miljodirektoratet.no/arcgis/rest/services/grunnforurensningutv/GrunnforurensningTemakart/MapServer';

type ArcgisMapElement = HTMLElement & {
  map?: { add: (layer: MapImageLayer) => void };
  viewOnReady: () => Promise<void>;
};

function MapWidget() {
  const mapRef = useRef<ArcgisMapElement>(null);

  useEffect(() => {
    const mapElement = mapRef.current;

    if (!mapElement) {
      return;
    }

    void mapElement.viewOnReady().then(() => {
      mapElement.map?.add(
        new MapImageLayer({
          title: 'Grunnforurensning',
          url: contaminatedLandLayerUrl,
        }),
      );
    });
  }, []);

  return (
    <div className={styles.mapContainer}>
      <arcgis-map
        id="contaminated-land-map"
        ref={mapRef}
        className={styles.sceneView}
        basemap="dark-gray"
        center="9,60"
        zoom="8"
      >
        <arcgis-layer-list
          slot="top-right"
          show-heading="true"
          visibility-appearance="checkbox"
        />
      </arcgis-map>
    </div>
  );
}

export default MapWidget;
