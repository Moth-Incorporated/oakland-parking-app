import * as L from 'leaflet';
import { clusterSpots, STREET_ZOOM, type Cluster } from '../geo';
import type { LatLng, Spot, ViewState } from '../types';

export interface MapHandlers {
    onSelect(spot: Spot): void;
    onViewChange(view: ViewState): void;
    onBackgroundTap(): void;
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Leaflet wrapper. Zoomed out, vacant spots collapse into gold count bubbles (FR1/FR8).
 * At street level (zoom 17+) every vacant spot becomes its own tappable pin with an F or $ badge (FR2).
 */
export class ParkingMap {
    private map: L.Map;
    private markers = L.layerGroup();
    private spots: Spot[] = [];
    private selectedId: number | null = null;
    private me: L.Marker | null = null;

    constructor(
        el: HTMLElement,
        center: LatLng,
        private handlers: MapHandlers,
    ) {
        this.map = L.map(el, {
            zoomControl: false,
            minZoom: 12,
            maxZoom: 19,
            zoomAnimation: !reduceMotion,
            fadeAnimation: !reduceMotion,
            markerZoomAnimation: !reduceMotion,
        }).setView([center.lat, center.lng], 16);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);
        this.markers.addTo(this.map);

        this.map.on('zoomend', () => this.render());
        this.map.on('moveend', () => this.emitView());
        this.map.on('click', () => this.handlers.onBackgroundTap());
    }

    setSpots(spots: Spot[]): void {
        this.spots = spots;
        this.render();
    }

    select(id: number | null): void {
        this.selectedId = id;
        this.render();
    }

    setUser(pos: LatLng): void {
        if (this.me) {
            this.me.setLatLng([pos.lat, pos.lng]);
            return;
        }
        this.me = L.marker([pos.lat, pos.lng], {
            icon: L.divIcon({ className: 'me-wrap', html: '<span class="me"></span>', iconSize: [44, 44], iconAnchor: [22, 22] }),
            interactive: false,
            keyboard: false,
            zIndexOffset: 1000,
        }).addTo(this.map);
    }

    flyTo(pos: LatLng, zoom: number): void {
        this.go([pos.lat, pos.lng], zoom);
    }

    /** Jump to street level around the current center (the sheet's "Zoom in" action). */
    zoomToStreets(): void {
        const c = this.map.getCenter();
        this.go([c.lat, c.lng], STREET_ZOOM);
    }

    /** Centers a spot slightly above the middle so the detail sheet does not cover it. */
    focusSpot(spot: Spot): void {
        const zoom = Math.max(this.map.getZoom(), STREET_ZOOM);
        const shifted = this.map
            .project([spot.lat, spot.lng], zoom)
            .add([0, Math.round(this.map.getSize().y * 0.18)]);
        const target = this.map.unproject(shifted, zoom);
        this.go([target.lat, target.lng], zoom);
    }

    private go(target: L.LatLngExpression, zoom: number): void {
        if (reduceMotion) this.map.setView(target, zoom, { animate: false });
        else this.map.flyTo(target, zoom, { duration: 0.6 });
    }

    private render(): void {
        this.markers.clearLayers();
        const vacant = this.spots.filter((s) => s.status === 'vacant');
        const zoom = this.map.getZoom();
        if (zoom >= STREET_ZOOM) {
            for (const spot of vacant) this.markers.addLayer(this.spotMarker(spot));
        } else {
            for (const cluster of clusterSpots(vacant, zoom)) this.markers.addLayer(this.clusterMarker(cluster, zoom));
        }
        this.emitView();
    }

    private emitView(): void {
        const bounds = this.map.getBounds();
        const zoom = this.map.getZoom();
        this.handlers.onViewChange({
            zoom,
            streetLevel: zoom >= STREET_ZOOM,
            inView: this.spots.filter((s) => s.status === 'vacant' && bounds.contains([s.lat, s.lng])),
        });
    }

    private spotMarker(spot: Spot): L.Marker {
        const selected = spot.id === this.selectedId;
        const classes = `pin ${spot.isFree ? 'pin--free' : 'pin--paid'}${selected ? ' pin--selected' : ''}`;
        const marker = L.marker([spot.lat, spot.lng], {
            icon: L.divIcon({
                className: 'pin-wrap',
                html: `<span class="${classes}">${spot.isFree ? 'F' : '$'}</span>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
            }),
            title: `${spot.name}, ${spot.isFree ? 'free' : 'paid'}`,
            keyboard: true,
            zIndexOffset: selected ? 500 : 0,
        });
        marker.on('click', () => this.handlers.onSelect(spot));
        return marker;
    }

    private clusterMarker(cluster: Cluster, zoom: number): L.Marker {
        const size = Math.round(42 + Math.min(Math.sqrt(cluster.count) * 5, 24));
        const marker = L.marker([cluster.lat, cluster.lng], {
            icon: L.divIcon({
                className: 'cluster-wrap',
                html: `<span class="cluster" style="width:${size}px;height:${size}px">${cluster.count}</span>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
            }),
            title: `${cluster.count} open spot${cluster.count === 1 ? '' : 's'}. Zoom in.`,
            keyboard: true,
        });
        marker.on('click', () => this.go([cluster.lat, cluster.lng], Math.min(zoom + 2, STREET_ZOOM)));
        return marker;
    }
}