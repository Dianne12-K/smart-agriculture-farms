export const BASEMAP_PRESETS = [
    {
        name: 'Esri World Imagery (Satellite)',
        url_template: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Esri World Imagery',
    },
    {
        name: 'Esri World Hillshade',
        url_template: 'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Esri, USGS, NGA, NASA, CGIAR',
    },
    {
        name: 'Esri World Terrain',
        url_template: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Esri, USGS, NOAA',
    },
    {
        name: 'Google Roadmap',
        url_template: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        attribution: '© Google',
    },
    {
        name: 'Google Satellite',
        url_template: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attribution: '© Google',
    },
    {
        name: 'Google Hybrid',
        url_template: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        attribution: '© Google',
    },
]
