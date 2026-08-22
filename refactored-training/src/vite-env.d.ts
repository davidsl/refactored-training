/// <reference types="vite/client" />

import type * as React from 'react';

type ArcgisMapProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
	id?: string;
	basemap?: string;
	center?: string;
	zoom?: string | number;
};

type ArcgisLayerListProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
	showHeading?: string | boolean;
	visibilityAppearance?: string;
};

declare module 'react' {
	namespace JSX {
		interface IntrinsicElements {
			'arcgis-map': ArcgisMapProps;
			'arcgis-layer-list': ArcgisLayerListProps;
		}
	}
}

declare module 'react/jsx-runtime' {
	namespace JSX {
		interface IntrinsicElements {
			'arcgis-map': ArcgisMapProps;
			'arcgis-layer-list': ArcgisLayerListProps;
		}
	}
}

export {};
