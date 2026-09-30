import axios from 'axios'
import router from '@/router'



const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api',
    headers: { 'Content-Type': 'application/json' }
})

// ─── REQUEST INTERCEPTOR ───────────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        console.log('interceptor token:', token)
        console.log('request url:', config.url)
        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`)
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ─── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            router.currentRoute.value.name !== 'Login' &&
            localStorage.getItem('token')
        ) {
            localStorage.removeItem('token')
            localStorage.removeItem('uuid')
            router.replace({ name: 'Login' })
        }
        return Promise.reject(error)
    }
)

// ─── AUTH ──────────────────────────────────────────────────────────────────
export const login    = (credentials) => api.post('/auth/login', credentials)
export const register = (userData)    => api.post('/auth/register', userData)

// ─── PROJECTS ──────────────────────────────────────────────────────────────
export const getProjects   = ()           => api.get('/projects')
export const createProject = (data)       => api.post('/projects', data)
export const deleteProject  = (uuid)       => api.delete(`/projects/${uuid}`)

export const updateProject = (uuid, data) => api.put(`/projects/${uuid}`, data)

// ─── LAYER GROUPS ──────────────────────────────────────────────────────────
export const getLayerGroups   = (projectUuid) => api.get('/layergroups', { params: { project_uuid: projectUuid } })
export const createLayerGroup = (data)        => api.post('/layergroups', data)
export const getLayerGroup    = (groupUuid)   => api.get(`/layergroups/${groupUuid}`)
export const deleteLayerGroup = (groupUuid)   => api.delete(`/layergroups/${groupUuid}`)

// ─── BASEMAPS ──────────────────────────────────────────────────────────────
export const getBasemaps   = (projectUuid)     => api.get('/basemaps', { params: { project_uuid: projectUuid } })
export const createBasemap = (data)            => api.post('/basemaps', data)
export const updateBasemap = (basemapUuid, data) => api.patch(`/basemaps/${basemapUuid}`, data)
export const deleteBasemap = (basemapUuid)     => api.delete(`/basemaps/${basemapUuid}`)

// ─── LAYERS ────────────────────────────────────────────────────────────────
export const getLayers    = (projectUuid) => api.get('/layers', { params: { project_uuid: projectUuid } })
export const createLayer  = (data)        => api.post('/layers', data)
export const getLayer     = (layerUuid)   => api.get(`/layers/${layerUuid}`)
export const deleteLayer  = (layerUuid)   => api.delete(`/layers/${layerUuid}`)

// ─── ATTRIBUTES ────────────────────────────────────────────────────────────
export const getAttributes    = (layerUuid)         => api.get(`/layers/attributes/${layerUuid}`)
export const addAttributes    = (layerUuid, data)   => api.post(`/layers/attributes/${layerUuid}`, data)
export const deleteAttribute  = (layerUuid, attrId) => api.delete(`/layers/attributes/${layerUuid}/${attrId}`)

// ─── UPLOAD ────────────────────────────────────────────────────────────────
export const uploadFile    = (layerUuid, formData) => api.post(`/layers/upload/${layerUuid}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
})
export const mapAttributes = (layerUuid, data)     => api.post(`/layers/upload/${layerUuid}/map`, data)

// ─── FEATURES ──────────────────────────────────────────────────────────────
export const getFeatures        = (layerUuid, params)    => api.get(`/layers/${layerUuid}/features`, { params })
export const getFeature         = (layerUuid, gid)       => api.get(`/layers/${layerUuid}/features/${gid}`)
export const createFeature      = (layerUuid, data)      => api.post(`/layers/${layerUuid}/features`, data)
export const updateFeature      = (layerUuid, gid, data) => api.patch(`/layers/${layerUuid}/features/${gid}`, data)
export const updateGeometry     = (layerUuid, gid, data) => api.put(`/layers/${layerUuid}/features/${gid}/geometry`, data)
export const deleteFeature      = (layerUuid, gid)       => api.delete(`/layers/${layerUuid}/features/${gid}`)
export const bulkDeleteFeatures = (layerUuid, gids)      => api.delete(`/layers/${layerUuid}/features/bulk`, { data: { gids } })
export const bulkUpdateFeatures = (layerUuid, data)      => api.patch(`/layers/${layerUuid}/features/bulk`, data)
export const generateDemoData   = (layerUuid, gid, cropType) => api.post(`/layers/${layerUuid}/features/${gid}/demo-data`, { crop_type: cropType })

