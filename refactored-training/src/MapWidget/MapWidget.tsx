import esriConfig from '@arcgis/core/config';
import '@arcgis/map-components/components/arcgis-map';
import styles from './MapWidget.module.css';

esriConfig.assetsPath = `${import.meta.env.BASE_URL}assets`;

function MapWidget() {
  return (
    <div className={styles.mapContainer}>
      <arcgis-map
        className={styles.sceneView}
        basemap="hybrid"
        center="9,60"
        zoom="8"
      />
    </div>
  );
}

export default MapWidget;
