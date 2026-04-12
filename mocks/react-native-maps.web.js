// Web stub for react-native-maps — not supported on web
import React from 'react';
import { View } from 'react-native';

const MapView = ({ children, style }) => React.createElement(View, { style }, children);
MapView.Animated = MapView;

export const Marker       = ({ children }) => null;
export const Callout      = ({ children }) => null;
export const Circle       = () => null;
export const Polygon      = () => null;
export const Polyline     = () => null;
export const Overlay      = () => null;
export const Heatmap      = () => null;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

export default MapView;
