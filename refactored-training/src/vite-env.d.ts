/// <reference types="vite/client" />

import type * as React from 'react';

type ArcgisMapProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
	id?: string;
	basemap?: string;
	center?: string;
	zoom?: string | number;
};

type ArcgisSearchProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
	allPlaceholder?: string;
	label?: string;
};

type ArcgisLocateProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
	label?: string;
};

declare module 'react' {
	namespace JSX {
		interface IntrinsicElements {
			'arcgis-map': ArcgisMapProps;
			'arcgis-search': ArcgisSearchProps;
			'arcgis-locate': ArcgisLocateProps;
		}
	}
}

declare module 'react/jsx-runtime' {
	namespace JSX {
		interface IntrinsicElements {
			'arcgis-map': ArcgisMapProps;
			'arcgis-search': ArcgisSearchProps;
			'arcgis-locate': ArcgisLocateProps;
		}
	}
}

export {};