// ─── NDVI ──────────────────────────────────────────────────────────────────
export const getNdvi         = (layerUuid, gid)                          => api.get(`/ndvi/${layerUuid}/${gid}`)
export const getNdviStats    = (layerUuid, gid, days = 30)               => api.get(`/ndvi/${layerUuid}/${gid}/stats`, { params: { days } })
export const getNdviTrend    = (layerUuid, gid, days = 90)               => api.get(`/ndvi/${layerUuid}/${gid}/trend`, { params: { days } })
export const getNdviChange   = (layerUuid, gid, days = 30)               => api.get(`/ndvi/${layerUuid}/${gid}/change`, { params: { days } })
export const getNdviHotspots = (layerUuid, gid, days = 30, gridSize = 3) => api.get(`/ndvi/${layerUuid}/${gid}/hotspots`, { params: { days, grid_size: gridSize } })
export const getNdviHistory  = (layerUuid, gid)                          => api.get(`/ndvi/${layerUuid}/${gid}/history`)

// ─── LULC ──────────────────────────────────────────────────────────────────
export const getLulcClassify  = (layerUuid, gid, days = 90) => api.get(`/lulc/${layerUuid}/${gid}/classify`, { params: { days } })
export const getLulcChange    = (layerUuid, gid, params)    => api.get(`/lulc/${layerUuid}/${gid}/change`, { params })
export const getLulcStatistics= (layerUuid, gid, days = 90) => api.get(`/lulc/${layerUuid}/${gid}/statistics`, { params: { days } })
export const getLulcHistory   = (layerUuid, gid)            => api.get(`/lulc/${layerUuid}/${gid}/history`)
export const getLulcCropMask  = (layerUuid, gid, days = 90) => api.get(`/lulc/${layerUuid}/${gid}/crop-mask`, { params: { days } })

// ─── DISASTERS ─────────────────────────────────────────────────────────────
export const getDisasterAlerts = (layerUuid, params)          => api.get(`/disasters/${layerUuid}/alerts`, { params })
export const getFeatureAlerts  = (layerUuid, gid, params)     => api.get(`/disasters/${layerUuid}/${gid}/alerts`, { params })
export const getDrought        = (layerUuid, gid, days = 30)  => api.get(`/disasters/${layerUuid}/${gid}/drought`, { params: { days } })
export const getFire           = (layerUuid, gid, days = 30)  => api.get(`/disasters/${layerUuid}/${gid}/fire`, { params: { days } })
export const getFlood          = (layerUuid, gid, days = 30)  => api.get(`/disasters/${layerUuid}/${gid}/flood`, { params: { days } })
export const getDisasterScan   = (layerUuid, gid, days = 30)  => api.get(`/disasters/${layerUuid}/${gid}/scan`, { params: { days } })

// ─── SOIL ──────────────────────────────────────────────────────────────────
export const getSoilProfile    = (layerUuid, gid, days = 7) => api.get(`/soil/${layerUuid}/${gid}`, { params: { days } })
export const getSoilHistory    = (layerUuid, gid)           => api.get(`/soil/${layerUuid}/${gid}/history`)
export const getSoilMoisture   = (layerUuid, gid, days = 7) => api.get(`/soil/${layerUuid}/${gid}/moisture`, { params: { days } })
export const getSoilProperties = (layerUuid, gid)           => api.get(`/soil/${layerUuid}/${gid}/properties`)

// ─── WEATHER ───────────────────────────────────────────────────────────────
export const getWeatherCurrent    = (projectUuid)            => api.get(`/weather/${projectUuid}/current`)
export const getWeatherForecast   = (projectUuid)            => api.get(`/weather/${projectUuid}/forecast`)
export const getWeatherHistorical = (projectUuid, months=12) => api.get(`/weather/${projectUuid}/historical`, { params: { months } })
export const getWeatherSummary    = (projectUuid)            => api.get(`/weather/${projectUuid}/summary`)

// ─── YIELD ─────────────────────────────────────────────────────────────────
export const getYieldModelInfo  = ()                        => api.get('/yield/model/info')
export const trainYieldModel    = (data)                    => api.post('/yield/train', data)
export const recordActualYield  = (layerUuid, gid, data)   => api.post(`/yield/${layerUuid}/${gid}/actual`, data)
export const getYieldHistory    = (layerUuid, gid)         => api.get(`/yield/${layerUuid}/${gid}/history`)
export const predictYield       = (layerUuid, gid, params) => api.get(`/yield/${layerUuid}/${gid}/predict`, { params })

// ─── RECOMMENDATIONS ───────────────────────────────────────────────────────
export const getRecommendations       = (layerUuid, params)      => api.get(`/recommendations/${layerUuid}`, { params })
export const getFeatureRecommendation = (layerUuid, gid, params) => api.get(`/recommendations/${layerUuid}/${gid}`, { params })
export const getRecommendationHistory = (layerUuid, gid)         => api.get(`/recommendations/${layerUuid}/${gid}/history`)
export const generateRecommendations  = (layerUuid, data)        => api.post(`/recommendations/${layerUuid}/generate`, data)

export default api