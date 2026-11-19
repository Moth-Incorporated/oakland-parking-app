// only file that talks to leaflet
// draws map, gold count bubbles, F and $ pins, and blue dot for user position

import * as L from 'leaflet';
import {clusterSpots, STREET_ZOOM, type Cluster} from '../geo';
import type {LatLng, Spot, ViewState} from '../types';

export interface MapHandlers {
    onSelect(spot: Spot): void;
    onViewChange(view: ViewState): void;
    onBackgroundTap(): void;
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// true if the spot is open
function isVacant(spot: Spot): boolean {
    return spot.status === 'vacant';
}

// Leaflet wrapper. Zoomed out, vacant spots collapse into gold count bubbles
// At street level (zoom 17+) every vacant spot becomes its own tappable pin with an F or $ badge
export class ParkingMap {
    private map: L.Map;
    private handlers: MapHandlers;
    private markers = L.layerGroup();
    private spots: Spot[] = [];
    private selectedId: number | null = null;
    private me: L.Marker | null = null;

    constructor(el: HTMLElement, center: LatLng, handlers: MapHandlers) {
        this.handlers = handlers;

        this.map = L.map(el, {
            zoomControl: false,
            minZoom: 12,
            maxZoom: 19,
            zoomAnimation: !reduceMotion,
            fadeAnimation: !reduceMotion,
            markerZoomAnimation: !reduceMotion,
        }).setView([center.latitude, center.longitude], 16);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);
        this.markers.addTo(this.map);

        this.map.on('zoomend', this.render.bind(this));
        this.map.on('moveend', this.emitView.bind(this));
        this.map.on('click', this.onMapClick.bind(this));
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
            this.me.setLatLng([pos.latitude, pos.longitude]);
            return;
        }
        this.me = L.marker([pos.latitude, pos.longitude], {
            icon: L.divIcon({ className: 'me-wrap', html: '<span class="me"></span>', iconSize: [44, 44], iconAnchor: [22, 22] }),
            interactive: false,
            keyboard: false,
            zIndexOffset: 1000,
        }).addTo(this.map);
    }

    flyTo(pos: LatLng, zoom: number): void {
        this.go([pos.latitude, pos.longitude], zoom);
    }

    // Jump to street level around the current center 
    zoomToStreets(): void {
        const c = this.map.getCenter();
        this.go([c.lat, c.lng], STREET_ZOOM);
    }

    // centers a spot slightly above middle so the detail sheet does not cover it
    focusSpot(spot: Spot): void {
        const zoom = Math.max(this.map.getZoom(), STREET_ZOOM);
        const shifted = this.map
            .project([spot.latitude, spot.longitude], zoom)
            .add([0, Math.round(this.map.getSize().y * 0.18)]);
        const target = this.map.unproject(shifted, zoom);
        this.go([target.lat, target.lng], zoom);
    }

    private go(target: L.LatLngExpression, zoom: number): void {
        if (reduceMotion) this.map.setView(target, zoom, { animate: false });
        else this.map.flyTo(target, zoom, { duration: 0.6 });
    }

    // runs when the user taps empty map
    private onMapClick(): void {
        this.handlers.onBackgroundTap();
    }

    private render(): void {
        this.markers.clearLayers();
        const vacant = this.spots.filter(isVacant);
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

        // true if the spot is open and inside the visible part of the map
        function isVacantAndInView(spot: Spot): boolean {
            return spot.status === 'vacant' && bounds.contains([spot.latitude, spot.longitude]);
        }

        this.handlers.onViewChange({
            zoom,
            streetLevel: zoom >= STREET_ZOOM,
            inView: this.spots.filter(isVacantAndInView),
        });
    }

    private spotMarker(spot: Spot): L.Marker {
        const handlers = this.handlers;
        const selected = spot.id === this.selectedId;
        const classes = `pin ${spot.isFree ? 'pin--free' : 'pin--paid'}${selected ? ' pin--selected' : ''}`;
        const marker = L.marker([spot.latitude, spot.longitude], {
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

        // runs when this pin is tapped
        function onClick(): void {
            handlers.onSelect(spot);
        }

        marker.on('click', onClick);
        return marker;
    }

    private clusterMarker(cluster: Cluster, zoom: number): L.Marker {
        const go = this.go.bind(this);
        const size = Math.round(42 + Math.min(Math.sqrt(cluster.count) * 5, 24));
        const marker = L.marker([cluster.latitude, cluster.longitude], {
            icon: L.divIcon({
                className: 'cluster-wrap',
                html: `<span class="cluster" style="width:${size}px;height:${size}px">${cluster.count}</span>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
            }),
            title: `${cluster.count} open spot${cluster.count === 1 ? '' : 's'}. Zoom in.`,
            keyboard: true,
        });

        // runs when this bubble is tapped: zoom in on it
        function onClick(): void {
            go([cluster.latitude, cluster.longitude], Math.min(zoom + 2, STREET_ZOOM));
        }

        marker.on('click', onClick);
        return marker;
    }
}