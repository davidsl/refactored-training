/// <reference types="vite/client" />

import type * as React from 'react';

type ArcgisMapProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
	basemap?: string;
	center?: string;
	zoom?: string | number;
};

declare module 'react' {
	namespace JSX {
		interface IntrinsicElements {
			'arcgis-map': ArcgisMapProps;
		}
	}
}

declare module 'react/jsx-runtime' {
	namespace JSX {
		interface IntrinsicElements {
			'arcgis-map': ArcgisMapProps;
		}
	}
}

export {};
