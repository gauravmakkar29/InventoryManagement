declare module "react-simple-maps" {
  import { ComponentType, ReactNode, SVGAttributes, CSSProperties } from "react";

  export interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
    parallels?: [number, number];
  }

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    translateExtent?: [[number, number], [number, number]];
    onMoveStart?: (event: { coordinates: [number, number]; zoom: number }) => void;
    onMove?: (event: { coordinates: [number, number]; zoom: number; dragging: boolean }) => void;
    onMoveEnd?: (event: { coordinates: [number, number]; zoom: number }) => void;
    children?: ReactNode;
  }

  export interface GeographiesChildrenArgs {
    geographies: GeographyType[];
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (args: GeographiesChildrenArgs) => ReactNode;
  }

  export interface GeographyType {
    rpiProperties: Record<string, unknown>;
    type: string;
    properties: Record<string, unknown>;
    geometry: Record<string, unknown>;
    id: string;
  }

  export interface GeographyProps extends SVGAttributes<SVGPathElement> {
    geography: GeographyType;
  }

  export interface MarkerProps extends SVGAttributes<SVGGElement> {
    coordinates: [number, number];
    children?: ReactNode;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const Marker: ComponentType<MarkerProps>;
}
