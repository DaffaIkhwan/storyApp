import CONFIG from '../config.js';

if (typeof L === 'undefined') {
    console.error('Leaflet library (L) not found. Make sure it is loaded via CDN or import.');
} else {
    L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
    console.log('Leaflet default icon image path configured.');
}

let mapInstance = null;
let activeMarkers = [];
let singleInputMarker = null;
let layerControl = null;

export function initMap(mapId, centerCoords = [-6.200000, 106.816666], zoomLevel = 10) {
    if (!L) return null;

    const mapElement = document.getElementById(mapId);
    if (!mapElement) {
        console.error(`Map container with id "${mapId}" not found.`);
        return null;
    }

    if (mapElement._leaflet_id) {
        console.warn(`Map container "${mapId}" already has a Leaflet instance (_leaflet_id: ${mapElement._leaflet_id}). Attempting removal.`);
        if (mapInstance && typeof mapInstance.remove === 'function') {
           try {
               if (layerControl && mapInstance.hasLayer(layerControl)) {
                   layerControl.remove();
               }
               mapInstance.remove();
               console.log(`Removed previous map instance referenced by mapInstance variable.`);
           } catch(e) { console.error("Error removing previous mapInstance:", e); }
        } else {
           mapElement.innerHTML = '';
           console.warn(`Map container "${mapId}" cleared directly as mapInstance variable was unavailable.`);
        }
        mapInstance = null;
        layerControl = null;
        delete mapElement._leaflet_id;
    }

    mapElement.innerHTML = '';

    try {
        mapInstance = L.map(mapId, {
            center: centerCoords,
            zoom: zoomLevel,
        });

        const streetsTileLayer = L.tileLayer(CONFIG.MAP_TILE_LAYER_URL, {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &amp; <a href="https://www.maptiler.com/">MapTiler</a>',
            apiKey: CONFIG.MAP_API_KEY,
        });
        const satelliteTileLayer = L.tileLayer(CONFIG.MAP_TILE_LAYER_URL_SATELITE, {
           maxZoom: 19,
           attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
           apiKey: CONFIG.MAP_API_KEY,
        });

        streetsTileLayer.addTo(mapInstance);

        const baseMaps = { "Streets": streetsTileLayer, "Satellite": satelliteTileLayer };
        layerControl = L.control.layers(baseMaps).addTo(mapInstance);

        activeMarkers = [];
        singleInputMarker = null;

        console.log(`Map initialized successfully in container "${mapId}".`);
        return mapInstance;

    } catch (error) {
        console.error(`Failed to initialize map in "${mapId}":`, error);
        mapElement.innerHTML = '<p class="error-message" style="padding: 10px;">Gagal memuat peta.</p>';
        mapInstance = null;
        return null;
    }
}

export function addMarker(coords, popupContent = null, options = {}) {
    if (!L || !mapInstance || !coords) return null;

    const lat = Array.isArray(coords) ? coords[0] : coords.lat;
    const lon = Array.isArray(coords) ? coords[1] : (coords.lon || coords.lng);
     if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
        console.warn("Invalid coordinates provided for addMarker:", coords);
        return null;
     }

    try {
        const marker = L.marker([lat, lon], options).addTo(mapInstance);
        if (popupContent) {
            marker.bindPopup(popupContent, { maxWidth: 250 });
        }
        activeMarkers.push(marker);
        return marker;
    } catch (error) {
        console.error("Error adding marker:", error, "Coords:", coords);
        if (error.message.includes("appendChild")) {
           console.error("Leaflet Error Hint: This often relates to missing marker icon images. Ensure L.Icon.Default.imagePath is set correctly.");
        }
        return null;
    }
}

export function clearMarkers() {
    if (!mapInstance) return;
    activeMarkers.forEach(marker => {
        if (mapInstance.hasLayer(marker)) {
           try { mapInstance.removeLayer(marker); }
           catch(e) { console.warn("Could not remove active marker:", e); }
        }
    });
    activeMarkers = [];

    if (singleInputMarker && mapInstance.hasLayer(singleInputMarker)) {
       try { mapInstance.removeLayer(singleInputMarker); }
       catch(e) { console.warn("Could not remove singleInputMarker:", e); }
    }
    singleInputMarker = null;
}

export function setupMapInput(mapId, initialCoords = [-6.200000, 106.816666], onLocationSelectCallback) {
    const map = initMap(mapId, initialCoords, 13);
    if (!map) return null;

    map.off('click');

    map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        if (singleInputMarker && map.hasLayer(singleInputMarker)) {
            map.removeLayer(singleInputMarker);
        }

        singleInputMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
        singleInputMarker.bindPopup(`Lokasi dipilih: ${lat.toFixed(5)}, ${lng.toFixed(5)}`).openPopup();

        singleInputMarker.off('dragend').on('dragend', function(event){
            const marker = event.target;
            const position = marker.getLatLng();
            const newCoords = { lat: position.lat, lon: position.lng };
             marker.setPopupContent(`Lokasi dipilih: ${newCoords.lat.toFixed(5)}, ${newCoords.lon.toFixed(5)}`).openPopup();
             console.log("Marker dragged to:", newCoords);
            if (onLocationSelectCallback) {
                onLocationSelectCallback(newCoords);
            }
         });

        if (onLocationSelectCallback) {
            onLocationSelectCallback({ lat: lat, lon: lng });
        }
    });

    const existingInstruction = map.getContainer().querySelector('.map-instruction-control');
    if (!existingInstruction) {
        const info = L.control({position: 'bottomleft'});
        info.onAdd = function (mapRef) {
            this._div = L.DomUtil.create('div', 'map-instruction map-instruction-control');
            this.update();
            return this._div;
        };
        info.update = function () {
            this._div.innerHTML = 'Klik peta / geser marker untuk pilih lokasi';
        };
        if (map && map.addControl) {
           info.addTo(map);
           if (!document.getElementById('map-instruction-style')) {
               const style = document.createElement('style');
               style.id = 'map-instruction-style';
               style.innerHTML = `.map-instruction { padding: 6px 10px; font: 12px/1.5 Arial, Helvetica, sans-serif; background: rgba(255,255,255,0.9); box-shadow: 0 0 15px rgba(0,0,0,0.2); border-radius: 5px; text-align: center; color: #333; }`;
               document.head.appendChild(style);
           }
        }
    }

    console.log(`Map input setup complete for "${mapId}".`);
    return map;
}

export function getMapInstance() {
    return mapInstance;
}