// --- Projects & Solids Management Module ---

let currentViewProject = null;
let currentWorkspaceProject = null;
let projectsCache = [];
let selectedPlmVersionItemIds = new Set();
let plmWorkspaceMode = 'menu';
let plmVersionsFlowMode = 'list';
let plmActiveSection = 'plm';
let selectedOpenedPlmVersionId = '';
let plmVersionEditTargetId = '';
let plmVersionMetaMode = 'create';
let plmVersionCopySourceId = '';
let plmVersionCompareSelectMode = false;
let selectedPlmCompareVersionIds = new Set();
let plmVersionComparisonIds = [];
let plmVersionSelectionExpandedNodeIds = new Set();
let plmVersionSelectionDescendantsById = new Map();
let plmVersionSelectionParentByChild = new Map();
let plmVersionSelectionCanonicalByNodeId = new Map();
let plmVersionSelectionExpansionInitialized = false;
let plmBomVersionContextId = '';
let plmEditingItemId = '';
let plmSelectedCadShortcut = '';
let plmSelectedDrawingShortcut = '';
let plmItemModalMovedToBody = false;
let plmBuloneriaModalMovedToBody = false;
let plmBuloneriaActiveCategory = 'tornillos';
let plmBuloneriaSearchText = '';
let plmBuloneriaCatalogByCategory = null;
let plmItemsSearchQuery = '';
let plmBomTableSearchQuery = '';
let erpHomeSearchQuery = '';
let erpSuppliersSearchQuery = '';
let erpMpSearchQuery = '';
let plmVersionsSearchQuery = '';
let erpActivePanel = 'home';
let erpDiagramPersistTimer = null;
let erpDiagramDragState = null;
let erpDiagramPanState = null;
let erpDiagramContentEditMode = false;
let erpDiagramGridEditMode = false;
let erpDiagramRowDragState = null;
let erpDiagramZoneDragState = null;
let erpDiagramZoomUiTimer = null;
let erpDiagramZoneConfigOpenCategory = '';
let erpDiagramZoneConfigExpandedGroups = {};
let activeErpDiagramNodeId = '';
let erpSupplierEditId = '';
let erpMpEditId = '';
let erpExpandedHomeItemIds = new Set();
let erpHomeVariantCollapseTimers = new Map();
let erpDiagramViewState = {
    scale: 0.22,
    minScale: 0.08,
    maxScale: 2.4,
    panX: 0,
    panY: 0
};
const ERP_DIAGRAM_ZOOM_HIDE_UI_MAX_SCALE = 0.14;
let erpDiagramAutoFitProjectId = '';
const plmBuloneriaSelectedKeys = new Set();
const ERP_SUPPLY_CATEGORIES = [
    'Redondos',
    'Perfil Estructurales',
    'Chapas',
    'Fundiciones',
    'Piezas Comerciales',
    'Rodamientos',
    'Bulones',
    'Resortes',
    'Rueda',
    'Cuadrados',
    'Piezas Ensambladas'
];
const ERP_SUPPLIER_SUPPLY_OPTIONS = [...ERP_SUPPLY_CATEGORIES, 'Mecanizado', 'Pintura', 'Tratamiento'];
const ERP_UNASSIGNED_CATEGORY = 'Sin Asignar';
const ERP_STRUCTURAL_CATEGORY = 'Conjuntos / SubConjuntos';
const ERP_DIAGRAM_ZONES = [ERP_UNASSIGNED_CATEGORY, ...ERP_SUPPLY_CATEGORIES, ERP_STRUCTURAL_CATEGORY];
const ERP_DIAGRAM_TONE_COLORS = [
    '#3498db', '#f1c40f', '#2ecc71', '#95a5a6', '#e67e22', '#9b59b6',
    '#1abc9c', '#e74c3c', '#16a085', '#f39c12', '#7f8c8d', '#bdc3c7',
    '#d35400'
];
const ERP_MP_PREFIX_MAP = {
    'Redondos': 'RED',
    'Perfil Estructurales': 'PES',
    'Chapas': 'CHP',
    'Fundiciones': 'FND',
    'Piezas Comerciales': 'PCO',
    'Rodamientos': 'RDM',
    'Bulones': 'BLN',
    'Resortes': 'RST',
    'Rueda': 'RDA',
    'Cuadrados': 'CDR',
    'Piezas Ensambladas': 'PEN'
};

const ERP_DIAGRAM_MACHINING_PARENT_KEY = 'cost_mecanizado';
const ERP_DIAGRAM_MACHINING_COST_CHILD_KEY = 'cost_mecanizado_total';
const ERP_DIAGRAM_MACHINING_PROVIDER_CHILD_KEY = 'provider_mecanizado';
const ERP_DIAGRAM_MACHINING_COLUMNS = [
    { key: 'cost_mecanizado_torno', label: 'Torno', type: 'cost', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: false },
    { key: 'cost_mecanizado_cnc', label: 'CNC', type: 'cost', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: false },
    { key: 'cost_mecanizado_serrucho', label: 'Serrucho', type: 'cost', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: false },
    { key: 'cost_mecanizado_corte_laser', label: 'Corte Laser', type: 'cost', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: false },
    { key: 'cost_mecanizado_plegado', label: 'Plegado', type: 'cost', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: false },
    { key: 'cost_mecanizado_agujereadora', label: 'Agujereadora', type: 'cost', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: false },
    { key: 'cost_mecanizado_soldadora', label: 'Soldadora', type: 'cost', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: false },
    { key: 'cost_mecanizado_mano_obra', label: 'Mano de Obra', type: 'cost', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: false }
];

const ERP_DIAGRAM_TREATMENT_PARENT_KEY = 'cost_tratamiento';
const ERP_DIAGRAM_TREATMENT_COST_CHILD_KEY = 'cost_tratamiento_total';
const ERP_DIAGRAM_TREATMENT_PROVIDER_CHILD_KEY = 'provider_tratamiento';
const ERP_DIAGRAM_TREATMENT_COLUMNS = [
    { key: 'cost_tratamiento_superficial', label: 'Superficial', type: 'cost', parent: ERP_DIAGRAM_TREATMENT_PARENT_KEY, defaultVisible: false },
    { key: 'cost_tratamiento_termico', label: 'Termico', type: 'cost', parent: ERP_DIAGRAM_TREATMENT_PARENT_KEY, defaultVisible: false }
];

const ERP_DIAGRAM_PAINT_PARENT_KEY = 'cost_pintado';
const ERP_DIAGRAM_PAINT_COST_CHILD_KEY = 'cost_pintado_total';
const ERP_DIAGRAM_PAINT_PROVIDER_CHILD_KEY = 'provider_pintado';
const ERP_DIAGRAM_METER_PACK_KEY = 'cost_mp_x_mt_pack';
const ERP_DIAGRAM_METER_LENGTH_KEY = 'mts';
const ERP_DIAGRAM_METER_COST_KEY = 'cost_mp_x_mt';
const ERP_DIAGRAM_VALUE_STATUS_OPTIONS = ['Facturado', 'Cotizado', 'Supuesto'];

const ERP_DIAGRAM_COST_FIELDS = [
    'cost_mp_x_kg',
    ERP_DIAGRAM_METER_COST_KEY,
    'cost_mp',
    ...ERP_DIAGRAM_MACHINING_COLUMNS.map((column) => column.key),
    ...ERP_DIAGRAM_TREATMENT_COLUMNS.map((column) => column.key),
    'cost_pintado',
    'cost_importacion',
    'cost_matriceria'
];

const ERP_DIAGRAM_CONFIGURABLE_COLUMNS = [
    { key: 'cost_mp_x_kg', label: 'Costo MP x Kg', type: 'cost', defaultVisible: true },
    { key: ERP_DIAGRAM_METER_LENGTH_KEY, label: 'Mts', type: 'qty', defaultVisible: false },
    { key: ERP_DIAGRAM_METER_COST_KEY, label: 'Costo MP x Mt', type: 'cost', defaultVisible: false },
    { key: 'cost_mp', label: 'Costo MP', type: 'cost', defaultVisible: true },
    { key: ERP_DIAGRAM_MACHINING_PARENT_KEY, label: 'Mecanizado', type: 'group', fallbackChildKey: 'cost_mecanizado_mano_obra', defaultVisible: true },
    ...ERP_DIAGRAM_MACHINING_COLUMNS,
    { key: ERP_DIAGRAM_MACHINING_COST_CHILD_KEY, label: 'Costo', type: 'cost', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: true },
    { key: ERP_DIAGRAM_MACHINING_PROVIDER_CHILD_KEY, label: 'Proveedor', type: 'provider', parent: ERP_DIAGRAM_MACHINING_PARENT_KEY, defaultVisible: true },
    { key: ERP_DIAGRAM_TREATMENT_PARENT_KEY, label: 'Tratamientos', type: 'group', fallbackChildKey: 'cost_tratamiento_superficial', defaultVisible: true },
    ...ERP_DIAGRAM_TREATMENT_COLUMNS,
    { key: ERP_DIAGRAM_TREATMENT_COST_CHILD_KEY, label: 'Costo', type: 'cost', parent: ERP_DIAGRAM_TREATMENT_PARENT_KEY, defaultVisible: true },
    { key: ERP_DIAGRAM_TREATMENT_PROVIDER_CHILD_KEY, label: 'Proveedor', type: 'provider', parent: ERP_DIAGRAM_TREATMENT_PARENT_KEY, defaultVisible: true },
    { key: ERP_DIAGRAM_PAINT_PARENT_KEY, label: 'Pintura', type: 'group', fallbackChildKey: ERP_DIAGRAM_PAINT_COST_CHILD_KEY, defaultVisible: true },
    { key: ERP_DIAGRAM_PAINT_COST_CHILD_KEY, label: 'Costo', type: 'cost', parent: ERP_DIAGRAM_PAINT_PARENT_KEY, defaultVisible: true },
    { key: ERP_DIAGRAM_PAINT_PROVIDER_CHILD_KEY, label: 'Proveedor', type: 'provider', parent: ERP_DIAGRAM_PAINT_PARENT_KEY, defaultVisible: true },
    { key: 'cost_importacion', label: 'Costo de Importación', type: 'cost', defaultVisible: true },
    { key: 'cost_matriceria', label: 'Costo Matriceria', type: 'cost', defaultVisible: true },
    { key: 'quoted_qty', label: 'Cantidad Cotizada', type: 'qty', defaultVisible: true }
];

const ERP_DIAGRAM_EDITABLE_FIELDS = [...ERP_DIAGRAM_COST_FIELDS, ERP_DIAGRAM_MACHINING_PARENT_KEY, ERP_DIAGRAM_TREATMENT_PARENT_KEY, 'kg', ERP_DIAGRAM_METER_LENGTH_KEY, 'quoted_qty', 'value_status', 'value_date'];
const ERP_DIAGRAM_MACHINING_USD_PER_HOUR = 20;

function normalizeErpValueStatus(valueRaw, fallback = 'Supuesto') {
    const value = String(valueRaw || '').trim();
    if (ERP_DIAGRAM_VALUE_STATUS_OPTIONS.includes(value)) return value;
    const fallbackValue = String(fallback || '').trim();
    if (ERP_DIAGRAM_VALUE_STATUS_OPTIONS.includes(fallbackValue)) return fallbackValue;
    return 'Supuesto';
}

function normalizeErpValueDate(valueRaw) {
    const raw = String(valueRaw || '').trim();
    if (!raw) return '';

    const normalized = raw
        .replace(/\s+/g, '')
        .replace(/[.\-]/g, '/');

    let day = 0;
    let month = 0;
    let year = 0;

    const slashMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slashMatch) {
        day = parseInt(slashMatch[1], 10);
        month = parseInt(slashMatch[2], 10);
        year = parseInt(slashMatch[3], 10);
    } else {
        const digits = normalized.replace(/\D/g, '');
        if (!/^\d{8}$/.test(digits)) return '';
        day = parseInt(digits.slice(0, 2), 10);
        month = parseInt(digits.slice(2, 4), 10);
        year = parseInt(digits.slice(4, 8), 10);
    }

    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return '';
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return '';

    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year
        || date.getMonth() !== (month - 1)
        || date.getDate() !== day
    ) {
        return '';
    }

    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const yyyy = String(year).padStart(4, '0');
    return `${dd}/${mm}/${yyyy}`;
}

function getErpValueStatusToneClass(valueRaw) {
    const value = normalizeErpValueStatus(valueRaw, 'Supuesto');
    if (value === 'Facturado') return 'erp-value-status-facturado';
    if (value === 'Cotizado') return 'erp-value-status-cotizado';
    return 'erp-value-status-supuesto';
}

function applyErpValueStatusClass(target, valueRaw) {
    if (!target || !target.classList) return;
    target.classList.remove('erp-value-status-facturado', 'erp-value-status-cotizado', 'erp-value-status-supuesto');
    target.classList.add(getErpValueStatusToneClass(valueRaw));
}

function hasErpDiagramRowValueStatusData(row) {
    if (!row || typeof row !== 'object') return false;

    const mpType = String(row.mp_category || '').trim();
    const mpMaterial = String(row.mp_material || '').trim();
    const mpProvider = normalizeErpSupplierSelectionValue(row.provider_id || '');
    const valueDate = normalizeErpValueDate(row.value_date || row.fecha_valor || row.fecha || '');

    if (mpType || mpMaterial || mpProvider || valueDate) return true;

    const kg = Math.max(0, toNumber(row.kg, 0));
    const mts = Math.max(0, toNumber(row.mts, 0));
    const costMpByKg = Math.max(0, toNumber(row.cost_mp_x_kg, 0));
    const costMpByMt = Math.max(0, toNumber(row.cost_mp_x_mt, 0));
    const costMp = Math.max(0, toNumber(row.cost_mp, 0));
    const costMecanizado = Math.max(0, toNumber(getErpDiagramMecanizadoRowValue(row), 0));
    const costTratamientos = Math.max(0, toNumber(getErpDiagramGroupValue(row, ERP_DIAGRAM_TREATMENT_PARENT_KEY), 0));
    const costPintado = Math.max(0, toNumber(row.cost_pintado, 0));
    const costImportacion = Math.max(0, toNumber(row.cost_importacion, 0));
    const costMatriceria = Math.max(0, toNumber(row.cost_matriceria, 0));

    return kg > 0
        || mts > 0
        || costMpByKg > 0
        || costMpByMt > 0
        || costMp > 0
        || costMecanizado > 0
        || costTratamientos > 0
        || costPintado > 0
        || costImportacion > 0
        || costMatriceria > 0;
}

function getErpDiagramColumnDefaultVisibility(column) {
    if (!column || typeof column !== 'object') return true;
    if (!Object.prototype.hasOwnProperty.call(column, 'defaultVisible')) return true;
    return Boolean(column.defaultVisible);
}

function getErpDiagramGroupParentColumns() {
    return ERP_DIAGRAM_CONFIGURABLE_COLUMNS.filter((column) => String(column && column.type ? column.type : '') === 'group');
}

function getErpDiagramGroupParentColumnByKey(parentKeyRaw) {
    const parentKey = String(parentKeyRaw || '').trim();
    if (!parentKey) return null;
    return getErpDiagramGroupParentColumns().find((column) => String(column && column.key ? column.key : '') === parentKey) || null;
}

function getErpDiagramGroupChildColumns(parentKeyRaw) {
    const parentKey = String(parentKeyRaw || '').trim();
    if (!parentKey) return [];
    return ERP_DIAGRAM_CONFIGURABLE_COLUMNS.filter((column) => String(column && column.parent ? column.parent : '') === parentKey);
}

function isErpDiagramGroupChildColumn(column) {
    return Boolean(String(column && column.parent ? column.parent : '').trim());
}

function isErpDiagramGroupChildKey(keyRaw) {
    const key = String(keyRaw || '').trim();
    if (!key) return false;
    return ERP_DIAGRAM_CONFIGURABLE_COLUMNS.some((column) => String(column && column.key ? column.key : '') === key && isErpDiagramGroupChildColumn(column));
}

function getErpDiagramGroupParentKeyByChildKey(keyRaw) {
    const key = String(keyRaw || '').trim();
    if (!key) return '';

    const col = ERP_DIAGRAM_CONFIGURABLE_COLUMNS.find((column) => String(column && column.key ? column.key : '') === key);
    return String(col && col.parent ? col.parent : '').trim();
}

function isErpDiagramGroupParentKey(keyRaw) {
    const key = String(keyRaw || '').trim();
    if (!key) return false;
    return getErpDiagramGroupParentColumns().some((column) => String(column && column.key ? column.key : '') === key);
}

function getErpDiagramGroupValue(row, parentKeyRaw) {
    const parentKey = String(parentKeyRaw || '').trim();
    if (!parentKey) return 0;

    const childTotal = getErpDiagramGroupChildColumns(parentKey).reduce((acc, column) => {
        const key = String(column && column.key ? column.key : '').trim();
        if (!key) return acc;
        return acc + Math.max(0, toNumber(row && row[key], 0));
    }, 0);

    if (childTotal > 0) return childTotal;
    return Math.max(0, toNumber(row && row[parentKey], 0));
}

function setErpDiagramGroupValue(row, parentKeyRaw, rawValue) {
    const parentKey = String(parentKeyRaw || '').trim();
    if (!parentKey || !row) return;

    const next = Math.max(0, parseErpLocalizedNumber(rawValue, 0));
    const parentColumn = getErpDiagramGroupParentColumnByKey(parentKey);
    const fallbackChildKey = String(parentColumn && parentColumn.fallbackChildKey ? parentColumn.fallbackChildKey : '').trim();

    let fallbackChildValue = next;
    if (parentKey === ERP_DIAGRAM_MACHINING_PARENT_KEY) {
        const rate = getErpDiagramMecanizadoRatePerHour();
        fallbackChildValue = rate > 0 ? (next / rate) * 60 : 0;
    }

    getErpDiagramGroupChildColumns(parentKey).forEach((column) => {
        const key = String(column && column.key ? column.key : '').trim();
        if (!key) return;
        if (String(column && column.type ? column.type : '') === 'provider') return;
        row[key] = (key === fallbackChildKey) ? fallbackChildValue : 0;
    });

    row[parentKey] = next;
}

function getErpDiagramMecanizadoColumns() {
    return getErpDiagramGroupChildColumns(ERP_DIAGRAM_MACHINING_PARENT_KEY);
}

function getErpDiagramMecanizadoParentColumn() {
    return getErpDiagramGroupParentColumnByKey(ERP_DIAGRAM_MACHINING_PARENT_KEY);
}

function isErpDiagramMecanizadoChildColumn(column) {
    return String(column && column.parent ? column.parent : '') === ERP_DIAGRAM_MACHINING_PARENT_KEY;
}

function isErpDiagramMecanizadoChildKey(keyRaw) {
    return getErpDiagramGroupParentKeyByChildKey(keyRaw) === ERP_DIAGRAM_MACHINING_PARENT_KEY;
}

function getErpDiagramGroupCostChildKey(parentKeyRaw) {
    const parentKey = String(parentKeyRaw || '').trim();
    if (parentKey === ERP_DIAGRAM_MACHINING_PARENT_KEY) return ERP_DIAGRAM_MACHINING_COST_CHILD_KEY;
    if (parentKey === ERP_DIAGRAM_TREATMENT_PARENT_KEY) return ERP_DIAGRAM_TREATMENT_COST_CHILD_KEY;
    if (parentKey === ERP_DIAGRAM_PAINT_PARENT_KEY) return ERP_DIAGRAM_PAINT_COST_CHILD_KEY;
    return '';
}

function getErpDiagramGroupProviderChildKey(parentKeyRaw) {
    const parentKey = String(parentKeyRaw || '').trim();
    if (parentKey === ERP_DIAGRAM_MACHINING_PARENT_KEY) return ERP_DIAGRAM_MACHINING_PROVIDER_CHILD_KEY;
    if (parentKey === ERP_DIAGRAM_TREATMENT_PARENT_KEY) return ERP_DIAGRAM_TREATMENT_PROVIDER_CHILD_KEY;
    if (parentKey === ERP_DIAGRAM_PAINT_PARENT_KEY) return ERP_DIAGRAM_PAINT_PROVIDER_CHILD_KEY;
    return '';
}

function getErpDiagramGroupUnitCost(row, parentKeyRaw) {
    const parentKey = String(parentKeyRaw || '').trim();
    if (!parentKey || !row) return 0;
    if (parentKey === ERP_DIAGRAM_MACHINING_PARENT_KEY) return Math.max(0, toNumber(getErpDiagramMecanizadoRowValue(row), 0));
    if (parentKey === ERP_DIAGRAM_TREATMENT_PARENT_KEY) return Math.max(0, toNumber(getErpDiagramGroupValue(row, parentKey), 0));
    if (parentKey === ERP_DIAGRAM_PAINT_PARENT_KEY) return Math.max(0, toNumber(row && row.cost_pintado, 0));
    return 0;
}

function applyErpDiagramImplicitGroupProviders(row) {
    if (!row || typeof row !== 'object') return;

    const mpProvider = String(row.provider_id || '').trim();
    const parents = [ERP_DIAGRAM_MACHINING_PARENT_KEY, ERP_DIAGRAM_TREATMENT_PARENT_KEY, ERP_DIAGRAM_PAINT_PARENT_KEY];

    parents.forEach((parentKey) => {
        const providerKey = getErpDiagramGroupProviderChildKey(parentKey);
        if (!providerKey) return;

        const currentProvider = String(row[providerKey] || '').trim();
        if (currentProvider) return;

        const unitCost = getErpDiagramGroupUnitCost(row, parentKey);
        if (unitCost <= 0) return;

        if (mpProvider) row[providerKey] = mpProvider;
    });
}

function isErpDiagramMandatoryGroupChildKey(parentKeyRaw, childKeyRaw) {
    const parentKey = String(parentKeyRaw || '').trim();
    const childKey = String(childKeyRaw || '').trim();
    if (!parentKey || !childKey) return false;
    return childKey === getErpDiagramGroupCostChildKey(parentKey) || childKey === getErpDiagramGroupProviderChildKey(parentKey);
}

function isErpDiagramGroupCostChildKey(keyRaw) {
    const key = String(keyRaw || '').trim();
    return key === ERP_DIAGRAM_MACHINING_COST_CHILD_KEY
        || key === ERP_DIAGRAM_TREATMENT_COST_CHILD_KEY
        || key === ERP_DIAGRAM_PAINT_COST_CHILD_KEY;
}

function isErpDiagramSystemGroupChildKey(keyRaw) {
    const key = String(keyRaw || '').trim();
    if (!key) return false;
    return key === ERP_DIAGRAM_MACHINING_COST_CHILD_KEY
        || key === ERP_DIAGRAM_MACHINING_PROVIDER_CHILD_KEY
        || key === ERP_DIAGRAM_TREATMENT_COST_CHILD_KEY
        || key === ERP_DIAGRAM_TREATMENT_PROVIDER_CHILD_KEY
        || key === ERP_DIAGRAM_PAINT_COST_CHILD_KEY
        || key === ERP_DIAGRAM_PAINT_PROVIDER_CHILD_KEY;
}

function hasErpDiagramGroupDetailChildrenVisible(parentKeyRaw, config = null) {
    const parentKey = String(parentKeyRaw || '').trim();
    if (!parentKey || !config || typeof config !== 'object') return false;
    return getErpDiagramGroupChildColumns(parentKey).some((childColumn) => {
        const childKey = String(childColumn && childColumn.key ? childColumn.key : '').trim();
        if (!childKey || isErpDiagramSystemGroupChildKey(childKey)) return false;
        return config[childKey] === true;
    });
}

function getErpDiagramMecanizadoRatePerHour() {
    return Math.max(0, toNumber(ERP_DIAGRAM_MACHINING_USD_PER_HOUR, 20));
}

function getErpDiagramMecanizadoMinutesTotal(row) {
    return getErpDiagramMecanizadoColumns().reduce((acc, column) => {
        const key = String(column && column.key ? column.key : '').trim();
        if (!key) return acc;
        return acc + Math.max(0, toNumber(row && row[key], 0));
    }, 0);
}

function getErpDiagramMecanizadoMinutesToCost(minutesRaw) {
    const minutes = Math.max(0, toNumber(minutesRaw, 0));
    return (minutes / 60) * getErpDiagramMecanizadoRatePerHour();
}

function getErpDiagramMecanizadoRowValue(row) {
    const minutesTotal = getErpDiagramMecanizadoMinutesTotal(row);
    if (minutesTotal > 0) return getErpDiagramMecanizadoMinutesToCost(minutesTotal);
    return Math.max(0, toNumber(row && row[ERP_DIAGRAM_MACHINING_PARENT_KEY], 0));
}

const ERP_DIAGRAM_NODE_HALF_WIDTH = 84;
const ERP_DIAGRAM_NODE_HALF_HEIGHT = 30;
const ERP_DIAGRAM_GRID_COLUMNS = 4;
const ERP_DIAGRAM_CELL_BASE_WIDTH = 2800;
const ERP_DIAGRAM_CELL_BASE_HEIGHT = 980;
const ERP_DIAGRAM_CELL_GAP_X = 180;
const ERP_DIAGRAM_CELL_GAP_Y = 180;
const LOCAL_CAD_HELPER_URL = 'http://127.0.0.1:51377';
const USE_LOCAL_CAD_HELPER = true;
const CAD_OPEN_LOADING_MIN_MS = 5000;
let localCadHelperStatus = 'unknown';

let selectedBomSourceId = null;
let selectedBomTargetId = null;
let activeBomNodeId = null;
let selectedBomEdgeId = null;
let bomDragState = null;
let bomLinkDragState = null;
let bomPanState = null;
let bomExpandedNodeIds = new Set();
let bomKeybindingsReady = false;
let bomEditModeEnabled = false;
let bomViewState = {
    scale: 0.34,
    minScale: 0.05,
    maxScale: 2.4,
    panX: 0,
    panY: 0
};

const BOM_NODE_HALF_WIDTH = 84;
const BOM_NODE_HALF_HEIGHT = 30;
const BOM_HANDLE_RADIUS = 9;
const BOM_HANDLE_HIT_RADIUS = 18;
const BOM_HANDLE_GAP = 18;
const BOM_OUTER_MARGIN = 280;
const BOM_CATEGORIES = ['Conjunto', 'Subconjunto 1', 'Subconjunto 1.1', 'Piezas', 'Buloneria'];
const BOM_PERFORMANCE_NODE_THRESHOLD = 180;
const BOM_PERFORMANCE_EDGE_THRESHOLD = 260;
let bomRenderRafHandle = null;
let bomRenderQueueIncludeTable = false;

const BOM_RING_RADII = {
    inner: 440,
    conjunto: 920,
    sub1: 1400,
    sub11: 1880,
    piezas: 2360,
    buloneria: 2840
};

const BOM_PROJECT_RING_DIAMETER_SCALE = 3;
const BOM_PROJECT_NODE_GAP_SCALE = 0.5;

function getBomRenderRingScale() {
    return BOM_PROJECT_RING_DIAMETER_SCALE;
}

function getBomRenderRingRadii() {
    const scale = Math.max(0.1, toNumber(getBomRenderRingScale(), 1));
    return {
        inner: BOM_RING_RADII.inner * scale,
        conjunto: BOM_RING_RADII.conjunto * scale,
        sub1: BOM_RING_RADII.sub1 * scale,
        sub11: BOM_RING_RADII.sub11 * scale,
        piezas: BOM_RING_RADII.piezas * scale,
        buloneria: BOM_RING_RADII.buloneria * scale
    };
}

function getBomNodeGapScale() {
    return BOM_PROJECT_NODE_GAP_SCALE;
}

function getBomCategoryBands() {
    const radii = getBomRenderRingRadii();
    return [
        { name: 'Conjunto', min: radii.inner, max: radii.conjunto },
        { name: 'Subconjunto 1', min: radii.conjunto, max: radii.sub1 },
        { name: 'Subconjunto 1.1', min: radii.sub1, max: radii.sub11 },
        { name: 'Piezas', min: radii.sub11, max: radii.piezas },
        { name: 'Buloneria', min: radii.piezas, max: radii.buloneria }
    ];
}

const BOM_CATEGORY_BANDS = [
    { name: 'Conjunto', min: BOM_RING_RADII.inner, max: BOM_RING_RADII.conjunto },
    { name: 'Subconjunto 1', min: BOM_RING_RADII.conjunto, max: BOM_RING_RADII.sub1 },
    { name: 'Subconjunto 1.1', min: BOM_RING_RADII.sub1, max: BOM_RING_RADII.sub11 },
    { name: 'Piezas', min: BOM_RING_RADII.sub11, max: BOM_RING_RADII.piezas },
    { name: 'Buloneria', min: BOM_RING_RADII.piezas, max: BOM_RING_RADII.buloneria }
];

const PLM_BULONERIA_INCH_THREAD_DIAMETERS = ['1/4"', '5/16"', '3/8"', '1/2"', '5/8"', '3/4"'];
const PLM_BULONERIA_INCH_THREAD_LENGTHS = ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"', '3 1/2"', '4"', '5"', '6"'];
const PLM_BULONERIA_INCH_NUT_DIAMETERS = ['1/4"', '5/16"', '3/8"', '7/16"', '1/2"', '9/16"', '5/8"', '3/4"', '7/8"', '1"', '1 1/8"', '1 1/4"'];
const PLM_BULONERIA_INCH_PIN_DIAMETERS = ['1/8"', '3/16"', '1/4"', '5/16"', '3/8"'];
const PLM_BULONERIA_INCH_PIN_LENGTHS = ['1/2"', '3/4"', '1"', '1 1/2"', '2"'];
const PLM_BULONERIA_INCH_LONG_LENGTHS = ['6"', '12"', '24"', '36"'];
const PLM_BULONERIA_INCH_ORING_DIAMETERS = ['1/4"', '3/8"', '1/2"', '5/8"', '3/4"', '1"'];
const PLM_BULONERIA_INCH_ORING_SECTIONS = ['1/16"', '3/32"', '1/8"', '3/16"'];
const PLM_BULONERIA_INCH_KEY_SIZES = ['1/8x1/8"', '3/16x3/16"', '1/4x1/4"', '5/16x5/16"'];
const PLM_BULONERIA_INCH_RIVET_DIAMETERS = ['1/8"', '5/32"', '3/16"', '1/4"'];
const PLM_BULONERIA_INCH_RIVET_LENGTHS = ['1/4"', '3/8"', '1/2"', '3/4"', '1"'];
const PLM_BULONERIA_SEEGER_DIAMETERS = Array.from({ length: 113 }, (_, idx) => String(idx + 8));
const PLM_BULONERIA_ORING_DIAMETERS = Array.from({ length: 117 }, (_, idx) => String(idx + 4));

const PLM_BULONERIA_CATEGORIES = [
    {
        id: 'tornillos',
        label: 'Tornillos',
        prefix: 'TRN',
        family: 'Tornillo',
        material: 'Acero Zincado',
        norma: 'ISO 4762',
        types: ['Allen', 'Allen Avellanado', 'Cabeza Fresada', 'Allen Cabeza Fresada', 'Hexagonal', 'Phillips', 'Torx'],
        diameters: ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M20', 'M22', 'M24', 'M30', 'M36'],
        lengths: ['06', '08', '10', '12', '15', '16', '20', '25', '30', '35', '40', '45', '50', '55', '60', '70', '80', '90', '100', '120', '140', '160', '180', '200'],
        inchDiameters: PLM_BULONERIA_INCH_THREAD_DIAMETERS,
        inchLengths: PLM_BULONERIA_INCH_THREAD_LENGTHS,
        pitchByDiameter: {
            M3: [{ value: '0.50', mode: 'Rosca Gruesa' }, { value: '0.35', mode: 'Rosca Fina' }],
            M4: [{ value: '0.70', mode: 'Rosca Gruesa' }, { value: '0.50', mode: 'Rosca Fina' }],
            M5: [{ value: '0.80', mode: 'Rosca Gruesa' }, { value: '0.50', mode: 'Rosca Fina' }],
            M6: [{ value: '1.00', mode: 'Rosca Gruesa' }, { value: '0.75', mode: 'Rosca Fina' }],
            M8: [{ value: '1.25', mode: 'Rosca Gruesa' }, { value: '1.00', mode: 'Rosca Fina' }],
            M10: [{ value: '1.50', mode: 'Rosca Gruesa' }, { value: '1.25', mode: 'Rosca Fina' }],
            M12: [{ value: '1.75', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M14: [{ value: '2.00', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M16: [{ value: '2.00', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M20: [{ value: '2.50', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M22: [{ value: '2.50', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M24: [{ value: '3.00', mode: 'Rosca Gruesa' }, { value: '2.00', mode: 'Rosca Fina' }],
            M30: [{ value: '3.50', mode: 'Rosca Gruesa' }, { value: '2.00', mode: 'Rosca Fina' }],
            M36: [{ value: '4.00', mode: 'Rosca Gruesa' }, { value: '3.00', mode: 'Rosca Fina' }],
            '1/4"': '20UNC',
            '5/16"': '18UNC',
            '3/8"': '16UNC',
            '1/2"': '13UNC',
            '5/8"': '11UNC',
            '3/4"': '10UNC'
        }
    },
    {
        id: 'bulones',
        label: 'Bulones',
        prefix: 'BLN',
        family: 'Bulon',
        material: 'Acero 8.8',
        norma: 'DIN 933',
        types: ['Hexagonal', 'Cabeza Flange', 'Parcial Rosca'],
        diameters: ['M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M20'],
        lengths: ['16', '20', '25', '30', '40', '50', '60', '80'],
        inchDiameters: PLM_BULONERIA_INCH_THREAD_DIAMETERS,
        inchLengths: PLM_BULONERIA_INCH_THREAD_LENGTHS
    },
    {
        id: 'tuercas',
        label: 'Tuercas',
        prefix: 'TCA',
        family: 'Tuerca',
        material: 'Acero Zincado',
        norma: 'DIN 934',
        types: ['Hexagonal', 'Autofrenante', 'Ciega', 'Mariposa', 'Contra Tuerca'],
        diameters: ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16', 'M20', 'M22', 'M24', 'M30', 'M36'],
        lengths: [],
        inchDiameters: PLM_BULONERIA_INCH_NUT_DIAMETERS,
        pitchByDiameter: {
            M3: [{ value: '0.50', mode: 'Rosca Gruesa' }, { value: '0.35', mode: 'Rosca Fina' }],
            M4: [{ value: '0.70', mode: 'Rosca Gruesa' }, { value: '0.50', mode: 'Rosca Fina' }],
            M5: [{ value: '0.80', mode: 'Rosca Gruesa' }, { value: '0.50', mode: 'Rosca Fina' }],
            M6: [{ value: '1.00', mode: 'Rosca Gruesa' }, { value: '0.75', mode: 'Rosca Fina' }],
            M8: [{ value: '1.25', mode: 'Rosca Gruesa' }, { value: '1.00', mode: 'Rosca Fina' }],
            M10: [{ value: '1.50', mode: 'Rosca Gruesa' }, { value: '1.25', mode: 'Rosca Fina' }],
            M12: [{ value: '1.75', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M14: [{ value: '2.00', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M16: [{ value: '2.00', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M20: [{ value: '2.50', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M22: [{ value: '2.50', mode: 'Rosca Gruesa' }, { value: '1.50', mode: 'Rosca Fina' }],
            M24: [{ value: '3.00', mode: 'Rosca Gruesa' }, { value: '2.00', mode: 'Rosca Fina' }],
            M30: [{ value: '3.50', mode: 'Rosca Gruesa' }, { value: '2.00', mode: 'Rosca Fina' }],
            M36: [{ value: '4.00', mode: 'Rosca Gruesa' }, { value: '3.00', mode: 'Rosca Fina' }],
            '1/4"': [{ value: '20UNC', mode: 'Rosca Gruesa' }, { value: '28UNF', mode: 'Rosca Fina' }],
            '5/16"': [{ value: '18UNC', mode: 'Rosca Gruesa' }, { value: '24UNF', mode: 'Rosca Fina' }],
            '3/8"': [{ value: '16UNC', mode: 'Rosca Gruesa' }, { value: '24UNF', mode: 'Rosca Fina' }],
            '7/16"': [{ value: '14UNC', mode: 'Rosca Gruesa' }, { value: '20UNF', mode: 'Rosca Fina' }],
            '1/2"': [{ value: '13UNC', mode: 'Rosca Gruesa' }, { value: '20UNF', mode: 'Rosca Fina' }],
            '9/16"': [{ value: '12UNC', mode: 'Rosca Gruesa' }, { value: '18UNF', mode: 'Rosca Fina' }],
            '5/8"': [{ value: '11UNC', mode: 'Rosca Gruesa' }, { value: '18UNF', mode: 'Rosca Fina' }],
            '3/4"': [{ value: '10UNC', mode: 'Rosca Gruesa' }, { value: '16UNF', mode: 'Rosca Fina' }],
            '7/8"': [{ value: '9UNC', mode: 'Rosca Gruesa' }, { value: '14UNF', mode: 'Rosca Fina' }],
            '1"': [{ value: '8UNC', mode: 'Rosca Gruesa' }, { value: '12UNF', mode: 'Rosca Fina' }],
            '1 1/8"': [{ value: '7UNC', mode: 'Rosca Gruesa' }, { value: '12UNF', mode: 'Rosca Fina' }],
            '1 1/4"': [{ value: '7UNC', mode: 'Rosca Gruesa' }, { value: '12UNF', mode: 'Rosca Fina' }]
        }
    },
    {
        id: 'arandelas',
        label: 'Arandelas',
        prefix: 'ARD',
        family: 'Arandela',
        material: 'Acero Inoxidable',
        norma: 'DIN 125',
        types: ['Plana', 'Grower', 'Dentada Interior', 'Dentada Exterior', 'Biselada'],
        diameters: ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12', 'M14', 'M16'],
        lengths: [],
        inchDiameters: PLM_BULONERIA_INCH_THREAD_DIAMETERS
    },
    {
        id: 'espina_elastica',
        label: 'Espina Elastica',
        prefix: 'EEL',
        family: 'Espina Elastica',
        material: 'Acero Resorte',
        norma: 'ISO 8752',
        types: ['Cilindrica Ranurada', 'Espiral'],
        diameters: ['2', '3', '4', '5', '6', '8', '10', '12'],
        lengths: ['10', '12', '16', '20', '25', '30', '40', '50'],
        inchDiameters: PLM_BULONERIA_INCH_PIN_DIAMETERS,
        inchLengths: PLM_BULONERIA_INCH_PIN_LENGTHS
    },
    {
        id: 'varilla_roscada',
        label: 'Varilla Roscada',
        prefix: 'VRS',
        family: 'Varilla Roscada',
        material: 'Acero Zincado',
        norma: 'DIN 975',
        types: ['Rosca Total'],
        diameters: ['M6', 'M8', 'M10', 'M12', 'M16', 'M20'],
        lengths: ['500', '1000', '1500', '2000', '3000'],
        inchDiameters: PLM_BULONERIA_INCH_THREAD_DIAMETERS,
        inchLengths: PLM_BULONERIA_INCH_LONG_LENGTHS
    },
    {
        id: 'aro_seeger',
        label: 'Aro Seeger',
        prefix: 'ASE',
        family: 'Aro Seeger',
        material: 'Acero Resorte',
        norma: 'DIN 471/472',
        types: ['Interior', 'Exterior'],
        diameters: PLM_BULONERIA_SEEGER_DIAMETERS,
        lengths: [],
        inchDiameters: ['3/8"', '1/2"', '5/8"', '3/4"', '1"', '1 1/4"']
    },
    {
        id: 'chaveta',
        label: 'Chaveta',
        prefix: 'CHV',
        family: 'Chaveta',
        material: 'Acero C45',
        norma: 'DIN 6885',
        types: ['Paralela', 'Media Luna', 'R'],
        diameters: ['2x2', '3x3', '4x4', '5x5', '6x6', '8x7', '10x8', '12x8'],
        lengths: ['20', '25', '30', '40', '50', '60'],
        inchDiameters: PLM_BULONERIA_INCH_KEY_SIZES,
        inchLengths: ['1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"']
    },
    {
        id: 'o_ring',
        label: 'O Ring',
        prefix: 'ORG',
        family: 'O Ring',
        material: 'NBR 70',
        norma: 'AS568',
        types: ['NBR', 'Viton'],
        diameters: PLM_BULONERIA_ORING_DIAMETERS,
        lengths: ['1.5', '2', '2.5', '3', '3.5'],
        inchDiameters: PLM_BULONERIA_INCH_ORING_DIAMETERS,
        inchLengths: PLM_BULONERIA_INCH_ORING_SECTIONS
    },
    {
        id: 'prisioneros',
        label: 'Prisioneros',
        prefix: 'PRS',
        family: 'Prisionero',
        material: 'Acero 12.9',
        norma: 'DIN 913',
        types: ['Punta Plana', 'Punta Conica', 'Punta Copa'],
        diameters: ['M3', 'M4', 'M5', 'M6', 'M8', 'M10', 'M12'],
        lengths: ['04', '06', '08', '10', '12', '16', '20'],
        inchDiameters: PLM_BULONERIA_INCH_THREAD_DIAMETERS,
        inchLengths: ['1/4"', '3/8"', '1/2"', '5/8"', '3/4"', '1"', '1 1/4"'],
        pitchByDiameter: {
            M3: '0.50',
            M4: '0.70',
            M5: '0.80',
            M6: '1.00',
            M8: '1.25',
            M10: '1.50',
            M12: '1.75',
            '1/4"': '20UNC',
            '5/16"': '18UNC',
            '3/8"': '16UNC',
            '1/2"': '13UNC',
            '5/8"': '11UNC',
            '3/4"': '10UNC'
        }
    },
    {
        id: 'esparragos',
        label: 'Esparragos',
        prefix: 'ESP',
        family: 'Esparrago',
        material: 'Acero 10.9',
        norma: 'DIN 975',
        types: ['Rosca Total', 'Rosca Parcial'],
        diameters: ['M6', 'M8', 'M10', 'M12', 'M16', 'M20'],
        lengths: ['40', '50', '60', '80', '100', '120', '150', '200'],
        inchDiameters: PLM_BULONERIA_INCH_THREAD_DIAMETERS,
        inchLengths: PLM_BULONERIA_INCH_LONG_LENGTHS
    },
    {
        id: 'remaches',
        label: 'Remaches',
        prefix: 'RMH',
        family: 'Remache',
        material: 'Aluminio',
        norma: 'DIN 7337',
        types: ['Pop Cabeza Ancha', 'Pop Estandar', 'Estructural'],
        diameters: ['3.2', '4.0', '4.8', '6.4'],
        lengths: ['08', '10', '12', '16', '20'],
        inchDiameters: PLM_BULONERIA_INCH_RIVET_DIAMETERS,
        inchLengths: PLM_BULONERIA_INCH_RIVET_LENGTHS
    }
];

function sanitizePlmBuloneriaToken(value) {
    return String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

function sanitizePlmBuloneriaMeasureToken(value) {
    const raw = String(value || '').toUpperCase().trim();
    if (!raw) return '';
    if (raw.includes('/') || raw.includes('"') || /\s/.test(raw)) {
        const marked = raw
            .replace(/\//g, 'S')
            .replace(/"/g, 'P')
            .replace(/\s+/g, '');
        return sanitizePlmBuloneriaToken(marked);
    }
    return sanitizePlmBuloneriaToken(raw);
}

function normalizePlmBuloneriaScalar(value) {
    if (value === null || value === undefined) return '';
    const normalized = String(value).trim();
    if (!normalized) return '';
    const lower = normalized.toLowerCase();
    if (lower === 'undefined' || lower === 'null' || lower === 'nan') return '';
    return normalized;
}

function mergeUniqueBuloneriaValues(primary, secondary) {
    const out = [];
    const seen = new Set();

    [primary, secondary].forEach((list) => {
        if (!Array.isArray(list)) return;
        list.forEach((value) => {
            const normalized = normalizePlmBuloneriaScalar(value);
            if (!normalized || seen.has(normalized)) return;
            seen.add(normalized);
            out.push(normalized);
        });
    });

    return out;
}

function normalizePlmBuloneriaPitchVariants(rawPitchSpec) {
    const out = [];
    const seen = new Set();
    const specs = Array.isArray(rawPitchSpec) ? rawPitchSpec : [rawPitchSpec];

    specs.forEach((spec) => {
        const src = spec && typeof spec === 'object' ? spec : null;
        const value = normalizePlmBuloneriaScalar(src ? (src.value ?? src.pitch ?? src.step ?? '') : spec);
        const mode = normalizePlmBuloneriaScalar(src ? (src.mode || src.label || '') : '');
        if (!value) return;
        const sig = `${value}|${mode.toUpperCase()}`;
        if (seen.has(sig)) return;
        seen.add(sig);
        out.push({ value, mode });
    });

    return out;
}

function buildPlmBuloneriaCatalog() {
    const catalog = {};

    PLM_BULONERIA_CATEGORIES.forEach((category) => {
        const diameters = mergeUniqueBuloneriaValues(category.diameters, category.inchDiameters);
        const mergedLengths = mergeUniqueBuloneriaValues(category.lengths, category.inchLengths);
        const lengths = mergedLengths.length
            ? mergedLengths
            : [null];
        const items = [];

        category.types.forEach((typeName) => {
            diameters.forEach((diameter) => {
                lengths.forEach((length) => {
                    const rawDiameter = normalizePlmBuloneriaScalar(diameter);
                    if (!rawDiameter) return;
                    const isChavetaR = String(category.id || '').trim() === 'chaveta'
                        && String(typeName || '').trim().toUpperCase() === 'R';
                    const pitchMap = category && typeof category.pitchByDiameter === 'object' ? category.pitchByDiameter : null;
                    const rThickness = rawDiameter.includes('x')
                        ? String(rawDiameter.split('x')[0] || '').trim()
                        : rawDiameter;
                    const displayDiameter = isChavetaR ? rThickness : rawDiameter;

                    const pitchVariants = pitchMap
                        ? normalizePlmBuloneriaPitchVariants(pitchMap[rawDiameter])
                        : [];
                    const variants = pitchVariants.length ? pitchVariants : [{ value: '', mode: '' }];

                    variants.forEach((pitchVariant) => {
                        const pitchValue = normalizePlmBuloneriaScalar(pitchVariant && pitchVariant.value ? pitchVariant.value : '');
                        const pitchMode = normalizePlmBuloneriaScalar(pitchVariant && pitchVariant.mode ? pitchVariant.mode : '');
                        const pitchModeSuffix = pitchMode ? ` (${pitchMode})` : '';
                        const lengthValue = normalizePlmBuloneriaScalar(length);
                        const hasLength = Boolean(lengthValue);
                        const displayDiameterWithPitch = pitchValue ? `${displayDiameter}x${pitchValue}` : displayDiameter;
                        const baseName = `${category.family} ${typeName} ${displayDiameterWithPitch}${pitchModeSuffix}`;
                        const measure = hasLength ? `${displayDiameterWithPitch}x${lengthValue}` : displayDiameterWithPitch;
                        const fullName = hasLength
                            ? (isChavetaR
                                ? `${category.family} ${typeName} ${displayDiameter}x${lengthValue}`
                                : `${baseName} x ${lengthValue}`)
                            : baseName;
                        const key = `${category.id}|${typeName}|${rawDiameter}|${pitchValue || 'NOP'}|${pitchMode || 'STD'}|${hasLength ? lengthValue : 'NA'}`;
                        const code = `${category.prefix}-${sanitizePlmBuloneriaToken(typeName).slice(0, 3)}-${sanitizePlmBuloneriaMeasureToken(displayDiameter)}${pitchValue ? sanitizePlmBuloneriaMeasureToken(pitchValue) : ''}${pitchMode ? sanitizePlmBuloneriaToken(pitchMode).slice(0, 2) : ''}${hasLength ? sanitizePlmBuloneriaMeasureToken(lengthValue) : ''}`;

                        items.push({
                            key,
                            category_id: category.id,
                            category_label: category.label,
                            item_id: code,
                            name: fullName,
                            description: `${category.family} ${typeName} ${measure}${pitchModeSuffix} - ${category.norma} - ${category.material}`,
                            notes: `Buloneria | ${category.label}`,
                            revision: 'A',
                            status: 'Activo'
                        });
                    });
                });
            });
        });

        catalog[category.id] = {
            id: category.id,
            label: category.label,
            items
        };
    });

    return catalog;
}

function getPlmBuloneriaCatalog() {
    if (!plmBuloneriaCatalogByCategory) {
        plmBuloneriaCatalogByCategory = buildPlmBuloneriaCatalog();
    }
    return plmBuloneriaCatalogByCategory;
}


function notifyProject(message, type = 'success') {
    if (typeof showNotification === 'function') {
        showNotification(message, type);
    }
    if (type === 'error' && typeof showNotification !== 'function') {
        alert(message);
    }
}

async function callLocalCadHelper(path, payload = {}, timeoutMs = 30000) {
    if (!USE_LOCAL_CAD_HELPER) {
        localCadHelperStatus = 'unavailable';
        return { ok: false, data: { status: 'unavailable', message: 'Local helper disabled' } };
    }

    if (localCadHelperStatus === 'unavailable') {
        return { ok: false, data: { status: 'unavailable', message: 'Local helper unavailable' } };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || 30000));

    try {
        const response = await fetch(`${LOCAL_CAD_HELPER_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload || {}),
            signal: controller.signal
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            localCadHelperStatus = 'unavailable';
            return { ok: false, data };
        }
        localCadHelperStatus = 'available';
        return { ok: true, data };
    } catch (error) {
        localCadHelperStatus = 'unavailable';
        return { ok: false, data: { status: 'error', message: String(error && error.message || 'Local helper unavailable') } };
    } finally {
        clearTimeout(timer);
    }
}


function setProjectModalError(message = '') {
    const el = document.getElementById('project-modal-error');
    if (!el) {
        if (message) alert(message);
        return;
    }

    const text = String(message || '').trim();
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
}

function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function formatMoney(value, options = {}) {
    const amount = toNumber(value, 0);
    const minDigitsRaw = toNumber(options && options.minimumFractionDigits, 2);
    const minDigits = Math.max(0, Math.min(6, Math.floor(minDigitsRaw)));
    const maxDigitsRaw = toNumber(options && options.maximumFractionDigits, minDigits);
    const maxDigits = Math.max(minDigits, Math.min(6, Math.floor(maxDigitsRaw)));
    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: minDigits,
            maximumFractionDigits: maxDigits
        }).format(amount);
    } catch (_) {
        return `$${amount.toFixed(maxDigits)}`;
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}


function normalizeSearchText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
}

function searchTextMatch(haystack, query) {
    const q = normalizeSearchText(query);
    if (!q) return true;
    return normalizeSearchText(haystack).includes(q);
}

function getWorkspaceSearchQuery(scopeRaw) {
    const scope = String(scopeRaw || '').trim().toLowerCase();
    if (scope === 'plm') return plmItemsSearchQuery;
    if (scope === 'bom') return plmBomTableSearchQuery;
    if (scope === 'erp') return erpHomeSearchQuery;
    if (scope === 'suppliers') return erpSuppliersSearchQuery;
    if (scope === 'materials') return erpMpSearchQuery;
    if (scope === 'versions') return plmVersionsSearchQuery;
    return '';
}

function setWorkspaceSearchQuery(scopeRaw, valueRaw) {
    const scope = String(scopeRaw || '').trim().toLowerCase();
    const value = String(valueRaw || '');
    if (scope === 'plm') plmItemsSearchQuery = value;
    else if (scope === 'bom') plmBomTableSearchQuery = value;
    else if (scope === 'erp') erpHomeSearchQuery = value;
    else if (scope === 'suppliers') erpSuppliersSearchQuery = value;
    else if (scope === 'materials') erpMpSearchQuery = value;
    else if (scope === 'versions') plmVersionsSearchQuery = value;
}

function applySearchToTbody(tbody, query, emptyColspan, emptyMessage = 'Sin resultados para la busqueda.') {
    if (!tbody) return;

    const q = normalizeSearchText(query);
    const previousEmpty = tbody.querySelector('.plm-search-empty-row');
    if (previousEmpty) previousEmpty.remove();

    const allRows = Array.from(tbody.querySelectorAll('tr'));
    const dataRows = allRows.filter((row) => !row.querySelector('td[colspan]'));

    if (!q) {
        dataRows.forEach((row) => {
            row.style.display = '';
        });
        return;
    }

    if (!dataRows.length) return;

    let visible = 0;
    dataRows.forEach((row) => {
        const match = searchTextMatch(row.textContent || '', q);
        row.style.display = match ? '' : 'none';
        if (match) visible += 1;
    });

    if (!visible) {
        const tr = document.createElement('tr');
        tr.className = 'plm-search-empty-row';
        tr.innerHTML = `<td colspan="${escapeHtml(String(emptyColspan || 1))}" class="text-center plm-empty">${escapeHtml(emptyMessage)}</td>`;
        tbody.appendChild(tr);
    }
}

function updateWorkspaceTableSearch(scopeRaw, valueRaw) {
    const scope = String(scopeRaw || '').trim().toLowerCase();
    setWorkspaceSearchQuery(scope, valueRaw);

    if (scope === 'plm') renderPlmTable();
    else if (scope === 'bom') renderBomClassificationTable();
    else if (scope === 'erp') renderErpHomePiecesTable();
    else if (scope === 'suppliers') renderErpSuppliersTable();
    else if (scope === 'materials') renderErpRawMaterialsTable();
    else if (scope === 'versions') renderWorkspaceVersionsTable();
}

function getBomBadgeTone(category) {
    const c = String(category || '').trim();
    if (c === 'Conjunto') return 'category-conjunto';
    if (c === 'Subconjunto 1') return 'category-sub1';
    if (c === 'Subconjunto 1.1') return 'category-sub11';
    if (c === 'Piezas') return 'category-piezas';
    if (c === 'Buloneria') return 'category-buloneria';
    if (c === 'Core') return 'category-core';
    return 'category-sin';
}

function renderBomBadge(label, toneClass) {
    const safe = escapeHtml(label);
    const tone = String(toneClass || 'category-sin').trim();
    return `<span class="plm-bom-badge ${tone}">${safe}</span>`;
}

function renderBomBadgeList(labels = [], toneClass = 'category-sin') {
    const values = Array.from(new Set((Array.isArray(labels) ? labels : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean)));

    if (!values.length) return '-';
    return `<div class="plm-bom-badge-list">${values.map((value) => renderBomBadge(value, toneClass)).join('')}</div>`;
}

function renderBomColorBadge(label, toneClass = 'branch-conjunto', colorRaw = '') {
    const safe = escapeHtml(label);
    const tone = String(toneClass || 'branch-conjunto').trim();
    const color = String(colorRaw || '').trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return `<span class="plm-bom-badge ${tone}">${safe}</span>`;
    }

    const bg = `${color}33`;
    const style = `color:${color}; background-color:${bg}; border-color:${color};`;
    return `<span class="plm-bom-badge ${tone}" style="${escapeHtml(style)}">${safe}</span>`;
}

function buildBomBranchToneMap(rows = [], listKey = 'conjuntoList', offset = 0) {
    const palette = Array.isArray(ERP_DIAGRAM_TONE_COLORS) && ERP_DIAGRAM_TONE_COLORS.length
        ? ERP_DIAGRAM_TONE_COLORS
        : ['#3498db', '#f1c40f', '#2ecc71', '#95a5a6', '#e67e22', '#9b59b6'];
    const toneMap = new Map();

    (Array.isArray(rows) ? rows : []).forEach((row) => {
        const labels = row && Array.isArray(row[listKey]) ? row[listKey] : [];
        labels.forEach((labelRaw) => {
            const label = String(labelRaw || '').trim();
            if (!label || toneMap.has(label)) return;
            const idx = (toneMap.size + Math.max(0, Number(offset) || 0)) % palette.length;
            toneMap.set(label, String(palette[idx] || '#3498db'));
        });
    });

    return toneMap;
}

function renderBomBranchBadgeList(labels = [], toneClass = 'branch-conjunto', toneMap = null) {
    const values = Array.from(new Set((Array.isArray(labels) ? labels : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean)));
    if (!values.length) return '-';

    return `<div class="plm-bom-badge-list">${values.map((value) => {
        const tone = toneMap instanceof Map ? toneMap.get(value) : '';
        return renderBomColorBadge(value, toneClass, tone);
    }).join('')}</div>`;
}

function renderBomPartBadge(part, toneClass = 'branch-pieza') {
    const itemCode = escapeHtml(String(part && part.item_id ? part.item_id : 'Sin Item ID').trim() || 'Sin Item ID');
    const itemName = escapeHtml(String(part && part.name ? part.name : 'Sin nombre').trim() || 'Sin nombre');
    const tone = String(toneClass || 'branch-pieza').trim();
    return `<span class="plm-bom-badge ${tone} plm-bom-part-badge"><span class="plm-bom-part-code">${itemCode}</span><span class="plm-bom-part-name">- ${itemName}</span></span>`;
}

function normalizeBomCategoryValue(categoryRaw) {
    const category = String(categoryRaw || '').trim();
    if (category === 'Conjunto') return category;
    if (category === 'Subconjunto 1') return category;
    if (category === 'Subconjunto 1.1') return category;
    if (category === 'Piezas') return category;
    if (category === 'Buloneria') return category;
    return '';
}

function normalizePlmItem(item, fallbackId = '') {
    const src = item && typeof item === 'object' ? item : {};
    const specialConfig = getBomSpecialConfigFromNode(src);
    return {
        id: String(src.id || fallbackId || `plm-${Date.now()}`),
        item_id: String(src.item_id || src.code || '').trim(),
        name: String(src.name || '').trim(),
        description: String(src.description || '').trim(),
        revision: String(src.revision || '').trim() || 'A',
        status: String(src.status || '').trim() || 'Activo',
        drawing: String(src.drawing || '').trim(),
        cad: String(src.cad || '').trim(),
        notes: String(src.notes || '').trim(),
        branch_name: String(src.branch_name || src.branch || '').trim(),
        category: String(src.category || '').trim(),
        x: toNumber(src.x, 0),
        y: toNumber(src.y, 0),
        bom_special_enabled: specialConfig.enabled,
        bom_special_numerator: specialConfig.numerator,
        bom_special_every: specialConfig.every
    };
}

function normalizeBomDuplicateNode(node, fallbackId = '', allowedSourceIds = null) {
    const src = node && typeof node === 'object' ? node : {};
    const sourceId = String(src.duplicate_source_id || src.source_id || '').trim();
    if (!sourceId) return null;
    if (allowedSourceIds instanceof Set && !allowedSourceIds.has(sourceId)) return null;
    const specialConfig = getBomSpecialConfigFromNode(src);

    return {
        id: String(src.id || fallbackId || `dup-${Date.now()}`),
        duplicate_source_id: sourceId,
        item_id: String(src.item_id || src.code || '').trim(),
        name: String(src.name || '').trim(),
        description: String(src.description || '').trim(),
        revision: String(src.revision || '').trim() || 'A',
        status: String(src.status || '').trim() || 'Activo',
        drawing: String(src.drawing || '').trim(),
        cad: String(src.cad || '').trim(),
        notes: String(src.notes || '').trim(),
        branch_name: String(src.branch_name || src.branch || '').trim(),
        category: String(src.category || '').trim(),
        x: toNumber(src.x, 0),
        y: toNumber(src.y, 0),
        bom_special_enabled: specialConfig.enabled,
        bom_special_numerator: specialConfig.numerator,
        bom_special_every: specialConfig.every,
        is_bom_duplicate: true
    };
}

function sanitizeVersionBuloneriaHierarchy(versionItems = [], versionEdges = [], versionDuplicateNodes = []) {
    const items = Array.isArray(versionItems) ? versionItems : [];
    const edges = Array.isArray(versionEdges) ? versionEdges : [];
    const duplicates = Array.isArray(versionDuplicateNodes) ? versionDuplicateNodes : [];

    if (!items.length) {
        return {
            items: [],
            edges: [],
            duplicateNodes: []
        };
    }

    const duplicateSourceById = new Map();
    duplicates.forEach((node) => {
        const id = String(node && node.id ? node.id : '').trim();
        const sourceId = String(node && node.duplicate_source_id ? node.duplicate_source_id : '').trim();
        if (!id || !sourceId) return;
        duplicateSourceById.set(id, sourceId);
    });

    const toCanonicalId = (nodeIdRaw) => {
        let nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId || nodeId === 'core') return nodeId;

        const visited = new Set();
        let guard = 0;
        while (duplicateSourceById.has(nodeId) && guard < 64 && !visited.has(nodeId)) {
            visited.add(nodeId);
            const next = String(duplicateSourceById.get(nodeId) || '').trim();
            if (!next || next === nodeId) break;
            nodeId = next;
            guard += 1;
        }
        return nodeId;
    };

    const itemById = new Map();
    items.forEach((item) => {
        const id = String(item && item.id ? item.id : '').trim();
        if (id) itemById.set(id, item);
    });

    const isBuloneriaCanonicalId = (itemIdRaw) => {
        const itemId = String(itemIdRaw || '').trim();
        if (!itemId) return false;
        const item = itemById.get(itemId);
        if (!item) return false;
        const explicitCategory = String(item && item.category ? item.category : '').trim();
        if (explicitCategory === 'Buloneria') return true;
        return String(getBomCategory(item) || '').trim() === 'Buloneria';
    };

    const selectedCanonicalIds = new Set(Array.from(itemById.keys()));
    const hasSelectedParent = (targetCanonicalIdRaw) => {
        const targetCanonicalId = String(targetCanonicalIdRaw || '').trim();
        if (!targetCanonicalId) return false;

        for (const edge of edges) {
            const rawTargetId = String(edge && edge.target_id ? edge.target_id : '').trim();
            if (!rawTargetId) continue;
            const edgeTargetCanonicalId = toCanonicalId(rawTargetId);
            if (edgeTargetCanonicalId !== targetCanonicalId) continue;

            const rawSourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
            if (!rawSourceId || rawSourceId === 'core') return true;
            const sourceCanonicalId = toCanonicalId(rawSourceId);
            if (sourceCanonicalId && selectedCanonicalIds.has(sourceCanonicalId)) return true;
        }

        return false;
    };

    const filteredItems = items.filter((item) => {
        const itemId = String(item && item.id ? item.id : '').trim();
        if (!itemId) return false;
        if (!isBuloneriaCanonicalId(itemId)) return true;
        return hasSelectedParent(itemId);
    });

    const allowedCanonicalIds = new Set(
        filteredItems
            .map((item) => String(item && item.id ? item.id : '').trim())
            .filter(Boolean)
    );

    const canonicalFilteredEdges = edges.filter((edge) => {
        const rawTargetId = String(edge && edge.target_id ? edge.target_id : '').trim();
        const rawSourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
        if (!rawTargetId || !rawSourceId || rawTargetId === rawSourceId) return false;

        const targetCanonicalId = toCanonicalId(rawTargetId);
        if (!targetCanonicalId || targetCanonicalId === 'core') return false;
        if (!allowedCanonicalIds.has(targetCanonicalId)) return false;

        if (rawSourceId === 'core') return true;
        const sourceCanonicalId = toCanonicalId(rawSourceId);
        if (!sourceCanonicalId || sourceCanonicalId === 'core') return false;
        return allowedCanonicalIds.has(sourceCanonicalId);
    });

    const duplicateIds = new Set(
        duplicates
            .map((node) => String(node && node.id ? node.id : '').trim())
            .filter(Boolean)
    );
    const referencedDuplicateIds = new Set();
    canonicalFilteredEdges.forEach((edge) => {
        const sourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
        const targetId = String(edge && edge.target_id ? edge.target_id : '').trim();
        if (duplicateIds.has(sourceId)) referencedDuplicateIds.add(sourceId);
        if (duplicateIds.has(targetId)) referencedDuplicateIds.add(targetId);
    });

    const filteredDuplicateNodes = duplicates.filter((node) => {
        const nodeId = String(node && node.id ? node.id : '').trim();
        if (!nodeId || !referencedDuplicateIds.has(nodeId)) return false;
        const canonicalId = toCanonicalId(nodeId);
        return Boolean(canonicalId && allowedCanonicalIds.has(canonicalId));
    });

    const allowedNodeIds = new Set([
        ...Array.from(allowedCanonicalIds),
        ...filteredDuplicateNodes.map((node) => String(node && node.id ? node.id : '').trim()).filter(Boolean)
    ]);

    const filteredEdges = canonicalFilteredEdges.filter((edge) => {
        const rawTargetId = String(edge && edge.target_id ? edge.target_id : '').trim();
        const rawSourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
        if (!rawTargetId || !allowedNodeIds.has(rawTargetId)) return false;
        if (rawSourceId === 'core') return true;
        return Boolean(rawSourceId && allowedNodeIds.has(rawSourceId));
    });

    return {
        items: filteredItems,
        edges: filteredEdges,
        duplicateNodes: filteredDuplicateNodes
    };
}

function normalizeErpSupplier(item, fallbackId = '') {
    const src = item && typeof item === 'object' ? item : {};
    const rawSupplies = Array.isArray(src.supplies)
        ? src.supplies
        : String(src.supplies || src.provee || '').split(',');

    const supplies = Array.from(new Set(
        rawSupplies
            .map((value) => String(value || '').trim())
            .filter((value) => value && ERP_SUPPLIER_SUPPLY_OPTIONS.includes(value))
    ));

    return {
        id: String(src.id || fallbackId || `sup-${Date.now()}`),
        name: String(src.name || src.supplier || '').trim(),
        provider_id: String(src.provider_id || src.supplier_id || src.code || '').trim(),
        description: String(src.description || '').trim(),
        country: String(src.country || src.pais || '').trim(),
        supplies
    };
}

function normalizeErpRawMaterial(item, fallbackId = '') {
    const src = item && typeof item === 'object' ? item : {};
    return {
        id: String(src.id || fallbackId || `mp-${Date.now()}`),
        category: String(src.category || src.raw_material || src.materia_prima || '').trim(),
        mp_id: String(src.mp_id || src.material_id || '').trim(),
        reference: String(src.reference || src.referencia || '').trim(),
        material: String(src.material || '').trim()
    };
}


function normalizeErpVariantCode(valueRaw, fallbackNumber = 1) {
    const raw = String(valueRaw || '').trim();
    const digits = raw.replace(/[^0-9]/g, '');

    let number = digits ? parseInt(digits, 10) : Math.floor(toNumber(fallbackNumber, 1));
    if (!Number.isFinite(number) || number < 1) number = 1;

    return String(number).padStart(3, '0');
}

function getErpVariantNumber(valueRaw, fallbackNumber = 1) {
    const normalized = normalizeErpVariantCode(valueRaw, fallbackNumber);
    const parsed = parseInt(normalized, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function compareErpDiagramRows(a, b) {
    const aItem = String(a && a.item_id ? a.item_id : '').trim();
    const bItem = String(b && b.item_id ? b.item_id : '').trim();
    const byItem = aItem.localeCompare(bItem, 'es', { sensitivity: 'base' });
    if (byItem !== 0) return byItem;

    const aVariant = getErpVariantNumber(a && a.variant_code ? a.variant_code : '', 1);
    const bVariant = getErpVariantNumber(b && b.variant_code ? b.variant_code : '', 1);
    if (aVariant !== bVariant) return aVariant - bVariant;

    const aId = String(a && a.id ? a.id : '').trim();
    const bId = String(b && b.id ? b.id : '').trim();
    return aId.localeCompare(bId, 'es', { sensitivity: 'base' });
}

function normalizeErpDiagramRow(row, fallbackId = '') {
    const src = row && typeof row === 'object' ? row : {};
    const category = String(src.category || '').trim();

    const mecanizadoColumns = ERP_DIAGRAM_MACHINING_COLUMNS.map((column) => String(column.key || '').trim()).filter(Boolean);
    const hasMecanizadoBreakdown = mecanizadoColumns.some((key) => Number.isFinite(toNumber(src[key], NaN)));
    const legacyMecanizado = Math.max(0, toNumber(src.cost_mecanizado, 0));
    const mecanizadoValues = {};
    mecanizadoColumns.forEach((key) => {
        const fallback = 0;
        mecanizadoValues[key] = Math.max(0, toNumber(src[key], fallback));
    });

    const treatmentColumns = ERP_DIAGRAM_TREATMENT_COLUMNS.map((column) => String(column.key || '').trim()).filter(Boolean);
    const legacyTreatment = Math.max(
        0,
        toNumber(
            src.cost_tratamiento,
            Math.max(0, toNumber(src.cost_tratamiento_superficial, 0)) + Math.max(0, toNumber(src.cost_tratamiento_termico, 0))
        )
    );
    const hasTreatmentBreakdown = treatmentColumns.some((key) => Number.isFinite(toNumber(src[key], NaN)));
    const treatmentValues = {};
    treatmentColumns.forEach((key) => {
        const fallback = (!hasTreatmentBreakdown && key === 'cost_tratamiento_superficial') ? legacyTreatment : 0;
        treatmentValues[key] = Math.max(0, toNumber(src[key], fallback));
    });

    const normalized = {
        id: String(src.id || fallbackId || `edr-${Date.now()}`),
        item_id: String(src.item_id || src.plm_item_id || '').trim(),
        variant_code: normalizeErpVariantCode(src.variant_code || src.variant || src.v || '', 1),
        category: ERP_DIAGRAM_ZONES.includes(category) ? category : ERP_UNASSIGNED_CATEGORY,
        provider_id: String(src.provider_id || '').trim(),
        [ERP_DIAGRAM_MACHINING_PROVIDER_CHILD_KEY]: String(
            src[ERP_DIAGRAM_MACHINING_PROVIDER_CHILD_KEY] || src.cost_mecanizado_provider || ''
        ).trim(),
        [ERP_DIAGRAM_TREATMENT_PROVIDER_CHILD_KEY]: String(
            src[ERP_DIAGRAM_TREATMENT_PROVIDER_CHILD_KEY] || src.cost_tratamiento_provider || ''
        ).trim(),
        [ERP_DIAGRAM_PAINT_PROVIDER_CHILD_KEY]: String(
            src[ERP_DIAGRAM_PAINT_PROVIDER_CHILD_KEY] || src.cost_pintado_provider || ''
        ).trim(),
        value_status: normalizeErpValueStatus(src.value_status || src.estado_valor || 'Supuesto'),
        value_date: normalizeErpValueDate(src.value_date || src.fecha_valor || src.fecha || ''),
        mp_category: String(src.mp_category || '').trim(),
        mp_material: String(src.mp_material || '').trim(),
        mp_reference: String(src.mp_reference || src.reference || '').trim(),
        x: toNumber(src.x, NaN),
        y: toNumber(src.y, NaN),
        kg: Math.max(0, toNumber(src.kg, 0)),
        mts: Math.max(0, toNumber(src.mts, 0)),
        quoted_qty: Math.max(1, Math.round(toNumber(src.quoted_qty, 1))),
        cost_mp_x_kg: Math.max(0, toNumber(src.cost_mp_x_kg, 0)),
        cost_mp_x_mt: Math.max(0, toNumber(src.cost_mp_x_mt, 0)),
        cost_mp: Math.max(0, toNumber(src.cost_mp, 0)),
        cost_mecanizado: Math.max(0, toNumber(src.cost_mecanizado, legacyMecanizado)),
        ...mecanizadoValues,
        cost_tratamiento: Math.max(0, toNumber(src.cost_tratamiento, legacyTreatment)),
        ...treatmentValues,
        cost_pintado: Math.max(0, toNumber(src.cost_pintado, 0)),
        cost_importacion: normalizeErpImportPercentValue(src.cost_importacion),
        cost_matriceria: Math.max(0, toNumber(src.cost_matriceria, 0))
    };

    applyErpDiagramImplicitGroupProviders(normalized);
    return normalized;

}

function getErpItemDiagramRows(itemIdRaw) {
    const itemId = String(itemIdRaw || '').trim();
    if (!itemId) return [];

    return getErpDiagramRows()
        .filter((row) => String(row && row.item_id ? row.item_id : '').trim() === itemId)
        .sort(compareErpDiagramRows);
}

function getNextErpVariantCodeForItem(itemIdRaw) {
    const rows = getErpItemDiagramRows(itemIdRaw);
    if (!rows.length) return '001';

    const maxNumber = rows.reduce((acc, row) => Math.max(acc, getErpVariantNumber(row && row.variant_code ? row.variant_code : '', 1)), 1);
    return normalizeErpVariantCode(String(maxNumber + 1), maxNumber + 1);
}

function createErpDiagramVariantRow(itemIdRaw, sourceRow = null) {
    if (!currentWorkspaceProject) return null;

    const itemId = String(itemIdRaw || '').trim();
    if (!itemId) return null;

    const variantCode = getNextErpVariantCodeForItem(itemId);
    const base = sourceRow && typeof sourceRow === 'object'
        ? normalizeErpDiagramRow(sourceRow)
        : normalizeErpDiagramRow({});

    const created = normalizeErpDiagramRow({
        ...base,
        id: `edr-${Date.now()}-${Math.floor(Math.random() * 100000)}-${Math.floor(Math.random() * 1000)}`,
        item_id: itemId,
        variant_code: variantCode,
        category: ERP_UNASSIGNED_CATEGORY,
        x: NaN,
        y: NaN
    });

    const rows = getErpDiagramRows();
    rows.push(created);
    return created;
}

function maybeFixMojibakeText(textRaw) {
    const text = String(textRaw == null ? '' : textRaw);
    if (!/[\u00C3\u00C2\u00E2]/.test(text)) return text;

    try {
        const bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i += 1) {
            const code = text.charCodeAt(i);
            if (code > 255) return text;
            bytes[i] = code;
        }

        const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        const badScore = (value) => (String(value).match(/[\u00C3\u00C2\u00E2]/g) || []).length;
        if (decoded && badScore(decoded) < badScore(text)) return decoded;
    } catch (_) {
        // Keep original text when decoding is not safe.
    }

    return text;
}

function normalizeProjectTextEncoding(value) {
    if (typeof value === 'string') return maybeFixMojibakeText(value);
    if (Array.isArray(value)) return value.map((entry) => normalizeProjectTextEncoding(entry));
    if (!value || typeof value !== 'object') return value;

    const normalized = {};
    Object.keys(value).forEach((key) => {
        normalized[key] = normalizeProjectTextEncoding(value[key]);
    });
    return normalized;
}


function ensureProjectShape(project) {
    const source = project && typeof project === 'object' ? normalizeProjectTextEncoding(project) : {};
    const p = source && typeof source === 'object' ? { ...source } : {};
    p.id = String(p.id || Date.now().toString());
    p.name = String(p.name || '').trim() || 'Proyecto sin nombre';
    p.description = String(p.description || '').trim();
    p.date = p.date || new Date().toLocaleDateString();
    p.status = p.status || 'Activo';
    p.solids = Array.isArray(p.solids) ? p.solids : [];

    p.plm_items = Array.isArray(p.plm_items)
        ? p.plm_items.map((item, idx) => normalizePlmItem(item, `plm-${p.id}-${idx + 1}`))
        : [];

    const legacyLinks = Array.isArray(p.bom_links) ? p.bom_links : [];
    const rawEdges = Array.isArray(p.bom_edges) ? p.bom_edges : [];
    const mergedEdges = rawEdges.length ? rawEdges : legacyLinks.map((link) => ({
        id: link.id,
        source_id: link.parent_id,
        target_id: link.child_id,
        quantity: toNumber(link.quantity, 1)
    }));

    p.bom_edges = mergedEdges
        .map((edge, idx) => ({
            id: String(edge.id || `edge-${p.id}-${idx + 1}`),
            source_id: String(edge.source_id || '').trim(),
            target_id: String(edge.target_id || '').trim(),
            quantity: normalizeBomQuantity(edge.quantity, 1)
        }))
        .filter((edge) => edge.source_id && edge.target_id && edge.source_id !== edge.target_id);

    const projectItemIdSet = new Set((p.plm_items || []).map((item) => String(item && item.id ? item.id : '').trim()).filter(Boolean));
    p.bom_duplicate_nodes = Array.isArray(p.bom_duplicate_nodes)
        ? p.bom_duplicate_nodes
            .map((node, idx) => normalizeBomDuplicateNode(node, `dup-${p.id}-${idx + 1}`, projectItemIdSet))
            .filter(Boolean)
        : [];

    p.erp_items = Array.isArray(p.erp_items)
        ? p.erp_items.map((item, idx) => ({
            id: String(item.id || `erp-${p.id}-${idx + 1}`),
            supplier: String(item.supplier || '').trim(),
            material: String(item.material || '').trim(),
            unit_cost: toNumber(item.unit_cost, 0),
            lead_time: Math.max(0, Math.round(toNumber(item.lead_time, 0)))
        }))
        : [];

    p.erp_suppliers = Array.isArray(p.erp_suppliers)
        ? p.erp_suppliers.map((item, idx) => normalizeErpSupplier(item, `sup-${p.id}-${idx + 1}`))
        : [];

    p.erp_raw_materials = Array.isArray(p.erp_raw_materials)
        ? p.erp_raw_materials.map((item, idx) => normalizeErpRawMaterial(item, `mp-${p.id}-${idx + 1}`))
        : [];

    const rawErpLayout = p.erp_diagram_layout && typeof p.erp_diagram_layout === 'object' ? p.erp_diagram_layout : {};
    p.erp_diagram_layout = {};
    ERP_DIAGRAM_ZONES.forEach((category, idx) => {
        const source = rawErpLayout[category] && typeof rawErpLayout[category] === 'object' ? rawErpLayout[category] : {};
        const minSpan = getErpZoneMinSpan(category);
        p.erp_diagram_layout[category] = {
            col: snapErpZoneGridValue(source.col, category, idx % ERP_DIAGRAM_GRID_COLUMNS),
            row: snapErpZoneGridValue(source.row, category, Math.floor(idx / ERP_DIAGRAM_GRID_COLUMNS)),
            w: snapErpZoneGridValue(source.w, category, 1, minSpan),
            h: snapErpZoneGridValue(source.h, category, 1, minSpan)
        };
    });

    const rawErpDiagramColumnVisibility = p.erp_diagram_column_visibility && typeof p.erp_diagram_column_visibility === 'object'
        ? p.erp_diagram_column_visibility
        : {};
    p.erp_diagram_column_visibility = {};
    ERP_DIAGRAM_ZONES.forEach((category) => {
        const source = rawErpDiagramColumnVisibility[category] && typeof rawErpDiagramColumnVisibility[category] === 'object'
            ? rawErpDiagramColumnVisibility[category]
            : {};
        const next = {};
        ERP_DIAGRAM_CONFIGURABLE_COLUMNS.forEach((column) => {
            const key = String(column && column.key ? column.key : '').trim();
            if (!key) return;
            next[key] = source[key] === false ? false : source[key] === true ? true : getErpDiagramColumnDefaultVisibility(column);
        });
        p.erp_diagram_column_visibility[category] = next;
    });

    const plmItemIds = new Set((p.plm_items || []).map((item) => String(item.id || '').trim()).filter(Boolean));
    p.erp_diagram_rows = Array.isArray(p.erp_diagram_rows)
        ? p.erp_diagram_rows
            .map((row, idx) => normalizeErpDiagramRow(row, `edr-${p.id}-${idx + 1}`))
            .filter((row) => row.item_id && plmItemIds.has(row.item_id) && ERP_DIAGRAM_ZONES.includes(row.category))
        : [];

    p.cpq_items = Array.isArray(p.cpq_items)
        ? p.cpq_items.map((item, idx) => ({
            id: String(item.id || `cpq-${p.id}-${idx + 1}`),
            option: String(item.option || '').trim(),
            delta_cost: toNumber(item.delta_cost, 0)
        }))
        : [];

    const cfg = p.cpq_settings && typeof p.cpq_settings === 'object' ? p.cpq_settings : {};
    p.cpq_settings = {
        quantity: Math.max(1, Math.round(toNumber(cfg.quantity, 1))),
        margin: Math.max(0, toNumber(cfg.margin, 25))
    };

    const rawVersions = Array.isArray(p.plm_versions) ? p.plm_versions : [];
    p.plm_versions = rawVersions.map((version, idx) => {
        const v = version && typeof version === 'object' ? version : {};
        const versionId = String(v.id || `ver-${p.id}-${idx + 1}`);

        let versionItems = [];
        if (Array.isArray(v.plm_items) && v.plm_items.length) {
            versionItems = v.plm_items.map((item, itemIdx) => normalizePlmItem(item, `vitem-${versionId}-${itemIdx + 1}`));
        } else {
            const itemIds = Array.isArray(v.item_ids) ? v.item_ids.map((id) => String(id || '').trim()).filter(Boolean) : [];
            if (itemIds.length) {
                versionItems = p.plm_items
                    .filter((item) => itemIds.includes(String(item.id)))
                    .map((item) => normalizePlmItem(item, String(item.id)));
            }
        }

        const versionItemCategoryById = new Map();
        versionItems.forEach((item) => {
            const id = String(item && item.id ? item.id : '').trim();
            const category = normalizeBomCategoryValue(item && item.category ? item.category : '');
            if (!id || !category) return;
            versionItemCategoryById.set(id, category);
        });

        const itemSet = new Set(versionItems.map((item) => String(item.id)));
        const versionDuplicateNodes = Array.isArray(v.bom_duplicate_nodes)
            ? v.bom_duplicate_nodes
                .map((node, dupIdx) => normalizeBomDuplicateNode(node, `vdup-${versionId}-${dupIdx + 1}`, itemSet))
                .filter(Boolean)
                .map((node) => {
                    const ownCategory = normalizeBomCategoryValue(node && node.category ? node.category : '');
                    if (ownCategory) return node;

                    const sourceId = String(node && node.duplicate_source_id ? node.duplicate_source_id : '').trim();
                    if (!sourceId) return node;

                    const sourceCategory = normalizeBomCategoryValue(versionItemCategoryById.get(sourceId) || '');
                    if (!sourceCategory) return node;
                    return { ...node, category: sourceCategory };
                })
            : [];
        const versionNodeSet = new Set([...itemSet, ...versionDuplicateNodes.map((node) => String(node.id || '').trim()).filter(Boolean)]);

        const versionEdgesRaw = Array.isArray(v.bom_edges) ? v.bom_edges : [];
        const versionEdges = versionEdgesRaw
            .map((edge, edgeIdx) => ({
                id: String(edge.id || `vedge-${versionId}-${edgeIdx + 1}`),
                source_id: String(edge.source_id || '').trim(),
                target_id: String(edge.target_id || '').trim(),
                quantity: normalizeBomQuantity(edge.quantity, 1)
            }))
            .filter((edge) => {
                if (!edge.source_id || !edge.target_id || edge.source_id === edge.target_id) return false;
                if (!versionNodeSet.has(edge.target_id)) return false;
                if (edge.source_id === 'core') return true;
                return versionNodeSet.has(edge.source_id);
            });

        const sanitizedVersionData = sanitizeVersionBuloneriaHierarchy(versionItems, versionEdges, versionDuplicateNodes);
        const sanitizedVersionItems = Array.isArray(sanitizedVersionData.items) ? sanitizedVersionData.items : [];
        const sanitizedVersionEdges = Array.isArray(sanitizedVersionData.edges) ? sanitizedVersionData.edges : [];
        const sanitizedVersionDuplicateNodes = Array.isArray(sanitizedVersionData.duplicateNodes) ? sanitizedVersionData.duplicateNodes : [];

        const createdAt = String(v.created_at || v.date || '').trim() || new Date().toISOString();
        const updatedAt = String(v.updated_at || v.modified_at || '').trim() || createdAt;
        const versionItemIds = sanitizedVersionItems.map((item) => String(item.id));
        const bomVariantSelection = cloneBomVariantSelectionMap(v.bom_variant_selection || v.erp_variant_selection || {}, versionItemIds);
        const rawBitacoraRecords = Array.isArray(v.bitacora_records)
            ? v.bitacora_records
            : Array.isArray(v.registros)
                ? v.registros
                : Array.isArray(v.logs)
                    ? v.logs
                    : [];
        const bitacoraRecords = rawBitacoraRecords
            .map((entry, entryIdx) => {
                const src = entry && typeof entry === 'object' ? entry : {};
                const title = String(src.title || src.titulo || '').trim();
                const description = String(src.description || src.descripcion || '').trim();
                const createdAtEntry = String(src.created_at || src.date || src.fecha || '').trim() || updatedAt;
                return {
                    id: String(src.id || `vlog-${versionId}-${entryIdx + 1}`),
                    title,
                    description,
                    created_at: createdAtEntry
                };
            })
            .filter((entry) => String(entry.title || '').trim() || String(entry.description || '').trim())
            .sort((a, b) => {
                const ta = Date.parse(String(a && a.created_at ? a.created_at : '')) || 0;
                const tb = Date.parse(String(b && b.created_at ? b.created_at : '')) || 0;
                return tb - ta;
            });

        return {
            id: versionId,
            name: String(v.name || '').trim() || `Version ${idx + 1}`,
            description: String(v.description || '').trim(),
            revision: normalizePlmVersionRevision(v.revision, idx + 1),
            created_at: createdAt,
            updated_at: updatedAt,
            item_ids: versionItemIds,
            plm_items: sanitizedVersionItems,
            bom_edges: sanitizedVersionEdges,
            bom_duplicate_nodes: sanitizedVersionDuplicateNodes,
            bom_variant_selection: bomVariantSelection,
            bitacora_records: bitacoraRecords
        };
    }).sort((a, b) => {
        const ta = Date.parse(String(a.created_at || '')) || 0;
        const tb = Date.parse(String(b.created_at || '')) || 0;
        return tb - ta;
    });

    p.active_plm_version_id = String(p.active_plm_version_id || '').trim();
    if (p.active_plm_version_id && !p.plm_versions.some((version) => String(version.id) === p.active_plm_version_id)) {
        p.active_plm_version_id = '';
    }

    return p;
}

function upsertProjectCache(project) {
    const normalized = ensureProjectShape(project);
    const idx = projectsCache.findIndex((p) => String(p.id) === String(normalized.id));
    if (idx >= 0) projectsCache[idx] = normalized;
    else projectsCache.push(normalized);
    return normalized;
}

function getProjectVersionById(versionIdRaw) {
    if (!currentWorkspaceProject) return null;
    const id = String(versionIdRaw || '').trim();
    if (!id) return null;

    const versions = Array.isArray(currentWorkspaceProject.plm_versions)
        ? currentWorkspaceProject.plm_versions
        : [];

    return versions.find((version) => String(version.id || '') === id) || null;
}

function plmVersionRevisionNumberToLetters(numberRaw) {
    let n = Math.max(1, Math.floor(toNumber(numberRaw, 1)));
    let letters = '';

    while (n > 0) {
        const rem = (n - 1) % 26;
        letters = String.fromCharCode(65 + rem) + letters;
        n = Math.floor((n - 1) / 26);
    }

    return letters || 'A';
}

function plmVersionRevisionLettersToNumber(lettersRaw) {
    const letters = String(lettersRaw || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (!letters) return 0;

    let value = 0;
    for (let i = 0; i < letters.length; i += 1) {
        value = (value * 26) + (letters.charCodeAt(i) - 64);
    }
    return value;
}

function getPlmVersionRevisionOrderValue(revisionRaw) {
    const raw = String(revisionRaw || '').trim().toUpperCase();
    if (!raw) return 0;

    if (/^[A-Z]+$/.test(raw)) return plmVersionRevisionLettersToNumber(raw);

    const lettersMatch = raw.match(/([A-Z]+)/);
    if (lettersMatch && lettersMatch[1]) {
        const lettersValue = plmVersionRevisionLettersToNumber(lettersMatch[1]);
        if (lettersValue > 0) return lettersValue;
    }

    const numberMatch = raw.match(/(\d+)/);
    if (numberMatch && numberMatch[1]) {
        const n = Number(numberMatch[1]);
        if (Number.isFinite(n) && n > 0) return Math.floor(n);
    }

    return 0;
}

function normalizePlmVersionRevision(revisionRaw, fallbackNumber = 1) {
    return 'A';
}

function getActiveBomVersion() {
    return getProjectVersionById(plmBomVersionContextId);
}

function isBomVersionContext() {
    return Boolean(getActiveBomVersion());
}

function clearBomVersionContext() {
    plmBomVersionContextId = '';
    bomExpandedNodeIds.clear();
}

function getVersionDuplicateSourceIdsToHide(versionRaw) {
    const version = versionRaw && typeof versionRaw === 'object' ? versionRaw : null;
    if (!version) return new Set();

    const items = Array.isArray(version.plm_items) ? version.plm_items : [];
    if (!items.length) return new Set();

    const itemIds = new Set(
        items
            .map((item) => String(item && item.id ? item.id : '').trim())
            .filter(Boolean)
    );
    if (!itemIds.size) return new Set();

    const duplicateNodes = Array.isArray(version.bom_duplicate_nodes) ? version.bom_duplicate_nodes : [];
    const duplicateIds = new Set();
    const duplicateSourceIds = new Set();
    duplicateNodes.forEach((node) => {
        const nodeId = String(node && node.id ? node.id : '').trim();
        if (nodeId) duplicateIds.add(nodeId);

        const sourceId = String(node && node.duplicate_source_id ? node.duplicate_source_id : '').trim();
        if (sourceId && itemIds.has(sourceId)) duplicateSourceIds.add(sourceId);
    });
    if (!duplicateSourceIds.size) return new Set();

    const edges = Array.isArray(version.bom_edges) ? version.bom_edges : [];
    const directlyConnectedItemIds = new Set();
    edges.forEach((edge) => {
        const sourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
        const targetId = String(edge && edge.target_id ? edge.target_id : '').trim();

        if (sourceId && sourceId !== 'core' && itemIds.has(sourceId) && !duplicateIds.has(sourceId)) {
            directlyConnectedItemIds.add(sourceId);
        }
        if (targetId && itemIds.has(targetId) && !duplicateIds.has(targetId)) {
            directlyConnectedItemIds.add(targetId);
        }
    });

    const hiddenSourceIds = new Set();
    duplicateSourceIds.forEach((sourceId) => {
        if (!directlyConnectedItemIds.has(sourceId)) hiddenSourceIds.add(sourceId);
    });

    return hiddenSourceIds;
}

function getActivePlmItems() {
    const version = getActiveBomVersion();
    if (version && Array.isArray(version.plm_items)) {
        const hiddenSourceIds = getVersionDuplicateSourceIdsToHide(version);
        if (!hiddenSourceIds.size) return version.plm_items;
        return version.plm_items.filter((item) => {
            const id = String(item && item.id ? item.id : '').trim();
            return id && !hiddenSourceIds.has(id);
        });
    }
    if (!currentWorkspaceProject) return [];
    return Array.isArray(currentWorkspaceProject.plm_items) ? currentWorkspaceProject.plm_items : [];
}

function getActiveBomDuplicateNodes() {
    const version = getActiveBomVersion();
    if (version && Array.isArray(version.bom_duplicate_nodes)) return version.bom_duplicate_nodes;
    if (!currentWorkspaceProject) return [];
    return Array.isArray(currentWorkspaceProject.bom_duplicate_nodes) ? currentWorkspaceProject.bom_duplicate_nodes : [];
}

function getEditableBomDuplicateNodes() {
    if (!currentWorkspaceProject) return [];

    const version = getActiveBomVersion();
    if (version) {
        if (!Array.isArray(version.bom_duplicate_nodes)) version.bom_duplicate_nodes = [];
        return version.bom_duplicate_nodes;
    }

    if (!Array.isArray(currentWorkspaceProject.bom_duplicate_nodes)) currentWorkspaceProject.bom_duplicate_nodes = [];
    return currentWorkspaceProject.bom_duplicate_nodes;
}

function getBomCanonicalItemId(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId || nodeId === 'core') return nodeId;

    const duplicate = getActiveBomDuplicateNodes().find((item) => String(item && item.id ? item.id : '').trim() === nodeId);
    if (duplicate) {
        const sourceId = String(duplicate.duplicate_source_id || '').trim();
        return sourceId || nodeId;
    }

    return nodeId;
}

function getProjectBomCanonicalItemId(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId || nodeId === 'core') return nodeId;
    if (!currentWorkspaceProject) return nodeId;

    const duplicates = Array.isArray(currentWorkspaceProject.bom_duplicate_nodes)
        ? currentWorkspaceProject.bom_duplicate_nodes
        : [];
    const duplicate = duplicates.find((item) => String(item && item.id ? item.id : '').trim() === nodeId);
    if (!duplicate) return nodeId;

    const sourceId = String(duplicate && duplicate.duplicate_source_id ? duplicate.duplicate_source_id : '').trim();
    return sourceId || nodeId;
}

function getActiveBomGraphNodes() {
    return getActivePlmItems().concat(getActiveBomDuplicateNodes());
}

function getActiveBomEdges() {
    const version = getActiveBomVersion();
    if (version && Array.isArray(version.bom_edges)) return version.bom_edges;
    if (!currentWorkspaceProject) return [];
    return Array.isArray(currentWorkspaceProject.bom_edges) ? currentWorkspaceProject.bom_edges : [];
}

function getEditableBomEdges() {
    if (!currentWorkspaceProject) return [];

    const version = getActiveBomVersion();
    if (version) {
        if (!Array.isArray(version.bom_edges)) version.bom_edges = [];
        return version.bom_edges;
    }

    if (!Array.isArray(currentWorkspaceProject.bom_edges)) currentWorkspaceProject.bom_edges = [];
    return currentWorkspaceProject.bom_edges;
}

function touchActiveBomVersion() {
    const version = getActiveBomVersion();
    if (!version) return;
    version.updated_at = new Date().toISOString();
}

function getPartById(partId) {
    const targetId = String(partId || '').trim();
    if (!targetId) return null;

    const items = getActiveBomGraphNodes();
    const direct = items.find((item) => String(item && item.id ? item.id : '').trim() === targetId) || null;
    if (direct) return direct;

    const duplicates = getActiveBomDuplicateNodes();
    return duplicates.find((item) => String(item && item.id ? item.id : '').trim() === targetId) || null;
}

function getPartLabel(part) {
    if (!part) return 'Desconocido';
    const code = part.item_id || 'Sin Item ID';
    const name = part.name || 'Sin nombre';
    return `${code} - ${name}`;
}

function buildBomNodeSubtitleLines(textRaw, maxCharsPerLine = 26, maxLines = 2) {
    const maxChars = Math.max(8, toNumber(maxCharsPerLine, 34));
    const maxLinesSafe = Math.max(1, toNumber(maxLines, 2));
    const text = String(textRaw || '').replace(/\s+/g, ' ').trim();
    if (!text) return [];

    const words = text.split(' ');
    const lines = [];
    let current = '';

    const pushCurrent = () => {
        if (!current) return;
        lines.push(current);
        current = '';
    };

    for (let i = 0; i < words.length; i += 1) {
        const word = String(words[i] || '').trim();
        if (!word) continue;

        if (!current) {
            if (word.length <= maxChars) {
                current = word;
            } else {
                current = `${word.slice(0, Math.max(1, maxChars - 3))}...`;
                pushCurrent();
            }
            continue;
        }

        const candidate = `${current} ${word}`;
        if (candidate.length <= maxChars) {
            current = candidate;
            continue;
        }

        pushCurrent();
        if (word.length <= maxChars) {
            current = word;
        } else {
            current = `${word.slice(0, Math.max(1, maxChars - 3))}...`;
            pushCurrent();
        }
    }
    pushCurrent();

    if (lines.length <= maxLinesSafe) return lines;

    const kept = lines.slice(0, maxLinesSafe);
    const mergedTail = lines.slice(maxLinesSafe - 1).join(' ');
    kept[maxLinesSafe - 1] = mergedTail.length <= maxChars
        ? mergedTail
        : `${mergedTail.slice(0, Math.max(1, maxChars - 3)).trimEnd()}...`;
    return kept;
}

function getBomNodeRenderHalfHeight(node) {
    const nodeId = String(node && node.id ? node.id : '').trim();
    if (!node || nodeId === 'core') return BOM_NODE_HALF_HEIGHT;
    const subtitleLines = buildBomNodeSubtitleLines(node.name || '', 26, 2);
    return subtitleLines.length > 1 ? (BOM_NODE_HALF_HEIGHT + 10) : BOM_NODE_HALF_HEIGHT;
}

function getErpDiagramNodeSubtitleLines(textRaw) {
    return buildBomNodeSubtitleLines(textRaw, 26, 2);
}

function getErpDiagramNodeRenderHalfHeight(nameRaw = '') {
    const subtitleLines = getErpDiagramNodeSubtitleLines(nameRaw);
    return subtitleLines.length > 1 ? (ERP_DIAGRAM_NODE_HALF_HEIGHT + 10) : ERP_DIAGRAM_NODE_HALF_HEIGHT;
}

function normalizeBomQuantity(value, fallback = 1) {
    const raw = String(value ?? '').trim();
    if (!raw) return 1;

    const num = Number(raw);
    if (!Number.isFinite(num)) return 1;

    return Math.max(1, Math.round(num));
}

function formatBomQuantity(value) {
    const qty = normalizeBomQuantity(value, 1);
    return String(qty);
}

function normalizeBomSpecialEnabled(valueRaw) {
    if (valueRaw === true || valueRaw === false) return valueRaw;
    const raw = String(valueRaw ?? '').trim().toLowerCase();
    if (!raw) return false;
    return raw === '1' || raw === 'true' || raw === 'si' || raw === 's' || raw === 'yes';
}

function getBomSpecialConfigFromNode(nodeRaw) {
    const node = nodeRaw && typeof nodeRaw === 'object' ? nodeRaw : {};
    const enabled = normalizeBomSpecialEnabled(
        node.bom_special_enabled ?? node.special_mode ?? node.is_special ?? false
    );
    const numerator = normalizeBomQuantity(
        node.bom_special_numerator ?? node.special_numerator ?? node.special_qty ?? 1,
        1
    );
    const every = normalizeBomQuantity(
        node.bom_special_every ?? node.special_every ?? node.special_each ?? 1,
        1
    );
    return {
        enabled,
        numerator,
        every,
        display: `${numerator}/${every}`,
        value: numerator / Math.max(1, every)
    };
}

function getBomSpecialTargetNode(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId || nodeId === 'core') return null;

    const canonicalId = getBomCanonicalItemId(nodeId);
    const canonicalNode = canonicalId ? getPartById(canonicalId) : null;
    if (canonicalNode && String(canonicalNode.id || '').trim() !== 'core') return canonicalNode;

    const directNode = getPartById(nodeId);
    if (directNode && String(directNode.id || '').trim() !== 'core') return directNode;
    return null;
}

function getBomSpecialConfigByNodeId(nodeIdRaw) {
    return getBomSpecialConfigFromNode(getBomSpecialTargetNode(nodeIdRaw));
}

function toggleBomSpecialMode(nodeIdRaw, persist = true) {
    if (!currentWorkspaceProject) return false;
    if (!isBomEditingAllowed(false)) return false;

    const targetNode = getBomSpecialTargetNode(nodeIdRaw);
    if (!targetNode) return false;

    const current = getBomSpecialConfigFromNode(targetNode);
    targetNode.bom_special_enabled = !current.enabled;
    targetNode.bom_special_numerator = current.numerator;
    targetNode.bom_special_every = current.every;

    renderBomClassificationTable();
    renderBomGraph();
    renderPlmValuesPanel();
    if (persist) {
        touchActiveBomVersion();
        persistCurrentWorkspace(true);
    }
    return true;
}

function updateBomSpecialQuantity(nodeIdRaw, fieldRaw, valueRaw, persist = true) {
    if (!currentWorkspaceProject) return false;
    if (!isBomEditingAllowed(false)) return false;

    const targetNode = getBomSpecialTargetNode(nodeIdRaw);
    if (!targetNode) return false;

    const field = String(fieldRaw || '').trim().toLowerCase();
    if (field !== 'numerator' && field !== 'every') return false;

    const config = getBomSpecialConfigFromNode(targetNode);
    targetNode.bom_special_enabled = true;
    targetNode.bom_special_numerator = field === 'numerator'
        ? normalizeBomQuantity(valueRaw, config.numerator)
        : config.numerator;
    targetNode.bom_special_every = field === 'every'
        ? normalizeBomQuantity(valueRaw, config.every)
        : config.every;

    renderBomClassificationTable();
    renderBomGraph();
    renderPlmValuesPanel();
    if (persist) {
        touchActiveBomVersion();
        persistCurrentWorkspace(true);
    }
    return true;
}

function getIncomingBomEdges(targetIdRaw) {
    if (!currentWorkspaceProject) return [];
    const targetId = String(targetIdRaw || '').trim();
    if (!targetId) return [];

    return getActiveBomEdges().filter((edge) => {
        return String(edge.target_id || '').trim() === targetId;
    });
}

function getPrimaryIncomingBomEdge(targetIdRaw) {
    const incoming = getIncomingBomEdges(targetIdRaw);
    if (!incoming.length) return null;

    const nonCore = incoming.find((edge) => String(edge.source_id || '').trim() !== 'core');
    return nonCore || incoming[0];
}

async function fetchProjectsList() {
    const response = await fetch('/api/projects');
    if (!response.ok) {
        throw new Error('No se pudo consultar proyectos.');
    }
    const projects = await response.json();
    projectsCache = Array.isArray(projects)
        ? projects.map((p) => ensureProjectShape(p))
        : [];
    return projectsCache;
}

async function saveProject(project) {
    const payload = ensureProjectShape(project);
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    let res = {};
    try {
        res = await response.json();
    } catch (_) {
        res = {};
    }

    if (!response.ok || res.status !== 'success') {
        throw new Error(res.message || 'No se pudo guardar el proyecto.');
    }

    const saved = ensureProjectShape(res.project || payload);
    upsertProjectCache(saved);
    return saved;
}

function updateWorkspaceHeader() {
    const project = currentWorkspaceProject;
    if (!project) return;

    refreshWorkspacePanelBreadcrumb();
}

function updateWorkspaceKPIs() {
    const project = currentWorkspaceProject;
    if (!project) return;

    const kpiParts = document.getElementById('plm-kpi-parts');
    const kpiErp = document.getElementById('plm-kpi-erp');
    const kpiCpq = document.getElementById('plm-kpi-cpq');

    const erpSuppliersCount = Array.isArray(project.erp_suppliers) ? project.erp_suppliers.length : 0;
    const erpRawMaterialsCount = Array.isArray(project.erp_raw_materials) ? project.erp_raw_materials.length : 0;

    if (kpiParts) kpiParts.textContent = String(project.plm_items.length);
    if (kpiErp) kpiErp.textContent = String(erpSuppliersCount + erpRawMaterialsCount);
    if (kpiCpq) kpiCpq.textContent = String(project.cpq_items.length);
}

function getOuterCategoryRadius() {
    return getBomRenderRingRadii().buloneria;
}

function getCategoryBand(category) {
    return getBomCategoryBands().find((band) => band.name === category) || null;
}

function getCategoryBandMidRadius(category) {
    const band = getCategoryBand(category);
    if (!band) return getOuterCategoryRadius() + 80;
    return (band.min + band.max) / 2;
}

function getCategoryBandThreeQuarterRadius(category) {
    const band = getCategoryBand(category);
    if (!band) return getOuterCategoryRadius() + 80;
    return band.min + ((band.max - band.min) * 0.75);
}

function getCategoryBandQuarterRadius(category) {
    const band = getCategoryBand(category);
    if (!band) return getOuterCategoryRadius() + 80;
    return band.min + ((band.max - band.min) * 0.25);
}

function isBomUsingLegacyCoordinateScale() {
    if (getBomRenderRingScale() <= 1) return false;

    const nodes = getActiveBomGraphNodes();
    if (!nodes.length) return false;

    const maxDistance = nodes.reduce((max, node) => Math.max(max, getBomDistance(node)), 0);
    const legacyThreshold = BOM_RING_RADII.buloneria + BOM_OUTER_MARGIN + 320;
    return maxDistance <= legacyThreshold;
}

function getBomDistance(node) {
    return Math.hypot(toNumber(node && node.x, 0), toNumber(node && node.y, 0));
}

function getBomAdjacency() {
    const adjacency = new Map();
    if (!currentWorkspaceProject) return adjacency;

    getActiveBomEdges().forEach((edge) => {
        const sourceId = String(edge.source_id || '').trim();
        const targetId = String(edge.target_id || '').trim();
        if (!sourceId || !targetId) return;

        const list = adjacency.get(sourceId) || [];
        list.push(targetId);
        adjacency.set(sourceId, list);
    });

    return adjacency;
}

function getBomNodeDepth(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId) return null;
    if (nodeId === 'core') return 0;

    const adjacency = getBomAdjacency();
    const queue = [{ id: 'core', depth: 0 }];
    const visited = new Set(['core']);

    while (queue.length) {
        const item = queue.shift();
        const children = adjacency.get(item.id) || [];

        for (const childId of children) {
            const id = String(childId);
            if (visited.has(id)) continue;
            if (id === nodeId) return item.depth + 1;
            visited.add(id);
            queue.push({ id, depth: item.depth + 1 });
        }
    }

    return null;
}

function getBomStructuralCategory(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId || nodeId === 'core') return nodeId === 'core' ? 'Core' : null;

    const node = getPartById(nodeId);
    if (!node) return null;

    const adjacency = getBomAdjacency();
    const children = adjacency.get(nodeId) || [];
    if (!children.length) return null;

    const depth = getBomNodeDepth(nodeId);
    if (depth == null) return null;

    if (!isBomVersionContext()) {
        const radialCategory = getBomCategoryByDistance(getBomDistance(node));
        const canBeStructural = radialCategory === 'Conjunto' || radialCategory === 'Subconjunto 1' || radialCategory === 'Subconjunto 1.1';
        if (!canBeStructural) return null;
    }

    if (depth <= 1) return 'Conjunto';
    if (depth === 2) return 'Subconjunto 1';
    return 'Subconjunto 1.1';
}

function getBomCategoryByDistance(distance) {
    const d = toNumber(distance, 0);
    const useLegacyBands = isBomUsingLegacyCoordinateScale();
    const primaryBands = useLegacyBands ? BOM_CATEGORY_BANDS : getBomCategoryBands();
    const fallbackBands = useLegacyBands ? getBomCategoryBands() : BOM_CATEGORY_BANDS;

    const band = primaryBands.find((b) => d > b.min && d <= b.max);
    if (band) return band.name;

    const fallback = fallbackBands.find((b) => d > b.min && d <= b.max);
    if (fallback) return fallback.name;

    return 'Sin categoria';
}

function getBomCategory(node) {
    if (!node) return 'Sin categoria';
    const id = String(node.id || '').trim();
    if (id === 'core') return 'Core';

    const explicitCategory = String(node && node.category ? node.category : '').trim();
    const validExplicitCategory = explicitCategory === 'Conjunto'
        || explicitCategory === 'Subconjunto 1'
        || explicitCategory === 'Subconjunto 1.1'
        || explicitCategory === 'Piezas'
        || explicitCategory === 'Buloneria';

    if (isBomVersionContext() && validExplicitCategory) {
        return explicitCategory;
    }

    const structural = getBomStructuralCategory(id);
    if (structural) return structural;

    const byDistance = getBomCategoryByDistance(getBomDistance(node));
    if (byDistance !== 'Sin categoria') return byDistance;
    if (validExplicitCategory) return explicitCategory;
    return byDistance;
}

function getBomCategoryRank(categoryRaw) {
    const category = String(categoryRaw || '').trim();
    const rankMap = {
        'Core': 0,
        'Conjunto': 1,
        'Subconjunto 1': 2,
        'Subconjunto 1.1': 3,
        'Piezas': 4,
        'Buloneria': 5
    };

    if (!Object.prototype.hasOwnProperty.call(rankMap, category)) return null;
    return rankMap[category];
}

function getBomNodeCategoryById(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId) return 'Sin categoria';
    if (nodeId === 'core') return 'Core';

    const node = getPartById(nodeId);
    return getBomCategory(node);
}

function validateBomEdgeHierarchyByIds(parentIdRaw, childIdRaw) {
    const parentId = String(parentIdRaw || '').trim();
    const childId = String(childIdRaw || '').trim();

    const parentCategory = getBomNodeCategoryById(parentId);
    const childCategory = getBomNodeCategoryById(childId);
    const parentRank = getBomCategoryRank(parentCategory);
    const childRank = getBomCategoryRank(childCategory);

    const invalid = Number.isFinite(parentRank)
        && Number.isFinite(childRank)
        && parentRank > childRank;

    return {
        ok: !invalid,
        parentId,
        childId,
        parentCategory,
        childCategory,
        parentRank,
        childRank
    };
}

function validateBomHierarchyForNode(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId) return { ok: true };

    const edges = getActiveBomEdges();
    for (const edge of edges) {
        const sourceId = String(edge && edge.source_id || '').trim();
        const targetId = String(edge && edge.target_id || '').trim();
        if (!sourceId || !targetId) continue;
        if (sourceId !== nodeId && targetId !== nodeId) continue;

        const check = validateBomEdgeHierarchyByIds(sourceId, targetId);
        if (!check.ok) return check;
    }

    return { ok: true };
}

function getNodeRectBounds() {
    return {
        halfWidth: BOM_NODE_HALF_WIDTH,
        halfHeight: BOM_NODE_HALF_HEIGHT
    };
}

function getRectBoundaryPoint(fromPoint, toPoint, bounds) {
    const dx = toNumber(toPoint && toPoint.x, 0) - toNumber(fromPoint && fromPoint.x, 0);
    const dy = toNumber(toPoint && toPoint.y, 0) - toNumber(fromPoint && fromPoint.y, 0);

    if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
        return {
            x: toNumber(fromPoint && fromPoint.x, 0),
            y: toNumber(fromPoint && fromPoint.y, 0)
        };
    }

    const scale = Math.max(
        Math.abs(dx) / Math.max(1, toNumber(bounds && bounds.halfWidth, BOM_NODE_HALF_WIDTH)),
        Math.abs(dy) / Math.max(1, toNumber(bounds && bounds.halfHeight, BOM_NODE_HALF_HEIGHT)),
        1
    );

    return {
        x: toNumber(fromPoint && fromPoint.x, 0) + (dx / scale),
        y: toNumber(fromPoint && fromPoint.y, 0) + (dy / scale)
    };
}

function getBomNodeObstacleRects(nodes = [], bounds = null, padding = 0) {
    const items = Array.isArray(nodes) ? nodes : [];
    const b = bounds && typeof bounds === 'object' ? bounds : getNodeRectBounds();
    const pad = Math.max(0, toNumber(padding, 0));

    return items.map((node) => {
        const id = String(node && node.id ? node.id : '').trim();
        const cx = toNumber(node && node.x, 0);
        const cy = toNumber(node && node.y, 0);
        return {
            id,
            minX: cx - Math.max(1, toNumber(b.halfWidth, BOM_NODE_HALF_WIDTH)) - pad,
            maxX: cx + Math.max(1, toNumber(b.halfWidth, BOM_NODE_HALF_WIDTH)) + pad,
            minY: cy - Math.max(1, toNumber(b.halfHeight, BOM_NODE_HALF_HEIGHT)) - pad,
            maxY: cy + Math.max(1, toNumber(b.halfHeight, BOM_NODE_HALF_HEIGHT)) + pad
        };
    });
}

function isPointInsideRect(point, rect, epsilon = 0.0001) {
    if (!point || !rect) return false;
    const x = toNumber(point.x, 0);
    const y = toNumber(point.y, 0);
    return x > (toNumber(rect.minX, 0) + epsilon)
        && x < (toNumber(rect.maxX, 0) - epsilon)
        && y > (toNumber(rect.minY, 0) + epsilon)
        && y < (toNumber(rect.maxY, 0) - epsilon);
}

function getOrientation(p, q, r) {
    const val = ((toNumber(q.y, 0) - toNumber(p.y, 0)) * (toNumber(r.x, 0) - toNumber(q.x, 0)))
        - ((toNumber(q.x, 0) - toNumber(p.x, 0)) * (toNumber(r.y, 0) - toNumber(q.y, 0)));
    if (Math.abs(val) < 0.000001) return 0;
    return val > 0 ? 1 : 2;
}

function isPointOnSegment(p, q, r) {
    const qx = toNumber(q.x, 0);
    const qy = toNumber(q.y, 0);
    return qx <= (Math.max(toNumber(p.x, 0), toNumber(r.x, 0)) + 0.000001)
        && qx >= (Math.min(toNumber(p.x, 0), toNumber(r.x, 0)) - 0.000001)
        && qy <= (Math.max(toNumber(p.y, 0), toNumber(r.y, 0)) + 0.000001)
        && qy >= (Math.min(toNumber(p.y, 0), toNumber(r.y, 0)) - 0.000001);
}

function doSegmentsIntersect(a, b, c, d) {
    const o1 = getOrientation(a, b, c);
    const o2 = getOrientation(a, b, d);
    const o3 = getOrientation(c, d, a);
    const o4 = getOrientation(c, d, b);

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === 0 && isPointOnSegment(a, c, b)) return true;
    if (o2 === 0 && isPointOnSegment(a, d, b)) return true;
    if (o3 === 0 && isPointOnSegment(c, a, d)) return true;
    if (o4 === 0 && isPointOnSegment(c, b, d)) return true;

    return false;
}

function doesSegmentIntersectRect(a, b, rect) {
    if (!a || !b || !rect) return false;

    if (isPointInsideRect(a, rect) || isPointInsideRect(b, rect)) return true;

    const r1 = { x: toNumber(rect.minX, 0), y: toNumber(rect.minY, 0) };
    const r2 = { x: toNumber(rect.maxX, 0), y: toNumber(rect.minY, 0) };
    const r3 = { x: toNumber(rect.maxX, 0), y: toNumber(rect.maxY, 0) };
    const r4 = { x: toNumber(rect.minX, 0), y: toNumber(rect.maxY, 0) };

    return doSegmentsIntersect(a, b, r1, r2)
        || doSegmentsIntersect(a, b, r2, r3)
        || doSegmentsIntersect(a, b, r3, r4)
        || doSegmentsIntersect(a, b, r4, r1);
}

function doesPolylineIntersectBomObstacles(points = [], obstacles = []) {
    const pts = Array.isArray(points) ? points : [];
    const rects = Array.isArray(obstacles) ? obstacles : [];
    if (pts.length < 2 || !rects.length) return false;

    for (let i = 1; i < (pts.length - 1); i += 1) {
        const p = pts[i];
        for (const rect of rects) {
            if (isPointInsideRect(p, rect)) return true;
        }
    }

    for (let i = 0; i < (pts.length - 1); i += 1) {
        const a = pts[i];
        const b = pts[i + 1];
        for (const rect of rects) {
            if (doesSegmentIntersectRect(a, b, rect)) return true;
        }
    }

    return false;
}

function getBomPolylineLength(points = []) {
    const pts = Array.isArray(points) ? points : [];
    if (pts.length < 2) return 0;

    let length = 0;
    for (let i = 0; i < (pts.length - 1); i += 1) {
        const a = pts[i];
        const b = pts[i + 1];
        length += Math.hypot(toNumber(b.x, 0) - toNumber(a.x, 0), toNumber(b.y, 0) - toNumber(a.y, 0));
    }
    return length;
}

function getBomPolylineMidPoint(points = []) {
    const pts = Array.isArray(points) ? points : [];
    if (!pts.length) return { x: 0, y: 0 };
    if (pts.length === 1) return { x: toNumber(pts[0].x, 0), y: toNumber(pts[0].y, 0) };

    const total = getBomPolylineLength(pts);
    if (total <= 0.000001) {
        return {
            x: (toNumber(pts[0].x, 0) + toNumber(pts[pts.length - 1].x, 0)) / 2,
            y: (toNumber(pts[0].y, 0) + toNumber(pts[pts.length - 1].y, 0)) / 2
        };
    }

    const half = total / 2;
    let walked = 0;

    for (let i = 0; i < (pts.length - 1); i += 1) {
        const a = pts[i];
        const b = pts[i + 1];
        const segLen = Math.hypot(toNumber(b.x, 0) - toNumber(a.x, 0), toNumber(b.y, 0) - toNumber(a.y, 0));
        if (walked + segLen >= half) {
            const t = (half - walked) / Math.max(segLen, 0.000001);
            return {
                x: toNumber(a.x, 0) + ((toNumber(b.x, 0) - toNumber(a.x, 0)) * t),
                y: toNumber(a.y, 0) + ((toNumber(b.y, 0) - toNumber(a.y, 0)) * t)
            };
        }
        walked += segLen;
    }

    const last = pts[pts.length - 1];
    return { x: toNumber(last.x, 0), y: toNumber(last.y, 0) };
}

function getBomPolylinePointAtRatio(points = [], ratioRaw = 0.5) {
    const pts = Array.isArray(points) ? points : [];
    if (!pts.length) return { x: 0, y: 0 };
    if (pts.length === 1) return { x: toNumber(pts[0].x, 0), y: toNumber(pts[0].y, 0) };

    const ratio = Math.max(0, Math.min(1, toNumber(ratioRaw, 0.5)));
    const total = getBomPolylineLength(pts);
    if (total <= 0.000001) return getBomPolylineMidPoint(pts);

    const target = total * ratio;
    let walked = 0;
    for (let i = 0; i < (pts.length - 1); i += 1) {
        const a = pts[i];
        const b = pts[i + 1];
        const segLen = Math.hypot(toNumber(b.x, 0) - toNumber(a.x, 0), toNumber(b.y, 0) - toNumber(a.y, 0));
        if (walked + segLen >= target) {
            const t = (target - walked) / Math.max(segLen, 0.000001);
            return {
                x: toNumber(a.x, 0) + ((toNumber(b.x, 0) - toNumber(a.x, 0)) * t),
                y: toNumber(a.y, 0) + ((toNumber(b.y, 0) - toNumber(a.y, 0)) * t)
            };
        }
        walked += segLen;
    }

    const last = pts[pts.length - 1];
    return { x: toNumber(last.x, 0), y: toNumber(last.y, 0) };
}

function doesQtyAnchorCollideWithNodes(point, nodeRects = [], halfWidthRaw = 14, halfHeightRaw = 7) {
    const p = point && typeof point === 'object' ? point : { x: 0, y: 0 };
    const halfWidth = Math.max(1, toNumber(halfWidthRaw, 14));
    const halfHeight = Math.max(1, toNumber(halfHeightRaw, 7));
    const px = toNumber(p.x, 0);
    const py = toNumber(p.y, 0);

    const qtyRect = {
        minX: px - halfWidth,
        maxX: px + halfWidth,
        minY: py - halfHeight,
        maxY: py + halfHeight
    };

    const rects = Array.isArray(nodeRects) ? nodeRects : [];
    for (const rect of rects) {
        if (!rect) continue;
        const overlapX = qtyRect.minX < toNumber(rect.maxX, 0) && qtyRect.maxX > toNumber(rect.minX, 0);
        const overlapY = qtyRect.minY < toNumber(rect.maxY, 0) && qtyRect.maxY > toNumber(rect.minY, 0);
        if (overlapX && overlapY) return true;
    }
    return false;
}

function resolveBomEdgeQtyAnchor(points = [], nodeRects = [], halfWidthRaw = 14, halfHeightRaw = 7) {
    const mid = getBomPolylinePointAtRatio(points, 0.5);
    if (!doesQtyAnchorCollideWithNodes(mid, nodeRects, halfWidthRaw, halfHeightRaw)) return mid;

    const q1 = getBomPolylinePointAtRatio(points, 0.25);
    if (!doesQtyAnchorCollideWithNodes(q1, nodeRects, halfWidthRaw, halfHeightRaw)) return q1;

    const q3 = getBomPolylinePointAtRatio(points, 0.75);
    if (!doesQtyAnchorCollideWithNodes(q3, nodeRects, halfWidthRaw, halfHeightRaw)) return q3;

    return mid;
}

function buildBomSmoothPathD(points = [], cornerSize = 18) {
    const pts = (Array.isArray(points) ? points : [])
        .map((p) => ({ x: toNumber(p && p.x, 0), y: toNumber(p && p.y, 0) }));

    if (pts.length < 2) return '';
    if (pts.length === 2) {
        return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
    }

    const radius = Math.max(0, toNumber(cornerSize, 18));
    let d = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 1; i < (pts.length - 1); i += 1) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const next = pts[i + 1];

        const v1x = curr.x - prev.x;
        const v1y = curr.y - prev.y;
        const v2x = next.x - curr.x;
        const v2y = next.y - curr.y;

        const l1 = Math.hypot(v1x, v1y);
        const l2 = Math.hypot(v2x, v2y);

        if (l1 < 0.0001 || l2 < 0.0001 || radius <= 0.001) {
            d += ` L ${curr.x} ${curr.y}`;
            continue;
        }

        const r = Math.min(radius, l1 / 2, l2 / 2);
        const inX = curr.x - ((v1x / l1) * r);
        const inY = curr.y - ((v1y / l1) * r);
        const outX = curr.x + ((v2x / l2) * r);
        const outY = curr.y + ((v2y / l2) * r);

        d += ` L ${inX} ${inY} Q ${curr.x} ${curr.y} ${outX} ${outY}`;
    }

    const last = pts[pts.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
}

function buildBomEdgeRoute(startPoint, endPoint, sourceNodeIdRaw, targetNodeIdRaw, obstacleRects = []) {
    const start = { x: toNumber(startPoint && startPoint.x, 0), y: toNumber(startPoint && startPoint.y, 0) };
    const end = { x: toNumber(endPoint && endPoint.x, 0), y: toNumber(endPoint && endPoint.y, 0) };
    const sourceNodeId = String(sourceNodeIdRaw || '').trim();
    const targetNodeId = String(targetNodeIdRaw || '').trim();

    const obstacles = (Array.isArray(obstacleRects) ? obstacleRects : [])
        .filter((rect) => {
            const id = String(rect && rect.id ? rect.id : '').trim();
            return id !== sourceNodeId && id !== targetNodeId;
        });

    const normalizeRoutePoints = (points = []) => {
        const src = Array.isArray(points) ? points : [];
        if (!src.length) return [];
        const out = [];
        src.forEach((p) => {
            const point = { x: toNumber(p && p.x, 0), y: toNumber(p && p.y, 0) };
            const prev = out.length ? out[out.length - 1] : null;
            if (!prev || Math.abs(prev.x - point.x) > 0.001 || Math.abs(prev.y - point.y) > 0.001) {
                out.push(point);
            }
        });
        return out;
    };

    const isValidRoute = (points = []) => {
        const pts = normalizeRoutePoints(points);
        if (pts.length < 2) return false;
        if (obstacles.length === 0) return true;
        return !doesPolylineIntersectBomObstacles(pts, obstacles);
    };

    const candidates = [];
    const pushCandidate = (points) => {
        const pts = normalizeRoutePoints(points);
        if (pts.length >= 2) candidates.push(pts);
    };

    const direct = [start, end];
    if (isValidRoute(direct)) return direct;

    pushCandidate([start, { x: start.x, y: end.y }, end]);
    pushCandidate([start, { x: end.x, y: start.y }, end]);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy);

    if (len > 0.0001) {
        const nx = -dy / len;
        const ny = dx / len;
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        [70, -70, 110, -110, 150, -150, 200, -200, 260, -260].forEach((offset) => {
            pushCandidate([start, { x: midX + (nx * offset), y: midY + (ny * offset) }, end]);
            pushCandidate([
                start,
                { x: start.x + (nx * offset), y: start.y + (ny * offset) },
                { x: end.x + (nx * offset), y: end.y + (ny * offset) },
                end
            ]);
        });

        const angleStart = Math.atan2(start.y, start.x);
        const angleEnd = Math.atan2(end.y, end.x);
        [80, 130, 180, 230].forEach((offset) => {
            pushCandidate([
                start,
                { x: start.x + (Math.cos(angleStart) * offset), y: start.y + (Math.sin(angleStart) * offset) },
                { x: end.x + (Math.cos(angleEnd) * offset), y: end.y + (Math.sin(angleEnd) * offset) },
                end
            ]);
            pushCandidate([
                start,
                { x: start.x - (Math.cos(angleStart) * offset), y: start.y - (Math.sin(angleStart) * offset) },
                { x: end.x - (Math.cos(angleEnd) * offset), y: end.y - (Math.sin(angleEnd) * offset) },
                end
            ]);
        });
    }

    const valid = candidates.filter((points) => isValidRoute(points));
    if (!valid.length) return direct;

    valid.sort((a, b) => {
        const bendsA = Math.max(0, a.length - 2);
        const bendsB = Math.max(0, b.length - 2);
        const scoreA = getBomPolylineLength(a) + (bendsA * 40);
        const scoreB = getBomPolylineLength(b) + (bendsB * 40);
        if (Math.abs(scoreA - scoreB) > 0.0001) return scoreA - scoreB;
        return a.length - b.length;
    });

    return valid[0];
}

function getPartBranchLabel(part) {
    if (!part) return 'Desconocido';

    const name = String(part.name || '').trim();
    if (name) return name;

    const custom = String(part.branch_name || '').trim();
    if (custom) return custom;

    const itemId = String(part.item_id || '').trim();
    return itemId || 'Sin nombre';
}

function getBomNodeById(nodeId) {
    const id = String(nodeId || '');
    if (id === 'core') {
        return {
            id: 'core',
            item_id: 'CORE',
            name: 'Cuerpo Terminado',
            category: 'Core',
            x: 0,
            y: 0,
            branch_name: 'Cuerpo Terminado'
        };
    }
    return getPartById(id);
}

function getBomNodeLabel(nodeId) {
    const node = getBomNodeById(nodeId);
    if (!node) return 'Ninguno';
    if (node.id === 'core') return 'Cuerpo Terminado';
    return getPartLabel(node);
}

function updateBomSelectionLabels() {
    const sourceEl = document.getElementById('plm-link-source-label');
    const targetEl = document.getElementById('plm-link-target-label');
    if (sourceEl) sourceEl.textContent = getBomNodeLabel(selectedBomSourceId);
    if (targetEl) targetEl.textContent = getBomNodeLabel(selectedBomTargetId);
}

function clearBomSelection() {
    selectedBomSourceId = null;
    selectedBomTargetId = null;
    activeBomNodeId = null;
    selectedBomEdgeId = null;
    bomLinkDragState = null;
    updateBomSelectionLabels();
    renderBomGraph();
}

function chooseBomNode(nodeId) {
    const id = String(nodeId || '').trim();
    if (!id) return;

    activeBomNodeId = id;
    selectedBomEdgeId = null;

    if (!selectedBomSourceId || (selectedBomSourceId && selectedBomTargetId)) {
        selectedBomSourceId = id;
        selectedBomTargetId = null;
    } else if (id === selectedBomSourceId) {
        selectedBomSourceId = null;
        selectedBomTargetId = null;
    } else {
        selectedBomTargetId = id;
    }

    updateBomSelectionLabels();
    renderBomGraph();
}

function getGraphFullscreenContainer(kindRaw = 'bom') {
    const kind = String(kindRaw || 'bom').trim().toLowerCase();
    if (kind === 'erp') {
        return document.querySelector('#erp-diagram-view .erp-diagram-graph-wrap');
    }
    return document.querySelector('.plm-section[data-plm-section="bom"] .plm-bom-graph-wrap');
}

function getGraphMaximizeIconSvg(active = false) {
    if (active) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 7V10H7"></path><path d="M14 7V10H17"></path><path d="M10 17V14H7"></path><path d="M14 17V14H17"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4H9"></path><path d="M15 4H20V9"></path><path d="M4 15V20H9"></path><path d="M15 20H20V15"></path></svg>';
}

function updateGraphMaximizeButtons() {
    const fullscreenEl = document.fullscreenElement || null;
    const targets = [
        { kind: 'bom', id: 'plm-bom-maximize-btn' },
        { kind: 'erp', id: 'erp-diagram-maximize-btn' }
    ];

    targets.forEach((entry) => {
        const btn = document.getElementById(entry.id);
        if (!btn) return;

        const container = getGraphFullscreenContainer(entry.kind);
        const active = Boolean(fullscreenEl && container && fullscreenEl === container);
        btn.classList.toggle('active', active);
        btn.innerHTML = getGraphMaximizeIconSvg(active);
        btn.title = active ? 'Restaurar' : 'Maximizar';
        btn.setAttribute('aria-label', active ? 'Restaurar' : 'Maximizar');
    });
}

function ensureGraphFullscreenBindings() {
    if (window.__graphFullscreenBindingsReady) return;
    window.__graphFullscreenBindingsReady = true;

    document.addEventListener('fullscreenchange', () => {
        updateGraphMaximizeButtons();

        // Fullscreen changes host dimensions; re-render active graph so wheel math stays aligned to cursor.
        setTimeout(() => {
            if (plmWorkspaceMode === 'main' && String(plmActiveSection || '').toLowerCase() === 'bom') {
                renderBomGraph();
            }
            if (String(erpActivePanel || '').toLowerCase() === 'diagram') {
                renderErpDiagramGraph();
            }
        }, 0);
    });
}

async function toggleGraphMaximize(kindRaw = 'bom') {
    ensureGraphFullscreenBindings();

    const container = getGraphFullscreenContainer(kindRaw);
    if (!container) {
        notifyProject('No se encontro el grafico para maximizar.', 'error');
        return;
    }

    const fullscreenEl = document.fullscreenElement || null;

    try {
        if (fullscreenEl === container) {
            if (document.exitFullscreen) await document.exitFullscreen();
        } else {
            if (fullscreenEl && document.exitFullscreen) {
                await document.exitFullscreen();
            }
            if (container.requestFullscreen) {
                await container.requestFullscreen();
            }
        }
    } catch (e) {
        notifyProject('No se pudo cambiar a pantalla completa.', 'error');
    } finally {
        updateGraphMaximizeButtons();
    }
}

function getLooseNodeSpawnPosition(index, totalNodes = 1) {
    const count = Math.max(1, toNumber(totalNodes, 1));
    const idx = Math.max(0, toNumber(index, 0));
    const radius = getOuterCategoryRadius() + BOM_OUTER_MARGIN;
    const angle = ((idx % Math.max(count, 16)) / Math.max(count, 16)) * Math.PI * 2 - (Math.PI / 2);

    return {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius)
    };
}

function placeNodesOutsideRings(persist = false) {
    if (!currentWorkspaceProject) return;
    const nodes = getActiveBomGraphNodes();
    const total = nodes.length;

    nodes.forEach((node, idx) => {
        const p = getLooseNodeSpawnPosition(idx, total);
        node.x = p.x;
        node.y = p.y;
    });

    renderBomClassificationTable();
    renderBomGraph();
    if (persist) {
        touchActiveBomVersion();
        persistCurrentWorkspace(true);
    }
}

function autoArrangeBomNodes(persist = true, force = false) {
    if (!currentWorkspaceProject) return;
    if (!force && !isBomEditingAllowed(true)) return;

    const nodes = getActiveBomGraphNodes();
    if (!nodes.length) return;
    const nodeGapScale = Math.max(0.1, toNumber(getBomNodeGapScale(), 1));
    const compactProjectPieceSpacing = getBomRenderRingScale() > 1;
    const samePieceSubgroupGapScale = compactProjectPieceSpacing ? 0.5 : 1;

    const nodeById = new Map(nodes.map((node) => [String(node && node.id ? node.id : ''), node]));
    const allNodeIds = Array.from(nodeById.keys()).filter((id) => id && id !== 'core');
    if (!allNodeIds.length) return;

    const connectedNodeIds = new Set();
    getActiveBomEdges().forEach((edge) => {
        const sourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
        const targetId = String(edge && edge.target_id ? edge.target_id : '').trim();

        if (sourceId && sourceId !== 'core' && nodeById.has(sourceId)) connectedNodeIds.add(sourceId);
        if (targetId && targetId !== 'core' && nodeById.has(targetId)) connectedNodeIds.add(targetId);
    });

    const nodeIds = allNodeIds.filter((id) => connectedNodeIds.has(id));
    const isolatedNodeIds = allNodeIds.filter((id) => !connectedNodeIds.has(id));

    const placeIsolatedNodesOnLeftGrid = (idsRaw) => {
        const ids = (Array.isArray(idsRaw) ? idsRaw : []).filter(Boolean);
        if (!ids.length) return;

        const rowStep = (BOM_NODE_HALF_HEIGHT * 2) + 26;
        const colStep = (BOM_NODE_HALF_WIDTH * 2) + 36;
        const usableHeight = Math.max(rowStep, (getOuterCategoryRadius() * 2) - 180);
        const maxRows = Math.max(1, Math.floor(usableHeight / rowStep));
        const cols = Math.max(1, Math.ceil(ids.length / maxRows));
        const rowsUsed = Math.min(maxRows, Math.ceil(ids.length / cols));
        const startY = -((rowsUsed - 1) * rowStep) / 2;
        const anchorX = -(getOuterCategoryRadius() + BOM_OUTER_MARGIN + 240);

        ids.forEach((nodeId, idx) => {
            const node = nodeById.get(nodeId);
            if (!node) return;

            const col = Math.floor(idx / maxRows);
            const row = idx % maxRows;
            node.x = Math.round(anchorX - (col * colStep));
            node.y = Math.round(startY + (row * rowStep));
        });
    };

    if (!nodeIds.length) {
        placeIsolatedNodesOnLeftGrid(isolatedNodeIds);

        renderBomClassificationTable();
        renderBomGraph();
        if (persist) {
            touchActiveBomVersion();
            persistCurrentWorkspace(true);
        }
        return;
    }

    const rankMap = {
        'Conjunto': 1,
        'Subconjunto 1': 2,
        'Subconjunto 1.1': 3,
        'Piezas': 4,
        'Buloneria': 5,
        'Sin categoria': 6,
        'Core': 0
    };

    const getRank = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId) return 6;
        if (nodeId === 'core') return 0;

        const node = nodeById.get(nodeId);
        const category = node ? getBomCategory(node) : 'Sin categoria';
        const rank = rankMap[category];
        return Number.isFinite(rank) ? rank : 6;
    };

    const parentMap = new Map();
    const childMap = new Map();

    getActiveBomEdges().forEach((edge) => {
        const parentId = String(edge && edge.source_id ? edge.source_id : '').trim();
        const childId = String(edge && edge.target_id ? edge.target_id : '').trim();

        if (!parentId || !childId || childId === 'core') return;
        if (!nodeById.has(childId)) return;
        if (parentId !== 'core' && !nodeById.has(parentId)) return;

        const parents = parentMap.get(childId) || [];
        parents.push(parentId);
        parentMap.set(childId, parents);

        const children = childMap.get(parentId) || [];
        children.push(childId);
        childMap.set(parentId, children);
    });

    const layers = new Map();
    nodeIds.forEach((nodeId) => {
        const rank = getRank(nodeId);
        const list = layers.get(rank) || [];
        list.push(nodeId);
        layers.set(rank, list);
    });

    const maxRank = Math.max(1, ...Array.from(layers.keys()));

    const tieBreaker = (aId, bId) => {
        const aNode = nodeById.get(String(aId));
        const bNode = nodeById.get(String(bId));

        const aCode = String(aNode && aNode.item_id ? aNode.item_id : '').trim();
        const bCode = String(bNode && bNode.item_id ? bNode.item_id : '').trim();
        const byCode = aCode.localeCompare(bCode, 'es', { sensitivity: 'base' });
        if (byCode !== 0) return byCode;

        const aName = String(aNode && aNode.name ? aNode.name : '').trim();
        const bName = String(bNode && bNode.name ? bNode.name : '').trim();
        const byName = aName.localeCompare(bName, 'es', { sensitivity: 'base' });
        if (byName !== 0) return byName;

        return String(aId).localeCompare(String(bId), 'es', { sensitivity: 'base' });
    };

    const arcStart = -Math.PI;
    const arcEnd = Math.PI;
    const centerAngle = -Math.PI / 2;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, Number.isFinite(v) ? v : centerAngle));
    const normAngle = (a) => clamp(a, arcStart, arcEnd);

    const getNodeAngle = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        const node = nodeById.get(nodeId);
        if (!node) return centerAngle;
        return normAngle(Math.atan2(toNumber(node.y, 0), toNumber(node.x, 0)));
    };

    const radialOverrideById = new Map();

    const getPlacementRadius = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        const overrideRadius = radialOverrideById.get(nodeId);
        if (Number.isFinite(overrideRadius)) return overrideRadius;

        const node = nodeById.get(nodeId);
        if (!node) return getCategoryBandThreeQuarterRadius('Piezas');

        const category = getBomCategory(node);
        const normalized = category === 'Sin categoria' ? 'Piezas' : category;

        // En detalle se prioriza radio exterior para ampliar arco util de piezas.
        if (normalized === 'Piezas') return getCategoryBandThreeQuarterRadius('Piezas');
        return getCategoryBandMidRadius(normalized);
    };

    const setNodePolar = (nodeIdRaw, angleRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        const node = nodeById.get(nodeId);
        if (!node) return;

        const angle = normAngle(angleRaw);
        const radius = getPlacementRadius(nodeId);

        node.x = Math.round(Math.cos(angle) * radius);
        node.y = Math.round(Math.sin(angle) * radius);
    };

    const getMinGapForRank = (rank, ids = []) => {
        const rows = (Array.isArray(ids) ? ids : []).filter((id) => nodeById.has(String(id || '').trim()));
        if (!rows.length) return 0.06;

        const radii = rows.map((id) => Math.max(1, getPlacementRadius(id)));
        const minRadius = Math.max(1, Math.min(...radii));
        const base = ((BOM_NODE_HALF_WIDTH * 2) + 24) / minRadius;

        const applyGapScale = (valueRaw) => Math.max(0.0001, toNumber(valueRaw, 0.06) * nodeGapScale);
        if (rank <= 3) return Math.max(0.06, base * 0.95);
        if (rank === 4) {
            if (compactProjectPieceSpacing) {
                // Proyecto x3: rank 4 debe compactar como buloneria (incluye nodeGapScale).
                return applyGapScale(Math.max(0.064, base * 0.96));
            }
            return Math.max(0.22, base * 2.24);
        }
        // Buloneria en un solo carril (3/4): separacion minima, priorizando mantener
        // la cercania angular con su padre (lineas mas cortas), sin colisionar.
        if (rank === 5) return applyGapScale(Math.max(0.064, base * 0.96));
        if (rank > 5) return Math.max(0.07, base * 1.02);
        return Math.max(0.068, base * 1.02);
    };

    const primaryParentMap = new Map();
    const placedAngles = new Map();
    const pieceBranchMap = getBomClassificationMap();

    const choosePrimaryParent = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        const nodeRank = getRank(nodeId);

        const parents = (parentMap.get(nodeId) || [])
            .map((id) => String(id || '').trim())
            .filter(Boolean);

        if (!parents.length) return null;

        const candidates = parents.filter((id) => id !== 'core' && nodeById.has(id));
        if (!candidates.length) return parents.includes('core') ? 'core' : null;

        candidates.sort((aId, bId) => {
            const aRank = getRank(aId);
            const bRank = getRank(bId);

            const aPenalty = Math.abs((nodeRank - aRank) - 1);
            const bPenalty = Math.abs((nodeRank - bRank) - 1);
            if (aPenalty !== bPenalty) return aPenalty - bPenalty;

            if (aRank !== bRank) return bRank - aRank;
            return tieBreaker(aId, bId);
        });

        return candidates[0] || null;
    };

    nodeIds.forEach((nodeId) => {
        primaryParentMap.set(nodeId, choosePrimaryParent(nodeId));
    });

    const descendantDetailAngleMemo = new Map();
    const getDescendantDetailAnchorAngle = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId || !nodeById.has(nodeId)) return null;
        if (descendantDetailAngleMemo.has(nodeId)) return descendantDetailAngleMemo.get(nodeId);

        const visited = new Set([nodeId]);
        const queue = [{ id: nodeId, depth: 0 }];
        let weightedSum = 0;
        let totalWeight = 0;

        while (queue.length) {
            const current = queue.shift();
            const currentId = String(current && current.id ? current.id : '').trim();
            const depth = Math.max(0, toNumber(current && current.depth, 0));

            (childMap.get(currentId) || []).forEach((childIdRaw) => {
                const childId = String(childIdRaw || '').trim();
                if (!childId || childId === 'core' || visited.has(childId) || !nodeById.has(childId)) return;

                visited.add(childId);

                const childRank = getRank(childId);
                if (childRank >= 4) {
                    const angle = placedAngles.has(childId) ? placedAngles.get(childId) : getNodeAngle(childId);
                    if (Number.isFinite(angle)) {
                        const weight = 1 / Math.max(1, depth + 1);
                        weightedSum += angle * weight;
                        totalWeight += weight;
                    }
                }

                queue.push({ id: childId, depth: depth + 1 });
            });
        }

        const anchor = totalWeight > 0 ? (weightedSum / totalWeight) : null;
        descendantDetailAngleMemo.set(nodeId, anchor);
        return anchor;
    };

    const placeOrderedWithGapResolver = (
        orderedIds = [],
        desiredMap = new Map(),
        minGap = 0.08,
        startA = arcStart,
        endA = arcEnd,
        getGapBetween = null
    ) => {
        const ids = (Array.isArray(orderedIds) ? orderedIds : []).slice();
        if (!ids.length) return;

        const start = Math.min(startA, endA);
        const end = Math.max(startA, endA);
        const span = Math.max(0.0001, end - start);

        const n = ids.length;
        const baseGap = Math.max(0.0001, toNumber(minGap, 0.08));
        const gaps = [];
        for (let i = 0; i < (n - 1); i += 1) {
            let gap = baseGap;
            if (typeof getGapBetween === 'function') {
                const resolved = toNumber(getGapBetween(ids[i], ids[i + 1], baseGap), baseGap);
                if (Number.isFinite(resolved) && resolved > 0) gap = Math.max(0.0001, resolved);
            }
            gaps.push(gap);
        }

        const requiredBase = baseGap * Math.max(0, n - 1);
        if (requiredBase > span && requiredBase > 0) {
            const scale = span / requiredBase;
            for (let i = 0; i < gaps.length; i += 1) gaps[i] = baseGap * scale;
        } else {
            const extras = gaps.map((g) => Math.max(0, g - baseGap));
            const totalExtra = extras.reduce((acc, value) => acc + value, 0);
            const allowedExtra = Math.max(0, span - requiredBase);
            if (totalExtra > allowedExtra && totalExtra > 0) {
                const scale = allowedExtra / totalExtra;
                for (let i = 0; i < gaps.length; i += 1) {
                    gaps[i] = baseGap + (extras[i] * scale);
                }
            }
        }

        const minPos = new Array(n).fill(start);
        for (let i = 1; i < n; i += 1) {
            minPos[i] = minPos[i - 1] + gaps[i - 1];
        }

        const maxPos = new Array(n).fill(end);
        for (let i = n - 2; i >= 0; i -= 1) {
            maxPos[i] = maxPos[i + 1] - gaps[i];
        }

        const desired = ids.map((id) => clamp(desiredMap.has(id) ? desiredMap.get(id) : getNodeAngle(id), start, end));
        const placed = desired.map((value, idx) => clamp(value, minPos[idx], maxPos[idx]));

        const relax = () => {
            for (let i = 1; i < n; i += 1) {
                const lowerBound = placed[i - 1] + gaps[i - 1];
                if (placed[i] < lowerBound) placed[i] = lowerBound;
                if (placed[i] > maxPos[i]) placed[i] = maxPos[i];
            }
            for (let i = n - 2; i >= 0; i -= 1) {
                const upperBound = placed[i + 1] - gaps[i];
                if (placed[i] > upperBound) placed[i] = upperBound;
                if (placed[i] < minPos[i]) placed[i] = minPos[i];
            }
        };

        for (let step = 0; step < 4; step += 1) relax();

        ids.forEach((id, idx) => {
            const angle = clamp(placed[idx], start, end);
            setNodePolar(id, angle);
            placedAngles.set(id, angle);
        });
    };

    const placeOrdered = (orderedIds = [], desiredMap = new Map(), minGap = 0.08, startA = arcStart, endA = arcEnd) => {
        placeOrderedWithGapResolver(orderedIds, desiredMap, minGap, startA, endA, null);
    };

    const getPlacedOrCurrentAngle = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId) return null;
        const angle = placedAngles.has(nodeId) ? placedAngles.get(nodeId) : getNodeAngle(nodeId);
        return Number.isFinite(angle) ? normAngle(angle) : null;
    };

    const getCircularMeanAngle = (anglesRaw = [], fallbackRaw = centerAngle) => {
        const angles = (Array.isArray(anglesRaw) ? anglesRaw : [])
            .map((value) => toNumber(value, NaN))
            .filter((value) => Number.isFinite(value));
        if (!angles.length) return Number.isFinite(fallbackRaw) ? normAngle(fallbackRaw) : centerAngle;

        let sinSum = 0;
        let cosSum = 0;
        angles.forEach((angle) => {
            sinSum += Math.sin(angle);
            cosSum += Math.cos(angle);
        });

        if (Math.abs(sinSum) < 0.000001 && Math.abs(cosSum) < 0.000001) {
            return Number.isFinite(fallbackRaw) ? normAngle(fallbackRaw) : centerAngle;
        }

        return normAngle(Math.atan2(sinSum, cosSum));
    };

    const getChildrenAnchorAngle = (nodeIdRaw, minChildRank = 0) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId) return null;

        const childAngles = (childMap.get(nodeId) || [])
            .map((id) => String(id || '').trim())
            .filter((id) => id && id !== 'core' && nodeById.has(id))
            .filter((id) => getRank(id) >= minChildRank)
            .map((id) => getPlacedOrCurrentAngle(id))
            .filter((v) => Number.isFinite(v));

        if (!childAngles.length) return null;
        return getCircularMeanAngle(childAngles, getPlacedOrCurrentAngle(nodeId));
    };

    // Estructurales: anclaje por descendencia de piezas para acortar recorridos hacia core.
    const rank1 = (layers.get(1) || []).slice();

    if (rank1.length) {
        const desired = new Map();
        rank1.forEach((id) => {
            const childAnchor = getChildrenAnchorAngle(id, 2);
            const descendantAnchor = getDescendantDetailAnchorAngle(id);
            if (Number.isFinite(childAnchor)) {
                desired.set(id, childAnchor);
                return;
            }
            desired.set(id, Number.isFinite(descendantAnchor) ? descendantAnchor : getNodeAngle(id));
        });

        const ordered = rank1.slice().sort((aId, bId) => {
            const a = desired.has(aId) ? desired.get(aId) : getNodeAngle(aId);
            const b = desired.has(bId) ? desired.get(bId) : getNodeAngle(bId);
            if (Math.abs(a - b) > 0.000001) return a - b;
            return tieBreaker(aId, bId);
        });

        placeOrdered(ordered, desired, getMinGapForRank(1, ordered), arcStart, arcEnd);
    }

    for (let rank = 2; rank <= 3; rank += 1) {
        const ids = (layers.get(rank) || []).slice();
        if (!ids.length) continue;

        const desired = new Map();
        ids.forEach((nodeId) => {
            const parentId = primaryParentMap.get(nodeId);
            const childAnchor = getChildrenAnchorAngle(nodeId, rank + 1);
            const descendantAnchor = getDescendantDetailAnchorAngle(nodeId);

            let parentAngle = null;
            if (parentId === 'core') parentAngle = centerAngle;
            else if (parentId && parentId !== 'core' && placedAngles.has(parentId)) {
                parentAngle = placedAngles.get(parentId);
            }

            if (Number.isFinite(childAnchor) && Number.isFinite(parentAngle)) {
                desired.set(nodeId, ((childAnchor * 0.84) + (parentAngle * 0.16)));
                return;
            }
            if (Number.isFinite(childAnchor)) {
                desired.set(nodeId, childAnchor);
                return;
            }

            if (Number.isFinite(descendantAnchor) && Number.isFinite(parentAngle)) {
                desired.set(nodeId, ((descendantAnchor * 0.72) + (parentAngle * 0.28)));
                return;
            }
            if (Number.isFinite(descendantAnchor)) {
                desired.set(nodeId, descendantAnchor);
                return;
            }
            if (Number.isFinite(parentAngle)) {
                desired.set(nodeId, parentAngle);
                return;
            }

            const childrenAngles = (childMap.get(nodeId) || [])
                .map((id) => String(id || '').trim())
                .filter((id) => id && id !== 'core')
                .map((id) => placedAngles.has(id) ? placedAngles.get(id) : getNodeAngle(id))
                .filter((v) => Number.isFinite(v));

            if (childrenAngles.length) {
                desired.set(nodeId, childrenAngles.reduce((acc, v) => acc + v, 0) / childrenAngles.length);
                return;
            }

            desired.set(nodeId, getNodeAngle(nodeId));
        });

        const ordered = ids.slice().sort((aId, bId) => {
            const a = desired.has(aId) ? desired.get(aId) : getNodeAngle(aId);
            const b = desired.has(bId) ? desired.get(bId) : getNodeAngle(bId);
            if (Math.abs(a - b) > 0.000001) return a - b;
            return tieBreaker(aId, bId);
        });

        placeOrdered(ordered, desired, getMinGapForRank(rank, ordered), arcStart, arcEnd);
    }

    const getDetailOrderByParentAndDepth = (rank) => {
        const ids = (layers.get(rank) || []).slice();
        if (!ids.length) return [];

        const idSet = new Set(ids);
        const childrenByParent = new Map();

        ids.forEach((id) => {
            const parentId = String(primaryParentMap.get(id) || '').trim() || '__root__';
            const list = childrenByParent.get(parentId) || [];
            list.push(id);
            childrenByParent.set(parentId, list);
        });

        const sortChildList = (arr = []) => arr.slice().sort((aId, bId) => {
            const aParent = String(primaryParentMap.get(aId) || '').trim();
            const bParent = String(primaryParentMap.get(bId) || '').trim();

            const aAnchor = aParent && placedAngles.has(aParent) ? placedAngles.get(aParent) : getNodeAngle(aId);
            const bAnchor = bParent && placedAngles.has(bParent) ? placedAngles.get(bParent) : getNodeAngle(bId);
            if (Math.abs(aAnchor - bAnchor) > 0.000001) return aAnchor - bAnchor;

            const byAngle = getNodeAngle(aId) - getNodeAngle(bId);
            if (Math.abs(byAngle - 0) > 0.000001) return byAngle;
            return tieBreaker(aId, bId);
        });

        const rootParents = Array.from(new Set(ids.map((id) => {
            const p = String(primaryParentMap.get(id) || '').trim();
            if (!p || !idSet.has(p)) return p || '__root__';
            return null;
        }).filter(Boolean)));

        rootParents.sort((aId, bId) => {
            const aAngle = aId === '__root__' ? centerAngle : (placedAngles.has(aId) ? placedAngles.get(aId) : getNodeAngle(aId));
            const bAngle = bId === '__root__' ? centerAngle : (placedAngles.has(bId) ? placedAngles.get(bId) : getNodeAngle(bId));
            if (Math.abs(aAngle - bAngle) > 0.000001) return aAngle - bAngle;
            return String(aId).localeCompare(String(bId), 'es', { sensitivity: 'base' });
        });

        const ordered = [];
        const used = new Set();

        rootParents.forEach((rootParentId) => {
            let currentParents = [rootParentId];

            while (currentParents.length) {
                const nextParents = [];
                currentParents.forEach((parentId) => {
                    const children = sortChildList(childrenByParent.get(parentId) || []);
                    children.forEach((childId) => {
                        if (used.has(childId)) return;
                        used.add(childId);
                        ordered.push(childId);
                        nextParents.push(childId);
                    });
                });
                currentParents = nextParents;
            }
        });

        // fallback por si quedo algun nodo fuera del barrido.
        ids.forEach((id) => {
            if (!used.has(id)) ordered.push(id);
        });

        return ordered;
    };

    const hasPieceStructuralSubgroup = (nodeIdRaw) => {
        let currentId = String(nodeIdRaw || '').trim();
        if (!currentId) return false;

        const visited = new Set();
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);

            const parentId = String(primaryParentMap.get(currentId) || '').trim();
            if (!parentId || parentId === 'core') return false;

            const parentRank = getRank(parentId);
            if (parentRank >= 1 && parentRank <= 3) return true;
            if (parentRank === 4) {
                currentId = parentId;
                continue;
            }
            return false;
        }

        return false;
    };

    const splitPieceNodesBySubgroup = (orderedIds = []) => {
        const ids = (Array.isArray(orderedIds) ? orderedIds : [])
            .map((id) => String(id || '').trim())
            .filter((id) => id && nodeById.has(id) && getRank(id) === 4);

        const withSubgroup = [];
        const withoutSubgroup = [];

        ids.forEach((id) => {
            if (hasPieceStructuralSubgroup(id)) withSubgroup.push(id);
            else withoutSubgroup.push(id);
        });

        return { withSubgroup, withoutSubgroup };
    };

    const pieceGroupInfoMemo = new Map();
    const getPieceGroupInfo = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId || !nodeById.has(nodeId) || getRank(nodeId) !== 4) {
            return { categoryKey: '', subgroupKey: '', visualCategoryKey: '' };
        }
        if (pieceGroupInfoMemo.has(nodeId)) return pieceGroupInfoMemo.get(nodeId);

        const canonicalId = String(getBomCanonicalItemId(nodeId) || '').trim();
        const branchDirect = pieceBranchMap.get(nodeId) || {};
        const branchCanonical = pieceBranchMap.get(canonicalId) || {};
        const conjunto = String(branchDirect.conjunto || branchCanonical.conjunto || '').trim();
        const sub1 = String(branchDirect.sub1 || branchCanonical.sub1 || '').trim();
        const sub11 = String(branchDirect.sub11 || branchCanonical.sub11 || '').trim();
        if (conjunto) {
            const info = {
                categoryKey: `conjunto:${conjunto}`,
                subgroupKey: `conjunto:${conjunto}|sub1:${sub1 || '-'}|sub11:${sub11 || '-'}`,
                visualCategoryKey: `conjunto:${conjunto}`
            };
            pieceGroupInfoMemo.set(nodeId, info);
            return info;
        }

        let currentId = nodeId;
        const visited = new Set();
        let categoryKey = '';
        let subgroupKey = '';
        let fallbackSubgroup = '';
        let topAncestor = '';
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const parentId = String(primaryParentMap.get(currentId) || '').trim();
            if (!parentId || parentId === 'core') break;
            const parentRank = getRank(parentId);
            if (parentRank === 1 && !categoryKey) categoryKey = `conjunto:${parentId}`;
            if ((parentRank === 2 || parentRank === 3) && !subgroupKey) subgroupKey = `subgrupo:${parentId}`;
            if ((parentRank >= 1 && parentRank <= 3) && !fallbackSubgroup) fallbackSubgroup = `estructura:${parentId}`;
            topAncestor = parentId;
            if (parentRank >= 1 && parentRank <= 4) {
                currentId = parentId;
                continue;
            }
            break;
        }

        const info = {
            categoryKey: categoryKey || (topAncestor ? `rama:${topAncestor}` : `rama:${nodeId}`),
            subgroupKey: subgroupKey || fallbackSubgroup || categoryKey || (topAncestor ? `rama:${topAncestor}` : `rama:${nodeId}`),
            visualCategoryKey: categoryKey || (topAncestor ? `rama:${topAncestor}` : `rama:${nodeId}`)
        };
        pieceGroupInfoMemo.set(nodeId, info);
        return info;
    };

    const prioritizePieceNodesBySubgroup = (orderedIds = []) => {
        const ids = (Array.isArray(orderedIds) ? orderedIds : [])
            .map((id) => String(id || '').trim())
            .filter((id) => id && nodeById.has(id) && getRank(id) === 4);
        if (!ids.length) return [];

        const orderIndex = new Map(ids.map((id, idx) => [id, idx]));
        return ids.slice().sort((aId, bId) => {
            const a = getPieceGroupInfo(aId);
            const b = getPieceGroupInfo(bId);

            const byCategory = String(a.visualCategoryKey || '').localeCompare(String(b.visualCategoryKey || ''), 'es', { sensitivity: 'base' });
            if (byCategory !== 0) return byCategory;

            const bySubgroup = String(a.subgroupKey || '').localeCompare(String(b.subgroupKey || ''), 'es', { sensitivity: 'base' });
            if (bySubgroup !== 0) return bySubgroup;

            return Number(orderIndex.get(aId)) - Number(orderIndex.get(bId));
        });
    };

    const isPieceParentChildPair = (aIdRaw, bIdRaw) => {
        const aId = String(aIdRaw || '').trim();
        const bId = String(bIdRaw || '').trim();
        if (!aId || !bId || aId === bId) return false;
        if (getRank(aId) !== 4 || getRank(bId) !== 4) return false;

        const aParent = String(primaryParentMap.get(aId) || '').trim();
        const bParent = String(primaryParentMap.get(bId) || '').trim();
        return aParent === bId || bParent === aId;
    };

    const getPieceInterBranchGap = (leftIdRaw, rightIdRaw, baseGapRaw = 0.08) => {
        const leftId = String(leftIdRaw || '').trim();
        const rightId = String(rightIdRaw || '').trim();
        const baseGap = Math.max(0.0001, toNumber(baseGapRaw, 0.08));
        if (!leftId || !rightId) return baseGap;
        if (isPieceParentChildPair(leftId, rightId)) return baseGap;

        const leftGroup = getPieceGroupInfo(leftId);
        const rightGroup = getPieceGroupInfo(rightId);

        const categoryChanged = Boolean(leftGroup.visualCategoryKey || rightGroup.visualCategoryKey)
            && leftGroup.visualCategoryKey !== rightGroup.visualCategoryKey;
        if (categoryChanged) return baseGap * (compactProjectPieceSpacing ? 2.6 : 20);

        const subgroupChanged = Boolean(leftGroup.subgroupKey || rightGroup.subgroupKey)
            && leftGroup.subgroupKey !== rightGroup.subgroupKey;
        if (subgroupChanged) return baseGap * (compactProjectPieceSpacing ? 1.6 : 6);

        // Misma rama estructural (mismo conjunto/subconjunto): compactar 50% en BOM de proyecto.
        return compactProjectPieceSpacing ? (baseGap * 0.95) : (baseGap * samePieceSubgroupGapScale);
    };

    const getPieceIntraCategoryGap = (leftIdRaw, rightIdRaw, baseGapRaw = 0.08) => {
        const leftId = String(leftIdRaw || '').trim();
        const rightId = String(rightIdRaw || '').trim();
        const baseGap = Math.max(0.0001, toNumber(baseGapRaw, 0.08));
        if (!leftId || !rightId) return baseGap;
        if (isPieceParentChildPair(leftId, rightId)) return baseGap;

        const leftGroup = getPieceGroupInfo(leftId);
        const rightGroup = getPieceGroupInfo(rightId);
        if (leftGroup.visualCategoryKey !== rightGroup.visualCategoryKey) {
            return compactProjectPieceSpacing ? (baseGap * 2.6) : baseGap;
        }

        const subgroupChanged = Boolean(leftGroup.subgroupKey || rightGroup.subgroupKey)
            && leftGroup.subgroupKey !== rightGroup.subgroupKey;
        if (subgroupChanged) return baseGap * (compactProjectPieceSpacing ? 1.6 : 6);

        // Misma rama estructural (mismo conjunto/subconjunto): compactar 50% en BOM de proyecto.
        return compactProjectPieceSpacing ? (baseGap * 0.95) : (baseGap * samePieceSubgroupGapScale);
    };

    const splitPieceNodesByCategory = (orderedIds = []) => {
        const ids = (Array.isArray(orderedIds) ? orderedIds : [])
            .map((id) => String(id || '').trim())
            .filter((id) => id && nodeById.has(id) && getRank(id) === 4);
        if (!ids.length) return [];

        const groups = [];
        const byKey = new Map();
        ids.forEach((id) => {
            const info = getPieceGroupInfo(id);
            const key = String(info.visualCategoryKey || info.categoryKey || info.subgroupKey || 'sin-categoria').trim() || 'sin-categoria';
            if (!byKey.has(key)) {
                const group = { key, ids: [] };
                byKey.set(key, group);
                groups.push(group);
            }
            byKey.get(key).ids.push(id);
        });

        return groups;
    };

    const alignPieceFamilyAngles = (orderedIds = [], desiredMap = null) => {
        const ids = (Array.isArray(orderedIds) ? orderedIds : [])
            .map((id) => String(id || '').trim())
            .filter((id) => id && nodeById.has(id) && getRank(id) === 4);
        if (!ids.length) return;

        const idSet = new Set(ids);
        ids.forEach((id) => {
            const parentId = String(primaryParentMap.get(id) || '').trim();
            if (!parentId || !idSet.has(parentId)) return;
            if (!isPieceParentChildPair(id, parentId)) return;

            const anchor = placedAngles.has(parentId)
                ? placedAngles.get(parentId)
                : ((desiredMap instanceof Map && desiredMap.has(parentId)) ? desiredMap.get(parentId) : getNodeAngle(parentId));

            if (!Number.isFinite(anchor)) return;

            const angle = clamp(anchor, arcStart, arcEnd);
            setNodePolar(id, angle);
            placedAngles.set(id, angle);
        });
    };

    const assignPieceRadialLanes = (orderedIds = []) => {
        const ids = (Array.isArray(orderedIds) ? orderedIds : [])
            .map((id) => String(id || '').trim())
            .filter((id) => id && nodeById.has(id) && getRank(id) === 4);
        if (!ids.length) return;

        const laneRadii = [
            getCategoryBandQuarterRadius('Piezas'),
            getCategoryBandThreeQuarterRadius('Piezas')
        ];

        const idSet = new Set(ids);
        const indexById = new Map(ids.map((id, idx) => [id, idx]));

        const pieceChildrenByParent = new Map();
        const pieceRelationIds = new Set();

        ids.forEach((id) => {
            const parentId = String(primaryParentMap.get(id) || '').trim();
            if (!parentId || !idSet.has(parentId)) return;
            if (!isPieceParentChildPair(id, parentId)) return;

            pieceRelationIds.add(id);
            pieceRelationIds.add(parentId);

            const list = pieceChildrenByParent.get(parentId) || [];
            list.push(id);
            pieceChildrenByParent.set(parentId, list);
        });

        pieceChildrenByParent.forEach((list) => {
            list.sort((aId, bId) => {
                const a = Number(indexById.get(aId));
                const b = Number(indexById.get(bId));
                return a - b;
            });
        });

        const assigned = new Set();

        const assignPieceFamily = (rootIdRaw, depth = 0) => {
            const rootId = String(rootIdRaw || '').trim();
            if (!rootId || assigned.has(rootId)) return;

            // Regla parent->child en piezas: misma direccion, alternando 1/4 y 3/4.
            const lane = (depth % 2 === 0) ? laneRadii[0] : laneRadii[1];
            radialOverrideById.set(rootId, lane);
            assigned.add(rootId);

            (pieceChildrenByParent.get(rootId) || []).forEach((childId) => {
                assignPieceFamily(childId, depth + 1);
            });
        };

        const relationRoots = ids.filter((id) => {
            if (!pieceRelationIds.has(id)) return false;
            const parentId = String(primaryParentMap.get(id) || '').trim();
            return !(parentId && idSet.has(parentId) && pieceRelationIds.has(parentId));
        });

        relationRoots.forEach((id) => assignPieceFamily(id, 0));

        ids.forEach((id) => {
            if (!pieceRelationIds.has(id) || assigned.has(id)) return;
            assignPieceFamily(id, 0);
        });

        // Regla general: 1/4 -> 3/4 y reinicia.
        let laneIdx = 0;
        ids.forEach((id) => {
            if (assigned.has(id)) return;
            radialOverrideById.set(id, laneRadii[laneIdx % laneRadii.length]);
            assigned.add(id);
            laneIdx += 1;
        });
    };

    const assignBuloneriaRadialLanes = (orderedIds = []) => {
        const ids = (Array.isArray(orderedIds) ? orderedIds : [])
            .map((id) => String(id || '').trim())
            .filter((id) => id && nodeById.has(id) && getRank(id) === 5);
        if (!ids.length) return;

        const laneRadius = getCategoryBandThreeQuarterRadius('Buloneria');
        ids.forEach((id) => {
            radialOverrideById.set(id, laneRadius);
        });
    };

    const placePieceNodesWithTail = (orderedIds = [], desiredMap = new Map()) => {
        const ordered = (Array.isArray(orderedIds) ? orderedIds : [])
            .map((id) => String(id || '').trim())
            .filter((id) => id && nodeById.has(id) && getRank(id) === 4);
        if (!ordered.length) return;

        const categoryGroups = splitPieceNodesByCategory(ordered);
        if (categoryGroups.length <= 1) {
            placeOrderedWithGapResolver(
                ordered,
                desiredMap,
                getMinGapForRank(4, ordered),
                arcStart,
                arcEnd,
                getPieceIntraCategoryGap
            );
            return;
        }

        // Distribucion por sectores equidistantes (360°): categorias bien definidas y separadas.
        if (compactProjectPieceSpacing) {
            placeOrderedWithGapResolver(
                ordered,
                desiredMap,
                getMinGapForRank(4, ordered),
                arcStart,
                arcEnd,
                getPieceInterBranchGap
            );
            return;
        }

        const spanTotal = Math.max(0.0001, arcEnd - arcStart);
        const requiredByGroup = categoryGroups.map((group) => {
            const baseGap = getMinGapForRank(4, group.ids);
            const required = group.ids.length <= 1
                ? 0
                : group.ids.slice(0, -1).reduce((acc, id, idx) => {
                    const nextId = group.ids[idx + 1];
                    return acc + getPieceIntraCategoryGap(id, nextId, baseGap);
                }, 0);
            return { group, baseGap, required };
        });
        const groupCount = Math.max(1, requiredByGroup.length);
        const sectorSpan = spanTotal / groupCount;
        const sectorPadding = Math.min(0.08, sectorSpan * 0.12);
        const availablePerSector = Math.max(0.0001, sectorSpan - (sectorPadding * 2));

        const cannotFitEqualSectors = requiredByGroup.some((row) => row.required > availablePerSector);
        if (cannotFitEqualSectors) {
            placeOrderedWithGapResolver(
                ordered,
                desiredMap,
                getMinGapForRank(4, ordered),
                arcStart,
                arcEnd,
                getPieceInterBranchGap
            );
            return;
        }

        requiredByGroup.forEach((row, idx) => {
            const sectorStart = arcStart + (idx * sectorSpan) + sectorPadding;
            const sectorEnd = sectorStart + availablePerSector;
            const sectorCenter = (sectorStart + sectorEnd) / 2;
            const halfRequired = row.required / 2;
            let start = sectorCenter - halfRequired;
            let end = sectorCenter + halfRequired;

            if (row.group.ids.length <= 1) {
                start = sectorCenter;
                end = sectorCenter;
            } else {
                if (start < sectorStart) {
                    const shift = sectorStart - start;
                    start += shift;
                    end += shift;
                }
                if (end > sectorEnd) {
                    const shift = end - sectorEnd;
                    start -= shift;
                    end -= shift;
                }
                start = Math.max(sectorStart, start);
                end = Math.min(sectorEnd, end);
            }

            const localDesired = new Map();
            row.group.ids.forEach((id) => {
                const desired = desiredMap.has(id) ? desiredMap.get(id) : getNodeAngle(id);
                localDesired.set(id, desired);
            });

            placeOrderedWithGapResolver(
                row.group.ids,
                localDesired,
                row.baseGap,
                start,
                end,
                getPieceIntraCategoryGap
            );
        });
    };

    let pieceRankOrdered = [];

    // Detalle: orden por padre y grado de parentesco (sin intercalar).
    for (let rank = 4; rank <= maxRank; rank += 1) {
        let ordered = getDetailOrderByParentAndDepth(rank);
        if (!ordered.length) continue;

        if (rank === 4) {
            ordered = prioritizePieceNodesBySubgroup(ordered);
            pieceRankOrdered = ordered.slice();
        }

        const desired = new Map();
        ordered.forEach((nodeId) => {
            const parentId = primaryParentMap.get(nodeId);

            if (rank === 4 && parentId && isPieceParentChildPair(nodeId, parentId)) {
                const parentAngle = placedAngles.has(parentId)
                    ? placedAngles.get(parentId)
                    : (desired.has(parentId) ? desired.get(parentId) : getNodeAngle(parentId));
                if (Number.isFinite(parentAngle)) {
                    desired.set(nodeId, parentAngle);
                    return;
                }
            }

            if (parentId && parentId !== 'core' && placedAngles.has(parentId)) {
                desired.set(nodeId, placedAngles.get(parentId));
                return;
            }

            const parentAngles = (parentMap.get(nodeId) || [])
                .map((id) => String(id || '').trim())
                .filter((id) => id && id !== 'core')
                .map((id) => placedAngles.has(id) ? placedAngles.get(id) : getNodeAngle(id))
                .filter((v) => Number.isFinite(v));

            if (parentAngles.length) {
                desired.set(nodeId, parentAngles.reduce((acc, v) => acc + v, 0) / parentAngles.length);
                return;
            }

            desired.set(nodeId, getNodeAngle(nodeId));
        });

        if (rank === 4) assignPieceRadialLanes(ordered);
        if (rank === 5) assignBuloneriaRadialLanes(ordered);

        if (rank === 4) {
            placePieceNodesWithTail(ordered, desired);
        } else {
            placeOrdered(ordered, desired, getMinGapForRank(rank, ordered), arcStart, arcEnd);
        }

        if (rank === 4) {
            alignPieceFamilyAngles(ordered, desired);
        }
    }

    // Anti-colision adicional entre piezas/buloneria en mismo rank.
    const resolveDetailAngularCollisions = () => {
        for (let rank = 4; rank <= maxRank; rank += 1) {
            const ids = (layers.get(rank) || []).slice();
            if (ids.length <= 1) continue;

            const minGap = getMinGapForRank(rank, ids);
            const iterations = rank === 4 ? 18 : (rank === 5 ? 8 : 10);

            for (let it = 0; it < iterations; it += 1) {
                const ordered = ids.slice().sort((aId, bId) => {
                    const a = placedAngles.has(aId) ? placedAngles.get(aId) : getNodeAngle(aId);
                    const b = placedAngles.has(bId) ? placedAngles.get(bId) : getNodeAngle(bId);
                    if (Math.abs(a - b) > 0.000001) return a - b;
                    return tieBreaker(aId, bId);
                });

                let moved = false;
                for (let i = 0; i < (ordered.length - 1); i += 1) {
                    const leftId = ordered[i];
                    const rightId = ordered[i + 1];

                    const a = placedAngles.has(leftId) ? placedAngles.get(leftId) : getNodeAngle(leftId);
                    const b = placedAngles.has(rightId) ? placedAngles.get(rightId) : getNodeAngle(rightId);
                    if (rank === 4 && isPieceParentChildPair(leftId, rightId)) continue;
                    if (rank === 4) {
                        const leftGroup = getPieceGroupInfo(leftId);
                        const rightGroup = getPieceGroupInfo(rightId);
                        if (leftGroup.visualCategoryKey !== rightGroup.visualCategoryKey) continue;
                    }
                    const targetGap = (rank === 4)
                        ? getPieceIntraCategoryGap(leftId, rightId, minGap)
                        : minGap;
                    const diff = b - a;
                    if (diff >= targetGap) continue;

                    const push = (targetGap - diff) / 2;
                    const nextA = clamp(a - push, arcStart, arcEnd);
                    const nextB = clamp(b + push, arcStart, arcEnd);

                    if (Math.abs(nextA - a) > 0.0005) {
                        setNodePolar(leftId, nextA);
                        placedAngles.set(leftId, nextA);
                        moved = true;
                    }
                    if (Math.abs(nextB - b) > 0.0005) {
                        setNodePolar(rightId, nextB);
                        placedAngles.set(rightId, nextB);
                        moved = true;
                    }
                }

                if (!moved) break;
            }
        }
    };

    resolveDetailAngularCollisions();

    if (pieceRankOrdered.length) {
        const orderedTail = prioritizePieceNodesBySubgroup(pieceRankOrdered);
        assignPieceRadialLanes(orderedTail);

        const desiredTail = new Map();
        orderedTail.forEach((nodeId) => {
            const angle = placedAngles.has(nodeId) ? placedAngles.get(nodeId) : getNodeAngle(nodeId);
            desiredTail.set(nodeId, angle);
        });

        placePieceNodesWithTail(orderedTail, desiredTail);
        alignPieceFamilyAngles(orderedTail, desiredTail);
    }

    const recenterStructuralByChildren = () => {
        for (let rank = 3; rank >= 1; rank -= 1) {
            const ids = (layers.get(rank) || []).slice();
            if (!ids.length) continue;

            const desired = new Map();
            ids.forEach((nodeId) => {
                const currentAngle = getPlacedOrCurrentAngle(nodeId);
                const childAnchor = getChildrenAnchorAngle(nodeId, rank + 1);
                if (Number.isFinite(childAnchor)) {
                    desired.set(nodeId, childAnchor);
                    return;
                }
                desired.set(nodeId, Number.isFinite(currentAngle) ? currentAngle : getNodeAngle(nodeId));
            });

            const ordered = ids.slice().sort((aId, bId) => {
                const a = desired.has(aId) ? desired.get(aId) : getNodeAngle(aId);
                const b = desired.has(bId) ? desired.get(bId) : getNodeAngle(bId);
                if (Math.abs(a - b) > 0.000001) return a - b;
                return tieBreaker(aId, bId);
            });

            placeOrdered(ordered, desired, getMinGapForRank(rank, ordered), arcStart, arcEnd);
        }
    };

    recenterStructuralByChildren();

    if (isolatedNodeIds.length) {
        placeIsolatedNodesOnLeftGrid(isolatedNodeIds);
    }

    renderBomClassificationTable();
    renderBomGraph();
    if (persist) {
        touchActiveBomVersion();
        persistCurrentWorkspace(true);
    }
}

function maybeInitializeBomLayout() {
    if (!currentWorkspaceProject) return;

    const items = getActivePlmItems();
    if (!items.length) return;

    // En BOM de versiones se recalcula siempre para usar exactamente
    // la misma distribución que el BOM maestro de PLM.
    if (isBomVersionContext()) {
        autoArrangeBomNodes(false, true);
        return;
    }

    const hasPosition = items.some((item) => {
        return Math.abs(toNumber(item.x, 0)) > 5 || Math.abs(toNumber(item.y, 0)) > 5;
    });

    if (!hasPosition) {
        placeNodesOutsideRings(false);
    }
}

function isBomSectionActive() {
    return Boolean(document.querySelector('#view-plm-workspace .plm-section.active[data-plm-section="bom"]'));
}

function isBomEditingAllowed(showErrors = false) {
    if (!currentWorkspaceProject) return false;
    if (bomEditModeEnabled) return true;

    if (showErrors) {
        const lockedByPerformance = isBomPerformanceModeLocked();
        notifyProject(
            lockedByPerformance
                ? 'BOM en modo rendimiento: active el lapiz para editar conexiones.'
                : 'Active el modo edicion (lapiz) para modificar el BOM.',
            'error'
        );
    }

    return false;
}

function ensureBomKeybindings() {
    if (bomKeybindingsReady) return;

    window.addEventListener('keydown', (ev) => {
        if (!currentWorkspaceProject || !isBomSectionActive()) return;
        if (!isBomEditingAllowed(false)) return;
        if (!(ev.key === 'Delete' || ev.key === 'Backspace')) return;
        if (!selectedBomEdgeId) return;

        const target = ev.target;
        const tag = target && target.tagName ? String(target.tagName).toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

        ev.preventDefault();
        removeBomEdgeById(selectedBomEdgeId, true);
    });

    bomKeybindingsReady = true;
}

function addBomEdge(sourceIdRaw, targetIdRaw, persist = true, showErrors = true) {
    if (!currentWorkspaceProject) return false;
    if (!isBomEditingAllowed(showErrors)) return false;

    const sourceId = String(sourceIdRaw || '').trim();
    const targetId = String(targetIdRaw || '').trim();

    if (!sourceId || !targetId) {
        if (showErrors) notifyProject('Seleccione nodo origen y destino.', 'error');
        return false;
    }
    if (sourceId === targetId) {
        if (showErrors) notifyProject('No puede conectar un nodo consigo mismo.', 'error');
        return false;
    }
    if (targetId === 'core') {
        if (showErrors) notifyProject('El cuerpo terminado solo puede ser nodo origen.', 'error');
        return false;
    }

    const hierarchyCheck = validateBomEdgeHierarchyByIds(sourceId, targetId);
    if (!hierarchyCheck.ok) {
        if (showErrors) {
            notifyProject(
                `No se puede conectar: el padre debe ser de mayor categoria. (${hierarchyCheck.parentCategory} -> ${hierarchyCheck.childCategory})`,
                'error'
            );
        }
        return false;
    }

    const edges = getEditableBomEdges();

    const exists = edges.some((edge) => String(edge.source_id) === sourceId && String(edge.target_id) === targetId);
    if (exists) {
        if (showErrors) notifyProject('Esta conexion ya existe.', 'error');
        return false;
    }

    if (hasPathBetweenNodes(targetId, sourceId)) {
        if (showErrors) notifyProject('La conexion genera un ciclo.', 'error');
        return false;
    }

    const edge = {
        id: `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        source_id: sourceId,
        target_id: targetId,
        quantity: 1
    };

    edges.push(edge);
    selectedBomEdgeId = edge.id;

    snapNodeToDerivedCategory(sourceId);

    renderBomClassificationTable();
    renderBomGraph();
    renderPlmValuesPanel();
    if (persist) {
        touchActiveBomVersion();
        persistCurrentWorkspace(true);
    }
    return true;
}

function removeBomEdgeById(edgeIdRaw, persist = true) {
    if (!currentWorkspaceProject) return false;
    if (!isBomEditingAllowed(false)) return false;

    const edgeId = String(edgeIdRaw || '').trim();
    if (!edgeId) return false;

    const edges = getEditableBomEdges();
    const idx = edges.findIndex((edge) => String(edge.id) === edgeId);
    if (idx < 0) return false;

    edges.splice(idx, 1);
    if (selectedBomEdgeId === edgeId) selectedBomEdgeId = null;

    renderBomClassificationTable();
    renderBomGraph();
    renderPlmValuesPanel();
    if (persist) {
        touchActiveBomVersion();
        persistCurrentWorkspace(true);
    }
    return true;
}

function updateBomEdgeQuantity(edgeIdRaw, valueRaw, persist = true) {
    if (!currentWorkspaceProject) return false;
    if (!isBomEditingAllowed(false)) return false;

    const edgeId = String(edgeIdRaw || '').trim();
    if (!edgeId) return false;

    const edge = getEditableBomEdges().find((item) => String(item.id) === edgeId);
    if (!edge) return false;

    edge.quantity = normalizeBomQuantity(valueRaw, edge.quantity);

    renderBomClassificationTable();
    renderBomGraph();
    renderPlmValuesPanel();
    if (persist) {
        touchActiveBomVersion();
        persistCurrentWorkspace(true);
    }
    return true;
}

function findBomNodeAtPoint(worldX, worldY, nodes) {
    const items = Array.isArray(nodes) ? nodes : [];

    for (let i = items.length - 1; i >= 0; i -= 1) {
        const node = items[i];
        const dx = Math.abs(worldX - toNumber(node.x, 0));
        const dy = Math.abs(worldY - toNumber(node.y, 0));
        const halfHeight = getBomNodeRenderHalfHeight(node);
        if (dx <= BOM_NODE_HALF_WIDTH && dy <= halfHeight) return node;
    }

    return null;
}

function worldFromClient(clientX, clientY, host, width, height) {
    const rect = host.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    const worldX = (sx - (width / 2) - bomViewState.panX) / Math.max(bomViewState.scale, 0.0001);
    const worldY = (sy - (height / 2) - bomViewState.panY) / Math.max(bomViewState.scale, 0.0001);

    return { x: worldX, y: worldY, sx, sy };
}

function buildViewportTransform(width, height) {
    return `translate(${(width / 2) + bomViewState.panX} ${(height / 2) + bomViewState.panY}) scale(${bomViewState.scale})`;
}

function isBomPerformanceModeLocked(nodeCountRaw = NaN, edgeCountRaw = NaN) {
    if (bomEditModeEnabled) return false;
    if (!currentWorkspaceProject) return false;

    const nodeCount = Number.isFinite(nodeCountRaw) ? nodeCountRaw : getActiveBomGraphNodes().length;
    const edgeCount = Number.isFinite(edgeCountRaw) ? edgeCountRaw : getActiveBomEdges().length;
    return nodeCount >= BOM_PERFORMANCE_NODE_THRESHOLD || edgeCount >= BOM_PERFORMANCE_EDGE_THRESHOLD;
}

function updateBomEditModeButton() {
    const btn = document.getElementById('plm-bom-edit-mode-btn');
    if (!btn) return;

    const lockedByPerformance = isBomPerformanceModeLocked();
    btn.classList.toggle('btn-primary', bomEditModeEnabled);
    btn.textContent = '\u270E';
    btn.title = bomEditModeEnabled
        ? 'Salir de modo edicion'
        : (lockedByPerformance ? 'Entrar en modo edicion (desbloquear BOM)' : 'Entrar en modo edicion');
    btn.setAttribute('aria-label', btn.title);
}

function toggleBomEditMode(forceValue = null) {
    const nextValue = typeof forceValue === 'boolean' ? forceValue : !bomEditModeEnabled;
    if (bomEditModeEnabled === nextValue) {
        updateBomEditModeButton();
        return;
    }

    bomEditModeEnabled = nextValue;
    bomDragState = null;
    bomLinkDragState = null;
    selectedBomSourceId = null;
    selectedBomTargetId = null;
    selectedBomEdgeId = null;

    updateBomEditModeButton();
    scheduleBomGraphRender(false);
}

function scheduleBomGraphRender(includeTable = false) {
    bomRenderQueueIncludeTable = bomRenderQueueIncludeTable || Boolean(includeTable);
    if (bomRenderRafHandle != null) return;

    bomRenderRafHandle = window.requestAnimationFrame(() => {
        bomRenderRafHandle = null;

        const shouldRenderTable = bomRenderQueueIncludeTable;
        bomRenderQueueIncludeTable = false;

        if (shouldRenderTable) renderBomClassificationTable();
        renderBomGraph();
    });
}

function snapNodeToDerivedCategory(nodeIdRaw) {
    const node = getPartById(nodeIdRaw);
    if (!node) return;

    const category = getBomCategory(node);
    if (!category || category === 'Sin categoria' || category === 'Piezas') return;

    const rawAngle = Math.atan2(toNumber(node.y, 0), toNumber(node.x, 0));
    const angle = Number.isFinite(rawAngle) ? rawAngle : (-Math.PI / 2);
    const radius = getCategoryBandMidRadius(category);

    node.x = Math.round(Math.cos(angle) * radius);
    node.y = Math.round(Math.sin(angle) * radius);
}

function hasPathBetweenNodes(fromId, toId) {
    if (!currentWorkspaceProject) return false;
    const start = String(fromId || '');
    const target = String(toId || '');
    const edges = getActiveBomEdges();

    const stack = [start];
    const visited = new Set();

    while (stack.length) {
        const node = stack.pop();
        if (node === target) return true;
        if (visited.has(node)) continue;
        visited.add(node);

        edges.forEach((edge) => {
            if (String(edge.source_id) === node && !visited.has(String(edge.target_id))) {
                stack.push(String(edge.target_id));
            }
        });
    }

    return false;
}

function setPlmPrimaryActionButton() {
    const btn = document.getElementById('plm-primary-action-btn');
    const deleteBtn = document.getElementById('plm-delete-item-btn');
    if (!btn) return;

    const isEditing = Boolean(String(plmEditingItemId || '').trim());
    btn.textContent = isEditing ? 'Guardar Cambios' : 'Agregar Pieza';

    if (deleteBtn) {
        deleteBtn.style.display = isEditing ? 'inline-block' : 'none';
    }

    const titleEl = document.getElementById('plm-item-modal-title');
    if (titleEl) {
        titleEl.textContent = isEditing ? 'Modificar Pieza' : 'Agregar Pieza';
    }
}

function normalizePlmItemCode(value) {
    return String(value || '').trim().toUpperCase();
}

function findExistingPlmItemByCode(itemCodeRaw, excludeItemIdRaw = '') {
    if (!currentWorkspaceProject) return null;

    const itemCode = normalizePlmItemCode(itemCodeRaw);
    if (!itemCode) return null;

    const excludeItemId = String(excludeItemIdRaw || '').trim();
    return currentWorkspaceProject.plm_items.find((item) => {
        const currentId = String(item && item.id ? item.id : '').trim();
        if (excludeItemId && currentId === excludeItemId) return false;
        return normalizePlmItemCode(item && item.item_id ? item.item_id : '') === itemCode;
    }) || null;
}

function hasExistingPlmItemCode(itemCodeRaw, excludeItemIdRaw = '') {
    return Boolean(findExistingPlmItemByCode(itemCodeRaw, excludeItemIdRaw));
}

function setPlmItemCodeErrorState(showError = false) {
    const inputEl = document.getElementById('plm-input-item-id');
    const errorEl = document.getElementById('plm-item-id-error');
    const hasError = Boolean(showError);

    if (inputEl) inputEl.classList.toggle('plm-input-invalid', hasError);
    if (errorEl) errorEl.style.display = hasError ? 'block' : 'none';
}

function validatePlmItemCodeInput(rawValue = null) {
    const inputEl = document.getElementById('plm-input-item-id');
    const currentValue = rawValue == null
        ? String(inputEl && inputEl.value ? inputEl.value : '')
        : String(rawValue);

    const normalized = normalizePlmItemCode(currentValue);
    const hasDuplicate = normalized
        ? hasExistingPlmItemCode(normalized, String(plmEditingItemId || '').trim())
        : false;

    setPlmItemCodeErrorState(hasDuplicate);
    return !hasDuplicate;
}

function isPlmItemModalOpen() {
    const modal = document.getElementById('plm-item-modal');
    return Boolean(modal && modal.style.display !== 'none');
}

function isPlmBuloneriaModalOpen() {
    const modal = document.getElementById('plm-buloneria-modal');
    return Boolean(modal && modal.style.display !== 'none');
}

function syncBodyScrollForPlmModals() {
    document.body.style.overflow = (isPlmItemModalOpen() || isPlmBuloneriaModalOpen()) ? 'hidden' : '';
}

function ensurePlmItemModalRoot() {
    const modal = document.getElementById('plm-item-modal');
    if (!modal) return null;

    if (!plmItemModalMovedToBody && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
        plmItemModalMovedToBody = true;
    }

    return modal;
}

function openPlmItemModal(keepCurrentValues = false) {
    if (!keepCurrentValues) {
        clearPlmFormInputs();
        resetPlmEditMode();
    }

    const modal = ensurePlmItemModalRoot();
    if (!modal) return;

    setPlmPrimaryActionButton();
    modal.style.display = 'flex';
    syncBodyScrollForPlmModals();

    const itemIdEl = document.getElementById('plm-input-item-id');
    if (itemIdEl) {
        window.setTimeout(() => itemIdEl.focus(), 0);
    }
}

function closePlmItemModal(resetForm = true) {
    const modal = document.getElementById('plm-item-modal');
    if (!modal) return;

    modal.style.display = 'none';
    syncBodyScrollForPlmModals();

    if (resetForm) {
        clearPlmFormInputs();
        resetPlmEditMode();
    }
}

function handlePlmItemModalBackdrop(event) {
    const target = event && event.target;
    if (!target) return;

    if (target.id === 'plm-item-modal') {
        closePlmItemModal();
    }
}

function forceRefreshPlmEntryUi() {
    const openBtn = document.getElementById('plm-open-item-modal-btn');
    if (openBtn) {
        openBtn.disabled = false;
        openBtn.onclick = (event) => {
            if (event) event.preventDefault();
            openPlmItemModal();
        };
    }

    const openBulBtn = document.getElementById('plm-open-buloneria-modal-btn');
    if (openBulBtn) {
        openBulBtn.disabled = false;
        openBulBtn.onclick = (event) => {
            if (event) event.preventDefault();
            openPlmBuloneriaModal();
        };
    }

    ensurePlmItemModalRoot();
    ensurePlmBuloneriaModalRoot();
    closePlmItemModal(false);
    closePlmBuloneriaModal(false);

    setPlmPrimaryActionButton();
}

function queuePlmEntryUiRefresh() {
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            forceRefreshPlmEntryUi();
        });
    });
}

function ensurePlmBuloneriaModalRoot() {
    const modal = document.getElementById('plm-buloneria-modal');
    if (!modal) return null;

    if (!plmBuloneriaModalMovedToBody && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
        plmBuloneriaModalMovedToBody = true;
    }

    return modal;
}

function getCurrentBuloneriaCategory() {
    const catalog = getPlmBuloneriaCatalog();
    const fallback = PLM_BULONERIA_CATEGORIES[0] ? PLM_BULONERIA_CATEGORIES[0].id : '';
    const activeId = String(plmBuloneriaActiveCategory || fallback).trim();
    return catalog[activeId] || catalog[fallback] || null;
}

function getFilteredBuloneriaItems(category) {
    if (!category) return [];
    const query = String(plmBuloneriaSearchText || '').trim().toLowerCase();
    if (!query) return category.items;

    return category.items.filter((item) => {
        const haystack = `${item.item_id} ${item.name} ${item.description}`.toLowerCase();
        return haystack.includes(query);
    });
}

function buildPlmBuloneriaKeyByCodeMap() {
    const catalog = getPlmBuloneriaCatalog();
    const map = new Map();

    Object.values(catalog).forEach((category) => {
        const items = Array.isArray(category && category.items) ? category.items : [];
        items.forEach((item) => {
            const normalizedCode = normalizePlmItemCode(item && item.item_id ? item.item_id : '');
            const key = String(item && item.key ? item.key : '').trim();
            if (!normalizedCode || !key || map.has(normalizedCode)) return;
            map.set(normalizedCode, key);
        });
    });

    return map;
}

function syncPlmBuloneriaSelectionWithWorkspace() {
    plmBuloneriaSelectedKeys.clear();
    if (!currentWorkspaceProject) return;

    const keyByCode = buildPlmBuloneriaKeyByCodeMap();
    currentWorkspaceProject.plm_items.forEach((item) => {
        const category = String(item && item.category ? item.category : '').trim().toLowerCase();
        if (category !== 'buloneria') return;

        const normalizedCode = normalizePlmItemCode(item && item.item_id ? item.item_id : '');
        const key = keyByCode.get(normalizedCode);
        if (key) plmBuloneriaSelectedKeys.add(key);
    });
}

function refreshPlmBuloneriaSelectionCount() {
    const countEl = document.getElementById('plm-buloneria-selected-count');
    if (countEl) {
        const total = plmBuloneriaSelectedKeys.size;
        countEl.textContent = `${total} seleccionado${total === 1 ? '' : 's'}`;
    }

    const insertBtn = document.getElementById('plm-buloneria-insert-btn');
    if (insertBtn) {
        insertBtn.disabled = plmBuloneriaSelectedKeys.size <= 0;
    }
}

function renderPlmBuloneriaCategories() {
    const container = document.getElementById('plm-buloneria-categories');
    if (!container) return;

    const catalog = getPlmBuloneriaCatalog();
    const categories = PLM_BULONERIA_CATEGORIES
        .map((meta) => catalog[meta.id])
        .filter(Boolean);

    container.innerHTML = categories.map((category) => {
        const active = String(category.id) === String(plmBuloneriaActiveCategory) ? ' active' : '';
        const count = category.items.length;
        return `
            <button type="button" class="btn plm-buloneria-category-btn${active}" onclick="setPlmBuloneriaCategory('${category.id}')">
                ${escapeHtml(category.label)}
                <span style="opacity:0.75; margin-left:6px;">(${count})</span>
            </button>
        `;
    }).join('');

}


function renderPlmBuloneriaItems() {
    const listEl = document.getElementById('plm-buloneria-items-list');
    const labelEl = document.getElementById('plm-buloneria-active-category-label');
    if (!listEl) return;

    const category = getCurrentBuloneriaCategory();
    if (!category) {
        listEl.innerHTML = '<div class="plm-buloneria-empty">No hay categorias disponibles.</div>';
        return;
    }

    if (labelEl) labelEl.textContent = category.label;

    const rows = getFilteredBuloneriaItems(category);
    if (!rows.length) {
        listEl.innerHTML = '<div class="plm-buloneria-empty">Sin coincidencias para la busqueda actual.</div>';
        refreshPlmBuloneriaSelectionCount();
        return;
    }

    listEl.innerHTML = rows.map((item) => {
        const checked = plmBuloneriaSelectedKeys.has(item.key) ? 'checked' : '';
        return `
            <label class="plm-buloneria-item-row">
                <span class="plm-buloneria-item-check-wrap">
                    <input type="checkbox" class="plm-buloneria-item-check" data-item-key="${escapeHtml(item.key)}" ${checked} onchange="togglePlmBuloneriaItemSelection(this.dataset.itemKey, this.checked)">
                </span>
                <span>
                    <div class="plm-buloneria-item-title">${escapeHtml(item.name)}</div>
                    <div class="plm-buloneria-item-meta">${escapeHtml(item.item_id)} | ${escapeHtml(item.description)}</div>
                </span>
            </label>
        `;
    }).join('');

    refreshPlmBuloneriaSelectionCount();
}

function setPlmBuloneriaCategory(categoryId) {
    plmBuloneriaActiveCategory = String(categoryId || '').trim() || plmBuloneriaActiveCategory;
    renderPlmBuloneriaCategories();
    renderPlmBuloneriaItems();
}

function updatePlmBuloneriaSearch(rawValue) {
    plmBuloneriaSearchText = String(rawValue || '').trim();
    renderPlmBuloneriaItems();
}

function togglePlmBuloneriaItemSelection(itemKey, isChecked) {
    const key = String(itemKey || '').trim();
    if (!key) return;

    if (Boolean(isChecked)) plmBuloneriaSelectedKeys.add(key);
    else plmBuloneriaSelectedKeys.delete(key);

    refreshPlmBuloneriaSelectionCount();
}

function resetPlmBuloneriaModalSelection() {
    syncPlmBuloneriaSelectionWithWorkspace();
    plmBuloneriaSearchText = '';
    plmBuloneriaActiveCategory = PLM_BULONERIA_CATEGORIES[0] ? PLM_BULONERIA_CATEGORIES[0].id : '';

    const searchEl = document.getElementById('plm-buloneria-search');
    if (searchEl) searchEl.value = '';
}

function openPlmBuloneriaModal(resetSelection = true) {
    const modal = ensurePlmBuloneriaModalRoot();
    if (!modal) return;

    if (resetSelection) {
        resetPlmBuloneriaModalSelection();
    }

    renderPlmBuloneriaCategories();
    renderPlmBuloneriaItems();

    modal.style.display = 'flex';
    syncBodyScrollForPlmModals();
}

function closePlmBuloneriaModal(resetSelection = true) {
    const modal = document.getElementById('plm-buloneria-modal');
    if (!modal) return;

    modal.style.display = 'none';
    if (resetSelection) {
        resetPlmBuloneriaModalSelection();
    }
    syncBodyScrollForPlmModals();
}

function handlePlmBuloneriaModalBackdrop(event) {
    const target = event && event.target;
    if (!target) return;

    if (target.id === 'plm-buloneria-modal') {
        closePlmBuloneriaModal();
    }
}

function getSelectedBuloneriaItems() {
    if (!plmBuloneriaSelectedKeys.size) return [];

    const catalog = getPlmBuloneriaCatalog();
    const map = new Map();
    Object.values(catalog).forEach((category) => {
        category.items.forEach((item) => map.set(item.key, item));
    });

    return Array.from(plmBuloneriaSelectedKeys)
        .map((key) => map.get(String(key)))
        .filter(Boolean);
}

async function insertSelectedBuloneriaToPlm() {
    if (!currentWorkspaceProject) return;

    const selectedItems = getSelectedBuloneriaItems();
    if (!selectedItems.length) {
        notifyProject('Seleccione al menos un item de buloneria.', 'error');
        return;
    }

    const existingCodes = new Set(
        currentWorkspaceProject.plm_items
            .map((item) => normalizePlmItemCode(item && item.item_id ? item.item_id : ''))
            .filter(Boolean)
    );
    const itemsToInsert = selectedItems.filter((item) => {
        const code = normalizePlmItemCode(item && item.item_id ? item.item_id : '');
        return code && !existingCodes.has(code);
    });
    if (!itemsToInsert.length) {
        notifyProject('Los items seleccionados ya estan cargados en PLM.', 'error');
        return;
    }

    const baseIndex = currentWorkspaceProject.plm_items.length;
    itemsToInsert.forEach((item, idx) => {
        const position = getLooseNodeSpawnPosition(baseIndex + idx, baseIndex + itemsToInsert.length + 1);
        currentWorkspaceProject.plm_items.push({
            id: `plm-${Date.now()}-${idx}`,
            item_id: item.item_id,
            name: item.name,
            description: item.description,
            revision: item.revision || 'A',
            status: 'Activo',
            drawing: '',
            cad: '',
            notes: item.notes || 'Buloneria',
            category: 'Buloneria',
            x: position.x,
            y: position.y
        });
    });

    closePlmBuloneriaModal(true);
    renderPlmTable();
    renderBomClassificationTable();
    renderBomGraph();
    updateWorkspaceKPIs();
    await persistCurrentWorkspace(true);

    notifyProject(`Se agregaron ${itemsToInsert.length} items de buloneria.`, 'success');
}

function getPlmFilePickerElements(kind) {
    const isDrawing = String(kind || '').trim().toLowerCase() === 'drawing';
    return {
        input: document.getElementById(isDrawing ? 'plm-input-drawing' : 'plm-input-cad'),
        button: document.getElementById(isDrawing ? 'plm-input-drawing-btn' : 'plm-input-cad-btn'),
        defaultLabel: isDrawing ? 'Seleccionar Plano' : 'Seleccionar CAD',
        selectedLabel: isDrawing ? 'Plano Seleccionado' : 'CAD Seleccionado'
    };
}

async function triggerPlmFilePicker(kind) {
    const normalized = String(kind || '').trim().toLowerCase();
    const picker = getPlmFilePickerElements(normalized);

    if (picker.input) picker.input.click();
}

function updatePlmFileButtonState(kind) {
    const picker = getPlmFilePickerElements(kind);
    if (!picker.button) return;

    const normalized = String(kind || '').trim().toLowerCase();
    const hasFile = normalized === 'cad'
        ? Boolean(String(plmSelectedCadShortcut || '').trim()) || Boolean(picker.input && picker.input.files && picker.input.files.length)
        : Boolean(String(plmSelectedDrawingShortcut || '').trim()) || Boolean(picker.input && picker.input.files && picker.input.files.length);

    picker.button.textContent = hasFile ? picker.selectedLabel : picker.defaultLabel;
    picker.button.classList.toggle('is-selected', hasFile);
}

function resetPlmFileButtonStates() {
    updatePlmFileButtonState('drawing');
    updatePlmFileButtonState('cad');
}

function clearPlmFormInputs() {
    const itemIdEl = document.getElementById('plm-input-item-id');
    const nameEl = document.getElementById('plm-input-name');
    const descEl = document.getElementById('plm-input-description');
    const revEl = document.getElementById('plm-input-revision');
    const drawingEl = document.getElementById('plm-input-drawing');
    const cadEl = document.getElementById('plm-input-cad');

    if (itemIdEl) itemIdEl.value = '';
    if (nameEl) nameEl.value = '';
    if (descEl) descEl.value = '';
    if (revEl) revEl.value = '';
    if (drawingEl) drawingEl.value = '';
    if (cadEl) cadEl.value = '';

    plmSelectedCadShortcut = '';
    plmSelectedDrawingShortcut = '';
    resetPlmFileButtonStates();
    setPlmItemCodeErrorState(false);
}

function resetPlmEditMode() {
    plmEditingItemId = '';
    setPlmPrimaryActionButton();
}

function getPlmStatusToneClass(status) {
    const normalized = String(status || '').trim().toLowerCase();

    if (normalized === 'activo') return 'plm-status-badge-active';
    if (normalized.includes('revisi')) return 'plm-status-badge-review';
    if (normalized === 'obsoleto') return 'plm-status-badge-obsolete';
    return 'plm-status-badge-neutral';
}

function normalizeShortcutTarget(rawPath) {
    const value = String(rawPath || '').trim();
    if (!value) return '';

    if (/^(https?:|file:\/\/)/i.test(value)) return value;

    if (value.startsWith('\\')) {
        return `file://${value.replace(/\\/g, '/')}`;
    }

    if (/^[a-zA-Z]:\\/.test(value)) {
        return `file:///${value.replace(/\\/g, '/')}`;
    }

    return value;
}

function setPlmOpenButtonLoading(button, isLoading) {
    if (!button || !(button instanceof HTMLElement)) return;

    const active = Boolean(isLoading);

    if (active) {
        if (!button.dataset.loadingWidth) {
            button.dataset.loadingWidth = `${Math.ceil(button.getBoundingClientRect().width)}px`;
        }
        button.style.width = button.dataset.loadingWidth;
    } else {
        button.style.width = '';
        delete button.dataset.loadingWidth;
    }

    button.classList.toggle('btn-loading', active);
    button.disabled = active;
    button.setAttribute('aria-busy', active ? 'true' : 'false');
}

function openPlmFileShortcut(rawPath, label = 'Archivo', triggerBtn = null) {
    const source = String(rawPath || '').trim();
    if (!source) {
        notifyProject(`No hay acceso directo cargado para ${label}.`, 'error');
        return;
    }

    const isCad = String(label || '').trim().toLowerCase() === 'cad';

    if (isCad) {
        const loadingStartedAt = Date.now();
        setPlmOpenButtonLoading(triggerBtn, true);
        const finishLoading = () => {
            const elapsedMs = Date.now() - loadingStartedAt;
            const waitMs = Math.max(0, CAD_OPEN_LOADING_MIN_MS - elapsedMs);
            window.setTimeout(() => setPlmOpenButtonLoading(triggerBtn, false), waitMs);
        };

        const openByServer = () => fetch('/api/plm-open-cad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shortcut: source })
        }).then(async (response) => {
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || String(payload.status || '').toLowerCase() !== 'success') {
                throw new Error(String(payload.message || 'No se pudo abrir CAD.'));
            }
        });

        if (USE_LOCAL_CAD_HELPER) {
            callLocalCadHelper('/open-file', { shortcut: source }, 20000)
                .then((helper) => {
                    if (helper.ok && String(helper.data && helper.data.status || '').toLowerCase() === 'success') {
                        return;
                    }
                    return openByServer();
                })
                .catch(() => openByServer())
                .catch((error) => {
                    notifyProject(String(error && error.message || 'No se pudo abrir CAD.'), 'error');
                })
                .finally(finishLoading);
            return;
        }

        openByServer()
            .catch((error) => {
                notifyProject(String(error && error.message || 'No se pudo abrir CAD.'), 'error');
            })
            .finally(finishLoading);
        return;
    }

    const target = normalizeShortcutTarget(source);
    if (!target) {
        notifyProject(`No se pudo resolver el acceso directo de ${label}.`, 'error');
        return;
    }

    try {
        const popup = window.open(target, '_blank', 'noopener,noreferrer');
        if (popup) {
            try { popup.opener = null; } catch (_) {}
        }
    } catch (error) {
        notifyProject(`No se pudo abrir ${label}.`, 'error');
    }
}



function startPlmItemEdit(index) {
    if (!currentWorkspaceProject) return;
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= currentWorkspaceProject.plm_items.length) return;

    const item = currentWorkspaceProject.plm_items[idx];
    if (!item) return;

    const itemIdEl = document.getElementById('plm-input-item-id');
    const nameEl = document.getElementById('plm-input-name');
    const descEl = document.getElementById('plm-input-description');
    const revEl = document.getElementById('plm-input-revision');
    const drawingEl = document.getElementById('plm-input-drawing');
    const cadEl = document.getElementById('plm-input-cad');

    if (itemIdEl) itemIdEl.value = String(item.item_id || '');
    if (nameEl) nameEl.value = String(item.name || '');
    if (descEl) descEl.value = String(item.description || '');
    if (revEl) revEl.value = String(item.revision || '');
    if (drawingEl) drawingEl.value = '';
    if (cadEl) cadEl.value = '';

    plmSelectedCadShortcut = String(item.cad || '').trim();
    plmSelectedDrawingShortcut = String(item.drawing || '').trim();
    resetPlmFileButtonStates();

    plmEditingItemId = String(item.id || '');
    setPlmPrimaryActionButton();

    openPlmItemModal(true);
    validatePlmItemCodeInput(item.item_id || '');

    if (itemIdEl) {
        window.setTimeout(() => itemIdEl.focus(), 0);
    }
}

function renderPlmTable() {
    const tbody = document.getElementById('plm-items-body');
    if (!tbody || !currentWorkspaceProject) return;

    const rows = currentWorkspaceProject.plm_items;
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center plm-empty">No hay piezas cargadas.</td></tr>';
        setPlmPrimaryActionButton();
        return;
    }

    const plmSearchInput = document.getElementById('plm-items-search');
    if (plmSearchInput && plmSearchInput.value !== getWorkspaceSearchQuery('plm')) plmSearchInput.value = getWorkspaceSearchQuery('plm');

    tbody.innerHTML = rows.map((item, idx) => {
        const revision = String(item.revision || 'A').trim() || 'A';
        const status = String(item.status || 'Activo').trim() || 'Activo';
        const drawing = String(item.drawing || '').trim();
        const cad = String(item.cad || '').trim();

        const drawingJs = JSON.stringify(drawing);
        const cadJs = JSON.stringify(cad);

        const drawingHtml = drawing
            ? `<button type="button" class="btn btn-sm" onclick='openPlmFileShortcut(${drawingJs}, "Plano")'>Abrir</button>`
            : '-';

        const cadHtml = cad
            ? `<button type="button" class="btn btn-sm" disabled title="Apertura CAD pausada temporalmente">Pausado</button>`
            : '-';

        return `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${escapeHtml(item.item_id || '-')}</td>
                <td>${escapeHtml(item.name || '-')}</td>
                <td>${escapeHtml(item.description || '-')}</td>
                <td><span class="plm-meta-badge plm-revision-badge">${escapeHtml(revision)}</span></td>
                <td><span class="plm-meta-badge ${getPlmStatusToneClass(status)}">${escapeHtml(status)}</span></td>
                <td>${drawingHtml}</td>
                <td>${cadHtml}</td>
                <td><button type="button" class="btn btn-sm" onclick="startPlmItemEdit(${idx})">Modificar</button></td>
            </tr>
        `;
    }).join('');

    applySearchToTbody(tbody, getWorkspaceSearchQuery('plm'), 9, 'No hay piezas coincidentes.');
    setPlmPrimaryActionButton();
}

function getBomContextRecordsByNodeId() {
    const assignments = new Map();
    if (!currentWorkspaceProject) return assignments;

    const nodeById = new Map();
    nodeById.set('core', {
        id: 'core',
        item_id: 'CORE',
        name: 'Cuerpo Terminado',
        branch_name: 'Cuerpo Terminado',
        x: 0,
        y: 0
    });

    getActiveBomGraphNodes().forEach((item) => {
        nodeById.set(String(item.id), item);
    });

    const baseContext = { conjunto: '', sub1: '', sub11: '', __qty: 1, __edgeId: '', __parentId: '', __pathKey: 'core' };

    const applyNodeToContext = (ctx, node) => {
        const next = { ...ctx };
        if (!node) return next;

        const category = getBomCategory(node);
        const label = getPartBranchLabel(node);

        if (category === 'Conjunto') {
            next.conjunto = label;
            next.sub1 = '';
            next.sub11 = '';
        } else if (category === 'Subconjunto 1') {
            next.sub1 = label;
            next.sub11 = '';
        } else if (category === 'Subconjunto 1.1') {
            next.sub11 = label;
        }

        return next;
    };

    const memo = new Map();
    const resolving = new Set();

    const dedupeContexts = (contexts = []) => {
        const out = [];
        const seen = new Set();
        contexts.forEach((ctx) => {
            const key = `${ctx.conjunto || ''}|${ctx.sub1 || ''}|${ctx.sub11 || ''}|${ctx.__edgeId || ''}|${normalizeBomQuantity(ctx.__qty, 1)}|${ctx.__pathKey || ''}`;
            if (seen.has(key)) return;
            seen.add(key);
            out.push(ctx);
        });
        return out;
    };

    const resolveContexts = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId) return [baseContext];
        if (memo.has(nodeId)) return memo.get(nodeId);
        if (nodeId === 'core') {
            memo.set('core', [baseContext]);
            return memo.get('core');
        }
        if (resolving.has(nodeId)) return [baseContext];

        resolving.add(nodeId);

        const incomingEdges = getIncomingBomEdges(nodeId)
            .filter((edge) => {
                const parentId = String(edge && edge.source_id ? edge.source_id : '').trim();
                return parentId === 'core' || nodeById.has(parentId);
            });

        const parentContexts = [];
        if (!incomingEdges.length) {
            parentContexts.push({ ...baseContext });
        } else {
            incomingEdges.forEach((edge) => {
                const parentId = String(edge.source_id || '').trim();
                const parentNode = nodeById.get(parentId);
                const upstreamContexts = resolveContexts(parentId);
                upstreamContexts.forEach((ctx) => {
                    const next = applyNodeToContext(ctx, parentNode);
                    const parentPathQty = normalizeBomQuantity(ctx && ctx.__qty ? ctx.__qty : 1, 1);
                    const edgeQty = normalizeBomQuantity(edge.quantity, 1);
                    const parentSpecialCfg = parentId && parentId !== 'core'
                        ? getBomSpecialConfigByNodeId(parentId)
                        : { enabled: false };
                    // Si el padre es Especial, la multiplicacion no arrastra ancestros:
                    // el calculo reinicia desde este tramo.
                    const inheritedQty = parentSpecialCfg.enabled ? 1 : parentPathQty;
                    next.__qty = normalizeBomQuantity(inheritedQty * edgeQty, 1);
                    next.__edgeId = String(edge.id || '').trim();
                    next.__parentId = parentId;
                    const prevPathKey = String(ctx && ctx.__pathKey ? ctx.__pathKey : 'core').trim() || 'core';
                    next.__pathKey = `${prevPathKey}>${next.__edgeId || `${parentId}->${nodeId}`}`;
                    parentContexts.push(next);
                });
            });
        }

        const currentNode = nodeById.get(nodeId);
        const finalContexts = dedupeContexts(parentContexts.map((ctx) => {
            const next = applyNodeToContext(ctx, currentNode);
            next.__qty = normalizeBomQuantity(ctx.__qty, 1);
            next.__edgeId = String(ctx.__edgeId || '').trim();
            next.__parentId = String(ctx.__parentId || '').trim();
            next.__pathKey = String(ctx.__pathKey || 'core').trim() || 'core';
            return next;
        }));

        resolving.delete(nodeId);
        memo.set(nodeId, finalContexts.length ? finalContexts : [{ ...baseContext }]);
        return memo.get(nodeId);
    };

    getActiveBomGraphNodes().forEach((item) => {
        const nodeId = String(item && item.id ? item.id : '').trim();
        if (!nodeId) return;
        assignments.set(nodeId, resolveContexts(nodeId));
    });

    return assignments;
}

function getBomClassificationMap() {
    const records = getBomContextRecordsByNodeId();
    const out = new Map();
    records.forEach((list, nodeId) => {
        const first = Array.isArray(list) && list.length ? list[0] : { conjunto: '', sub1: '', sub11: '' };
        out.set(String(nodeId), {
            conjunto: String(first.conjunto || '').trim(),
            sub1: String(first.sub1 || '').trim(),
            sub11: String(first.sub11 || '').trim()
        });
    });
    return out;
}

function getBomRowsOrderedByBranch(rows) {
    const items = Array.isArray(rows) ? rows : [];
    if (!items.length || !currentWorkspaceProject) return items;

    const nodeById = new Map(items.map((item) => [String(item.id), item]));
    const parentByChild = new Map();
    const childrenByParent = new Map();

    items.forEach((item) => {
        const childId = String(item.id || '').trim();
        const edge = getPrimaryIncomingBomEdge(childId);
        if (!edge) return;

        const parentId = String(edge.source_id || '').trim();
        if (!parentId) return;
        if (parentId !== 'core' && !nodeById.has(parentId)) return;

        parentByChild.set(childId, parentId);
        const list = childrenByParent.get(parentId) || [];
        list.push(childId);
        childrenByParent.set(parentId, list);
    });

    const categoryOrder = {
        'Conjunto': 0,
        'Subconjunto 1': 1,
        'Subconjunto 1.1': 2,
        'Piezas': 3,
        'Buloneria': 4,
        'Sin categoria': 5
    };

    const sortIds = (ids) => {
        return ids.slice().sort((aId, bId) => {
            const a = nodeById.get(String(aId));
            const b = nodeById.get(String(bId));
            const aCat = a ? getBomCategory(a) : 'Sin categoria';
            const bCat = b ? getBomCategory(b) : 'Sin categoria';
            const aRank = Object.prototype.hasOwnProperty.call(categoryOrder, aCat) ? categoryOrder[aCat] : 99;
            const bRank = Object.prototype.hasOwnProperty.call(categoryOrder, bCat) ? categoryOrder[bCat] : 99;

            if (aRank !== bRank) return aRank - bRank;

            const aName = String(a && a.name ? a.name : '').trim();
            const bName = String(b && b.name ? b.name : '').trim();
            const byName = aName.localeCompare(bName, 'es', { sensitivity: 'base' });
            if (byName !== 0) return byName;

            return String(aId).localeCompare(String(bId));
        });
    };

    const visited = new Set();
    const orderedIds = [];

    const walk = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId || visited.has(nodeId) || !nodeById.has(nodeId)) return;

        visited.add(nodeId);
        orderedIds.push(nodeId);

        const children = sortIds(childrenByParent.get(nodeId) || []);
        children.forEach((childId) => walk(childId));
    };

    const coreChildren = sortIds(childrenByParent.get('core') || []);
    coreChildren.forEach((id) => walk(id));

    const additionalRoots = sortIds(items
        .map((item) => String(item.id))
        .filter((id) => !visited.has(id) && !parentByChild.has(id)));
    additionalRoots.forEach((id) => walk(id));

    const leftovers = sortIds(items
        .map((item) => String(item.id))
        .filter((id) => !visited.has(id)));
    leftovers.forEach((id) => walk(id));

    return orderedIds.map((id) => nodeById.get(id)).filter(Boolean);
}

function cloneBomVariantSelectionMap(sourceMap = {}, allowedItemIdsRaw = null) {
    const source = sourceMap && typeof sourceMap === 'object' ? sourceMap : {};
    const allowedSet = Array.isArray(allowedItemIdsRaw)
        ? new Set(allowedItemIdsRaw.map((id) => String(id || '').trim()).filter(Boolean))
        : null;

    const out = {};
    Object.keys(source).forEach((rawItemId) => {
        const itemId = String(rawItemId || '').trim();
        if (!itemId) return;
        if (allowedSet && !allowedSet.has(itemId)) return;

        const cfg = source[rawItemId] && typeof source[rawItemId] === 'object' ? source[rawItemId] : {};
        const explicitCfg = cfg.__explicit && typeof cfg.__explicit === 'object' ? cfg.__explicit : {};
        const materiaPrima = normalizeBomVariantSelectionValue(cfg.materia_prima || cfg.category || '');
        const tipoMp = normalizeBomVariantSelectionValue(cfg.tipo_mp || cfg.mp_type || '');
        const material = normalizeBomVariantSelectionValue(cfg.material || cfg.mp_material || '');
        const proveedor = normalizeBomVariantSelectionValue(cfg.proveedor || cfg.provider || '');

        out[itemId] = {
            materia_prima: materiaPrima,
            tipo_mp: tipoMp,
            material,
            proveedor,
            __explicit: {
                materia_prima: Boolean(explicitCfg.materia_prima) && Boolean(materiaPrima),
                tipo_mp: Boolean(explicitCfg.tipo_mp) && Boolean(tipoMp),
                material: Boolean(explicitCfg.material) && Boolean(material),
                proveedor: Boolean(explicitCfg.proveedor) && Boolean(proveedor)
            }
        };
    });

    return out;
}

function getActiveBomVariantSelectionMap() {
    if (!currentWorkspaceProject) return {};

    const version = getActiveBomVersion();
    if (version) {
        if (!version.bom_variant_selection || typeof version.bom_variant_selection !== 'object') {
            version.bom_variant_selection = {};
        }
        return version.bom_variant_selection;
    }

    if (!currentWorkspaceProject.bom_variant_selection || typeof currentWorkspaceProject.bom_variant_selection !== 'object') {
        currentWorkspaceProject.bom_variant_selection = {};
    }
    return currentWorkspaceProject.bom_variant_selection;
}

function getBomVariantOptionsForItem(itemIdRaw) {
    const itemId = String(itemIdRaw || '').trim();
    if (!itemId) return [];

    const supplierMap = getErpHomeSupplierNameByIdMap();
    return getErpItemDiagramRows(itemId)
        .map((row) => {
            const rowId = String(row && row.id ? row.id : '').trim();
            if (!rowId) return null;

            const materiaPrima = normalizeErpDiagramCategory(row && row.category ? row.category : ERP_UNASSIGNED_CATEGORY);
            const tipoMp = String(row && row.mp_category ? row.mp_category : '').trim() || '-';
            const material = String(row && row.mp_material ? row.mp_material : '').trim() || '-';
            const providerId = String(row && row.provider_id ? row.provider_id : '').trim();
            const proveedor = providerId ? (supplierMap.get(providerId) || providerId) : '-';
            const costTotal = Math.max(0, toNumber(getErpDiagramTotal(row), 0));

            return {
                row_id: rowId,
                materia_prima: materiaPrima || '-',
                tipo_mp: tipoMp,
                material,
                proveedor,
                cost_total: costTotal
            };
        })
        .filter(Boolean);
}


function normalizeBomVariantSelectionValue(raw) {
    const value = String(raw || '').trim();
    if (!value || value === '-') return '';
    return value;
}

function getBomVariantSelectionForItem(itemIdRaw, options = [], withDefaults = true) {
    const itemId = String(itemIdRaw || '').trim();
    const selectionMap = getActiveBomVariantSelectionMap();
    const cfg = selectionMap[itemId] && typeof selectionMap[itemId] === 'object' ? selectionMap[itemId] : {};

    const raw = {
        materia_prima: normalizeBomVariantSelectionValue(cfg.materia_prima || ''),
        tipo_mp: normalizeBomVariantSelectionValue(cfg.tipo_mp || ''),
        material: normalizeBomVariantSelectionValue(cfg.material || ''),
        proveedor: normalizeBomVariantSelectionValue(cfg.proveedor || '')
    };

    if (!withDefaults) {
        return raw;
    }

    return {
        materia_prima: raw.materia_prima || '-',
        tipo_mp: raw.tipo_mp || '-',
        material: raw.material || '-',
        proveedor: raw.proveedor || '-'
    };
}


function getBomVariantExplicitMapForItem(itemIdRaw) {
    const itemId = String(itemIdRaw || '').trim();
    if (!itemId) {
        return { materia_prima: false, tipo_mp: false, material: false, proveedor: false };
    }

    const selectionMap = getActiveBomVariantSelectionMap();
    const cfg = selectionMap[itemId] && typeof selectionMap[itemId] === 'object' ? selectionMap[itemId] : {};
    const explicit = cfg.__explicit && typeof cfg.__explicit === 'object' ? cfg.__explicit : {};

    return {
        materia_prima: Boolean(explicit.materia_prima) && Boolean(normalizeBomVariantSelectionValue(cfg.materia_prima || '')),
        tipo_mp: Boolean(explicit.tipo_mp) && Boolean(normalizeBomVariantSelectionValue(cfg.tipo_mp || '')),
        material: Boolean(explicit.material) && Boolean(normalizeBomVariantSelectionValue(cfg.material || '')),
        proveedor: Boolean(explicit.proveedor) && Boolean(normalizeBomVariantSelectionValue(cfg.proveedor || ''))
    };
}

function getBestBomVariantOption(options = [], selected = null) {
    if (!Array.isArray(options) || !options.length) return null;

    const target = selected && typeof selected === 'object' ? selected : {};
    const materia = String(target.materia_prima || '').trim();
    const tipo = String(target.tipo_mp || '').trim();
    const material = String(target.material || '').trim();
    const proveedor = String(target.proveedor || '').trim();

    const strict = options.find((opt) => String(opt.materia_prima || '').trim() === materia
        && String(opt.tipo_mp || '').trim() === tipo
        && String(opt.material || '').trim() === material
        && String(opt.proveedor || '').trim() === proveedor);
    if (strict) return strict;

    const byMateriaTipoMaterial = options.find((opt) => String(opt.materia_prima || '').trim() === materia
        && String(opt.tipo_mp || '').trim() === tipo
        && String(opt.material || '').trim() === material);
    if (byMateriaTipoMaterial) return byMateriaTipoMaterial;

    const byMateriaTipo = options.find((opt) => String(opt.materia_prima || '').trim() === materia
        && String(opt.tipo_mp || '').trim() === tipo);
    if (byMateriaTipo) return byMateriaTipo;

    const byMaterial = options.find((opt) => String(opt.material || '').trim() === material);
    if (byMaterial) return byMaterial;

    const byMateria = options.find((opt) => String(opt.materia_prima || '').trim() === materia);
    if (byMateria) return byMateria;

    const byTipo = options.find((opt) => String(opt.tipo_mp || '').trim() === tipo);
    if (byTipo) return byTipo;

    const byProveedor = options.find((opt) => String(opt.proveedor || '').trim() === proveedor);
    if (byProveedor) return byProveedor;

    return options[0];
}

function getUniqueBomOptionValues(values = []) {
    const out = [];
    const seen = new Set();
    values.forEach((raw) => {
        const value = String(raw || '').trim() || '-';
        if (seen.has(value)) return;
        seen.add(value);
        out.push(value);
    });
    return out;
}

function filterBomVariantOptions(options = [], selection = null, ignoreFieldRaw = '') {
    if (!Array.isArray(options) || !options.length) return [];

    const target = selection && typeof selection === 'object' ? selection : {};
    const ignoreField = String(ignoreFieldRaw || '').trim();

    const targetMateria = String(target.materia_prima || '').trim();
    const targetTipo = String(target.tipo_mp || '').trim();
    const targetMaterial = String(target.material || '').trim();
    const targetProveedor = String(target.proveedor || '').trim();

    return options.filter((opt) => {
        const materia = String(opt && opt.materia_prima ? opt.materia_prima : '-').trim() || '-';
        const tipo = String(opt && opt.tipo_mp ? opt.tipo_mp : '-').trim() || '-';
        const material = String(opt && opt.material ? opt.material : '-').trim() || '-';
        const proveedor = String(opt && opt.proveedor ? opt.proveedor : '-').trim() || '-';

        if (ignoreField !== 'materia_prima' && targetMateria && materia !== targetMateria) return false;
        if (ignoreField !== 'tipo_mp' && targetTipo && tipo !== targetTipo) return false;
        if (ignoreField !== 'material' && targetMaterial && material !== targetMaterial) return false;
        if (ignoreField !== 'proveedor' && targetProveedor && proveedor !== targetProveedor) return false;
        return true;
    });
}

function buildBomVariantSelectHtml(itemIdRaw, fieldRaw, options = [], selectedValueRaw = '') {
    const itemId = String(itemIdRaw || '').trim();
    const field = String(fieldRaw || '').trim();
    if (!itemId || !field || !Array.isArray(options) || !options.length) return '-';

    const uniqueValues = getUniqueBomOptionValues(options)
        .map((value) => String(value || '').trim())
        .filter(Boolean);
    const hasDashOption = uniqueValues.includes('-');
    const realOptions = uniqueValues.filter((value) => value !== '-');

    const selectedRaw = String(selectedValueRaw || '').trim();
    const selectedValue = (selectedRaw === '-' && hasDashOption)
        ? '-'
        : (realOptions.includes(selectedRaw) ? selectedRaw : '');
    const isUnselected = !selectedValue;

    const itemIdJs = JSON.stringify(itemId);
    const optionHtmlParts = [
        `<option value=""${isUnselected ? ' selected' : ''}>Sin seleccionar</option>`
    ];
    if (hasDashOption) {
        optionHtmlParts.push(`<option value="-"${selectedValue === '-' ? ' selected' : ''}>-</option>`);
    }
    realOptions.forEach((valueRaw) => {
        const value = String(valueRaw || '').trim();
        const selected = value === selectedValue ? ' selected' : '';
        optionHtmlParts.push(`<option value="${escapeHtml(value)}"${selected}>${escapeHtml(value)}</option>`);
    });
    const optionHtml = optionHtmlParts.join('');

    return `<select class="plm-bom-variant-select${isUnselected ? ' is-unselected' : ''}" onchange='updateBomVariantSelection(${itemIdJs}, "${field}", this.value)'>${optionHtml}</select>`;
}

function updateBomVariantSelection(itemIdRaw, fieldRaw, valueRaw) {
    if (!currentWorkspaceProject) return;

    const itemId = String(itemIdRaw || '').trim();
    const field = String(fieldRaw || '').trim();
    if (!itemId || !['materia_prima', 'tipo_mp', 'material', 'proveedor'].includes(field)) return;

    const options = getBomVariantOptionsForItem(itemId);
    const currentRaw = getBomVariantSelectionForItem(itemId, options, false);
    const currentExplicit = getBomVariantExplicitMapForItem(itemId);
    const normalizedIncoming = normalizeBomVariantSelectionValue(valueRaw);

    const next = {
        materia_prima: currentRaw.materia_prima,
        tipo_mp: currentRaw.tipo_mp,
        material: currentRaw.material,
        proveedor: currentRaw.proveedor,
        [field]: normalizedIncoming
    };

    const nextExplicit = {
        materia_prima: Boolean(currentExplicit.materia_prima),
        tipo_mp: Boolean(currentExplicit.tipo_mp),
        material: Boolean(currentExplicit.material),
        proveedor: Boolean(currentExplicit.proveedor),
        [field]: Boolean(normalizedIncoming)
    };

    const filterSelection = {
        materia_prima: (nextExplicit.materia_prima && next.materia_prima) ? next.materia_prima : '',
        tipo_mp: (nextExplicit.tipo_mp && next.tipo_mp) ? next.tipo_mp : '',
        material: (nextExplicit.material && next.material) ? next.material : '',
        proveedor: (nextExplicit.proveedor && next.proveedor) ? next.proveedor : ''
    };

    const materiaScoped = filterBomVariantOptions(options, filterSelection, 'materia_prima');
    const tipoScoped = filterBomVariantOptions(options, filterSelection, 'tipo_mp');
    const materialScoped = filterBomVariantOptions(options, filterSelection, 'material');
    const proveedorScoped = filterBomVariantOptions(options, filterSelection, 'proveedor');

    const materiaAllowed = new Set(getUniqueBomOptionValues((materiaScoped.length ? materiaScoped : options).map((opt) => opt.materia_prima)));
    const tipoAllowed = new Set(getUniqueBomOptionValues((tipoScoped.length ? tipoScoped : options).map((opt) => opt.tipo_mp)));
    const materialAllowed = new Set(getUniqueBomOptionValues((materialScoped.length ? materialScoped : options).map((opt) => opt.material)));
    const proveedorAllowed = new Set(getUniqueBomOptionValues((proveedorScoped.length ? proveedorScoped : options).map((opt) => opt.proveedor)));

    if (next.materia_prima && !materiaAllowed.has(next.materia_prima)) {
        next.materia_prima = '';
        nextExplicit.materia_prima = false;
    }
    if (next.tipo_mp && !tipoAllowed.has(next.tipo_mp)) {
        next.tipo_mp = '';
        nextExplicit.tipo_mp = false;
    }
    if (next.material && !materialAllowed.has(next.material)) {
        next.material = '';
        nextExplicit.material = false;
    }
    if (next.proveedor && !proveedorAllowed.has(next.proveedor)) {
        next.proveedor = '';
        nextExplicit.proveedor = false;
    }

    const selectionMap = getActiveBomVariantSelectionMap();
    const hasAnyValue = Boolean(
        normalizeBomVariantSelectionValue(next.materia_prima)
        || normalizeBomVariantSelectionValue(next.tipo_mp)
        || normalizeBomVariantSelectionValue(next.material)
        || normalizeBomVariantSelectionValue(next.proveedor)
    );
    const hasAnyExplicit = Boolean(nextExplicit.materia_prima || nextExplicit.tipo_mp || nextExplicit.material || nextExplicit.proveedor);

    if (!hasAnyValue && !hasAnyExplicit) {
        delete selectionMap[itemId];
    } else {
        selectionMap[itemId] = {
            materia_prima: next.materia_prima,
            tipo_mp: next.tipo_mp,
            material: next.material,
            proveedor: next.proveedor,
            __explicit: nextExplicit
        };
    }

    touchActiveBomVersion();
    renderBomClassificationTable();
    renderBomGraph();
    renderPlmValuesPanel();
    queueErpDiagramPersist();
}

function getBomVariantUiStateForItem(itemIdRaw) {
    const itemId = String(itemIdRaw || '').trim();
    const fallback = {
        variantOptions: [],
        materiaOptions: ['-'],
        tipoOptions: ['-'],
        materialOptions: ['-'],
        proveedorOptions: ['-'],
        matched: null,
        uiSelection: {
            materia_prima: '-',
            tipo_mp: '-',
            material: '-',
            proveedor: '-'
        }
    };

    if (!itemId) return fallback;

    const variantOptions = getBomVariantOptionsForItem(itemId);
    if (!variantOptions.length) return fallback;

    const selectionRaw = getBomVariantSelectionForItem(itemId, variantOptions, false);
    const explicit = getBomVariantExplicitMapForItem(itemId);
    const fields = ['materia_prima', 'tipo_mp', 'material', 'proveedor'];
    const getFieldOptionSets = (rows = [], field = '') => {
        const unique = getUniqueBomOptionValues(rows.map((opt) => opt && opt[field]))
            .map((value) => String(value || '').trim())
            .filter(Boolean);
        const real = unique.filter((value) => value !== '-');
        return {
            unique,
            real,
            hasDash: unique.includes('-')
        };
    };

    const scopedSelection = {
        materia_prima: explicit.materia_prima ? selectionRaw.materia_prima : '',
        tipo_mp: explicit.tipo_mp ? selectionRaw.tipo_mp : '',
        material: explicit.material ? selectionRaw.material : '',
        proveedor: explicit.proveedor ? selectionRaw.proveedor : ''
    };

    let scopedOptions = variantOptions.slice();
    let stopAuto = false;
    fields.forEach((field) => {
        const explicitValue = String(scopedSelection[field] || '').trim();
        if (explicitValue) {
            scopedOptions = filterBomVariantOptions(scopedOptions, { [field]: explicitValue }, '');
            return;
        }

        if (stopAuto) {
            scopedSelection[field] = '';
            return;
        }

        const sets = getFieldOptionSets(scopedOptions, field);
        if (sets.real.length === 1) {
            scopedSelection[field] = String(sets.real[0] || '').trim();
            scopedOptions = filterBomVariantOptions(scopedOptions, { [field]: scopedSelection[field] }, '');
            return;
        }
        if (!sets.real.length && sets.hasDash) {
            scopedSelection[field] = '-';
            scopedOptions = filterBomVariantOptions(scopedOptions, { [field]: '-' }, '');
            return;
        }

        scopedSelection[field] = '';
        stopAuto = true;
    });

    const materiaScoped = filterBomVariantOptions(variantOptions, scopedSelection, 'materia_prima');
    const tipoScoped = filterBomVariantOptions(variantOptions, scopedSelection, 'tipo_mp');
    const materialScoped = filterBomVariantOptions(variantOptions, scopedSelection, 'material');
    const proveedorScoped = filterBomVariantOptions(variantOptions, scopedSelection, 'proveedor');

    const materiaOptions = getUniqueBomOptionValues((materiaScoped.length ? materiaScoped : variantOptions).map((opt) => opt.materia_prima));
    const tipoOptions = getUniqueBomOptionValues((tipoScoped.length ? tipoScoped : variantOptions).map((opt) => opt.tipo_mp));
    const materialOptions = getUniqueBomOptionValues((materialScoped.length ? materialScoped : variantOptions).map((opt) => opt.material));
    const proveedorOptions = getUniqueBomOptionValues((proveedorScoped.length ? proveedorScoped : variantOptions).map((opt) => opt.proveedor));

    const selectionForMatch = {
        materia_prima: scopedSelection.materia_prima,
        tipo_mp: scopedSelection.tipo_mp,
        material: scopedSelection.material,
        proveedor: scopedSelection.proveedor
    };

    const hasPendingSelection = fields.some((field) => !String(selectionForMatch[field] || '').trim());
    const matched = hasPendingSelection ? null : getBestBomVariantOption(variantOptions, selectionForMatch);
    const uiSelection = {
        materia_prima: String(selectionForMatch.materia_prima || '').trim(),
        tipo_mp: String(selectionForMatch.tipo_mp || '').trim(),
        material: String(selectionForMatch.material || '').trim(),
        proveedor: String(selectionForMatch.proveedor || '').trim()
    };

    return {
        variantOptions,
        materiaOptions,
        tipoOptions,
        materialOptions,
        proveedorOptions,
        matched,
        uiSelection
    };
}

function duplicateBomNode(nodeIdRaw) {
    if (!currentWorkspaceProject) return;
    if (!isBomEditingAllowed(true)) return;

    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId || nodeId === 'core') return;

    const sourceCanonicalId = getBomCanonicalItemId(nodeId);
    const sourceNode = getPartById(sourceCanonicalId) || getPartById(nodeId);
    if (!sourceNode) {
        notifyProject('No se pudo duplicar el nodo seleccionado.', 'error');
        return;
    }

    const duplicates = getEditableBomDuplicateNodes();
    const cloneId = `dup-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const baseX = toNumber(sourceNode.x, 0);
    const baseY = toNumber(sourceNode.y, 0);

    const normalized = normalizeBomDuplicateNode({
        id: cloneId,
        duplicate_source_id: sourceCanonicalId,
        item_id: String(sourceNode.item_id || '').trim(),
        name: String(sourceNode.name || '').trim(),
        description: String(sourceNode.description || '').trim(),
        revision: String(sourceNode.revision || 'A').trim() || 'A',
        status: String(sourceNode.status || 'Activo').trim() || 'Activo',
        drawing: String(sourceNode.drawing || '').trim(),
        cad: String(sourceNode.cad || '').trim(),
        notes: String(sourceNode.notes || '').trim(),
        category: String(sourceNode.category || '').trim(),
        branch_name: String(sourceNode.branch_name || '').trim(),
        bom_special_enabled: normalizeBomSpecialEnabled(sourceNode.bom_special_enabled),
        bom_special_numerator: normalizeBomQuantity(sourceNode.bom_special_numerator, 1),
        bom_special_every: normalizeBomQuantity(sourceNode.bom_special_every, 1),
        x: Math.round(baseX + 42),
        y: Math.round(baseY + 28),
        is_bom_duplicate: true
    }, cloneId);

    if (!normalized) {
        notifyProject('No se pudo duplicar el nodo seleccionado.', 'error');
        return;
    }

    duplicates.push(normalized);

    activeBomNodeId = cloneId;
    bomExpandedNodeIds.clear();
    bomExpandedNodeIds.add(cloneId);

    renderBomClassificationTable();
    renderBomGraph();
    touchActiveBomVersion();
    persistCurrentWorkspace(true);
}

function removeBomDuplicateNode(nodeIdRaw, persist = true) {
    if (!currentWorkspaceProject) return false;
    if (!isBomEditingAllowed(true)) return false;

    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId) return false;

    const duplicates = getEditableBomDuplicateNodes();
    const idx = duplicates.findIndex((item) => String(item && item.id ? item.id : '').trim() === nodeId);
    if (idx < 0) return false;

    duplicates.splice(idx, 1);

    const removedEdgeIds = new Set();
    const edges = getEditableBomEdges();
    for (let i = edges.length - 1; i >= 0; i -= 1) {
        const edge = edges[i];
        const sourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
        const targetId = String(edge && edge.target_id ? edge.target_id : '').trim();
        if (sourceId !== nodeId && targetId !== nodeId) continue;
        removedEdgeIds.add(String(edge && edge.id ? edge.id : '').trim());
        edges.splice(i, 1);
    }

    if (selectedBomSourceId === nodeId) selectedBomSourceId = null;
    if (selectedBomTargetId === nodeId) selectedBomTargetId = null;
    if (activeBomNodeId === nodeId) activeBomNodeId = null;
    if (removedEdgeIds.has(String(selectedBomEdgeId || '').trim())) selectedBomEdgeId = null;
    bomExpandedNodeIds.delete(nodeId);

    renderBomClassificationTable();
    renderBomGraph();
    if (persist) {
        touchActiveBomVersion();
        persistCurrentWorkspace(true);
    }

    return true;
}

function toggleBomNodeDetails(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId || nodeId === 'core') return;

    if (bomExpandedNodeIds.has(nodeId)) {
        bomExpandedNodeIds.delete(nodeId);
    } else {
        bomExpandedNodeIds.clear();
        bomExpandedNodeIds.add(nodeId);
    }

    renderBomGraph();
}

function getBomClassificationGroupedRows() {
    const graphNodes = getActiveBomGraphNodes();
    const contextMap = getBomContextRecordsByNodeId();
    const grouped = new Map();

    const ensureGroup = (canonicalId, canonicalItem) => {
        if (!grouped.has(canonicalId)) {
            const specialConfig = getBomSpecialConfigFromNode(canonicalItem);
            grouped.set(canonicalId, {
                item: canonicalItem,
                conjunto: [],
                sub1: [],
                sub11: [],
                qtyTotal: 0,
                isSpecial: specialConfig.enabled,
                specialNumerator: specialConfig.numerator,
                specialEvery: specialConfig.every,
                sourceNodeIds: []
            });
        }
        return grouped.get(canonicalId);
    };

    graphNodes.forEach((node) => {
        const nodeId = String(node && node.id ? node.id : '').trim();
        if (!nodeId || nodeId === 'core') return;

        const canonicalId = getBomCanonicalItemId(nodeId);
        const canonicalItem = getPartById(canonicalId) || node;
        if (!canonicalItem) return;

        const bucket = ensureGroup(canonicalId, canonicalItem);
        bucket.sourceNodeIds.push(nodeId);

        const isDuplicateNode = Boolean(node && node.is_bom_duplicate);
        const contexts = Array.isArray(contextMap.get(nodeId)) ? contextMap.get(nodeId) : [];
        if (!contexts.length) {
            if (!isDuplicateNode && !bucket.isSpecial) bucket.qtyTotal += 1;
            return;
        }

        contexts.forEach((ctx) => {
            const conjunto = String(ctx && ctx.conjunto ? ctx.conjunto : '').trim();
            const sub1 = String(ctx && ctx.sub1 ? ctx.sub1 : '').trim();
            const sub11 = String(ctx && ctx.sub11 ? ctx.sub11 : '').trim();
            const edgeId = String(ctx && ctx.__edgeId ? ctx.__edgeId : '').trim();
            const qty = normalizeBomQuantity(ctx && ctx.__qty ? ctx.__qty : 1, 1);

            if (conjunto) bucket.conjunto.push(conjunto);
            if (sub1) bucket.sub1.push(sub1);
            if (sub11) bucket.sub11.push(sub11);
            if (bucket.isSpecial) return;
            if (!isDuplicateNode || edgeId) bucket.qtyTotal += qty;
        });
    });

    const dedupe = (arr = []) => Array.from(new Set(arr.map((v) => String(v || '').trim()).filter(Boolean)));

    return Array.from(grouped.values())
        .sort((a, b) => {
            const aConj = dedupe(a.conjunto)[0] || '';
            const bConj = dedupe(b.conjunto)[0] || '';
            const byConj = aConj.localeCompare(bConj, 'es', { sensitivity: 'base' });
            if (byConj !== 0) return byConj;

            const aSub1 = dedupe(a.sub1)[0] || '';
            const bSub1 = dedupe(b.sub1)[0] || '';
            const bySub1 = aSub1.localeCompare(bSub1, 'es', { sensitivity: 'base' });
            if (bySub1 !== 0) return bySub1;

            const aSub11 = dedupe(a.sub11)[0] || '';
            const bSub11 = dedupe(b.sub11)[0] || '';
            const bySub11 = aSub11.localeCompare(bSub11, 'es', { sensitivity: 'base' });
            if (bySub11 !== 0) return bySub11;

            const aLabel = getPartLabel(a.item);
            const bLabel = getPartLabel(b.item);
            return aLabel.localeCompare(bLabel, 'es', { sensitivity: 'base' });
        })
        .map((row) => {
            const item = row.item;
            const category = getBomCategory(item);
            const qtyTotal = row.isSpecial
                ? (Math.max(1, normalizeBomQuantity(row.specialNumerator, 1)) / Math.max(1, normalizeBomQuantity(row.specialEvery, 1)))
                : Math.max(1, Math.round(toNumber(row.qtyTotal, 1)));
            const qtyDisplay = row.isSpecial
                ? `${Math.max(1, normalizeBomQuantity(row.specialNumerator, 1))}/${Math.max(1, normalizeBomQuantity(row.specialEvery, 1))}`
                : String(Math.max(1, Math.round(toNumber(row.qtyTotal, 1))));
            return {
                item,
                itemId: String(item && item.id ? item.id : '').trim(),
                category,
                conjuntoList: dedupe(row.conjunto),
                sub1List: dedupe(row.sub1),
                sub11List: dedupe(row.sub11),
                qtyTotal,
                qtyDisplay
            };
        });
}

function focusBomNodeById(nodeIdRaw, zoomRaw = 0.58) {
    if (!currentWorkspaceProject) return false;

    const requestedId = String(nodeIdRaw || '').trim();
    if (!requestedId || requestedId === 'core') return false;

    const directNode = getPartById(requestedId);
    const canonicalId = getBomCanonicalItemId(requestedId);
    const fallbackNode = getActiveBomGraphNodes().find((node) => {
        const nodeId = String(node && node.id ? node.id : '').trim();
        if (!nodeId || nodeId === 'core') return false;
        return getBomCanonicalItemId(nodeId) === canonicalId;
    }) || null;
    const targetNode = directNode || fallbackNode;

    if (!targetNode) return false;

    const preferredScale = Math.max(0.58, toNumber(zoomRaw, 0.58));
    const nextScale = Math.max(
        bomViewState.minScale,
        Math.min(
            bomViewState.maxScale,
            Math.max(toNumber(bomViewState.scale, preferredScale), preferredScale)
        )
    );

    bomViewState.scale = nextScale;
    bomViewState.panX = -toNumber(targetNode.x, 0) * nextScale;
    bomViewState.panY = -toNumber(targetNode.y, 0) * nextScale;
    activeBomNodeId = String(targetNode.id || requestedId).trim();

    renderBomGraph();
    return true;
}

function renderBomClassificationTable() {
    if (!currentWorkspaceProject) return;

    const titleEl = document.getElementById('plm-bom-panel-title');
    const projectPanel = document.getElementById('plm-bom-project-panel');
    const versionPanel = document.getElementById('plm-bom-version-panel');
    const projectBody = document.getElementById('plm-bom-project-body');
    const versionBody = document.getElementById('plm-bom-version-body');
    const searchProject = document.getElementById('plm-bom-search-project');
    const searchVersion = document.getElementById('plm-bom-search-version');

    const isVersion = isBomVersionContext();
    const query = getWorkspaceSearchQuery('bom');
    const activeBody = isVersion ? versionBody : projectBody;
    const activeColspan = isVersion ? 13 : 7;

    if (titleEl) titleEl.textContent = isVersion ? 'BOM Version' : 'BOM Proyecto';
    if (projectPanel) projectPanel.style.display = isVersion ? 'none' : 'block';
    if (versionPanel) versionPanel.style.display = isVersion ? 'block' : 'none';
    if (searchProject && searchProject.value !== query) searchProject.value = query;
    if (searchVersion && searchVersion.value !== query) searchVersion.value = query;
    if (!activeBody) return;

    const baseItems = getActivePlmItems();
    if (!baseItems.length) {
        activeBody.innerHTML = `<tr><td colspan="${activeColspan}" class="text-center plm-empty">No hay piezas cargadas.</td></tr>`;
        return;
    }

    const rows = getBomClassificationGroupedRows();
    if (!rows.length) {
        activeBody.innerHTML = `<tr><td colspan="${activeColspan}" class="text-center plm-empty">No hay piezas cargadas.</td></tr>`;
        return;
    }
    const conjuntoToneMap = buildBomBranchToneMap(rows, 'conjuntoList', 0);
    const sub1ToneMap = buildBomBranchToneMap(rows, 'sub1List', 3);
    const sub11ToneMap = buildBomBranchToneMap(rows, 'sub11List', 6);

    if (!isVersion) {
        projectBody.innerHTML = rows.map((row) => {
            const nodeIdJs = JSON.stringify(String(row.itemId || ''));
            const nodeActionHtml = row.itemId
                ? `<button type="button" class="btn btn-sm plm-bom-go-btn" onclick='focusBomNodeById(${nodeIdJs})'>Ir</button>`
                : '-';
            const categoryHtml = renderBomBadge(row.category, getBomBadgeTone(row.category));
            const conjuntoHtml = renderBomBranchBadgeList(row.conjuntoList, 'branch-conjunto', conjuntoToneMap);
            const sub1Html = renderBomBranchBadgeList(row.sub1List, 'branch-sub1', sub1ToneMap);
            const sub11Html = renderBomBranchBadgeList(row.sub11List, 'branch-sub11', sub11ToneMap);
            const pieceHtml = (row.category === 'Piezas' || row.category === 'Buloneria')
                ? renderBomPartBadge(row.item, row.category === 'Buloneria' ? 'branch-buloneria' : 'branch-pieza')
                : '-';
            const qtyHtml = `<span class="plm-bom-qty-total">${escapeHtml(String(row.qtyDisplay || row.qtyTotal))}</span>`;

            return `
                <tr>
                    <td class="text-center">${nodeActionHtml}</td>
                    <td>${categoryHtml}</td>
                    <td>${conjuntoHtml}</td>
                    <td>${sub1Html}</td>
                    <td>${sub11Html}</td>
                    <td>${pieceHtml}</td>
                    <td>${qtyHtml}</td>
                </tr>
            `;
        }).join('');

        applySearchToTbody(projectBody, query, 7, 'No hay filas BOM coincidentes.');
        return;
    }

    versionBody.innerHTML = rows.map((row) => {
        const nodeIdJs = JSON.stringify(String(row.itemId || ''));
        const nodeActionHtml = row.itemId
            ? `<button type="button" class="btn btn-sm plm-bom-go-btn" onclick='focusBomNodeById(${nodeIdJs})'>Ir</button>`
            : '-';
        const categoryHtml = renderBomBadge(row.category, getBomBadgeTone(row.category));
        const conjuntoHtml = renderBomBranchBadgeList(row.conjuntoList, 'branch-conjunto', conjuntoToneMap);
        const sub1Html = renderBomBranchBadgeList(row.sub1List, 'branch-sub1', sub1ToneMap);
        const sub11Html = renderBomBranchBadgeList(row.sub11List, 'branch-sub11', sub11ToneMap);
        const pieceHtml = (row.category === 'Piezas' || row.category === 'Buloneria')
            ? renderBomPartBadge(row.item, row.category === 'Buloneria' ? 'branch-buloneria' : 'branch-pieza')
            : '-';
        const qtyHtml = `<span class="plm-bom-qty-total">${escapeHtml(String(row.qtyDisplay || row.qtyTotal))}</span>`;

        const isStructuralRow = isErpStructuralBomCategory(row.category);
        let materiaHtml = '-';
        let tipoHtml = '-';
        let materialHtml = '-';
        let proveedorHtml = '-';
        let unitHtml = '-';
        let totalHtml = '-';

        if (!isStructuralRow) {
            const variantUi = getBomVariantUiStateForItem(row.itemId);
            materiaHtml = buildBomVariantSelectHtml(row.itemId, 'materia_prima', variantUi.materiaOptions, variantUi.uiSelection.materia_prima);
            tipoHtml = buildBomVariantSelectHtml(row.itemId, 'tipo_mp', variantUi.tipoOptions, variantUi.uiSelection.tipo_mp);
            materialHtml = buildBomVariantSelectHtml(row.itemId, 'material', variantUi.materialOptions, variantUi.uiSelection.material);
            proveedorHtml = buildBomVariantSelectHtml(row.itemId, 'proveedor', variantUi.proveedorOptions, variantUi.uiSelection.proveedor);

            const unitCost = variantUi.matched ? Math.max(0, toNumber(variantUi.matched.cost_total, 0)) : null;
            unitHtml = unitCost != null ? `<span class="plm-bom-cost-unit">${escapeHtml(formatMoney(unitCost))}</span>` : '-';
            totalHtml = unitCost != null ? `<span class="plm-bom-cost-total">${escapeHtml(formatMoney(unitCost * row.qtyTotal))}</span>` : '-';
        }

        return `
            <tr>
                <td class="text-center">${nodeActionHtml}</td>
                <td>${categoryHtml}</td>
                <td>${conjuntoHtml}</td>
                <td>${sub1Html}</td>
                <td>${sub11Html}</td>
                <td>${pieceHtml}</td>
                <td>${qtyHtml}</td>
                <td>${materiaHtml}</td>
                <td>${tipoHtml}</td>
                <td>${materialHtml}</td>
                <td>${proveedorHtml}</td>
                <td>${unitHtml}</td>
                <td>${totalHtml}</td>
            </tr>
        `;
    }).join('');

    applySearchToTbody(versionBody, query, 13, 'No hay filas BOM coincidentes.');
}


function renderBomRelationsTable() {
    // Se mantiene para compatibilidad, pero la tabla de relaciones fue removida del layout.
}

function getBomNodeInstanceMeta(nodes = []) {
    const rows = Array.isArray(nodes) ? nodes : [];
    const byCanonical = new Map();

    rows.forEach((node) => {
        const nodeId = String(node && node.id ? node.id : '').trim();
        if (!nodeId || nodeId === 'core') return;
        const canonicalId = getBomCanonicalItemId(nodeId);
        const list = byCanonical.get(canonicalId) || [];
        list.push(nodeId);
        byCanonical.set(canonicalId, list);
    });

    const indexByNodeId = new Map();
    const countByCanonical = new Map();

    byCanonical.forEach((ids, canonicalId) => {
        const ordered = ids.slice().sort((a, b) => {
            if (a === canonicalId && b !== canonicalId) return -1;
            if (b === canonicalId && a !== canonicalId) return 1;
            return a.localeCompare(b);
        });

        countByCanonical.set(canonicalId, ordered.length);
        ordered.forEach((nodeId, idx) => {
            indexByNodeId.set(nodeId, idx + 1);
        });
    });

    return { indexByNodeId, countByCanonical };
}

function renderBomGraph() {
    const host = document.getElementById('plm-bom-graph');
    if (!host || !currentWorkspaceProject) return;

    ensureGraphFullscreenBindings();
    updateGraphMaximizeButtons();
    updateBomEditModeButton();


    const width = Math.max(host.clientWidth || 960, 760);
    const height = Math.max(host.clientHeight || 860, 560);

    host.innerHTML = '';
    host.oncontextmenu = (ev) => ev.preventDefault();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'plm-bom-svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    host.appendChild(svg);

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = '<marker id="plm-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#cf1625" /></marker>';
    svg.appendChild(defs);

    const viewport = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    viewport.setAttribute('class', 'plm-bom-viewport');
    const applyViewportTransform = () => {
        viewport.setAttribute('transform', buildViewportTransform(width, height));
        host.classList.toggle('zoom-boost-lines', toNumber(bomViewState.scale, 1) <= 0.1);
    };
    applyViewportTransform();
    svg.appendChild(viewport);

    let bomWheelZoomRaf = null;
    let bomWheelZoomFactor = 1;
    let bomWheelClientX = 0;
    let bomWheelClientY = 0;

    const flushBomWheelZoom = () => {
        bomWheelZoomRaf = null;
        const factor = toNumber(bomWheelZoomFactor, 1);
        bomWheelZoomFactor = 1;
        if (!Number.isFinite(factor) || factor <= 0) return;

        const world = worldFromClient(bomWheelClientX, bomWheelClientY, host, width, height);
        const prevScale = toNumber(bomViewState.scale, 1);
        const nextScale = Math.max(bomViewState.minScale, Math.min(bomViewState.maxScale, prevScale * factor));
        if (Math.abs(nextScale - prevScale) < 0.0001) return;

        bomViewState.scale = nextScale;

        const rect = host.getBoundingClientRect();
        const sx = bomWheelClientX - rect.left;
        const sy = bomWheelClientY - rect.top;
        bomViewState.panX = sx - (width / 2) - (world.x * nextScale);
        bomViewState.panY = sy - (height / 2) - (world.y * nextScale);
        applyViewportTransform();
    };

    const scheduleBomWheelZoom = (ev) => {
        if (!ev) return;
        ev.preventDefault();
        const factor = ev.deltaY < 0 ? 1.12 : 0.88;
        bomWheelZoomFactor *= factor;
        bomWheelClientX = ev.clientX;
        bomWheelClientY = ev.clientY;
        if (bomWheelZoomRaf != null) return;
        bomWheelZoomRaf = window.requestAnimationFrame(flushBomWheelZoom);
    };

    const activeGraphNodes = getActiveBomGraphNodes();
    const activeEdges = getActiveBomEdges();
    const renderRingRadii = getBomRenderRingRadii();
    const isPerformanceMode = isBomPerformanceModeLocked(activeGraphNodes.length, activeEdges.length);
    const canEditGraph = bomEditModeEnabled && !isPerformanceMode;
    const useStraightEdges = isPerformanceMode || bomEditModeEnabled;

    [renderRingRadii.inner, renderRingRadii.conjunto, renderRingRadii.sub1, renderRingRadii.sub11, renderRingRadii.piezas, renderRingRadii.buloneria].forEach((radius) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '0');
        circle.setAttribute('cy', '0');
        circle.setAttribute('r', String(radius));
        circle.setAttribute('class', 'plm-bom-ring');
        viewport.appendChild(circle);
    });

    BOM_CATEGORIES.forEach((category) => {
        const labelRadius = getCategoryBandMidRadius(category);
        const tone = getBomBadgeTone(category);

        const chip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chip.setAttribute('class', `plm-bom-ring-chip ${tone}`);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(labelRadius));
        label.setAttribute('y', '-8');
        label.setAttribute('class', 'plm-bom-ring-chip-text');
        label.textContent = category;

        chip.appendChild(label);
        viewport.appendChild(chip);

        try {
            const bbox = label.getBBox();
            const padX = 16;
            const padY = 10;
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bg.setAttribute('x', String(bbox.x - padX));
            bg.setAttribute('y', String(bbox.y - padY));
            bg.setAttribute('width', String(bbox.width + (padX * 2)));
            bg.setAttribute('height', String(bbox.height + (padY * 2)));
            bg.setAttribute('rx', '18');
            bg.setAttribute('ry', '18');
            bg.setAttribute('class', 'plm-bom-ring-chip-bg');
            chip.insertBefore(bg, label);
        } catch (_) {
            // Si falla el calculo de caja en algun navegador, se mantiene solo texto.
        }
    });

    const nodes = [{ id: 'core', x: 0, y: 0, item_id: 'CORE', name: 'Cuerpo Terminado', branch_name: 'Cuerpo Terminado' }]
        .concat(activeGraphNodes);

    const nodeById = new Map(nodes.map((n) => [String(n.id), n]));
    const bounds = getNodeRectBounds();
    const obstacleRects = useStraightEdges ? [] : getBomNodeObstacleRects(nodes, bounds, 10);
    const qtyCollisionRects = getBomNodeObstacleRects(nodes, bounds, 0);
    const nodeInstanceMeta = getBomNodeInstanceMeta(nodes);
    const qtyOverlayElements = [];

    activeEdges.forEach((edge) => {
        const src = nodeById.get(String(edge.source_id));
        const dst = nodeById.get(String(edge.target_id));
        if (!src || !dst) return;
        const targetSpecial = getBomSpecialConfigByNodeId(dst.id);
        const isSpecialTarget = Boolean(targetSpecial.enabled);
        const specialQtyWidth = 96;
        const specialQtyHeight = 18;

        const srcPoint = { x: toNumber(src.x, 0), y: toNumber(src.y, 0) };
        const dstPoint = { x: toNumber(dst.x, 0), y: toNumber(dst.y, 0) };
        const srcBounds = { halfWidth: BOM_NODE_HALF_WIDTH, halfHeight: getBomNodeRenderHalfHeight(src) };
        const dstBounds = { halfWidth: BOM_NODE_HALF_WIDTH, halfHeight: getBomNodeRenderHalfHeight(dst) };

        // Visual BOM: flecha desde hijo hacia padre.
        const startPoint = getRectBoundaryPoint(dstPoint, srcPoint, dstBounds);
        const endPoint = getRectBoundaryPoint(srcPoint, dstPoint, srcBounds);

        const routePoints = useStraightEdges
            ? [startPoint, endPoint]
            : buildBomEdgeRoute(
                startPoint,
                endPoint,
                String(edge.source_id || ''),
                String(edge.target_id || ''),
                obstacleRects
            );

        const onSelectEdge = (ev) => {
            ev.stopPropagation();
            selectedBomEdgeId = String(edge.id);
            activeBomNodeId = null;
            scheduleBomGraphRender(false);
        };

        const routePathD = useStraightEdges
            ? `M ${toNumber(startPoint.x, 0)} ${toNumber(startPoint.y, 0)} L ${toNumber(endPoint.x, 0)} ${toNumber(endPoint.y, 0)}`
            : buildBomSmoothPathD(routePoints, 18);

        const hitEdge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitEdge.setAttribute('d', routePathD);
        hitEdge.setAttribute('class', 'plm-bom-edge-hit');
        hitEdge.addEventListener('click', onSelectEdge);
        viewport.appendChild(hitEdge);

        const edgeShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const isSelected = String(edge.id) === String(selectedBomEdgeId);
        edgeShape.setAttribute('d', routePathD);
        edgeShape.setAttribute('class', `plm-bom-edge ${isSelected ? 'selected' : ''}`.trim());
        edgeShape.setAttribute('marker-end', 'url(#plm-arrow)');
        viewport.appendChild(edgeShape);

        const qtyAnchor = resolveBomEdgeQtyAnchor(
            routePoints,
            qtyCollisionRects,
            isSpecialTarget ? (specialQtyWidth / 2) : 14,
            isSpecialTarget ? (specialQtyHeight / 2) : 7
        );
        if (canEditGraph) {
            const qtyFo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
            qtyFo.setAttribute('x', String(toNumber(qtyAnchor.x, 0) - (isSpecialTarget ? (specialQtyWidth / 2) : 14)));
            qtyFo.setAttribute('y', String(toNumber(qtyAnchor.y, 0) - (isSpecialTarget ? (specialQtyHeight / 2) : 7)));
            qtyFo.setAttribute('width', String(isSpecialTarget ? specialQtyWidth : 28));
            qtyFo.setAttribute('height', String(isSpecialTarget ? specialQtyHeight : 14));
            qtyFo.setAttribute('class', 'plm-bom-edge-qty-fo');

            const stopEdgeEvents = (ev) => ev.stopPropagation();
            const qtyWrap = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
            qtyWrap.setAttribute('class', isSpecialTarget ? 'plm-bom-edge-special-wrap' : 'plm-bom-edge-qty-wrap');

            if (isSpecialTarget) {
                const specialLeftInput = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
                specialLeftInput.setAttribute('class', 'plm-bom-edge-special-input');
                specialLeftInput.setAttribute('type', 'number');
                specialLeftInput.setAttribute('min', '1');
                specialLeftInput.setAttribute('step', '1');
                specialLeftInput.setAttribute('inputmode', 'numeric');
                specialLeftInput.value = formatBomQuantity(targetSpecial.numerator);

                const specialSep = document.createElementNS('http://www.w3.org/1999/xhtml', 'span');
                specialSep.setAttribute('class', 'plm-bom-edge-special-sep');
                specialSep.textContent = 'cada';

                const specialRightInput = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
                specialRightInput.setAttribute('class', 'plm-bom-edge-special-input');
                specialRightInput.setAttribute('type', 'number');
                specialRightInput.setAttribute('min', '1');
                specialRightInput.setAttribute('step', '1');
                specialRightInput.setAttribute('inputmode', 'numeric');
                specialRightInput.value = formatBomQuantity(targetSpecial.every);

                [specialLeftInput, specialRightInput].forEach((inputEl) => {
                    inputEl.addEventListener('mousedown', stopEdgeEvents);
                    inputEl.addEventListener('click', stopEdgeEvents);
                    inputEl.addEventListener('dblclick', stopEdgeEvents);
                    inputEl.addEventListener('keydown', stopEdgeEvents);
                });
                specialSep.addEventListener('mousedown', stopEdgeEvents);
                specialSep.addEventListener('click', stopEdgeEvents);

                specialLeftInput.addEventListener('change', () => {
                    updateBomSpecialQuantity(dst.id, 'numerator', specialLeftInput.value, true);
                });
                specialRightInput.addEventListener('change', () => {
                    updateBomSpecialQuantity(dst.id, 'every', specialRightInput.value, true);
                });

                qtyWrap.appendChild(specialLeftInput);
                qtyWrap.appendChild(specialSep);
                qtyWrap.appendChild(specialRightInput);
            } else {
                const qtyInput = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
                qtyInput.setAttribute('class', 'plm-bom-edge-qty-input');
                qtyInput.setAttribute('type', 'number');
                qtyInput.setAttribute('min', '1');
                qtyInput.setAttribute('step', '1');
                qtyInput.setAttribute('inputmode', 'numeric');
                qtyInput.value = formatBomQuantity(edge.quantity);

                qtyInput.addEventListener('mousedown', stopEdgeEvents);
                qtyInput.addEventListener('click', stopEdgeEvents);
                qtyInput.addEventListener('dblclick', stopEdgeEvents);
                qtyInput.addEventListener('keydown', stopEdgeEvents);
                qtyInput.addEventListener('change', () => {
                    updateBomEdgeQuantity(edge.id, qtyInput.value, true);
                });

                qtyWrap.appendChild(qtyInput);
            }

            qtyFo.appendChild(qtyWrap);
            qtyOverlayElements.push(qtyFo);
        } else {
            const qtyValue = isSpecialTarget
                ? `${formatBomQuantity(targetSpecial.numerator)}/${formatBomQuantity(targetSpecial.every)}`
                : formatBomQuantity(edge.quantity);
            const badgeWidth = Math.max(20, Math.min(56, (String(qtyValue).length * 8) + 10));
            const badgeAnchor = resolveBomEdgeQtyAnchor(routePoints, qtyCollisionRects, badgeWidth / 2, 7);
            const qtyBadge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            qtyBadge.setAttribute('class', 'plm-bom-edge-qty-badge');
            qtyBadge.setAttribute('transform', `translate(${toNumber(badgeAnchor.x, 0)}, ${toNumber(badgeAnchor.y, 0)})`);
            qtyBadge.setAttribute('pointer-events', 'none');

            const badgeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            badgeRect.setAttribute('x', String(-(badgeWidth / 2)));
            badgeRect.setAttribute('y', '-7');
            badgeRect.setAttribute('width', String(badgeWidth));
            badgeRect.setAttribute('height', '14');
            badgeRect.setAttribute('rx', '6');
            badgeRect.setAttribute('ry', '6');
            badgeRect.setAttribute('fill', '#120b10');
            badgeRect.setAttribute('stroke', '#cf1625');
            badgeRect.setAttribute('stroke-width', '1');
            qtyBadge.appendChild(badgeRect);

            const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            badgeText.setAttribute('x', '0');
            badgeText.setAttribute('y', '0');
            badgeText.setAttribute('text-anchor', 'middle');
            badgeText.setAttribute('dominant-baseline', 'middle');
            badgeText.setAttribute('fill', '#ffe9ed');
            badgeText.setAttribute('font-size', '10');
            badgeText.textContent = qtyValue;
            qtyBadge.appendChild(badgeText);
            qtyOverlayElements.push(qtyBadge);
        }
    });

    if (bomLinkDragState) {
        const preview = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        preview.setAttribute('x1', String(toNumber(bomLinkDragState.startX, 0)));
        preview.setAttribute('y1', String(toNumber(bomLinkDragState.startY, 0)));
        preview.setAttribute('x2', String(toNumber(bomLinkDragState.currentX, 0)));
        preview.setAttribute('y2', String(toNumber(bomLinkDragState.currentY, 0)));
        preview.setAttribute('class', 'plm-bom-edge-preview');
        preview.setAttribute('marker-end', 'url(#plm-arrow)');
        viewport.appendChild(preview);
    }

    nodes.forEach((node) => {
        const nodeX = toNumber(node.x, 0);
        const nodeY = toNumber(node.y, 0);
        const category = getBomCategory(node);
        const nodeSpecial = getBomSpecialConfigByNodeId(node.id);

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const nodeClasses = ['plm-bom-node'];
        if (node.id === 'core') nodeClasses.push('core');
        if (String(node.id) === String(activeBomNodeId)) nodeClasses.push('active');
        if (category === 'Sin categoria') nodeClasses.push('outside');

        g.setAttribute('transform', `translate(${nodeX}, ${nodeY})`);
        g.setAttribute('class', nodeClasses.join(' '));
        g.style.cursor = 'pointer';

        const subtitleLines = buildBomNodeSubtitleLines(node.name || '', 26, 2);
        const isTwoLineSubtitle = subtitleLines.length > 1;
        const nodeHalfHeight = isTwoLineSubtitle ? (BOM_NODE_HALF_HEIGHT + 10) : BOM_NODE_HALF_HEIGHT;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(-BOM_NODE_HALF_WIDTH));
        rect.setAttribute('y', String(-nodeHalfHeight));
        rect.setAttribute('width', String(BOM_NODE_HALF_WIDTH * 2));
        rect.setAttribute('height', String(nodeHalfHeight * 2));
        rect.setAttribute('rx', '10');
        g.appendChild(rect);

        if (node.id !== 'core' && nodeSpecial.enabled) {
            const specialStar = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            specialStar.setAttribute('x', String(-BOM_NODE_HALF_WIDTH + 14));
            specialStar.setAttribute('y', String(-nodeHalfHeight + 14));
            specialStar.setAttribute('class', 'plm-bom-node-special-star');
            specialStar.textContent = '★';
            g.appendChild(specialStar);
        }

        const subtitleTopY = isTwoLineSubtitle ? -1 : 9;
        const titleY = subtitleLines.length > 0 ? (isTwoLineSubtitle ? -15 : -10) : 0;

        const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t1.setAttribute('x', '0');
        t1.setAttribute('y', String(titleY));
        t1.setAttribute('class', 'plm-bom-node-title');
        t1.textContent = node.id === 'core' ? 'CUERPO TERMINADO' : (node.item_id || 'SIN ID');
        g.appendChild(t1);

        if (subtitleLines.length) {
            const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t2.setAttribute('x', '0');
            t2.setAttribute('y', String(subtitleTopY));
            t2.setAttribute('class', 'plm-bom-node-subtitle');
            t2.setAttribute('dominant-baseline', 'auto');
            subtitleLines.forEach((line, idx) => {
                const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                span.setAttribute('x', '0');
                span.setAttribute('dy', idx === 0 ? '0' : '12');
                span.textContent = line;
                t2.appendChild(span);
            });
            g.appendChild(t2);
        }

        if (node.id !== 'core') {
            const nodeId = String(node.id || '').trim();
            const canonicalId = getBomCanonicalItemId(nodeId);
            const nodeInstanceCount = Math.max(1, Number(nodeInstanceMeta.countByCanonical.get(canonicalId) || 1));
            const nodeInstanceIndex = Math.max(1, Number(nodeInstanceMeta.indexByNodeId.get(nodeId) || 1));

            if (nodeInstanceCount > 1) {
                const instanceText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                instanceText.setAttribute('x', String(BOM_NODE_HALF_WIDTH - 14));
                instanceText.setAttribute('y', String(-nodeHalfHeight + 12));
                instanceText.setAttribute('class', 'plm-bom-node-instance');
                instanceText.textContent = `(${nodeInstanceIndex})`;
                g.appendChild(instanceText);
            }
            const isDetailsExpanded = bomExpandedNodeIds.has(nodeId);

            const toggle = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            toggle.setAttribute('class', `plm-bom-node-toggle ${isDetailsExpanded ? 'open' : ''}`.trim());
            toggle.setAttribute('transform', `translate(${BOM_NODE_HALF_WIDTH - 12}, ${nodeHalfHeight - 12})`);

            const toggleBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            toggleBox.setAttribute('x', '-8');
            toggleBox.setAttribute('y', '-8');
            toggleBox.setAttribute('width', '16');
            toggleBox.setAttribute('height', '16');
            toggleBox.setAttribute('rx', '6');
            toggleBox.setAttribute('ry', '6');
            toggleBox.setAttribute('class', 'plm-bom-node-toggle-box');
            toggle.appendChild(toggleBox);

            const toggleChevron = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            toggleChevron.setAttribute('points', isDetailsExpanded ? '-2,0 0,-2 2,0' : '-2,-1 0,1 2,-1');
            toggleChevron.setAttribute('class', 'plm-bom-node-toggle-chevron');
            toggle.appendChild(toggleChevron);

            const stopNodeDetailEvents = (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
            };

            toggle.addEventListener('mousedown', stopNodeDetailEvents);
            toggle.addEventListener('click', (ev) => {
                stopNodeDetailEvents(ev);
                toggleBomNodeDetails(nodeId);
            });

            g.appendChild(toggle);

            if (isDetailsExpanded) {
                const variantTargetId = canonicalId;
                const variantUi = getBomVariantUiStateForItem(variantTargetId);
                const detailCost = variantUi.matched
                    ? formatMoney(Math.max(0, toNumber(variantUi.matched.cost_total, 0)))
                    : '-';

                const detailsFo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                const detailWidth = 368;
                const detailHeight = 188;
                detailsFo.setAttribute('x', String(-(detailWidth / 2)));
                detailsFo.setAttribute('y', String(nodeHalfHeight + 8));
                detailsFo.setAttribute('width', String(detailWidth));
                detailsFo.setAttribute('height', String(detailHeight));
                detailsFo.setAttribute('class', 'plm-bom-node-details-fo');

                const detailCard = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
                detailCard.setAttribute('class', 'plm-bom-node-details-card');

                const buildNodeSelectHtml = (field, optionsRaw, selectedRaw) => {
                    const options = Array.isArray(optionsRaw) && optionsRaw.length ? optionsRaw : ['-'];
                    const selectedValue = String(selectedRaw || '').trim() || String(options[0] || '-');
                    const optionHtml = options.map((valueRaw) => {
                        const value = String(valueRaw || '').trim() || '-';
                        const selected = value === selectedValue ? ' selected' : '';
                        return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(value)}</option>`;
                    }).join('');
                    return `<select class="plm-bom-node-details-select" data-bom-node-field="${field}">${optionHtml}</select>`;
                };

                const materiaSelectHtml = buildNodeSelectHtml('materia_prima', variantUi.materiaOptions, variantUi.uiSelection.materia_prima);
                const tipoSelectHtml = buildNodeSelectHtml('tipo_mp', variantUi.tipoOptions, variantUi.uiSelection.tipo_mp);
                const materialSelectHtml = buildNodeSelectHtml('material', variantUi.materialOptions, variantUi.uiSelection.material);
                const proveedorSelectHtml = buildNodeSelectHtml('proveedor', variantUi.proveedorOptions, variantUi.uiSelection.proveedor);

                const nodeIdJs = JSON.stringify(nodeId);
                const isDuplicateNode = Boolean(node && node.is_bom_duplicate);
                const actionFn = isDuplicateNode ? 'removeBomDuplicateNode' : 'duplicateBomNode';
                const actionLabel = isDuplicateNode ? 'Eliminar Nodo' : 'Duplicar Nodo';
                const specialActionClass = `btn btn-sm plm-bom-special-btn ${nodeSpecial.enabled ? 'active' : ''}`.trim();
                detailCard.innerHTML = `
                    <div class="plm-bom-node-details-actions">
                        <button type="button" class="${specialActionClass}" onclick='toggleBomSpecialMode(${nodeIdJs})' title="Activar modo Especial">★</button>
                        <button type="button" class="btn btn-sm plm-bom-duplicate-btn" onclick='${actionFn}(${nodeIdJs})'>${actionLabel}</button>
                    </div>
                    <div class="plm-bom-node-details-row"><span class="plm-bom-node-details-label">Materia Prima:</span><span class="plm-bom-node-details-value">${materiaSelectHtml}</span></div>
                    <div class="plm-bom-node-details-row"><span class="plm-bom-node-details-label">Tipo de MP:</span><span class="plm-bom-node-details-value">${tipoSelectHtml}</span></div>
                    <div class="plm-bom-node-details-row"><span class="plm-bom-node-details-label">Material:</span><span class="plm-bom-node-details-value">${materialSelectHtml}</span></div>
                    <div class="plm-bom-node-details-row"><span class="plm-bom-node-details-label">Proveedor:</span><span class="plm-bom-node-details-value">${proveedorSelectHtml}</span></div>
                    <div class="plm-bom-node-details-row"><span class="plm-bom-node-details-label">Costo:</span><span class="plm-bom-node-details-value">${escapeHtml(detailCost)}</span></div>
                `;

                const stopNodeDetailBubble = (ev) => ev.stopPropagation();
                detailCard.addEventListener('mousedown', stopNodeDetailBubble);
                detailCard.addEventListener('click', stopNodeDetailBubble);
                detailCard.addEventListener('wheel', stopNodeDetailBubble);

                detailCard.querySelectorAll('.plm-bom-node-details-select').forEach((selectEl) => {
                    selectEl.addEventListener('mousedown', stopNodeDetailBubble);
                    selectEl.addEventListener('click', stopNodeDetailBubble);
                    selectEl.addEventListener('change', (ev) => {
                        ev.stopPropagation();
                        const field = String(selectEl.getAttribute('data-bom-node-field') || '').trim();
                        if (!field) return;
                        updateBomVariantSelection(variantTargetId, field, selectEl.value);
                    });
                });

                detailsFo.appendChild(detailCard);
                g.appendChild(detailsFo);
            }
        }

        g.addEventListener('click', (ev) => {
            ev.stopPropagation();
            chooseBomNode(node.id);
        });
        if (node.id !== 'core') {

        g.addEventListener('mousedown', (ev) => {
            if (ev.button !== 0) return;
            if (bomLinkDragState) return;
            if (!canEditGraph) return;
            ev.stopPropagation();
            ev.preventDefault();

            const start = worldFromClient(ev.clientX, ev.clientY, host, width, height);
            bomDragState = {
                nodeId: String(node.id),
                startX: start.x,
                startY: start.y,
                baseX: nodeX,
                baseY: nodeY,
                moved: false
            };

            const onMove = (moveEv) => {
                if (!bomDragState) return;
                const current = worldFromClient(moveEv.clientX, moveEv.clientY, host, width, height);
                const part = getPartById(bomDragState.nodeId);
                if (!part) return;

                const nextX = Math.round(bomDragState.baseX + (current.x - bomDragState.startX));
                const nextY = Math.round(bomDragState.baseY + (current.y - bomDragState.startY));
                if (nextX !== Math.round(bomDragState.baseX) || nextY !== Math.round(bomDragState.baseY)) {
                    bomDragState.moved = true;
                }

                part.x = nextX;
                part.y = nextY;
                scheduleBomGraphRender(false);
            };

            const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);

                const dragState = bomDragState;
                bomDragState = null;

                const movedNodeId = String(dragState && dragState.nodeId || '').trim();
                const wasMoved = Boolean(dragState && dragState.moved);

                if (!movedNodeId) return;

                if (!wasMoved) {
                    return;
                }

                let shouldPersist = true;
                const hierarchyCheck = validateBomHierarchyForNode(movedNodeId);
                if (!hierarchyCheck.ok) {
                    const part = getPartById(movedNodeId);
                    if (part) {
                        part.x = Math.round(toNumber(dragState.baseX, toNumber(part.x, 0)));
                        part.y = Math.round(toNumber(dragState.baseY, toNumber(part.y, 0)));
                    }

                    shouldPersist = false;
                    notifyProject(
                        `Movimiento invalido: el padre debe ser de mayor categoria. (${hierarchyCheck.parentCategory} -> ${hierarchyCheck.childCategory})`,
                        'error'
                    );
                }

                scheduleBomGraphRender(true);

                if (shouldPersist) {
                    touchActiveBomVersion();
                    persistCurrentWorkspace(true);
                }
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        });
        }

        if (String(node.id) === String(activeBomNodeId) && canEditGraph) {
            [
                { dx: 0, dy: -(nodeHalfHeight + BOM_HANDLE_GAP) },
                { dx: BOM_NODE_HALF_WIDTH + BOM_HANDLE_GAP, dy: 0 },
                { dx: 0, dy: nodeHalfHeight + BOM_HANDLE_GAP },
                { dx: -(BOM_NODE_HALF_WIDTH + BOM_HANDLE_GAP), dy: 0 }
            ].forEach((h) => {
                const startLinkDrag = (ev) => {
                    if (ev.button !== 0) return;
                    if (!canEditGraph) return;
                    ev.stopPropagation();
                    ev.preventDefault();

                    const startX = nodeX + h.dx;
                    const startY = nodeY + h.dy;
                    bomLinkDragState = { sourceId: String(node.id), startX, startY, currentX: startX, currentY: startY };

                    const onMove = (moveEv) => {
                        if (!bomLinkDragState) return;
                        const world = worldFromClient(moveEv.clientX, moveEv.clientY, host, width, height);
                        bomLinkDragState.currentX = world.x;
                        bomLinkDragState.currentY = world.y;
                        scheduleBomGraphRender(false);
                    };

                    const onUp = (upEv) => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);

                        if (!bomLinkDragState) return;
                        const sourceId = bomLinkDragState.sourceId;
                        const world = worldFromClient(upEv.clientX, upEv.clientY, host, width, height);
                        const targetNode = findBomNodeAtPoint(world.x, world.y, nodes);
                        bomLinkDragState = null;

                        if (targetNode && String(targetNode.id) !== String(sourceId)) {
                            // UX: el usuario arrastra hijo -> padre; modelo interno se guarda padre -> hijo.
                            addBomEdge(targetNode.id, sourceId, true, true);
                        } else {
                            scheduleBomGraphRender(false);
                        }
                    };

                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                };

                const handleHit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                handleHit.setAttribute('cx', String(h.dx));
                handleHit.setAttribute('cy', String(h.dy));
                handleHit.setAttribute('r', String(BOM_HANDLE_HIT_RADIUS));
                handleHit.setAttribute('class', 'plm-bom-handle-hit');
                handleHit.addEventListener('mousedown', startLinkDrag);
                g.appendChild(handleHit);

                const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                handle.setAttribute('cx', String(h.dx));
                handle.setAttribute('cy', String(h.dy));
                handle.setAttribute('r', String(BOM_HANDLE_RADIUS));
                handle.setAttribute('class', 'plm-bom-handle');
                g.appendChild(handle);
            });
        }

        viewport.appendChild(g);
    });

    // Cantidades por encima de nodos para que nunca queden tapadas.
    qtyOverlayElements.forEach((el) => viewport.appendChild(el));

    svg.addEventListener('mousedown', (ev) => {
        if (ev.button !== 2) return;
        ev.preventDefault();

        bomPanState = {
            startClientX: ev.clientX,
            startClientY: ev.clientY,
            startPanX: bomViewState.panX,
            startPanY: bomViewState.panY
        };
        host.classList.add('panning');

        const onMove = (moveEv) => {
            if (!bomPanState) return;
            bomViewState.panX = bomPanState.startPanX + (moveEv.clientX - bomPanState.startClientX);
            bomViewState.panY = bomPanState.startPanY + (moveEv.clientY - bomPanState.startClientY);
            applyViewportTransform();
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            bomPanState = null;
            host.classList.remove('panning');
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    });
    svg.addEventListener('wheel', (ev) => {
        scheduleBomWheelZoom(ev);
    }, { passive: false });

    svg.addEventListener('click', () => {
        activeBomNodeId = null;
        selectedBomEdgeId = null;
        bomExpandedNodeIds.clear();
        scheduleBomGraphRender(false);
    });
}

function connectSelectedBomNodes() {
    notifyProject('Use los manejadores pulsantes del nodo para crear conexiones.', 'error');
}

function removeBomEdge(index) {
    if (!currentWorkspaceProject) return;

    const edges = getActiveBomEdges();
    if (!Array.isArray(edges)) return;
    if (index < 0 || index >= edges.length) return;

    const edge = edges[index];
    if (!edge) return;
    removeBomEdgeById(edge.id, true);
}

function getErpMpPrefix(category) {
    const normalized = String(category || '').trim();
    if (!normalized) return 'MP';
    if (ERP_MP_PREFIX_MAP[normalized]) return ERP_MP_PREFIX_MAP[normalized];

    const letters = normalized
        .split(/\s+/)
        .map((chunk) => String(chunk || '').trim()[0] || '')
        .join('')
        .toUpperCase()
        .replace(/[^A-Z]/g, '');

    return letters.slice(0, 3).padEnd(3, 'X') || 'MP';
}

function getNextErpMpId(category) {
    if (!currentWorkspaceProject) return '';

    const normalizedCategory = String(category || '').trim();
    if (!normalizedCategory) return '';

    const prefix = getErpMpPrefix(normalizedCategory);
    const mpSearchInput = document.getElementById('erp-mp-search');
    if (mpSearchInput && mpSearchInput.value !== getWorkspaceSearchQuery('materials')) mpSearchInput.value = getWorkspaceSearchQuery('materials');

    const rows = Array.isArray(currentWorkspaceProject.erp_raw_materials)
        ? currentWorkspaceProject.erp_raw_materials
        : [];

    let max = 0;
    rows.forEach((row) => {
        if (String(row && row.category ? row.category : '').trim() !== normalizedCategory) return;

        const rawId = String(row && row.mp_id ? row.mp_id : '').trim();
        const withPrefix = rawId.match(new RegExp(`^${prefix}-(\\d+)$`, 'i'));
        const generic = rawId.match(/(\d+)$/);
        const n = withPrefix ? Number(withPrefix[1]) : (generic ? Number(generic[1]) : NaN);
        if (Number.isFinite(n)) max = Math.max(max, n);
    });

    return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

function renderErpSuppliersTable() {
    const tbody = document.getElementById('erp-suppliers-body');
    if (!tbody || !currentWorkspaceProject) return;

    const suppliersSearchInput = document.getElementById('erp-suppliers-search');
    if (suppliersSearchInput && suppliersSearchInput.value !== getWorkspaceSearchQuery('suppliers')) suppliersSearchInput.value = getWorkspaceSearchQuery('suppliers');

    const rows = Array.isArray(currentWorkspaceProject.erp_suppliers)
        ? currentWorkspaceProject.erp_suppliers
        : [];

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center plm-empty">No hay proveedores cargados.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map((item) => {
        const supplies = Array.isArray(item.supplies) ? item.supplies : [];
        const suppliesText = supplies.length ? supplies.join(' / ') : '-';
        const supplierIdJs = JSON.stringify(String(item && item.id ? item.id : '').trim());
        return `
            <tr>
                <td>${escapeHtml(item.name || '-')}</td>
                <td>${escapeHtml(item.provider_id || '-')}</td>
                <td>${escapeHtml(item.description || '-')}</td>
                <td>${escapeHtml(item.country || '-')}</td>
                <td>${escapeHtml(suppliesText)}</td>
                <td class="text-center"><button type="button" class="btn btn-sm" onclick='openErpSupplierModal(${supplierIdJs})'>Modificar</button></td>
            </tr>
        `;
    }).join('');

    applySearchToTbody(tbody, getWorkspaceSearchQuery('suppliers'), 6, 'No hay proveedores coincidentes.');
}

function renderErpRawMaterialsTable() {
    const tbody = document.getElementById('erp-mp-body');
    if (!tbody || !currentWorkspaceProject) return;

    const rows = Array.isArray(currentWorkspaceProject.erp_raw_materials)
        ? currentWorkspaceProject.erp_raw_materials
        : [];

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center plm-empty">No hay materia prima cargada.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map((item) => {
        const category = String(item && item.category ? item.category : '').trim();
        const categoryMarkup = category
            ? buildErpZoneBadgeMarkup(category, category)
            : '-';
        const materialIdJs = JSON.stringify(String(item && item.id ? item.id : '').trim());

        return `
        <tr>
            <td>${categoryMarkup}</td>
            <td>${escapeHtml(item.mp_id || '-')}</td>
            <td>${escapeHtml(item.reference || '-')}</td>
            <td>${escapeHtml(item.material || '-')}</td>
            <td class="text-center"><button type="button" class="btn btn-sm" onclick='openErpMpModal(${materialIdJs})'>Modificar</button></td>
        </tr>
    `;
    }).join('');

    applySearchToTbody(tbody, getWorkspaceSearchQuery('materials'), 5, 'No hay materias primas coincidentes.');
}


function getErpZoneToneColor(categoryRaw) {
    const category = normalizeErpDiagramCategory(categoryRaw, '');
    const idx = ERP_DIAGRAM_ZONES.indexOf(category);
    if (idx < 0) return '#95a5a6';
    return ERP_DIAGRAM_TONE_COLORS[idx % ERP_DIAGRAM_TONE_COLORS.length] || '#95a5a6';
}

function buildErpZoneBadgeMarkup(labelRaw, categoryRaw) {
    const label = String(labelRaw || '').trim();
    if (!label || label === '-') return '-';

    const color = getErpZoneToneColor(categoryRaw);
    const bg = `${color}33`;
    return `<span class="plm-meta-badge" style="color:${escapeHtml(color)}; background-color:${escapeHtml(bg)}; border-color:${escapeHtml(color)};">${escapeHtml(label)}</span>`;
}

function renderErpHomePiecesTable() {
    const tbody = document.getElementById('erp-home-pieces-body');
    if (!tbody || !currentWorkspaceProject) return;

    const erpSearchInput = document.getElementById('erp-home-search');
    if (erpSearchInput && erpSearchInput.value !== getWorkspaceSearchQuery('erp')) erpSearchInput.value = getWorkspaceSearchQuery('erp');

    const rows = Array.isArray(currentWorkspaceProject.plm_items)
        ? currentWorkspaceProject.plm_items
        : [];

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center plm-empty">No hay piezas PLM cargadas.</td></tr>';
        return;
    }

    const syncResult = ensureErpDiagramRowsSynced();
    if (syncResult.changed) queueErpDiagramPersist();

    const supplierNameById = getErpHomeSupplierNameByIdMap();
    const markup = [];

    rows.forEach((item) => {
        const internalId = String(item && item.id ? item.id : '').trim();
        if (!internalId) return;

        const variantRows = getErpItemDiagramRows(internalId);
        const variantCount = variantRows.length;
        const expanded = erpExpandedHomeItemIds.has(internalId);

        const revision = String(item && item.revision ? item.revision : '').trim() || '-';
        const revisionBadge = revision === '-'
            ? '-'
            : `<span class="plm-meta-badge plm-revision-badge">${escapeHtml(revision)}</span>`;

        const itemIdJs = JSON.stringify(internalId);
        const itemIdAttr = escapeHtml(internalId);
        const variantsToggleIcon = expanded ? '&#8722;' : '&#9662;';
        const variantsToggleTitle = expanded ? 'Ocultar variantes' : 'Mostrar variantes';

        markup.push(`
            <tr class="erp-home-parent-row" data-erp-item-id="${itemIdAttr}">
                <td class="erp-home-control-col">
                    <div class="erp-home-control-stack">
                        <div class="erp-home-row-tools">
                            <button type="button" class="erp-home-tool-btn erp-home-toggle-variants-btn" data-erp-item-id="${itemIdAttr}" onclick='toggleErpHomeVariantRows(${itemIdJs})' title="${variantsToggleTitle}">${variantsToggleIcon}</button>
                            <button type="button" class="erp-home-tool-btn" onclick='addErpVariantNode(${itemIdJs})' title="Agregar variante">+</button>
                        </div>
                        <span class="erp-home-variant-circle" title="Cantidad de variantes">${escapeHtml(String(variantCount))}</span>
                    </div>
                </td>
                <td>${escapeHtml(item.item_id || '-')}</td>
                <td>${escapeHtml(item.name || '-')}</td>
                <td class="text-center">
                    <div class="erp-diagram-cost-readonly erp-diagram-value-status-badge erp-value-status-empty erp-home-value-status">-</div>
                </td>
                <td class="text-center">
                    <div class="erp-diagram-cost-readonly erp-home-value-date">-</div>
                </td>
                <td class="text-center">${revisionBadge}</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
            </tr>
        `);

        if (!expanded) return;
        markup.push(buildErpHomeVariantRowsMarkupByItemId(internalId, supplierNameById, false));
    });

    tbody.innerHTML = markup.join('');

    applySearchToTbody(tbody, getWorkspaceSearchQuery('erp'), 11, 'No hay piezas ERP coincidentes.');
}


function getErpHomeSupplierNameByIdMap() {
    const suppliers = Array.isArray(currentWorkspaceProject && currentWorkspaceProject.erp_suppliers)
        ? currentWorkspaceProject.erp_suppliers
        : [];

    const supplierNameById = new Map();
    suppliers.forEach((supplier) => {
        const providerId = String(supplier && supplier.provider_id ? supplier.provider_id : '').trim();
        const name = String(supplier && supplier.name ? supplier.name : '').trim();
        const supplierValue = getErpSupplierOptionValue(supplier);
        if (providerId) supplierNameById.set(providerId, name || providerId);
        if (supplierValue) supplierNameById.set(supplierValue, name || providerId || supplierValue);
    });

    return supplierNameById;
}

function flashErpDiagramRowById(rowIdRaw) {
    const rowId = String(rowIdRaw || '').trim();
    if (!rowId) return false;

    const rows = document.querySelectorAll('#erp-diagram-graph tr.erp-diagram-row-draggable');
    let targetRow = null;
    for (let i = 0; i < rows.length; i += 1) {
        const rowEl = rows[i];
        const rowElId = String(rowEl && rowEl.dataset ? rowEl.dataset.erpRowId || '' : '').trim();
        if (rowElId === rowId) {
            targetRow = rowEl;
            break;
        }
    }
    if (!targetRow) return false;

    targetRow.classList.remove('erp-diagram-row-flash');
    // Reflow para permitir re-disparo de la animacion en clicks consecutivos.
    void targetRow.offsetWidth;
    targetRow.classList.add('erp-diagram-row-flash');

    if (typeof targetRow.scrollIntoView === 'function') {
        targetRow.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    }

    window.setTimeout(() => {
        targetRow.classList.remove('erp-diagram-row-flash');
    }, 5000);
    return true;
}

function focusErpDiagramRowById(rowIdRaw, zoomRaw = NaN) {
    if (!currentWorkspaceProject) return false;

    const rowId = String(rowIdRaw || '').trim();
    if (!rowId) return false;

    const row = getErpDiagramRowById(rowId);
    if (!row) return false;

    const category = normalizeErpDiagramCategory(row && row.category ? row.category : ERP_UNASSIGNED_CATEGORY);

    setErpPanel('diagram');

    const host = document.getElementById('erp-diagram-graph');
    if (!host) return false;

    const width = Math.max(host.clientWidth || 960, 760);
    const height = Math.max(host.clientHeight || 860, 560);
    const layoutMap = cloneErpDiagramLayoutMap(getErpDiagramLayoutMap());
    const zone = getErpCategoryZone(category, layoutMap);

    let focusX = zone ? toNumber(zone.cx, 0) : toNumber(row && row.x, 0);
    let focusY = zone ? toNumber(zone.cy, 0) : toNumber(row && row.y, 0);

    if (isErpDiagramNodeZoneCategory(category)) {
        const rowX = toNumber(row && row.x, NaN);
        const rowY = toNumber(row && row.y, NaN);
        if (Number.isFinite(rowX) && Number.isFinite(rowY)) {
            focusX = rowX;
            focusY = rowY;
        }
    }

    const availWidth = Math.max(120, width - 160);
    const availHeight = Math.max(120, height - 160);
    let targetScale = toNumber(erpDiagramViewState.scale, 0.22);

    if (zone) {
        const zoneWidth = Math.max(1, toNumber(zone.width, 1));
        const zoneHeight = Math.max(1, toNumber(zone.height, 1));
        const zoneFitScale = Math.min(availWidth / zoneWidth, availHeight / zoneHeight) * 0.95;
        targetScale = Math.max(targetScale, zoneFitScale, 0.26);
    }

    const requestedZoom = toNumber(zoomRaw, NaN);
    if (Number.isFinite(requestedZoom)) targetScale = Math.max(targetScale, requestedZoom);

    targetScale = Math.max(
        erpDiagramViewState.minScale,
        Math.min(erpDiagramViewState.maxScale, targetScale)
    );

    erpDiagramViewState.scale = targetScale;
    erpDiagramViewState.panX = -(focusX * targetScale);
    erpDiagramViewState.panY = -(focusY * targetScale);
    activeErpDiagramNodeId = rowId;

    renderErpDiagramGraph();

    if (!isErpDiagramNodeZoneCategory(category)) {
        window.setTimeout(() => {
            flashErpDiagramRowById(rowId);
        }, 36);
    }

    return true;
}

function buildErpHomeVariantRowsMarkupByItemId(itemIdRaw, supplierNameById = null, animateEnter = false) {
    if (!currentWorkspaceProject) return '';

    const itemId = String(itemIdRaw || '').trim();
    if (!itemId) return '';

    const plmItems = Array.isArray(currentWorkspaceProject.plm_items) ? currentWorkspaceProject.plm_items : [];
    const item = plmItems.find((entry) => String(entry && entry.id ? entry.id : '').trim() === itemId) || null;
    if (!item) return '';

    const providerMap = supplierNameById instanceof Map ? supplierNameById : getErpHomeSupplierNameByIdMap();

    const revision = String(item && item.revision ? item.revision : '').trim() || '-';
    const revisionBadge = revision === '-'
        ? '-'
        : `<span class="plm-meta-badge plm-revision-badge">${escapeHtml(revision)}</span>`;

    const variantRows = getErpItemDiagramRows(itemId);
    if (!variantRows.length) return '';

    const parentAttr = escapeHtml(itemId);
    const rowEnterClass = animateEnter ? ' erp-home-variant-row-enter' : '';

    return variantRows.map((variantRow) => {
        const zoneCategory = normalizeErpDiagramCategory(variantRow && variantRow.category, '');
        const isUnassigned = zoneCategory === ERP_UNASSIGNED_CATEGORY;
        const materiaPrimaBadge = isUnassigned
            ? buildErpZoneBadgeMarkup('Sin Asignar', ERP_UNASSIGNED_CATEGORY)
            : buildErpZoneBadgeMarkup(zoneCategory, zoneCategory);

        const mpType = isUnassigned
            ? '-'
            : (String(variantRow && variantRow.mp_category ? variantRow.mp_category : '').trim() || '-');
        const material = isUnassigned
            ? '-'
            : (String(variantRow && variantRow.mp_material ? variantRow.mp_material : '').trim() || '-');

        const providerId = String(variantRow && variantRow.provider_id ? variantRow.provider_id : '').trim();
        const providerLabel = isUnassigned
            ? '-'
            : (providerId ? (providerMap.get(providerId) || getErpSupplierDisplayName(providerId, providerId)) : '-');
        const hasValueStatusData = hasErpDiagramRowValueStatusData(variantRow);
        const selectedValueStatus = hasValueStatusData
            ? normalizeErpValueStatus(variantRow && variantRow.value_status ? variantRow.value_status : 'Supuesto')
            : '';
        const valueStatusClass = hasValueStatusData
            ? getErpValueStatusToneClass(selectedValueStatus)
            : 'erp-value-status-empty';
        const valueStatusMarkup = !hasValueStatusData
            ? '<div class="erp-diagram-cost-readonly erp-diagram-value-status-badge erp-value-status-empty erp-home-value-status">-</div>'
            : `<div class="erp-diagram-cost-readonly erp-diagram-value-status-badge ${valueStatusClass} erp-home-value-status">${escapeHtml(selectedValueStatus)}</div>`;
        const valueDate = normalizeErpValueDate(variantRow && (variantRow.value_date || variantRow.fecha_valor || variantRow.fecha) ? (variantRow.value_date || variantRow.fecha_valor || variantRow.fecha) : '');
        const valueDateMarkup = `<div class="erp-diagram-cost-readonly erp-home-value-date">${escapeHtml(valueDate || '-')}</div>`;

        const total = isUnassigned ? '-' : formatMoney(getErpDiagramTotal(variantRow));
        const variantCode = normalizeErpVariantCode(variantRow && variantRow.variant_code ? variantRow.variant_code : '', 1);
        const variantRowId = String(variantRow && variantRow.id ? variantRow.id : '').trim();
        const variantRowIdJs = JSON.stringify(variantRowId);
        const goToDiagramTitle = `Ver ${variantCode} en diagrama ERP`;

        return `
                <tr class="erp-home-variant-row${rowEnterClass}" data-erp-parent-item-id="${parentAttr}" data-erp-row-id="${escapeHtml(variantRowId)}">
                    <td class="erp-home-control-col">
                        <div class="erp-home-variant-row-tools">
                            <button type="button" class="erp-home-variant-circle erp-home-variant-link" onclick='focusErpDiagramRowById(${variantRowIdJs})' title="${escapeHtml(goToDiagramTitle)}">${escapeHtml(variantCode)}</button>
                            <button type="button" class="erp-home-variant-delete-btn" onclick='requestRemoveErpVariantRow(${variantRowIdJs})' title="Eliminar variante">&times;</button>
                        </div>
                    </td>
                    <td class="text-center"><span class="erp-home-parent-arrow">&uarr;</span></td>
                    <td class="text-center"><span class="erp-home-parent-arrow">&uarr;</span></td>
                    <td class="text-center">${valueStatusMarkup}</td>
                    <td class="text-center">${valueDateMarkup}</td>
                    <td class="text-center">${revisionBadge}</td>
                    <td class="text-center">${materiaPrimaBadge}</td>
                    <td class="text-center">${escapeHtml(mpType)}</td>
                    <td class="text-center">${escapeHtml(material)}</td>
                    <td class="text-center">${escapeHtml(providerLabel)}</td>
                    <td class="text-center">${escapeHtml(total)}</td>
                </tr>
            `;
    }).join('');
}

function getErpHomeParentRowByItemId(itemIdRaw) {
    const itemId = String(itemIdRaw || '').trim();
    if (!itemId) return null;

    const tbody = document.getElementById('erp-home-pieces-body');
    if (!tbody) return null;

    const parentRows = tbody.querySelectorAll('.erp-home-parent-row');
    for (let i = 0; i < parentRows.length; i += 1) {
        const row = parentRows[i];
        if (String(row && row.dataset ? row.dataset.erpItemId || '' : '').trim() === itemId) return row;
    }

    return null;
}

function getErpHomeVariantRowsAfterParent(parentRow) {
    const rows = [];
    if (!parentRow) return rows;

    let cursor = parentRow.nextElementSibling;
    while (cursor && cursor.classList && cursor.classList.contains('erp-home-variant-row')) {
        rows.push(cursor);
        cursor = cursor.nextElementSibling;
    }

    return rows;
}

function setErpHomeToggleButtonExpanded(parentRow, expanded) {
    const toggleBtn = parentRow ? parentRow.querySelector('.erp-home-toggle-variants-btn') : null;
    if (!toggleBtn) return;

    toggleBtn.innerHTML = expanded ? '&#8722;' : '&#9662;';
    toggleBtn.title = expanded ? 'Ocultar variantes' : 'Mostrar variantes';
}

function toggleErpHomeVariantRows(itemIdRaw) {
    const itemId = String(itemIdRaw || '').trim();
    if (!itemId) return;

    const parentRow = getErpHomeParentRowByItemId(itemId);
    if (!parentRow) {
        if (erpExpandedHomeItemIds.has(itemId)) erpExpandedHomeItemIds.delete(itemId);
        else erpExpandedHomeItemIds.add(itemId);
        renderErpHomePiecesTable();
        return;
    }

    const activeTimer = erpHomeVariantCollapseTimers.get(itemId);
    if (activeTimer) {
        window.clearTimeout(activeTimer);
        erpHomeVariantCollapseTimers.delete(itemId);
    }

    const isExpanded = erpExpandedHomeItemIds.has(itemId);

    if (isExpanded) {
        erpExpandedHomeItemIds.delete(itemId);
        setErpHomeToggleButtonExpanded(parentRow, false);

        const variantRows = getErpHomeVariantRowsAfterParent(parentRow);
        if (!variantRows.length) return;

        variantRows.forEach((row) => row.classList.add('erp-home-variant-row-leave'));

        const removeTimer = window.setTimeout(() => {
            if (erpExpandedHomeItemIds.has(itemId)) {
                variantRows.forEach((row) => row.classList.remove('erp-home-variant-row-leave'));
            } else {
                variantRows.forEach((row) => {
                    if (row && row.parentNode) row.parentNode.removeChild(row);
                });
            }
            erpHomeVariantCollapseTimers.delete(itemId);
        }, 170);

        erpHomeVariantCollapseTimers.set(itemId, removeTimer);
        return;
    }

    erpExpandedHomeItemIds.add(itemId);
    setErpHomeToggleButtonExpanded(parentRow, true);

    const currentRows = getErpHomeVariantRowsAfterParent(parentRow);
    if (currentRows.length) {
        currentRows.forEach((row) => row.classList.remove('erp-home-variant-row-leave'));
        return;
    }

    const variantMarkup = buildErpHomeVariantRowsMarkupByItemId(itemId, null, true);
    if (!variantMarkup) return;

    parentRow.insertAdjacentHTML('afterend', variantMarkup);

    const insertedRows = getErpHomeVariantRowsAfterParent(parentRow);
    if (!insertedRows.length) return;

    requestAnimationFrame(() => {
        insertedRows.forEach((row) => row.classList.remove('erp-home-variant-row-enter'));
    });
}

function addErpVariantNode(itemIdRaw) {
    if (!currentWorkspaceProject) return;

    const itemId = String(itemIdRaw || '').trim();
    if (!itemId) return;

    const sourceRows = getErpItemDiagramRows(itemId);
    const source = sourceRows.length ? sourceRows[sourceRows.length - 1] : null;
    const created = createErpDiagramVariantRow(itemId, source);
    if (!created) {
        notifyProject('No se pudo crear la variante.', 'error');
        return;
    }

    const syncResult = ensureErpDiagramRowsSynced();
    if (syncResult.changed) {
        // la sincronizacion acomoda posicion/categoria por defecto cuando corresponde
    }

    erpExpandedHomeItemIds.add(itemId);
    renderErpHomePiecesTable();
    if (String(erpActivePanel || '').toLowerCase() === 'diagram') renderErpDiagramGraph();

    queueErpDiagramPersist();
    notifyProject(`Variante ${created.variant_code} agregada.`, 'success');
}


function requestRemoveErpVariantRow(rowIdRaw) {
    if (!currentWorkspaceProject) return;

    const rowId = String(rowIdRaw || '').trim();
    if (!rowId) return;

    const row = getErpDiagramRowById(rowId);
    if (!row) return;

    const itemId = String(row && row.item_id ? row.item_id : '').trim();
    const variantCode = normalizeErpVariantCode(row && row.variant_code ? row.variant_code : '', 1);

    const plmItems = Array.isArray(currentWorkspaceProject.plm_items) ? currentWorkspaceProject.plm_items : [];
    const item = plmItems.find((entry) => String(entry && entry.id ? entry.id : '').trim() === itemId) || null;
    const itemLabel = String(item && item.item_id ? item.item_id : '').trim() || String(item && item.name ? item.name : '').trim() || 'pieza';

    const message = `Desea eliminar la variante <strong>${escapeHtml(variantCode)}</strong> de <strong>${escapeHtml(itemLabel)}</strong>?`;
    const executeDelete = () => removeErpVariantRow(rowId);

    if (typeof showCustomConfirm === 'function') {
        showCustomConfirm('Eliminar Variante', message, 'Cancelar', 'Eliminar', (confirmed) => {
            if (confirmed) executeDelete();
        }, true);
        return;
    }

    if (typeof showConfirm === 'function') {
        showConfirm(message, executeDelete, 'Eliminar Variante', 'var(--bpb-blue)');
        return;
    }

    if (window.confirm(`Desea eliminar la variante ${variantCode} de ${itemLabel}?`)) {
        executeDelete();
    }
}

function removeErpVariantRow(rowIdRaw) {
    if (!currentWorkspaceProject) return;

    const rowId = String(rowIdRaw || '').trim();
    if (!rowId) return;

    const rows = getErpDiagramRows();
    const idx = rows.findIndex((row) => String(row && row.id ? row.id : '').trim() === rowId);
    if (idx < 0) return;

    const targetRow = rows[idx];
    const itemId = String(targetRow && targetRow.item_id ? targetRow.item_id : '').trim();
    const variantCode = normalizeErpVariantCode(targetRow && targetRow.variant_code ? targetRow.variant_code : '', 1);

    const itemRows = getErpItemDiagramRows(itemId);
    if (itemRows.length <= 1) {
        notifyProject('No se puede eliminar la unica variante.', 'error');
        return;
    }

    rows.splice(idx, 1);

    if (String(activeErpDiagramNodeId || '').trim() === rowId) {
        activeErpDiagramNodeId = '';
    }

    const syncResult = ensureErpDiagramRowsSynced();
    if (syncResult.changed) {
        // mantiene consistencia de codigos y posiciones
    }

    renderErpHomePiecesTable();
    if (String(erpActivePanel || '').toLowerCase() === 'diagram') renderErpDiagramGraph();

    queueErpDiagramPersist();
    notifyProject(`Variante ${variantCode} eliminada.`, 'success');
}

function getErpDiagramRows() {
    if (!currentWorkspaceProject) return [];
    if (!Array.isArray(currentWorkspaceProject.erp_diagram_rows)) currentWorkspaceProject.erp_diagram_rows = [];
    return currentWorkspaceProject.erp_diagram_rows;
}

function normalizeErpImportPercentValue(valueRaw) {
    const value = Math.max(0, toNumber(valueRaw, 0));
    const pct = value > 0 && value < 1 ? (value * 100) : value;
    return Math.round(pct * 1000) / 1000;
}

function parseErpLocalizedNumber(valueRaw, fallback = 0) {
    const raw = String(valueRaw ?? '').trim();
    if (!raw) return fallback;

    let normalized = raw.replace(/\s+/g, '');
    if (normalized.includes(',')) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseErpImportPercentInput(valueRaw) {
    const raw = String(valueRaw ?? '').trim();
    if (!raw) return 0;
    const parsed = parseErpLocalizedNumber(raw.replace('%', ''), 0);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return normalizeErpImportPercentValue(parsed);
}

function formatErpImportPercentInputValue(valueRaw, options = {}) {
    const pct = normalizeErpImportPercentValue(valueRaw);
    const allowZero = Boolean(options && options.allowZero);
    if (!allowZero && pct <= 0) return '';
    const rounded = Math.round(pct * 1000) / 1000;
    const text = Math.abs(rounded - Math.round(rounded)) < 0.000001
        ? String(Math.round(rounded))
        : String(rounded).replace('.', ',');
    return `${text}%`;
}

function getErpDiagramImportBaseUnitCost(row) {
    const kg = Math.max(0, toNumber(row && row.kg, 0));
    const mts = Math.max(0, toNumber(row && row.mts, 0));
    const costMpByKg = Math.max(0, toNumber(row && row.cost_mp_x_kg, 0)) * kg;
    const costMpByMt = Math.max(0, toNumber(row && row.cost_mp_x_mt, 0)) * mts;
    const costMp = Math.max(0, toNumber(row && row.cost_mp, 0));
    const baseMp = costMp > 0 ? costMp : (costMpByKg + costMpByMt);

    const normalizeCountry = (countryRaw) => {
        return String(countryRaw || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const isArgentinaCountry = (countryRaw) => {
        const normalized = normalizeCountry(countryRaw);
        if (!normalized) return false;
        return normalized.includes('argentina');
    };

    const isGroupImported = (parentKeyRaw) => {
        const parentKey = String(parentKeyRaw || '').trim();
        if (!parentKey) return false;

        const groupCost = Math.max(0, toNumber(getErpDiagramGroupUnitCost(row, parentKey), 0));
        if (groupCost <= 0) return false;

        const providerKey = getErpDiagramGroupProviderChildKey(parentKey);
        if (!providerKey) return false;

        const providerSelection = normalizeErpSupplierSelectionValue(row && row[providerKey] ? row[providerKey] : '');
        if (!providerSelection) return false;

        const country = getErpSupplierCountryBySelection(providerSelection, '');
        if (!country) return false;
        return !isArgentinaCountry(country);
    };

    let importedExtras = 0;
    if (isGroupImported(ERP_DIAGRAM_MACHINING_PARENT_KEY)) {
        importedExtras += Math.max(0, toNumber(getErpDiagramGroupUnitCost(row, ERP_DIAGRAM_MACHINING_PARENT_KEY), 0));
    }
    if (isGroupImported(ERP_DIAGRAM_TREATMENT_PARENT_KEY)) {
        importedExtras += Math.max(0, toNumber(getErpDiagramGroupUnitCost(row, ERP_DIAGRAM_TREATMENT_PARENT_KEY), 0));
    }
    if (isGroupImported(ERP_DIAGRAM_PAINT_PARENT_KEY)) {
        importedExtras += Math.max(0, toNumber(getErpDiagramGroupUnitCost(row, ERP_DIAGRAM_PAINT_PARENT_KEY), 0));
    }

    return baseMp + importedExtras;
}

function getErpDiagramImportacionUnitCost(row) {
    const percent = normalizeErpImportPercentValue(row && row.cost_importacion);
    const ratio = percent / 100;
    return getErpDiagramImportBaseUnitCost(row) * ratio;
}

function getErpDiagramUnitTotal(row) {
    const qty = Math.max(1, Math.round(toNumber(row && row.quoted_qty, 1)));
    const kg = Math.max(0, toNumber(row && row.kg, 0));
    const mts = Math.max(0, toNumber(row && row.mts, 0));

    const costMpByKg = Math.max(0, toNumber(row && row.cost_mp_x_kg, 0)) * kg;
    const costMpByMt = Math.max(0, toNumber(row && row.cost_mp_x_mt, 0)) * mts;
    const costMp = Math.max(0, toNumber(row && row.cost_mp, 0));

    const costMecanizado = Math.max(0, toNumber(getErpDiagramMecanizadoRowValue(row), 0));
    const costTratamiento = Math.max(0, toNumber(getErpDiagramGroupValue(row, ERP_DIAGRAM_TREATMENT_PARENT_KEY), 0));

    const costPintado = Math.max(0, toNumber(row && row.cost_pintado, 0));
    const costImportacion = Math.max(0, toNumber(getErpDiagramImportacionUnitCost(row), 0));

    const matriceriaTotal = Math.max(0, toNumber(row && row.cost_matriceria, 0));
    const matriceriaUnit = matriceriaTotal / qty;

    return costMpByKg
        + costMpByMt
        + costMp
        + costMecanizado
        + costTratamiento
        + costPintado
        + costImportacion
        + matriceriaUnit;
}

function getErpDiagramTotal(row) {
    // Costo Total mostrado en ERP es unitario.
    // Cantidad Cotizada solo se usa para prorratear Costo Matriceria en getErpDiagramUnitTotal.
    return getErpDiagramUnitTotal(row);
}

function normalizeErpDiagramCategory(categoryRaw, fallback = ERP_UNASSIGNED_CATEGORY) {
    const category = String(categoryRaw || '').trim();
    if (ERP_DIAGRAM_ZONES.includes(category)) return category;

    const fallbackValue = String(fallback ?? '').trim();
    if (fallbackValue === '') return '';
    if (ERP_DIAGRAM_ZONES.includes(fallbackValue)) return fallbackValue;
    return ERP_UNASSIGNED_CATEGORY;
}

function isErpStructuralBomCategory(categoryRaw) {
    const category = String(categoryRaw || '').trim();
    return category === 'Conjunto'
        || category === 'Subconjunto 1'
        || category === 'Subconjunto 1.1';
}

function isErpDiagramNodeZoneCategory(categoryRaw) {
    const category = normalizeErpDiagramCategory(categoryRaw, '');
    return category === ERP_UNASSIGNED_CATEGORY || category === ERP_STRUCTURAL_CATEGORY;
}

function isErpBulonesCategory(categoryRaw) {
    const category = normalizeErpDiagramCategory(categoryRaw, '');
    return category === 'Bulones';
}

function getErpDiagramFieldMaxFractionDigits(categoryOrRowRaw, fieldRaw) {
    const field = String(fieldRaw || '').trim();
    let categoryRaw = '';
    if (categoryOrRowRaw && typeof categoryOrRowRaw === 'object') {
        categoryRaw = String(categoryOrRowRaw.category || '').trim();
    } else {
        categoryRaw = String(categoryOrRowRaw || '').trim();
    }

    if (isErpBulonesCategory(categoryRaw) && field === 'cost_mp') return 5;
    return 3;
}

function formatErpDiagramRowTotal(row) {
    const total = getErpDiagramTotal(row);
    if (isErpBulonesCategory(row && row.category ? row.category : '')) {
        return formatMoney(total, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
    }
    return formatMoney(total);
}

function formatErpDiagramInputValue(value) {
    const n = Math.max(0, toNumber(value, 0));
    const rounded = Math.round(n * 1000) / 1000;
    const txt = Math.abs(rounded - Math.round(rounded)) < 0.000001 ? String(Math.round(rounded)) : String(rounded);
    return txt.replace('.', ',');
}

function formatErpDiagramEditableInputValue(value, options = {}) {
    const raw = toNumber(value, NaN);
    if (!Number.isFinite(raw)) return '';

    const n = Math.max(0, raw);
    const allowZero = Boolean(options && options.allowZero);
    const maxFractionDigitsRaw = toNumber(options && options.maxFractionDigits, 3);
    const maxFractionDigits = Math.max(0, Math.min(6, Math.floor(maxFractionDigitsRaw)));
    if (!allowZero && n <= 0) return '';

    const multiplier = Math.pow(10, maxFractionDigits);
    const rounded = Math.round((n * multiplier) + Number.EPSILON) / multiplier;
    const txt = Math.abs(rounded - Math.round(rounded)) < 0.000001 ? String(Math.round(rounded)) : String(rounded);
    return txt.replace('.', ',');
}

function getErpDiagramInputPlaceholder(fieldRaw) {
    const field = String(fieldRaw || '').trim();
    if (!field) return '';

    if (field === 'quoted_qty') return 'N\u00B0';
    if (field === 'kg') return 'kg';
    if (field === ERP_DIAGRAM_METER_LENGTH_KEY) return 'm';
    if (field === 'cost_importacion') return '%';
    if (field === 'value_date') return 'DD/MM/AAAA';

    if (isErpDiagramMecanizadoChildKey(field)) return '\u23F1 (min)';

    if (field.startsWith('cost_')) return '$ USD';
    return '';
}

function getErpZoneNodeBounds(zone) {
    if (!zone) {
        return {
            minX: -ERP_DIAGRAM_NODE_HALF_WIDTH,
            maxX: ERP_DIAGRAM_NODE_HALF_WIDTH,
            minY: -ERP_DIAGRAM_NODE_HALF_HEIGHT,
            maxY: ERP_DIAGRAM_NODE_HALF_HEIGHT
        };
    }

    return {
        minX: zone.minX + ERP_DIAGRAM_NODE_HALF_WIDTH + 12,
        maxX: zone.maxX - ERP_DIAGRAM_NODE_HALF_WIDTH - 12,
        minY: zone.minY + ERP_DIAGRAM_NODE_HALF_HEIGHT + 58,
        maxY: zone.maxY - ERP_DIAGRAM_NODE_HALF_HEIGHT - 16
    };
}

function clampErpPointToZone(xRaw, yRaw, zone) {
    const x = toNumber(xRaw, NaN);
    const y = toNumber(yRaw, NaN);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !zone) return { x, y };

    const bounds = getErpZoneNodeBounds(zone);
    return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, y))
    };
}

function mapErpPointBetweenZones(xRaw, yRaw, fromZone, toZone) {
    const x = toNumber(xRaw, NaN);
    const y = toNumber(yRaw, NaN);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !fromZone || !toZone) return { x: NaN, y: NaN };

    const fromWidth = Math.max(1, fromZone.maxX - fromZone.minX);
    const fromHeight = Math.max(1, fromZone.maxY - fromZone.minY);
    const toWidth = Math.max(1, toZone.maxX - toZone.minX);
    const toHeight = Math.max(1, toZone.maxY - toZone.minY);

    const tx = (x - fromZone.minX) / fromWidth;
    const ty = (y - fromZone.minY) / fromHeight;

    return {
        x: toZone.minX + (tx * toWidth),
        y: toZone.minY + (ty * toHeight)
    };
}

function getErpNodeZoneGridPoint(
    categoryRaw,
    indexRaw = 0,
    totalRaw = 1,
    layoutMap = null,
    maxNodeHalfHeightRaw = ERP_DIAGRAM_NODE_HALF_HEIGHT
) {
    const category = normalizeErpDiagramCategory(categoryRaw, '');
    if (!isErpDiagramNodeZoneCategory(category)) return { x: NaN, y: NaN };

    const zone = getErpCategoryZone(category, layoutMap);
    if (!zone) return { x: NaN, y: NaN };

    const bounds = getErpZoneNodeBounds(zone);
    const idx = Math.max(0, Math.floor(toNumber(indexRaw, 0)));
    const total = Math.max(1, Math.floor(toNumber(totalRaw, 1)));

    const maxNodeHalfHeight = Math.max(ERP_DIAGRAM_NODE_HALF_HEIGHT, toNumber(maxNodeHalfHeightRaw, ERP_DIAGRAM_NODE_HALF_HEIGHT));
    const baseStepX = (ERP_DIAGRAM_NODE_HALF_WIDTH * 2) + 8;
    const baseStepY = (maxNodeHalfHeight * 2) + 10;
    const topPadding = category === ERP_STRUCTURAL_CATEGORY ? 42 : 30;

    const usableMinY = bounds.minY + topPadding;
    const usableWidth = Math.max(1, bounds.maxX - bounds.minX);
    const usableHeight = Math.max(1, bounds.maxY - usableMinY);
    const maxColsByStep = Math.max(1, Math.floor((usableWidth + baseStepX) / Math.max(1, baseStepX)));
    const aspect = Math.max(0.35, Math.min(3.2, usableWidth / Math.max(1, usableHeight)));
    const idealCols = Math.max(1, Math.ceil(Math.sqrt(total * aspect) * 0.92));
    let cols = Math.max(1, Math.min(maxColsByStep, idealCols));
    let rows = Math.max(1, Math.ceil(total / cols));

    const maxRowsByStep = Math.max(1, Math.floor((usableHeight + baseStepY) / Math.max(1, baseStepY)));
    while (rows > maxRowsByStep && cols < maxColsByStep) {
        cols += 1;
        rows = Math.max(1, Math.ceil(total / cols));
    }

    let stepX = baseStepX;
    let stepY = baseStepY;
    const minStepX = Math.max(ERP_DIAGRAM_NODE_HALF_WIDTH * 2, baseStepX * 0.82);
    const minStepY = Math.max(maxNodeHalfHeight * 2, baseStepY * 0.84);

    if (cols > 1) {
        stepX = Math.max(minStepX, Math.min(baseStepX, usableWidth / (cols - 1)));
    }
    if (rows > 1) {
        stepY = Math.max(minStepY, Math.min(baseStepY, usableHeight / (rows - 1)));
    }

    const usedWidth = Math.max(0, (cols - 1) * stepX);
    const usedHeight = Math.max(0, (rows - 1) * stepY);
    const gridStartX = bounds.minX + Math.max(0, (usableWidth - usedWidth) / 2);
    const gridStartY = usableMinY + Math.max(0, Math.min(18, usableHeight - usedHeight));

    const col = idx % cols;
    const rowIndex = Math.floor(idx / cols);
    const rawX = gridStartX + (col * stepX);
    const rawY = gridStartY + (rowIndex * stepY);
    const clamped = clampErpPointToZone(rawX, rawY, zone);

    return {
        x: Math.round(toNumber(clamped.x, rawX)),
        y: Math.round(toNumber(clamped.y, rawY))
    };
}

function ensureErpDiagramRowsSynced(layoutMap = null) {
    if (!currentWorkspaceProject) return { changed: false, rowsByItem: new Map() };

    const rows = getErpDiagramRows();
    const plmItems = Array.isArray(currentWorkspaceProject.plm_items) ? currentWorkspaceProject.plm_items : [];
    const plmById = new Map();
    plmItems.forEach((item) => {
        const id = String(item && item.id ? item.id : '').trim();
        if (id) plmById.set(id, item);
    });

    let changed = false;

    for (let i = rows.length - 1; i >= 0; i -= 1) {
        const itemId = String(rows[i] && rows[i].item_id ? rows[i].item_id : '').trim();
        if (!itemId || !plmById.has(itemId)) {
            rows.splice(i, 1);
            changed = true;
        }
    }

    plmItems.forEach((item) => {
        const itemId = String(item && item.id ? item.id : '').trim();
        if (!itemId) return;

        const hasAny = rows.some((row) => String(row && row.item_id ? row.item_id : '').trim() === itemId);
        if (hasAny) return;

        rows.push(normalizeErpDiagramRow({
            id: `edr-${Date.now()}-${Math.floor(Math.random() * 100000)}-${Math.floor(Math.random() * 1000)}`,
            item_id: itemId,
            variant_code: '001',
            category: ERP_UNASSIGNED_CATEGORY,
            provider_id: '',
            [ERP_DIAGRAM_MACHINING_PROVIDER_CHILD_KEY]: '',
            [ERP_DIAGRAM_TREATMENT_PROVIDER_CHILD_KEY]: '',
            [ERP_DIAGRAM_PAINT_PROVIDER_CHILD_KEY]: '',
            x: NaN,
            y: NaN
        }));
        changed = true;
    });

    const rowsByItem = new Map();
    rows.forEach((row) => {
        const itemId = String(row && row.item_id ? row.item_id : '').trim();
        if (!itemId) return;

        const normalizedCategory = normalizeErpDiagramCategory(row.category);
        if (normalizedCategory !== row.category) {
            row.category = normalizedCategory;
            changed = true;
        }

        if (!rowsByItem.has(itemId)) rowsByItem.set(itemId, []);
        rowsByItem.get(itemId).push(row);
    });

    rowsByItem.forEach((groupRows) => {
        groupRows.sort(compareErpDiagramRows);

        const usedCodes = new Set();
        let nextCandidate = 1;

        groupRows.forEach((row) => {
            let code = normalizeErpVariantCode(row && row.variant_code ? row.variant_code : '', nextCandidate);
            let codeNum = getErpVariantNumber(code, nextCandidate);

            while (usedCodes.has(code)) {
                code = normalizeErpVariantCode(String(nextCandidate), nextCandidate);
                codeNum = getErpVariantNumber(code, nextCandidate);
                nextCandidate += 1;
            }

            if (String(row.variant_code || '') !== code) {
                row.variant_code = code;
                changed = true;
            }

            usedCodes.add(code);
            nextCandidate = Math.max(nextCandidate, codeNum + 1);
        });
    });

    const layout = getErpCategoryGridLayout(layoutMap || getErpDiagramLayoutMap());
    const zonesByCategory = new Map(layout.zones.map((zone) => [String(zone.name || ''), zone]));

    ERP_DIAGRAM_ZONES.forEach((category) => {
        const group = rows
            .filter((row) => normalizeErpDiagramCategory(row && row.category) === category)
            .sort(compareErpDiagramRows);

        const zone = zonesByCategory.get(category) || null;
        const maxNodeHalfHeight = isErpDiagramNodeZoneCategory(category)
            ? group.reduce((acc, row) => {
                const itemId = String(row && row.item_id ? row.item_id : '').trim();
                const item = itemId ? (plmById.get(itemId) || null) : null;
                return Math.max(acc, getErpDiagramNodeRenderHalfHeight(item && item.name ? item.name : ''));
            }, ERP_DIAGRAM_NODE_HALF_HEIGHT)
            : ERP_DIAGRAM_NODE_HALF_HEIGHT;

        group.forEach((row, idx) => {
            const x = toNumber(row && row.x, NaN);
            const y = toNumber(row && row.y, NaN);
            const inZone = zone && Number.isFinite(x) && Number.isFinite(y)
                && x >= zone.minX && x <= zone.maxX
                && y >= zone.minY && y <= zone.maxY;
            if (inZone) return;

            const seed = `${String(row && row.item_id ? row.item_id : idx)}-${normalizeErpVariantCode(row && row.variant_code ? row.variant_code : '', 1)}-${String(row && row.id ? row.id : idx)}`;
            const point = isErpDiagramNodeZoneCategory(category)
                ? getErpNodeZoneGridPoint(category, idx, group.length, layout.layoutMap, maxNodeHalfHeight)
                : getErpDefaultNodePoint(seed, idx, group.length, category, layout.layoutMap);
            row.x = Math.round(point.x);
            row.y = Math.round(point.y);
            changed = true;
        });
    });

    return { changed, rowsByItem };
}

function applyErpZoneLayoutToRows(categoryRaw, previousLayoutMap, nextLayoutMap) {
    if (!currentWorkspaceProject) return false;

    const category = normalizeErpDiagramCategory(categoryRaw, '');
    if (!category) return false;

    const fromZone = getErpCategoryZone(category, previousLayoutMap);
    const toZone = getErpCategoryZone(category, nextLayoutMap);
    if (!fromZone || !toZone) return false;

    const rows = getErpDiagramRows()
        .filter((row) => normalizeErpDiagramCategory(row && row.category) === category)
        .sort(compareErpDiagramRows);

    let changed = false;
    rows.forEach((row, idx) => {
        const x = toNumber(row && row.x, NaN);
        const y = toNumber(row && row.y, NaN);
        const mapped = Number.isFinite(x) && Number.isFinite(y)
            ? mapErpPointBetweenZones(x, y, fromZone, toZone)
            : getErpDefaultNodePoint(`${String(row && row.item_id ? row.item_id : idx)}-${normalizeErpVariantCode(row && row.variant_code ? row.variant_code : '', 1)}-${String(row && row.id ? row.id : idx)}`, idx, rows.length, category, nextLayoutMap);

        const clamped = clampErpPointToZone(mapped.x, mapped.y, toZone);
        const nextX = Math.round(toNumber(clamped.x, toNumber(mapped.x, 0)));
        const nextY = Math.round(toNumber(clamped.y, toNumber(mapped.y, 0)));
        if (nextX !== Math.round(toNumber(row.x, NaN)) || nextY !== Math.round(toNumber(row.y, NaN))) {
            row.x = nextX;
            row.y = nextY;
            changed = true;
        }
    });

    return changed;
}

function getErpDiagramZoneColumnConfigMap() {
    if (!currentWorkspaceProject) return {};
    if (!currentWorkspaceProject.erp_diagram_column_visibility || typeof currentWorkspaceProject.erp_diagram_column_visibility !== 'object') {
        currentWorkspaceProject.erp_diagram_column_visibility = {};
    }

    const map = currentWorkspaceProject.erp_diagram_column_visibility;
    ERP_DIAGRAM_ZONES.forEach((category) => {
        const source = map[category] && typeof map[category] === 'object' ? map[category] : {};
        const next = {};
        ERP_DIAGRAM_CONFIGURABLE_COLUMNS.forEach((column) => {
            const key = String(column && column.key ? column.key : '').trim();
            if (!key) return;
            next[key] = source[key] === false ? false : source[key] === true ? true : getErpDiagramColumnDefaultVisibility(column);
        });
        next[ERP_DIAGRAM_METER_PACK_KEY] = Boolean(next[ERP_DIAGRAM_METER_LENGTH_KEY]) && Boolean(next[ERP_DIAGRAM_METER_COST_KEY]);
        map[category] = next;
    });

    return map;
}

function getErpDiagramVisibleColumnsForCategory(categoryRaw) {
    const category = normalizeErpDiagramCategory(categoryRaw);
    if (isErpDiagramNodeZoneCategory(category)) return [];

    const map = getErpDiagramZoneColumnConfigMap();
    const config = map[category] && typeof map[category] === 'object' ? map[category] : {};

    const ordered = [];
    const consumedChildKeys = new Set();

    ERP_DIAGRAM_CONFIGURABLE_COLUMNS.forEach((column) => {
        const key = String(column && column.key ? column.key : '').trim();
        if (!key || consumedChildKeys.has(key)) return;

        if (String(column && column.type ? column.type : '') === 'group') {
            const parentVisible = config[key] !== false;
            const childColumns = getErpDiagramGroupChildColumns(key);
            childColumns.forEach((childColumn) => {
                const childKey = String(childColumn && childColumn.key ? childColumn.key : '').trim();
                if (childKey) consumedChildKeys.add(childKey);
            });

            if (!parentVisible) return;

            const visibleChildColumns = childColumns.filter((childColumn) => {
                const childKey = String(childColumn && childColumn.key ? childColumn.key : '').trim();
                if (!childKey) return false;
                const isTreatmentCost = key === ERP_DIAGRAM_TREATMENT_PARENT_KEY && childKey === ERP_DIAGRAM_TREATMENT_COST_CHILD_KEY;
                if (isTreatmentCost && hasErpDiagramGroupDetailChildrenVisible(key, config)) return false;
                if (isErpDiagramMandatoryGroupChildKey(key, childKey)) return true;
                return config[childKey] === true;
            });

            if (visibleChildColumns.length) {
                visibleChildColumns.forEach((childColumn) => ordered.push(childColumn));
            } else {
                ordered.push({ key, label: String(column.label || key), type: 'cost', parent: key, standaloneGroup: true });
            }
            return;
        }

        if (isErpDiagramGroupChildColumn(column)) return;
        if (config[key] !== false) ordered.push(column);
    });

    return ordered;
}

function isErpDiagramContentEditingAllowed(showErrors = false) {
    if (erpDiagramContentEditMode) return true;
    if (showErrors) notifyProject('Diagrama ERP en modo rendimiento: active el lapiz para editar contenido.', 'error');
    return false;
}

function isErpDiagramGridEditingAllowed(showErrors = false) {
    if (erpDiagramGridEditMode) return true;
    if (showErrors) notifyProject('Active "Modificar Cuadricula" para editar cuadrantes.', 'error');
    return false;
}

function buildErpDiagramZoneTableMarkup(categoryRaw, zoneRowsRaw, plmById) {
    const category = normalizeErpDiagramCategory(categoryRaw);
    const zoneRows = Array.isArray(zoneRowsRaw) ? zoneRowsRaw : [];
    const isEditable = isErpDiagramContentEditingAllowed(false);

    if (isErpDiagramNodeZoneCategory(category)) {
        return isEditable
            ? '<div class="erp-diagram-unassigned-hint">Arrastre nodos aqui para dejarlos sin asignar.</div>'
            : '<div class="erp-diagram-unassigned-hint">Modo rendimiento: vista solo lectura.</div>';
    }

    const visibleColumns = getErpDiagramVisibleColumnsForCategory(category);

    const groupedChildCounts = new Map();
    visibleColumns.forEach((column) => {
        const parentKey = String(column && column.parent ? column.parent : '').trim();
        const isStandalone = Boolean(column && column.standaloneGroup);
        if (!parentKey || isStandalone) return;
        groupedChildCounts.set(parentKey, (groupedChildCounts.get(parentKey) || 0) + 1);
    });

    const hasSecondHeaderRow = groupedChildCounts.size > 0;
    const staticHeaderRowSpan = hasSecondHeaderRow ? ' rowspan="2"' : '';

    const buildColumnHeader = (column, rowClass = 'erp-h1') => {
        const columnKey = String(column && column.key ? column.key : '').trim();
        const isMtsColumn = columnKey === ERP_DIAGRAM_METER_LENGTH_KEY;
        const thClass = isMtsColumn
            ? 'erp-col-mts'
            : column.type === 'qty'
            ? 'erp-col-qty'
            : column.type === 'provider'
                ? 'erp-col-provider'
                : 'erp-col-cost';
        return `<th class="${rowClass} ${thClass}">${escapeHtml(column.label)}</th>`;
    };

    const dynamicTopHeaderCells = [];
    const dynamicSecondHeaderCells = [];
    const insertedGroups = new Set();

    visibleColumns.forEach((column) => {
        const parentKey = String(column && column.parent ? column.parent : '').trim();
        const isStandalone = Boolean(column && column.standaloneGroup);
        const isChild = parentKey && !isStandalone;

        if (isChild) {
            if (!insertedGroups.has(parentKey)) {
                const parentColumn = getErpDiagramGroupParentColumnByKey(parentKey);
                const parentLabel = String(parentColumn && parentColumn.label ? parentColumn.label : parentKey);
                const childCount = Math.max(1, groupedChildCounts.get(parentKey) || 1);
                dynamicTopHeaderCells.push(`<th class="erp-h1 erp-col-group" colspan="${childCount}">${escapeHtml(parentLabel)}</th>`);
                insertedGroups.add(parentKey);
            }
            dynamicSecondHeaderCells.push(buildColumnHeader(column, 'erp-h2'));
            return;
        }

        const columnKey = String(column && column.key ? column.key : '').trim();
        const isMtsColumn = columnKey === ERP_DIAGRAM_METER_LENGTH_KEY;
        const thClass = isMtsColumn
            ? 'erp-col-mts'
            : column.type === 'qty'
            ? 'erp-col-qty'
            : column.type === 'provider'
                ? 'erp-col-provider'
                : 'erp-col-cost';
        dynamicTopHeaderCells.push(`<th class="erp-h1 ${thClass}"${staticHeaderRowSpan}>${escapeHtml(column.label)}</th>`);
    });

    const secondHeaderRow = hasSecondHeaderRow
        ? `<tr>${dynamicSecondHeaderCells.join('')}</tr>`
        : '';

    const header = `
        <table class="erp-diagram-zone-table">
            <thead>
                <tr>
                    <th class="erp-h1 erp-col-variant"${staticHeaderRowSpan}>V</th>
                    <th class="erp-h1 erp-col-id"${staticHeaderRowSpan}>Item ID</th>
                    <th class="erp-h1 erp-col-name"${staticHeaderRowSpan}>Nombre</th>
                    <th class="erp-h1 erp-col-description"${staticHeaderRowSpan}>Estado de Valor</th>
                    <th class="erp-h1 erp-col-date"${staticHeaderRowSpan}>Fecha</th>
                    <th class="erp-h1 erp-col-mp-type"${staticHeaderRowSpan}>Tipo de MP</th>
                    <th class="erp-h1 erp-col-material"${staticHeaderRowSpan}>Material</th>
                    <th class="erp-h1 erp-col-provider"${staticHeaderRowSpan}>Proveedor</th>
                    <th class="erp-h1 erp-col-kg"${staticHeaderRowSpan}>Kg</th>
                    ${dynamicTopHeaderCells.join('')}
                    <th class="erp-h1 erp-col-total"${staticHeaderRowSpan}>Costo Total</th>
                </tr>
                ${secondHeaderRow}
            </thead>
    `;

    const bodyRows = zoneRows.length
        ? zoneRows.map((row) => {
            const itemId = String(row && row.item_id ? row.item_id : '').trim();
            const item = plmById.get(itemId) || {};
            const rowId = String(row && row.id ? row.id : '');
            const rowIdJs = JSON.stringify(rowId);

            const zoneCategory = normalizeErpDiagramCategory(row && row.category ? row.category : category);
            const selectedMpType = String(row && row.mp_category ? row.mp_category : '').trim();
            const selectedMpMaterial = String(row && row.mp_material ? row.mp_material : '').trim();
            const selectedProvider = String(row && row.provider_id ? row.provider_id : '').trim();
            const hasValueStatusData = hasErpDiagramRowValueStatusData(row);
            const selectedValueStatus = hasValueStatusData
                ? normalizeErpValueStatus(row && row.value_status ? row.value_status : 'Supuesto')
                : '';
            const selectedValueDate = normalizeErpValueDate(row && (row.value_date || row.fecha_valor || row.fecha) ? (row.value_date || row.fecha_valor || row.fecha) : '');
            const valueStatusClass = hasValueStatusData
                ? getErpValueStatusToneClass(selectedValueStatus)
                : 'erp-value-status-empty';
            const zoneConfigMap = getErpDiagramZoneColumnConfigMap();
            const zoneConfig = zoneConfigMap[category] && typeof zoneConfigMap[category] === 'object' ? zoneConfigMap[category] : {};
            const canEditGroupCost = (parentKeyRaw) => {
                const parentKey = String(parentKeyRaw || '').trim();
                if (!parentKey) return false;
                const hasDetailChildVisible = getErpDiagramGroupChildColumns(parentKey).some((childColumn) => {
                    const childKey = String(childColumn && childColumn.key ? childColumn.key : '').trim();
                    if (!childKey) return false;
                    if (isErpDiagramMandatoryGroupChildKey(parentKey, childKey)) return false;
                    return zoneConfig[childKey] === true;
                });
                return !hasDetailChildVisible;
            };
            const mpTypeControl = isEditable
                ? `
                    <select class="erp-diagram-provider-select erp-diagram-mp-select" onchange='updateErpDiagramRowMpCategory(${rowIdJs}, this.value)'>
                        ${buildErpMpCategorySelectOptions(zoneCategory, selectedMpType)}
                    </select>
                `
                : `<div class="erp-diagram-cost-readonly">${escapeHtml(selectedMpType || '-')}</div>`;

            const mpMaterialControl = isEditable
                ? `
                    <select class="erp-diagram-provider-select erp-diagram-mp-select" onchange='updateErpDiagramRowMpMaterial(${rowIdJs}, this.value)'>
                        ${buildErpMpMaterialSelectOptions(zoneCategory, selectedMpType, selectedMpMaterial)}
                    </select>
                `
                : `<div class="erp-diagram-cost-readonly">${escapeHtml(selectedMpMaterial || '-')}</div>`;

            const providerControl = isEditable
                ? `
                    <select class="erp-diagram-provider-select" onchange='updateErpDiagramRowProvider(${rowIdJs}, this.value)'>
                        ${buildErpSupplierSelectOptions(selectedProvider, zoneCategory)}
                    </select>
                `
                : `<div class="erp-diagram-cost-readonly">${escapeHtml(getErpSupplierDisplayName(selectedProvider, '-'))}</div>`;
            const valueStatusControl = !hasValueStatusData
                ? `<div class="erp-diagram-cost-readonly erp-diagram-value-status-badge erp-value-status-empty">-</div>`
                : (isEditable
                ? `
                    <select class="erp-diagram-provider-select erp-diagram-value-status-select ${valueStatusClass}" onchange='updateErpDiagramRowField(${rowIdJs}, "value_status", this.value, this)'>
                        ${buildErpValueStatusSelectOptions(selectedValueStatus)}
                    </select>
                `
                : `<div class="erp-diagram-cost-readonly erp-diagram-value-status-badge ${valueStatusClass}">${escapeHtml(selectedValueStatus)}</div>`);
            const valueDateControl = isEditable
                ? `
                    <input
                        class="erp-diagram-cost-input erp-diagram-date-input"
                        type="text"
                        inputmode="numeric"
                        maxlength="10"
                        value="${escapeHtml(selectedValueDate)}"
                        placeholder="DD/MM/AAAA"
                        onchange='updateErpDiagramRowField(${rowIdJs}, "value_date", this.value, this)'
                    >
                `
                : `<div class="erp-diagram-cost-readonly erp-diagram-cost-readonly-flat erp-diagram-date-readonly">${escapeHtml(selectedValueDate || '-')}</div>`;

            const buildInput = (field, options = {}) => {
                const cls = options.className ? ` ${options.className}` : '';
                const rawValue = isErpDiagramGroupParentKey(field)
                    ? (String(field) === ERP_DIAGRAM_MACHINING_PARENT_KEY ? getErpDiagramMecanizadoRowValue(row) : getErpDiagramGroupValue(row, field))
                    : (row && row[field]);
                const isImportPercentField = String(field) === 'cost_importacion';
                const maxFractionDigits = getErpDiagramFieldMaxFractionDigits(row, field);
                const value = isImportPercentField
                    ? formatErpImportPercentInputValue(rawValue)
                    : formatErpDiagramEditableInputValue(rawValue, { maxFractionDigits });
                const placeholder = options.placeholder || getErpDiagramInputPlaceholder(field);
                const inputMode = options.inputMode || (String(field) === 'quoted_qty' ? 'numeric' : 'decimal');
                if (!isEditable) {
                    return `<div class="erp-diagram-cost-readonly erp-diagram-cost-readonly-flat">${escapeHtml(value || '-')}</div>`;
                }
                return `<input type="text" inputmode="${escapeHtml(inputMode)}" class="erp-diagram-cost-input${cls}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" autocomplete="off" onchange='updateErpDiagramRowField(${rowIdJs}, "${field}", this.value, this)'>`;
            };

            const dynamicCells = visibleColumns.map((column) => {
                const columnKey = String(column && column.key ? column.key : '').trim();
                const parentKey = getErpDiagramGroupParentKeyByChildKey(columnKey);
                if (column.type === 'qty') {
                    const qtyInputMode = columnKey === ERP_DIAGRAM_METER_LENGTH_KEY ? 'decimal' : 'numeric';
                    const qtyColClass = columnKey === ERP_DIAGRAM_METER_LENGTH_KEY ? 'erp-col-mts' : 'erp-col-qty';
                    return `<td class="${qtyColClass}">${buildInput(columnKey, { className: 'erp-diagram-qty-input', inputMode: qtyInputMode })}</td>`;
                }
                if (column.type === 'provider') {
                    const providerReadonlyClass = isEditable
                        ? 'erp-diagram-cost-readonly'
                        : 'erp-diagram-cost-readonly erp-diagram-cost-readonly-flat';
                    const selectedGroupProvider = String(row && row[columnKey] ? row[columnKey] : '').trim();
                    const providerKeyJs = JSON.stringify(columnKey);
                    const providerControl = isEditable
                        ? `
                            <select class="erp-diagram-provider-select" onchange='updateErpDiagramRowGroupProvider(${rowIdJs}, ${providerKeyJs}, this.value)'>
                                ${buildErpSupplierSelectOptions(selectedGroupProvider, zoneCategory, columnKey)}
                            </select>
                        `
                        : `<div class="${providerReadonlyClass}">${escapeHtml(getErpSupplierDisplayName(selectedGroupProvider, '-'))}</div>`;
                    return `<td class="erp-col-provider">${providerControl}</td>`;
                }
                if (isErpDiagramGroupCostChildKey(columnKey) && parentKey) {
                    const totalValue = parentKey === ERP_DIAGRAM_MACHINING_PARENT_KEY
                        ? getErpDiagramMecanizadoRowValue(row)
                        : getErpDiagramGroupValue(row, parentKey);
                    const allowEditCost = isEditable && canEditGroupCost(parentKey);
                    if (allowEditCost) {
                        return `<td class="erp-col-cost">${buildInput(parentKey)}</td>`;
                    }
                    const readonlyClass = isEditable
                        ? 'erp-diagram-cost-readonly'
                        : 'erp-diagram-cost-readonly erp-diagram-cost-readonly-flat';
                    const readonlyValue = formatErpDiagramEditableInputValue(totalValue, { maxFractionDigits: getErpDiagramFieldMaxFractionDigits(row, parentKey) });
                    return `<td class="erp-col-cost"><div class="${readonlyClass}">${escapeHtml(readonlyValue || '-')}</div></td>`;
                }
                return `<td class="erp-col-cost">${buildInput(columnKey)}</td>`;
            }).join('');

            const rowDragAttrs = isEditable
                ? `draggable="true" ondragstart='startErpDiagramRowDrag(event, ${rowIdJs})' ondragend="endErpDiagramRowDrag()"`
                : 'draggable="false"';

            return `
                <tr class="erp-diagram-row-draggable" data-erp-row-id="${escapeHtml(rowId)}" data-erp-category="${escapeHtml(category)}" ${rowDragAttrs}>
                    <td class="erp-col-variant">${escapeHtml(normalizeErpVariantCode(row && row.variant_code ? row.variant_code : '', 1))}</td>
                    <td class="erp-col-id">${escapeHtml(item.item_id || '-')}</td>
                    <td class="erp-col-name">${escapeHtml(item.name || '-')}</td>
                    <td class="erp-col-description">${valueStatusControl}</td>
                    <td class="erp-col-date">${valueDateControl}</td>
                    <td class="erp-col-mp-type">${mpTypeControl}</td>
                    <td class="erp-col-material">${mpMaterialControl}</td>
                    <td class="erp-col-provider">${providerControl}</td>
                    <td class="erp-col-kg">${buildInput('kg', { className: 'erp-diagram-kg-input', inputMode: 'decimal' })}</td>
                    ${dynamicCells}
                    <td class="erp-col-total erp-diagram-total-cell">${escapeHtml(formatErpDiagramRowTotal(row))}</td>
                </tr>
            `;
        }).join('')
        : `<tr><td colspan="${9 + visibleColumns.length}" class="erp-diagram-zone-empty">Sin piezas asignadas.</td></tr>`;

    return `${header}<tbody>${bodyRows}</tbody></table>`;
}

function queueErpDiagramPersist() {
    if (erpDiagramPersistTimer) {
        clearTimeout(erpDiagramPersistTimer);
        erpDiagramPersistTimer = null;
    }

    erpDiagramPersistTimer = setTimeout(() => {
        erpDiagramPersistTimer = null;
        persistCurrentWorkspace(true).catch((e) => {
            console.error(e);
            notifyProject('No se pudo guardar configuracion del diagrama ERP.', 'error');
        });
    }, 350);
}
function getErpSupplierGroupSupplyKey(providerFieldKeyRaw = '') {
    const providerFieldKey = String(providerFieldKeyRaw || '').trim();
    if (!providerFieldKey) return '';

    const parentKey = getErpDiagramGroupParentKeyByChildKey(providerFieldKey);
    const resolvedParentKey = parentKey || providerFieldKey;

    if (resolvedParentKey === ERP_DIAGRAM_MACHINING_PARENT_KEY || providerFieldKey === ERP_DIAGRAM_MACHINING_PROVIDER_CHILD_KEY) return 'Mecanizado';
    if (resolvedParentKey === ERP_DIAGRAM_TREATMENT_PARENT_KEY || providerFieldKey === ERP_DIAGRAM_TREATMENT_PROVIDER_CHILD_KEY) return 'Tratamiento';
    if (resolvedParentKey === ERP_DIAGRAM_PAINT_PARENT_KEY || providerFieldKey === ERP_DIAGRAM_PAINT_PROVIDER_CHILD_KEY) return 'Pintura';
    return '';
}

function supplierProvidesCategory(supplier, supplyCategoryRaw = '') {
    const target = String(supplyCategoryRaw || '').trim().toLowerCase();
    if (!target) return false;

    const supplies = Array.isArray(supplier && supplier.supplies) ? supplier.supplies : [];
    return supplies.some((supplyRaw) => {
        const supply = String(supplyRaw || '').trim().toLowerCase();
        if (!supply) return false;
        if (target === 'tratamiento') return supply === 'tratamiento' || supply === 'tratamientos';
        return supply === target;
    });
}

function getErpSupplierOptionValue(supplier) {
    const supplierId = String(supplier && supplier.id ? supplier.id : '').trim();
    if (supplierId) return `sup:${supplierId}`;
    const providerId = String(supplier && supplier.provider_id ? supplier.provider_id : '').trim();
    if (providerId) return providerId;
    return String(supplier && supplier.name ? supplier.name : '').trim();
}

function resolveErpSupplierFromSelection(selectionRaw) {
    const selection = String(selectionRaw || '').trim();
    if (!selection || selection === '-') return null;

    const suppliers = Array.isArray(currentWorkspaceProject && currentWorkspaceProject.erp_suppliers)
        ? currentWorkspaceProject.erp_suppliers
        : [];
    if (!suppliers.length) return null;

    if (selection.startsWith('sup:')) {
        const supplierId = selection.slice(4).trim();
        if (!supplierId) return null;
        return suppliers.find((supplier) => String(supplier && supplier.id ? supplier.id : '').trim() === supplierId) || null;
    }

    const byProviderId = suppliers.find((supplier) => String(supplier && supplier.provider_id ? supplier.provider_id : '').trim() === selection);
    if (byProviderId) return byProviderId;

    return suppliers.find((supplier) => String(supplier && supplier.name ? supplier.name : '').trim() === selection) || null;
}

function normalizeErpSupplierSelectionValue(selectionRaw) {
    const raw = String(selectionRaw || '').trim();
    if (!raw || raw === '-') return '';
    const supplier = resolveErpSupplierFromSelection(selectionRaw);
    return supplier ? getErpSupplierOptionValue(supplier) : raw;
}

function getErpSupplierDisplayName(selectionRaw, fallback = '-') {
    const supplier = resolveErpSupplierFromSelection(selectionRaw);
    if (supplier) {
        const name = String(supplier && supplier.name ? supplier.name : '').trim();
        const providerId = String(supplier && supplier.provider_id ? supplier.provider_id : '').trim();
        return name || providerId || fallback;
    }
    const selection = String(selectionRaw || '').trim();
    return selection || fallback;
}

function getErpSupplierCountryBySelection(selectionRaw, fallback = '-') {
    const supplier = resolveErpSupplierFromSelection(selectionRaw);
    if (supplier) {
        const country = String(supplier && supplier.country ? supplier.country : '').trim();
        return country || fallback;
    }
    return fallback;
}

function buildErpSupplierSelectOptions(selectedProviderId = '', zoneCategoryRaw = '', providerFieldKeyRaw = '') {
    const selected = normalizeErpSupplierSelectionValue(selectedProviderId);
    const zoneCategory = normalizeErpDiagramCategory(zoneCategoryRaw, '');
    const groupSupplyKey = getErpSupplierGroupSupplyKey(providerFieldKeyRaw);
    const suppliers = Array.isArray(currentWorkspaceProject && currentWorkspaceProject.erp_suppliers)
        ? currentWorkspaceProject.erp_suppliers
        : [];

    const filteredSuppliers = groupSupplyKey
        ? suppliers.filter((supplier) => supplierProvidesCategory(supplier, groupSupplyKey))
        : ((zoneCategory && zoneCategory !== ERP_UNASSIGNED_CATEGORY)
        ? suppliers.filter((supplier) => {
            return supplierProvidesCategory(supplier, zoneCategory);
        })
        : suppliers);

    const base = ['<option value="">-</option>'];
    filteredSuppliers.forEach((supplier) => {
        const value = getErpSupplierOptionValue(supplier);
        const name = String(supplier && supplier.name ? supplier.name : '').trim();
        if (!value) return;
        const selectedAttr = value === selected ? ' selected' : '';
        const providerId = String(supplier && supplier.provider_id ? supplier.provider_id : '').trim();
        const label = name || providerId || value;
        base.push(`<option value="${escapeHtml(value)}"${selectedAttr}>${escapeHtml(label)}</option>`);
    });

    return base.join('');
}

function buildErpValueStatusSelectOptions(selectedRaw = 'Supuesto') {
    const selected = normalizeErpValueStatus(selectedRaw, 'Supuesto');
    return ERP_DIAGRAM_VALUE_STATUS_OPTIONS.map((option) => {
        const selectedAttr = option === selected ? ' selected' : '';
        return `<option value="${escapeHtml(option)}"${selectedAttr}>${escapeHtml(option)}</option>`;
    }).join('');
}

function getErpRawMaterialCatalog() {
    const rows = Array.isArray(currentWorkspaceProject && currentWorkspaceProject.erp_raw_materials)
        ? currentWorkspaceProject.erp_raw_materials
        : [];

    const categories = [];
    const rowsByCategory = new Map();

    rows.forEach((row) => {
        const category = String(row && row.category ? row.category : '').trim();
        if (!category) return;

        if (!categories.includes(category)) categories.push(category);
        if (!rowsByCategory.has(category)) rowsByCategory.set(category, []);
        rowsByCategory.get(category).push(row);
    });

    return { categories, rowsByCategory };
}

function buildErpMpCategorySelectOptions(zoneCategoryRaw = '', selectedType = '') {
    const zoneCategory = String(zoneCategoryRaw || '').trim();
    const selected = String(selectedType || '').trim();
    const { rowsByCategory } = getErpRawMaterialCatalog();
    const rows = rowsByCategory.get(zoneCategory) || [];
    const base = ['<option value="">-</option>'];
    const used = new Set();

    rows.forEach((row) => {
        const reference = String(row && row.reference ? row.reference : '').trim();
        if (!reference || used.has(reference)) return;
        used.add(reference);
        const selectedAttr = reference === selected ? ' selected' : '';
        base.push(`<option value="${escapeHtml(reference)}"${selectedAttr}>${escapeHtml(reference)}</option>`);
    });

    return base.join('');
}

function buildErpMpMaterialSelectOptions(zoneCategoryRaw = '', selectedTypeRaw = '', selectedMaterial = '') {
    const zoneCategory = String(zoneCategoryRaw || '').trim();
    const selectedType = String(selectedTypeRaw || '').trim();
    const selected = String(selectedMaterial || '').trim();
    const { rowsByCategory } = getErpRawMaterialCatalog();
    const categoryRows = rowsByCategory.get(zoneCategory) || [];
    const rows = selectedType
        ? categoryRows.filter((row) => String(row && row.reference ? row.reference : '').trim() === selectedType)
        : categoryRows;

    const base = ['<option value="">-</option>'];
    const used = new Set();

    rows.forEach((row) => {
        const material = String(row && row.material ? row.material : '').trim();
        if (!material || used.has(material)) return;
        used.add(material);
        const selectedAttr = material === selected ? ' selected' : '';
        base.push(`<option value="${escapeHtml(material)}"${selectedAttr}>${escapeHtml(material)}</option>`);
    });

    return base.join('');
}

function getErpMpReferenceForSelection(zoneCategoryRaw = '', selectedTypeRaw = '', selectedMaterialRaw = '') {
    const zoneCategory = String(zoneCategoryRaw || '').trim();
    const selectedType = String(selectedTypeRaw || '').trim();
    const selectedMaterial = String(selectedMaterialRaw || '').trim();
    const { rowsByCategory } = getErpRawMaterialCatalog();
    const rows = rowsByCategory.get(zoneCategory) || [];

    if (selectedType) return selectedType;

    const byMaterial = selectedMaterial
        ? rows.filter((row) => String(row && row.material ? row.material : '').trim() === selectedMaterial)
        : rows;

    const found = (byMaterial[0] || rows[0] || null);
    return String(found && found.reference ? found.reference : '').trim();
}

function setErpDiagramZoneColumnVisibility(categoryRaw, keyRaw, isVisible) {
    const category = normalizeErpDiagramCategory(categoryRaw, '');
    const key = String(keyRaw || '').trim();
    if (!category || !key) return;

    const map = getErpDiagramZoneColumnConfigMap();
    if (!map[category] || typeof map[category] !== 'object') map[category] = {};

    const visible = Boolean(isVisible);
    if (key === ERP_DIAGRAM_METER_PACK_KEY) {
        map[category][ERP_DIAGRAM_METER_LENGTH_KEY] = visible;
        map[category][ERP_DIAGRAM_METER_COST_KEY] = visible;
        map[category][ERP_DIAGRAM_METER_PACK_KEY] = visible;
        queueErpDiagramPersist();
        renderErpDiagramGraph();
        return;
    }

    map[category][key] = visible;

    const parentKey = getErpDiagramGroupParentKeyByChildKey(key);
    if (parentKey && visible) {
        map[category][parentKey] = true;
    }

    if (isErpDiagramGroupParentKey(key) && visible) {
        const mandatoryCostKey = getErpDiagramGroupCostChildKey(key);
        const mandatoryProviderKey = getErpDiagramGroupProviderChildKey(key);
        if (mandatoryCostKey) map[category][mandatoryCostKey] = true;
        if (mandatoryProviderKey) map[category][mandatoryProviderKey] = true;
    }

    if (isErpDiagramGroupParentKey(key) && !visible) {
        getErpDiagramGroupChildColumns(key).forEach((childColumn) => {
            const childKey = String(childColumn && childColumn.key ? childColumn.key : '').trim();
            if (!childKey) return;
            map[category][childKey] = false;
        });
    }

    if (parentKey && isErpDiagramMandatoryGroupChildKey(parentKey, key) && !visible) {
        map[category][key] = true;
    }

    queueErpDiagramPersist();
    renderErpDiagramGraph();
}

function isErpHalfStepZoneCategory(categoryRaw) {
    const category = normalizeErpDiagramCategory(categoryRaw, '');
    return category === ERP_UNASSIGNED_CATEGORY || category === ERP_STRUCTURAL_CATEGORY;
}

function getErpZoneGridStep(categoryRaw) {
    return isErpHalfStepZoneCategory(categoryRaw) ? 0.5 : 1;
}

function getErpZoneMinSpan(categoryRaw) {
    return isErpHalfStepZoneCategory(categoryRaw) ? 0.5 : 1;
}

function snapErpZoneGridValue(valueRaw, categoryRaw, fallback = 0, minRaw = null) {
    const step = getErpZoneGridStep(categoryRaw);
    const value = toNumber(valueRaw, fallback);
    const snapped = Math.round((value / step) + Number.EPSILON) * step;
    const rounded = Math.round(snapped * 1000) / 1000;
    if (minRaw === null || minRaw === undefined) return rounded;
    return Math.max(toNumber(minRaw, 0), rounded);
}

function getErpZoneSpanWorldSize(spanRaw, cellSizeRaw, gapSizeRaw) {
    const span = Math.max(0, toNumber(spanRaw, 0));
    const cellSize = Math.max(1, toNumber(cellSizeRaw, 1));
    const gapSize = Math.max(0, toNumber(gapSizeRaw, 0));
    if (span <= 1) return span * cellSize;
    return (span * cellSize) + ((Math.ceil(span) - 1) * gapSize);
}

function getErpDiagramLayoutMap() {
    if (!currentWorkspaceProject) return {};

    if (!currentWorkspaceProject.erp_diagram_layout || typeof currentWorkspaceProject.erp_diagram_layout !== 'object') {
        currentWorkspaceProject.erp_diagram_layout = {};
    }

    const map = currentWorkspaceProject.erp_diagram_layout;
    ERP_DIAGRAM_ZONES.forEach((category, idx) => {
        const source = map[category] && typeof map[category] === 'object' ? map[category] : {};
        const minSpan = getErpZoneMinSpan(category);
        map[category] = {
            col: snapErpZoneGridValue(source.col, category, idx % ERP_DIAGRAM_GRID_COLUMNS),
            row: snapErpZoneGridValue(source.row, category, Math.floor(idx / ERP_DIAGRAM_GRID_COLUMNS)),
            w: snapErpZoneGridValue(source.w, category, 1, minSpan),
            h: snapErpZoneGridValue(source.h, category, 1, minSpan)
        };
    });

    return map;
}

function cloneErpDiagramLayoutMap(sourceMap) {
    const src = sourceMap && typeof sourceMap === 'object' ? sourceMap : {};
    const copy = {};

    ERP_DIAGRAM_ZONES.forEach((category, idx) => {
        const source = src[category] && typeof src[category] === 'object' ? src[category] : {};
        const minSpan = getErpZoneMinSpan(category);
        copy[category] = {
            col: snapErpZoneGridValue(source.col, category, idx % ERP_DIAGRAM_GRID_COLUMNS),
            row: snapErpZoneGridValue(source.row, category, Math.floor(idx / ERP_DIAGRAM_GRID_COLUMNS)),
            w: snapErpZoneGridValue(source.w, category, 1, minSpan),
            h: snapErpZoneGridValue(source.h, category, 1, minSpan)
        };
    });

    return copy;
}

function doErpGridRectsOverlap(a, b) {
    const aMinCol = toNumber(a && a.col, 0);
    const aMinRow = toNumber(a && a.row, 0);
    const aMaxCol = aMinCol + Math.max(0.01, toNumber(a && a.w, 1));
    const aMaxRow = aMinRow + Math.max(0.01, toNumber(a && a.h, 1));

    const bMinCol = toNumber(b && b.col, 0);
    const bMinRow = toNumber(b && b.row, 0);
    const bMaxCol = bMinCol + Math.max(0.01, toNumber(b && b.w, 1));
    const bMaxRow = bMinRow + Math.max(0.01, toNumber(b && b.h, 1));

    return aMinCol < bMaxCol && aMaxCol > bMinCol && aMinRow < bMaxRow && aMaxRow > bMinRow;
}

function isErpZoneLayoutChangeValid(categoryRaw, proposalRaw, sourceMap = null) {
    const category = normalizeErpDiagramCategory(categoryRaw, '');
    if (!category) return false;
    const minSpan = getErpZoneMinSpan(category);

    const proposal = {
        col: snapErpZoneGridValue(proposalRaw && proposalRaw.col, category, 0),
        row: snapErpZoneGridValue(proposalRaw && proposalRaw.row, category, 0),
        w: snapErpZoneGridValue(proposalRaw && proposalRaw.w, category, 1, minSpan),
        h: snapErpZoneGridValue(proposalRaw && proposalRaw.h, category, 1, minSpan)
    };

    const layoutMap = cloneErpDiagramLayoutMap(sourceMap || getErpDiagramLayoutMap());
    layoutMap[category] = proposal;

    const categories = ERP_DIAGRAM_ZONES.slice();
    for (let i = 0; i < categories.length; i += 1) {
        const a = layoutMap[categories[i]];
        if (!a) continue;
        for (let j = i + 1; j < categories.length; j += 1) {
            const b = layoutMap[categories[j]];
            if (!b) continue;
            if (doErpGridRectsOverlap(a, b)) return false;
        }
    }

    return true;
}

function getErpCategoryGridLayout(customLayoutMap = null) {
    const layoutMap = cloneErpDiagramLayoutMap(customLayoutMap || getErpDiagramLayoutMap());
    const cellWidth = Math.max(420, ERP_DIAGRAM_CELL_BASE_WIDTH);
    const cellHeight = Math.max(420, ERP_DIAGRAM_CELL_BASE_HEIGHT);
    const gapX = Math.max(0, ERP_DIAGRAM_CELL_GAP_X);
    const gapY = Math.max(0, ERP_DIAGRAM_CELL_GAP_Y);
    const pitchX = cellWidth + gapX;
    const pitchY = cellHeight + gapY;

    const baseZones = ERP_DIAGRAM_ZONES.map((name, idx) => {
        const cfg = layoutMap[name] || { col: idx % ERP_DIAGRAM_GRID_COLUMNS, row: Math.floor(idx / ERP_DIAGRAM_GRID_COLUMNS), w: 1, h: 1 };
        const minSpan = getErpZoneMinSpan(name);
        const col = snapErpZoneGridValue(cfg.col, name, idx % ERP_DIAGRAM_GRID_COLUMNS);
        const row = snapErpZoneGridValue(cfg.row, name, Math.floor(idx / ERP_DIAGRAM_GRID_COLUMNS));
        const w = snapErpZoneGridValue(cfg.w, name, 1, minSpan);
        const h = snapErpZoneGridValue(cfg.h, name, 1, minSpan);

        const x = col * pitchX;
        const y = row * pitchY;
        const width = Math.max(1, getErpZoneSpanWorldSize(w, cellWidth, gapX));
        const height = Math.max(1, getErpZoneSpanWorldSize(h, cellHeight, gapY));

        return {
            name,
            index: idx,
            col,
            row,
            w,
            h,
            rawMinX: x,
            rawMaxX: x + width,
            rawMinY: y,
            rawMaxY: y + height,
            rawCx: x + (width / 2),
            rawCy: y + (height / 2),
            size: Math.max(cellWidth, cellHeight),
            cellWidth,
            cellHeight,
            width,
            height
        };
    });

    const minX = Math.min(...baseZones.map((zone) => zone.rawMinX));
    const maxX = Math.max(...baseZones.map((zone) => zone.rawMaxX));
    const minY = Math.min(...baseZones.map((zone) => zone.rawMinY));
    const maxY = Math.max(...baseZones.map((zone) => zone.rawMaxY));

    const totalWidth = Math.max(cellWidth, maxX - minX);
    const totalHeight = Math.max(cellHeight, maxY - minY);
    const offsetX = -minX - (totalWidth / 2);
    const offsetY = -minY - (totalHeight / 2);

    const zones = baseZones.map((zone) => ({
        ...zone,
        minX: zone.rawMinX + offsetX,
        maxX: zone.rawMaxX + offsetX,
        minY: zone.rawMinY + offsetY,
        maxY: zone.rawMaxY + offsetY,
        cx: zone.rawCx + offsetX,
        cy: zone.rawCy + offsetY
    }));

    return {
        cell: Math.max(cellWidth, cellHeight),
        gap: Math.max(gapX, gapY),
        pitch: pitchX,
        cellWidth,
        cellHeight,
        gapX,
        gapY,
        pitchX,
        pitchY,
        totalWidth,
        totalHeight,
        offsetX,
        offsetY,
        zones,
        layoutMap
    };
}

function getErpCategoryZone(categoryRaw, customLayoutMap = null) {
    const category = normalizeErpDiagramCategory(categoryRaw);
    const layout = getErpCategoryGridLayout(customLayoutMap);
    return layout.zones.find((zone) => zone.name === category) || null;
}

function getErpCategoryFromPosition(xRaw, yRaw, customLayoutMap = null) {
    const x = toNumber(xRaw, NaN);
    const y = toNumber(yRaw, NaN);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return ERP_UNASSIGNED_CATEGORY;

    const layout = getErpCategoryGridLayout(customLayoutMap);
    const zone = layout.zones.find((item) => x >= item.minX && x <= item.maxX && y >= item.minY && y <= item.maxY);
    return zone ? zone.name : ERP_UNASSIGNED_CATEGORY;
}

function getStableAngleFromString(seedRaw) {
    const seed = String(seedRaw || '0');
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }
    const normalized = Math.abs(hash % 360);
    return (normalized * Math.PI) / 180;
}

function getErpDefaultNodePoint(itemId, index, total, category = '', customLayoutMap = null) {
    const idx = Math.max(0, toNumber(index, 0));
    const count = Math.max(1, toNumber(total, 1));
    const zone = getErpCategoryZone(category, customLayoutMap);

    if (!zone) {
        const angle = (-Math.PI / 2) + ((idx / count) * Math.PI * 2);
        const radius = 240;
        return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    }

    const seedJitter = getStableAngleFromString(itemId) * 6;
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.max(1, Math.ceil(count / cols));
    const bounds = getErpZoneNodeBounds(zone);

    const col = idx % cols;
    const row = Math.floor(idx / cols);

    const tx = cols <= 1 ? 0.5 : (col / (cols - 1));
    const ty = rows <= 1 ? 0.5 : (row / (rows - 1));

    const x = bounds.minX + ((bounds.maxX - bounds.minX) * tx) + Math.cos(seedJitter) * 8;
    const y = bounds.minY + ((bounds.maxY - bounds.minY) * ty) + Math.sin(seedJitter) * 8;

    const clamped = clampErpPointToZone(x, y, zone);
    return {
        x: Math.round(toNumber(clamped.x, x)),
        y: Math.round(toNumber(clamped.y, y))
    };
}

function erpWorldFromClient(clientX, clientY, host, width, height) {
    const rect = host.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    const worldX = (sx - (width / 2) - erpDiagramViewState.panX) / Math.max(erpDiagramViewState.scale, 0.0001);
    const worldY = (sy - (height / 2) - erpDiagramViewState.panY) / Math.max(erpDiagramViewState.scale, 0.0001);

    return { x: worldX, y: worldY, sx, sy };
}

function buildErpViewportTransform(width, height) {
    return `translate(${(width / 2) + erpDiagramViewState.panX} ${(height / 2) + erpDiagramViewState.panY}) scale(${erpDiagramViewState.scale})`;
}

function fitErpDiagramViewToLayout(layout, width, height) {
    if (!layout) return;

    const totalWidth = Math.max(1, toNumber(layout.totalWidth, 1));
    const totalHeight = Math.max(1, toNumber(layout.totalHeight, 1));
    const availWidth = Math.max(120, toNumber(width, 0) - 140);
    const availHeight = Math.max(120, toNumber(height, 0) - 140);

    const scaleByWidth = availWidth / totalWidth;
    const scaleByHeight = availHeight / totalHeight;
    const fittedScale = Math.min(scaleByWidth, scaleByHeight);

    erpDiagramViewState.scale = Math.max(
        erpDiagramViewState.minScale,
        Math.min(erpDiagramViewState.maxScale, fittedScale)
    );
    erpDiagramViewState.panX = 0;
    erpDiagramViewState.panY = 0;
}

function getErpDiagramRowsByItem() {
    const rows = getErpDiagramRows();
    const map = new Map();

    rows.forEach((row) => {
        const itemId = String(row && row.item_id ? row.item_id : '').trim();
        if (!itemId) return;
        if (!map.has(itemId)) map.set(itemId, []);
        map.get(itemId).push(row);
    });

    map.forEach((groupRows) => groupRows.sort(compareErpDiagramRows));
    return map;
}
function upsertErpDiagramRow(itemIdRaw, categoryRaw, xRaw, yRaw) {
    if (!currentWorkspaceProject) return null;

    const itemId = String(itemIdRaw || '').trim();
    const category = normalizeErpDiagramCategory(categoryRaw);
    if (!itemId) return null;

    const rows = getErpDiagramRows();
    const idx = rows.findIndex((row) => String(row && row.item_id ? row.item_id : '').trim() === itemId);

    const x = toNumber(xRaw, NaN);
    const y = toNumber(yRaw, NaN);

    if (idx >= 0) {
        const row = rows[idx];
        row.category = normalizeErpDiagramCategory(category);
        row.x = x;
        row.y = y;
        return row;
    }

    const created = normalizeErpDiagramRow({
        id: `edr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        item_id: itemId,
        variant_code: getNextErpVariantCodeForItem(itemId),
        category: normalizeErpDiagramCategory(category),
        provider_id: '',
        [ERP_DIAGRAM_MACHINING_PROVIDER_CHILD_KEY]: '',
        [ERP_DIAGRAM_TREATMENT_PROVIDER_CHILD_KEY]: '',
        [ERP_DIAGRAM_PAINT_PROVIDER_CHILD_KEY]: '',
        value_status: 'Supuesto',
        value_date: '',
        mp_category: '',
        mp_material: '',
        mp_reference: '',
        x,
        y,
        cost_mp_x_kg: 0,
        mts: 0,
        cost_mp_x_mt: 0,
        cost_mp: 0,
        cost_mecanizado: 0,
        cost_mecanizado_torno: 0,
        cost_mecanizado_cnc: 0,
        cost_mecanizado_serrucho: 0,
        cost_mecanizado_corte_laser: 0,
        cost_mecanizado_plegado: 0,
        cost_mecanizado_agujereadora: 0,
        cost_mecanizado_soldadora: 0,
        cost_mecanizado_mano_obra: 0,
        cost_tratamiento: 0,
        cost_tratamiento_superficial: 0,
        cost_pintado: 0,
        cost_tratamiento_termico: 0,
        cost_importacion: 0,
        cost_matriceria: 0
    });

    rows.push(created);
    return created;
}

function assignPlmItemToErpDiagramCategory(itemIdRaw, categoryRaw, xRaw = NaN, yRaw = NaN) {
    if (!currentWorkspaceProject) return;

    const itemId = String(itemIdRaw || '').trim();
    const category = normalizeErpDiagramCategory(categoryRaw);
    if (!itemId) return;

    const items = Array.isArray(currentWorkspaceProject.plm_items) ? currentWorkspaceProject.plm_items : [];
    const exists = items.some((item) => String(item && item.id ? item.id : '').trim() === itemId);
    if (!exists) return;

    upsertErpDiagramRow(itemId, category, xRaw, yRaw);
    renderErpDiagramGraph();
    queueErpDiagramPersist();
}


function normalizeErpDiagramRowByCategory(row, previousCategoryRaw = '') {
    if (!row) return;

    const category = normalizeErpDiagramCategory(row.category);
    const previousCategory = normalizeErpDiagramCategory(previousCategoryRaw, '');

    const clearMaterialSelection = () => {
        row.mp_category = '';
        row.mp_material = '';
        row.mp_reference = '';
        row.provider_id = '';
    };

    if (category === ERP_UNASSIGNED_CATEGORY) {
        clearMaterialSelection();
        return;
    }

    if (previousCategory && previousCategory !== category) {
        clearMaterialSelection();
        return;
    }

    const { rowsByCategory } = getErpRawMaterialCatalog();
    const categoryRows = rowsByCategory.get(category) || [];

    const selectedType = String(row.mp_category || '').trim();
    if (!selectedType) {
        row.mp_material = '';
        row.mp_reference = '';
        row.provider_id = '';
        return;
    }

    const typeRows = categoryRows.filter((entry) => String(entry && entry.reference ? entry.reference : '').trim() === selectedType);
    if (!typeRows.length) {
        clearMaterialSelection();
        return;
    }

    const selectedMaterial = String(row.mp_material || '').trim();
    const materialValid = selectedMaterial
        ? typeRows.some((entry) => String(entry && entry.material ? entry.material : '').trim() === selectedMaterial)
        : false;
    if (!materialValid) row.mp_material = '';

    row.mp_reference = selectedType;
}

function assignErpDiagramRowToCategory(rowIdRaw, categoryRaw, xRaw = NaN, yRaw = NaN) {
    if (!isErpDiagramContentEditingAllowed(false)) return;

    const rowId = String(rowIdRaw || '').trim();
    if (!rowId) return;

    const row = getErpDiagramRowById(rowId);
    if (!row) return;

    const previousCategory = normalizeErpDiagramCategory(row.category, '');
    row.category = normalizeErpDiagramCategory(categoryRaw);
    normalizeErpDiagramRowByCategory(row, previousCategory);

    row.x = toNumber(xRaw, NaN);
    row.y = toNumber(yRaw, NaN);

    renderErpDiagramGraph();
    queueErpDiagramPersist();
}

function autoArrangeErpDiagramNodes() {
    if (!currentWorkspaceProject) return;
    if (!isErpDiagramContentEditingAllowed(true)) return;

    const rows = getErpDiagramRows();
    if (!rows.length) {
        notifyProject('No hay nodos asignados para distribuir.', 'error');
        return;
    }

    // Conjuntos/Subconjuntos del BOM se agrupan en su zona dedicada al distribuir.
    const plmItems = Array.isArray(currentWorkspaceProject.plm_items) ? currentWorkspaceProject.plm_items : [];
    const plmById = new Map();
    plmItems.forEach((item) => {
        const id = String(item && item.id ? item.id : '').trim();
        if (id) plmById.set(id, item);
    });

    rows.forEach((row) => {
        const itemId = String(row && row.item_id ? row.item_id : '').trim();
        const item = itemId ? (plmById.get(itemId) || null) : null;
        const bomCategory = item ? getBomCategory(item) : '';
        const isStructural = isErpStructuralBomCategory(bomCategory);
        const isBuloneria = String(bomCategory || '').trim() === 'Buloneria';

        const previousCategory = normalizeErpDiagramCategory(row && row.category ? row.category : '', ERP_UNASSIGNED_CATEGORY);
        let nextCategory = previousCategory;

        if (isStructural) {
            nextCategory = ERP_STRUCTURAL_CATEGORY;
        } else if (isBuloneria) {
            nextCategory = 'Bulones';
        } else if (previousCategory === ERP_STRUCTURAL_CATEGORY) {
            nextCategory = ERP_UNASSIGNED_CATEGORY;
        }

        if (String(row.category || '').trim() === nextCategory) return;

        row.category = nextCategory;
        normalizeErpDiagramRowByCategory(row, previousCategory);
    });

    const layoutMap = cloneErpDiagramLayoutMap(getErpDiagramLayoutMap());
    ERP_DIAGRAM_ZONES.forEach((category) => {
        const group = rows.filter((row) => String(row && row.category ? row.category : '') === category).sort(compareErpDiagramRows);
        const total = group.length;
        if (!total) return;

        const isNodeGridZone = isErpDiagramNodeZoneCategory(category);
        const maxNodeHalfHeight = isNodeGridZone
            ? group.reduce((acc, row) => {
                const itemId = String(row && row.item_id ? row.item_id : '').trim();
                const item = itemId ? (plmById.get(itemId) || null) : null;
                return Math.max(acc, getErpDiagramNodeRenderHalfHeight(item && item.name ? item.name : ''));
            }, ERP_DIAGRAM_NODE_HALF_HEIGHT)
            : ERP_DIAGRAM_NODE_HALF_HEIGHT;

        group.forEach((row, idx) => {
            let point;

            if (isNodeGridZone) {
                point = getErpNodeZoneGridPoint(category, idx, total, layoutMap, maxNodeHalfHeight);
            } else {
                point = getErpDefaultNodePoint(`${String(row && row.item_id ? row.item_id : idx)}-${normalizeErpVariantCode(row && row.variant_code ? row.variant_code : '', 1)}-${String(row && row.id ? row.id : idx)}`, idx, total, category, layoutMap);
            }

            row.x = Math.round(point.x);
            row.y = Math.round(point.y);
        });
    });

    renderErpDiagramGraph();
    queueErpDiagramPersist();
}

function renderErpDiagramGraph() {
    const host = document.getElementById('erp-diagram-graph');
    if (!host || !currentWorkspaceProject) return;
    const canEditContent = isErpDiagramContentEditingAllowed(false);
    const canEditGrid = isErpDiagramGridEditingAllowed(false);

    if (erpDiagramZoomUiTimer) {
        clearTimeout(erpDiagramZoomUiTimer);
        erpDiagramZoomUiTimer = null;
    }
    host.classList.remove('zooming');

    ensureGraphFullscreenBindings();
    updateGraphMaximizeButtons();

    const width = Math.max(host.clientWidth || 960, 760);
    const height = Math.max(host.clientHeight || 860, 560);

    host.innerHTML = '';
    host.oncontextmenu = (ev) => ev.preventDefault();
    host.ondragover = (ev) => {
        if (!canEditContent) return;
        if (!erpDiagramRowDragState) return;
        ev.preventDefault();
        if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
    };
    host.ondrop = (ev) => {
        if (!canEditContent) return;
        if (!erpDiagramRowDragState) return;
        ev.preventDefault();

        const drag = erpDiagramRowDragState;
        erpDiagramRowDragState = null;

        const row = getErpDiagramRowById(String(drag && drag.rowId ? drag.rowId : ''));
        if (!row) return;

        const world = erpWorldFromClient(ev.clientX, ev.clientY, host, width, height);
        const category = getErpCategoryFromPosition(world.x, world.y, cloneErpDiagramLayoutMap(getErpDiagramLayoutMap()));

        assignErpDiagramRowToCategory(
            String(row && row.id ? row.id : ''),
            category,
            Math.round(toNumber(world.x, row.x)),
            Math.round(toNumber(world.y, row.y))
        );
    };

    const editModeBtn = document.getElementById('erp-diagram-edit-btn');
    if (editModeBtn) {
        editModeBtn.classList.toggle('btn-primary', canEditContent);
        editModeBtn.textContent = '\u270E';
        editModeBtn.title = canEditContent
            ? 'Salir de edicion de contenido'
            : 'Entrar en edicion de contenido';
        editModeBtn.setAttribute('aria-label', editModeBtn.title);
    }

    const gridEditBtn = document.getElementById('erp-diagram-grid-edit-btn');
    if (gridEditBtn) {
        gridEditBtn.classList.toggle('btn-primary', canEditGrid);
        gridEditBtn.textContent = canEditGrid ? 'Finalizar Cuadricula' : 'Modificar Cuadricula';
        gridEditBtn.title = canEditGrid
            ? 'Salir de edicion de cuadricula'
            : 'Entrar en edicion de cuadricula';
        gridEditBtn.setAttribute('aria-label', gridEditBtn.title);
    }

    const autoBtn = document.getElementById('erp-diagram-auto-btn');
    if (autoBtn) {
        autoBtn.disabled = !canEditContent;
        autoBtn.title = canEditContent
            ? 'Distribuir nodos'
            : 'Disponible solo al editar contenido';
    }

    const persistedLayoutMap = cloneErpDiagramLayoutMap(getErpDiagramLayoutMap());
    const syncResult = ensureErpDiagramRowsSynced(persistedLayoutMap);
    if (syncResult.changed) queueErpDiagramPersist();

    const rows = getErpDiagramRows();

    const baseLayoutMap = cloneErpDiagramLayoutMap(persistedLayoutMap);
    if (erpDiagramZoneDragState && erpDiagramZoneDragState.preview && ERP_DIAGRAM_ZONES.includes(String(erpDiagramZoneDragState.category || ''))) {
        const previewCategory = String(erpDiagramZoneDragState.category || '');
        const minSpan = getErpZoneMinSpan(previewCategory);
        baseLayoutMap[String(erpDiagramZoneDragState.category)] = {
            col: snapErpZoneGridValue(erpDiagramZoneDragState.preview.col, previewCategory, 0),
            row: snapErpZoneGridValue(erpDiagramZoneDragState.preview.row, previewCategory, 0),
            w: snapErpZoneGridValue(erpDiagramZoneDragState.preview.w, previewCategory, 1, minSpan),
            h: snapErpZoneGridValue(erpDiagramZoneDragState.preview.h, previewCategory, 1, minSpan)
        };
    }

    const layout = getErpCategoryGridLayout(baseLayoutMap);
    const zonesByCategory = new Map(layout.zones.map((zone) => [String(zone.name || ''), zone]));

    const workspaceProjectId = String(currentWorkspaceProject && currentWorkspaceProject.id ? currentWorkspaceProject.id : '').trim();
    if (workspaceProjectId && erpDiagramAutoFitProjectId !== workspaceProjectId) {
        fitErpDiagramViewToLayout(layout, width, height);
        erpDiagramAutoFitProjectId = workspaceProjectId;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'erp-diagram-svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    host.appendChild(svg);

    const viewport = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    viewport.setAttribute('class', 'erp-diagram-viewport');
    const applyViewportTransform = () => {
        viewport.setAttribute('transform', buildErpViewportTransform(width, height));
    };
    applyViewportTransform();
    svg.appendChild(viewport);

    let erpWheelZoomRaf = null;
    let erpWheelZoomFactor = 1;
    let erpWheelClientX = 0;
    let erpWheelClientY = 0;
    const clearErpDiagramZooming = () => {
        if (erpDiagramZoomUiTimer) {
            clearTimeout(erpDiagramZoomUiTimer);
            erpDiagramZoomUiTimer = null;
        }
        host.classList.remove('zooming');
    };
    const markErpDiagramZooming = () => {
        host.classList.add('zooming');
        if (erpDiagramZoomUiTimer) clearTimeout(erpDiagramZoomUiTimer);
        erpDiagramZoomUiTimer = setTimeout(() => {
            erpDiagramZoomUiTimer = null;
            host.classList.remove('zooming');
        }, 140);
    };

    const flushErpWheelZoom = () => {
        erpWheelZoomRaf = null;
        const factor = toNumber(erpWheelZoomFactor, 1);
        erpWheelZoomFactor = 1;
        if (!Number.isFinite(factor) || factor <= 0) return;

        const world = erpWorldFromClient(erpWheelClientX, erpWheelClientY, host, width, height);
        const prevScale = toNumber(erpDiagramViewState.scale, 1);
        const nextScale = Math.max(erpDiagramViewState.minScale, Math.min(erpDiagramViewState.maxScale, prevScale * factor));
        if (Math.abs(nextScale - prevScale) < 0.0001) return;

        erpDiagramViewState.scale = nextScale;

        const rect = host.getBoundingClientRect();
        const sx = erpWheelClientX - rect.left;
        const sy = erpWheelClientY - rect.top;
        erpDiagramViewState.panX = sx - (width / 2) - (world.x * nextScale);
        erpDiagramViewState.panY = sy - (height / 2) - (world.y * nextScale);
        applyViewportTransform();
    };

    const scheduleErpWheelZoom = (ev) => {
        if (!ev) return;
        ev.preventDefault();

        const factor = ev.deltaY < 0 ? 1.12 : 0.88;
        const nextAccumFactor = erpWheelZoomFactor * factor;
        const currentScale = toNumber(erpDiagramViewState.scale, 1);
        const projectedScale = Math.max(
            erpDiagramViewState.minScale,
            Math.min(erpDiagramViewState.maxScale, currentScale * nextAccumFactor)
        );
        if (projectedScale <= ERP_DIAGRAM_ZOOM_HIDE_UI_MAX_SCALE) {
            markErpDiagramZooming();
        } else {
            clearErpDiagramZooming();
        }

        erpWheelZoomFactor = nextAccumFactor;
        erpWheelClientX = ev.clientX;
        erpWheelClientY = ev.clientY;
        if (erpWheelZoomRaf != null) return;
        erpWheelZoomRaf = window.requestAnimationFrame(flushErpWheelZoom);
    };

    const handleErpDiagramWheel = (ev) => {
        scheduleErpWheelZoom(ev);
    };

    const beginErpDiagramPan = (mouseEv) => {
        if (!mouseEv || mouseEv.button !== 2) return;
        mouseEv.preventDefault();

        erpDiagramPanState = {
            startClientX: mouseEv.clientX,
            startClientY: mouseEv.clientY,
            startPanX: erpDiagramViewState.panX,
            startPanY: erpDiagramViewState.panY
        };
        host.classList.add('panning');

        const onMove = (moveEv) => {
            if (!erpDiagramPanState) return;
            erpDiagramViewState.panX = erpDiagramPanState.startPanX + (moveEv.clientX - erpDiagramPanState.startClientX);
            erpDiagramViewState.panY = erpDiagramPanState.startPanY + (moveEv.clientY - erpDiagramPanState.startClientY);
            applyViewportTransform();
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            erpDiagramPanState = null;
            host.classList.remove('panning');
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const beginZoneInteraction = (mode, zone, mouseEv) => {
        if (!zone || !mode) return;
        mouseEv.stopPropagation();
        mouseEv.preventDefault();

        const zoneCategory = String(zone.name || '');
        const gridStep = getErpZoneGridStep(zoneCategory);
        const minSpan = getErpZoneMinSpan(zoneCategory);
        const start = erpWorldFromClient(mouseEv.clientX, mouseEv.clientY, host, width, height);
        erpDiagramZoneDragState = {
            category: zoneCategory,
            mode: String(mode),
            startX: start.x,
            startY: start.y,
            base: {
                col: snapErpZoneGridValue(zone.col, zoneCategory, 0),
                row: snapErpZoneGridValue(zone.row, zoneCategory, 0),
                w: snapErpZoneGridValue(zone.w, zoneCategory, 1, minSpan),
                h: snapErpZoneGridValue(zone.h, zoneCategory, 1, minSpan)
            },
            preview: null,
            moved: false
        };

        const onMove = (moveEv) => {
            if (!erpDiagramZoneDragState) return;

            const current = erpWorldFromClient(moveEv.clientX, moveEv.clientY, host, width, height);
            const pitchX = Math.max(1, toNumber(layout && layout.pitchX, layout && layout.pitch ? layout.pitch : 1));
            const pitchY = Math.max(1, toNumber(layout && layout.pitchY, layout && layout.pitch ? layout.pitch : 1));
            const movePitchX = pitchX * gridStep;
            const movePitchY = pitchY * gridStep;
            const dx = Math.round((current.x - erpDiagramZoneDragState.startX) / movePitchX) * gridStep;
            const dy = Math.round((current.y - erpDiagramZoneDragState.startY) / movePitchY) * gridStep;

            const base = erpDiagramZoneDragState.base;
            let proposal = { col: base.col, row: base.row, w: base.w, h: base.h };

            if (erpDiagramZoneDragState.mode === 'move') {
                proposal.col = base.col + dx;
                proposal.row = base.row + dy;
            } else {
                const modeKey = String(erpDiagramZoneDragState.mode || '').replace('resize-', '');
                const useW = modeKey.includes('w');
                const useE = modeKey.includes('e');
                const useN = modeKey.includes('n');
                const useS = modeKey.includes('s');

                let nextCol = base.col;
                let nextRow = base.row;
                let nextW = base.w;
                let nextH = base.h;

                if (useW) {
                    nextCol = base.col + dx;
                    nextW = base.w - dx;
                }
                if (useE) {
                    nextW = base.w + dx;
                }
                if (useN) {
                    nextRow = base.row + dy;
                    nextH = base.h - dy;
                }
                if (useS) {
                    nextH = base.h + dy;
                }

                if (nextW < minSpan) {
                    if (useW) nextCol += (nextW - minSpan);
                    nextW = minSpan;
                }
                if (nextH < minSpan) {
                    if (useN) nextRow += (nextH - minSpan);
                    nextH = minSpan;
                }

                proposal = {
                    col: snapErpZoneGridValue(nextCol, zoneCategory, base.col),
                    row: snapErpZoneGridValue(nextRow, zoneCategory, base.row),
                    w: snapErpZoneGridValue(nextW, zoneCategory, base.w, minSpan),
                    h: snapErpZoneGridValue(nextH, zoneCategory, base.h, minSpan)
                };
            }

            if (!isErpZoneLayoutChangeValid(erpDiagramZoneDragState.category, proposal)) return;

            const changed = proposal.col !== base.col || proposal.row !== base.row || proposal.w !== base.w || proposal.h !== base.h;
            erpDiagramZoneDragState.preview = proposal;
            erpDiagramZoneDragState.moved = erpDiagramZoneDragState.moved || changed;
            renderErpDiagramGraph();
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);

            const drag = erpDiagramZoneDragState;
            erpDiagramZoneDragState = null;
            if (!drag) return;

            const persistedMap = cloneErpDiagramLayoutMap(getErpDiagramLayoutMap());
            let changed = false;
            let movedRows = false;

            if (drag.preview && isErpZoneLayoutChangeValid(drag.category, drag.preview, persistedMap)) {
                const currentCfg = persistedMap[drag.category] || { col: 0, row: 0, w: 1, h: 1 };
                const currentMinSpan = getErpZoneMinSpan(drag.category);
                const nextCfg = {
                    col: snapErpZoneGridValue(drag.preview.col, drag.category, currentCfg.col),
                    row: snapErpZoneGridValue(drag.preview.row, drag.category, currentCfg.row),
                    w: snapErpZoneGridValue(drag.preview.w, drag.category, currentCfg.w, currentMinSpan),
                    h: snapErpZoneGridValue(drag.preview.h, drag.category, currentCfg.h, currentMinSpan)
                };
                changed = nextCfg.col !== currentCfg.col || nextCfg.row !== currentCfg.row || nextCfg.w !== currentCfg.w || nextCfg.h !== currentCfg.h;
                if (changed) {
                    const nextLayoutMap = cloneErpDiagramLayoutMap(persistedMap);
                    nextLayoutMap[drag.category] = nextCfg;
                    movedRows = applyErpZoneLayoutToRows(drag.category, persistedMap, nextLayoutMap);
                    const layoutMap = getErpDiagramLayoutMap();
                    layoutMap[drag.category] = nextCfg;
                }
            }

            renderErpDiagramGraph();

            if (changed || movedRows) {
                queueErpDiagramPersist();
            } else if (drag.moved) {
                notifyProject('No se puede superponer cuadrantes. Mantenga la grilla libre para redimensionar.', 'error');
            }
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const plmItems = Array.isArray(currentWorkspaceProject.plm_items) ? currentWorkspaceProject.plm_items : [];
    const plmById = new Map();
    plmItems.forEach((item) => {
        const id = String(item && item.id ? item.id : '').trim();
        if (id) plmById.set(id, item);
    });

    const groupedRowsByCategory = new Map(ERP_DIAGRAM_ZONES.map((category) => [category, []]));
    rows.forEach((row) => {
        const category = normalizeErpDiagramCategory(row && row.category);
        if (!groupedRowsByCategory.has(category)) groupedRowsByCategory.set(category, []);
        groupedRowsByCategory.get(category).push(row);
    });
    groupedRowsByCategory.forEach((group) => {
        group.sort(compareErpDiagramRows);
    });

    const rowOrderByRowId = new Map();
    groupedRowsByCategory.forEach((group) => {
        group.forEach((row, idx) => {
            const rowId = String(row && row.id ? row.id : '').trim();
            if (!rowId) return;
            rowOrderByRowId.set(rowId, { idx, total: group.length });
        });
    });

    layout.zones.forEach((zone, idx) => {
        const isEdit = canEditGrid;
        const isConfigOpen = String(erpDiagramZoneConfigOpenCategory || '') === String(zone.name || '');

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(zone.minX));
        rect.setAttribute('y', String(zone.minY));
        rect.setAttribute('width', String(zone.width));
        rect.setAttribute('height', String(zone.height));
        rect.setAttribute('rx', '14');
        rect.setAttribute('ry', '14');
        rect.setAttribute('class', `erp-diagram-square ${isEdit ? 'editing' : ''}`.trim());
        viewport.appendChild(rect);

        const chip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chip.setAttribute('class', 'plm-bom-ring-chip erp-diagram-chip');
        const chipColor = getErpZoneToneColor(zone.name);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(zone.cx));
        label.setAttribute('y', String(zone.minY + 42));
        label.setAttribute('class', 'plm-bom-ring-chip-text');
        label.setAttribute('style', `fill:${chipColor};`);
        label.textContent = String(zone.name || '').toUpperCase();

        chip.appendChild(label);
        viewport.appendChild(chip);

        try {
            const bbox = label.getBBox();
            const padX = 16;
            const padY = 10;
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bg.setAttribute('x', String(bbox.x - padX));
            bg.setAttribute('y', String(bbox.y - padY));
            bg.setAttribute('width', String(bbox.width + (padX * 2)));
            bg.setAttribute('height', String(bbox.height + (padY * 2)));
            bg.setAttribute('rx', '18');
            bg.setAttribute('ry', '18');
            bg.setAttribute('class', 'plm-bom-ring-chip-bg');
            bg.setAttribute('style', `fill:${chipColor}33; stroke:${chipColor};`);
            chip.insertBefore(bg, label);
        } catch (_) {
            // fallback sin fondo
        }

        if (!isErpDiagramNodeZoneCategory(zone.name)) {
            const tableFo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
            tableFo.setAttribute('x', String(zone.minX + 12));
            tableFo.setAttribute('y', String(zone.minY + 88));
            tableFo.setAttribute('width', String(Math.max(64, zone.width - 24)));
            tableFo.setAttribute('height', String(Math.max(60, zone.height - 100)));
            tableFo.setAttribute('class', 'erp-diagram-zone-fo');

            const tableWrap = document.createElement('div');
            tableWrap.className = 'erp-diagram-zone-table-wrap';
            tableWrap.innerHTML = buildErpDiagramZoneTableMarkup(zone.name, groupedRowsByCategory.get(String(zone.name || '')) || [], plmById);

            const setRowDragLock = (target, locked) => {
                if (!target || typeof target.closest !== 'function') return;
                const rowEl = target.closest('tr.erp-diagram-row-draggable');
                if (!rowEl) return;
                if (locked) {
                    rowEl.setAttribute('draggable', 'false');
                    rowEl.setAttribute('data-drag-locked', '1');
                } else {
                    rowEl.setAttribute('draggable', 'true');
                    rowEl.removeAttribute('data-drag-locked');
                }
            };

            if (canEditContent) {
                tableWrap.addEventListener('focusin', (ev) => {
                    if (isErpDiagramEditableDragTarget(ev.target)) setRowDragLock(ev.target, true);
                });
                tableWrap.addEventListener('focusout', (ev) => {
                    if (isErpDiagramEditableDragTarget(ev.target)) setRowDragLock(ev.target, false);
                });
            }

            tableWrap.addEventListener('mousedown', (ev) => {
                if (ev.button === 2) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    beginErpDiagramPan(ev);
                    return;
                }

                if (canEditContent && isErpDiagramEditableDragTarget(ev.target)) {
                    setRowDragLock(ev.target, true);
                }

                ev.stopPropagation();
            });
            if (canEditContent) {
                tableWrap.addEventListener('dragstart', (ev) => {
                    if (isErpDiagramEditableDragTarget(ev.target)) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        erpDiagramRowDragState = null;
                        return;
                    }
                }, true);
            }
            tableWrap.addEventListener('contextmenu', (ev) => ev.preventDefault());
            tableWrap.addEventListener('click', (ev) => ev.stopPropagation());
            tableWrap.addEventListener('wheel', (ev) => {
                ev.stopPropagation();
                handleErpDiagramWheel(ev);
            }, { passive: false });
            tableFo.appendChild(tableWrap);
            if (isEdit) tableFo.style.pointerEvents = 'none';
            viewport.appendChild(tableFo);

            if (canEditContent) {
                const btnW = 56;
                const btnH = 56;
                const btnX = zone.maxX - btnW - 12;
                const btnY = zone.minY + 14;

                const configBtn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                configBtn.setAttribute('class', `erp-diagram-zone-config-btn ${isConfigOpen ? 'open' : ''}`.trim());

                const configBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                configBg.setAttribute('x', String(btnX));
                configBg.setAttribute('y', String(btnY));
                configBg.setAttribute('width', String(btnW));
                configBg.setAttribute('height', String(btnH));
                configBg.setAttribute('rx', '12');
                configBg.setAttribute('ry', '12');
                configBg.setAttribute('class', 'erp-diagram-zone-config-btn-bg');
                configBtn.appendChild(configBg);

                const configIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                configIcon.setAttribute('x', String(btnX + (btnW / 2)));
                configIcon.setAttribute('y', String(btnY + (btnH / 2) + 1));
                configIcon.setAttribute('class', 'erp-diagram-zone-config-btn-text');
                configIcon.textContent = '\u2699';
                configBtn.appendChild(configIcon);

                configBtn.addEventListener('mousedown', (ev) => {
                    if (ev.button === 2) {
                        ev.stopPropagation();
                        beginErpDiagramPan(ev);
                        return;
                    }
                    ev.stopPropagation();
                    ev.preventDefault();
                });
                configBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    erpDiagramZoneConfigOpenCategory = isConfigOpen ? '' : String(zone.name || '');
                    if (isConfigOpen) erpDiagramZoneConfigExpandedGroups = {};
                    renderErpDiagramGraph();
                });

                viewport.appendChild(configBtn);
            }

            if (isConfigOpen && canEditContent) {
                const panelWidth = 258;
                const panelHeight = Math.max(170, Math.min(360, zone.height - 56));
                const panelX = Math.max(zone.minX + 12, zone.maxX - panelWidth - 12);
                const panelY = zone.minY + 48;

                const panelFo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                panelFo.setAttribute('x', String(panelX));
                panelFo.setAttribute('y', String(panelY));
                panelFo.setAttribute('width', String(panelWidth));
                panelFo.setAttribute('height', String(panelHeight));
                panelFo.setAttribute('class', 'erp-diagram-zone-config-fo');

                const panel = document.createElement('div');
                panel.className = 'erp-diagram-zone-config-panel';

                const title = document.createElement('div');
                title.className = 'erp-diagram-zone-config-title';
                title.textContent = 'Configurar columnas';
                panel.appendChild(title);

                const categoryKey = String(zone.name || '');

                const categoryConfigMap = getErpDiagramZoneColumnConfigMap();
                const categoryConfig = categoryConfigMap[categoryKey] && typeof categoryConfigMap[categoryKey] === 'object' ? categoryConfigMap[categoryKey] : {};

                const buildCheckboxRow = (column, isChild = false) => {
                    const key = String(column && column.key ? column.key : '').trim();
                    if (!key) return null;

                    const rowEl = document.createElement('div');
                    rowEl.className = `erp-diagram-zone-config-row${isChild ? ' child' : ''}`;

                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = categoryConfig[key] !== false;

                    const applyCheck = () => {
                        const checked = Boolean(input.checked);
                        setErpDiagramZoneColumnVisibility(categoryKey, key, checked);
                    };

                    input.addEventListener('mousedown', (event) => {
                        if (event.button !== 2) event.stopPropagation();
                    });
                    input.addEventListener('click', (event) => event.stopPropagation());
                    input.addEventListener('change', (event) => {
                        event.stopPropagation();
                        applyCheck();
                    });

                    const span = document.createElement('span');
                    span.textContent = String(column.label || key || 'Columna');

                    rowEl.appendChild(input);
                    rowEl.appendChild(span);
                    rowEl.addEventListener('click', (event) => {
                        if (event.target === input) return;
                        event.stopPropagation();
                        input.checked = !input.checked;
                        applyCheck();
                    });

                    return rowEl;
                };

                const regularColumns = ERP_DIAGRAM_CONFIGURABLE_COLUMNS.filter((column) => {
                    const key = String(column && column.key ? column.key : '').trim();
                    if (!key) return false;
                    if (String(column && column.type ? column.type : '') === 'group' && key !== ERP_DIAGRAM_PAINT_PARENT_KEY) return false;
                    if (isErpDiagramGroupChildColumn(column)) return false;
                    if (key === ERP_DIAGRAM_METER_LENGTH_KEY || key === ERP_DIAGRAM_METER_COST_KEY) return false;
                    return true;
                });
                regularColumns.forEach((column) => {
                    const rowEl = buildCheckboxRow(column, false);
                    if (rowEl) panel.appendChild(rowEl);

                    const columnKey = String(column && column.key ? column.key : '').trim();
                    if (columnKey === 'cost_mp_x_kg') {
                        const packRow = buildCheckboxRow({ key: ERP_DIAGRAM_METER_PACK_KEY, label: 'Costo MP x Mt' }, false);
                        if (packRow) panel.appendChild(packRow);
                    }
                });

                const groupParents = getErpDiagramGroupParentColumns()
                    .filter((parentColumn) => String(parentColumn && parentColumn.key ? parentColumn.key : '').trim() !== ERP_DIAGRAM_PAINT_PARENT_KEY);
                groupParents.forEach((parentColumn) => {
                    const parentKey = String(parentColumn && parentColumn.key ? parentColumn.key : '').trim();
                    if (!parentKey) return;

                    const parentChecked = categoryConfig[parentKey] !== false;
                    const expandedKey = `${categoryKey}::${parentKey}`;
                    const isExpanded = Boolean(erpDiagramZoneConfigExpandedGroups[expandedKey]);

                    const groupRow = document.createElement('div');
                    groupRow.className = 'erp-diagram-zone-config-group-row';

                    const groupMain = document.createElement('div');
                    groupMain.className = 'erp-diagram-zone-config-group-main';

                    const groupInput = document.createElement('input');
                    groupInput.type = 'checkbox';
                    groupInput.checked = parentChecked;

                    const applyParentCheck = () => {
                        setErpDiagramZoneColumnVisibility(categoryKey, parentKey, Boolean(groupInput.checked));
                    };

                    groupInput.addEventListener('mousedown', (event) => {
                        if (event.button !== 2) event.stopPropagation();
                    });
                    groupInput.addEventListener('click', (event) => event.stopPropagation());
                    groupInput.addEventListener('change', (event) => {
                        event.stopPropagation();
                        applyParentCheck();
                    });

                    const groupText = document.createElement('span');
                    groupText.className = 'erp-diagram-zone-config-group-text';
                    groupText.textContent = String(parentColumn.label || parentKey);

                    groupMain.appendChild(groupInput);
                    groupMain.appendChild(groupText);
                    groupMain.addEventListener('mousedown', (event) => {
                        if (event.button !== 2) event.stopPropagation();
                    });
                    groupMain.addEventListener('click', (event) => {
                        if (event.target === groupInput) return;
                        event.stopPropagation();
                        groupInput.checked = !groupInput.checked;
                        applyParentCheck();
                    });

                    const groupToggleBtn = document.createElement('button');
                    groupToggleBtn.type = 'button';
                    groupToggleBtn.className = 'erp-diagram-zone-config-group-toggle';
                    groupToggleBtn.textContent = isExpanded ? '\u25BE' : '\u25B8';
                    groupToggleBtn.addEventListener('mousedown', (event) => {
                        if (event.button !== 2) event.stopPropagation();
                    });
                    groupToggleBtn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        erpDiagramZoneConfigExpandedGroups[expandedKey] = !isExpanded;
                        renderErpDiagramGraph();
                    });

                    groupRow.appendChild(groupMain);
                    groupRow.appendChild(groupToggleBtn);
                    panel.appendChild(groupRow);

                    if (isExpanded) {
                        const groupWrap = document.createElement('div');
                        groupWrap.className = 'erp-diagram-zone-config-group-children';
                        getErpDiagramGroupChildColumns(parentKey).forEach((childColumn) => {
                            const childKey = String(childColumn && childColumn.key ? childColumn.key : '').trim();
                            if (isErpDiagramSystemGroupChildKey(childKey)) return;
                            const rowEl = buildCheckboxRow(childColumn, true);
                            if (rowEl) groupWrap.appendChild(rowEl);
                        });
                        panel.appendChild(groupWrap);
                    }
                });

                panel.addEventListener('mousedown', (ev) => {
                    if (ev.button === 2) {
                        ev.stopPropagation();
                        ev.preventDefault();
                        beginErpDiagramPan(ev);
                        return;
                    }
                    ev.stopPropagation();
                });
                panel.addEventListener('contextmenu', (ev) => ev.preventDefault());
                panel.addEventListener('click', (ev) => ev.stopPropagation());
                panel.addEventListener('wheel', (ev) => {
                    ev.stopPropagation();
                    handleErpDiagramWheel(ev);
                }, { passive: false });

                panelFo.appendChild(panel);
                if (isEdit) panelFo.style.pointerEvents = 'none';
                viewport.appendChild(panelFo);
            }
        } else {
            // Sin Asignar sin etiqueta ni configurador.
        }

        if (isEdit) {
            rect.classList.add('edit-target');
            rect.addEventListener('mousedown', (ev) => {
                if (ev.button !== 0) return;
                beginZoneInteraction('move', zone, ev);
            });

            const addHandle = (x, y, mode) => {
                const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                hit.setAttribute('cx', String(x));
                hit.setAttribute('cy', String(y));
                hit.setAttribute('r', '16');
                hit.setAttribute('class', 'erp-diagram-zone-handle-hit');
                hit.addEventListener('mousedown', (ev) => {
                    if (ev.button !== 0) return;
                    beginZoneInteraction(mode, zone, ev);
                });
                viewport.appendChild(hit);

                const visible = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                visible.setAttribute('cx', String(x));
                visible.setAttribute('cy', String(y));
                visible.setAttribute('r', '7');
                visible.setAttribute('class', 'erp-diagram-zone-handle');
                viewport.appendChild(visible);
            };

            addHandle(zone.maxX, zone.cy, 'resize-e');
            addHandle(zone.cx, zone.maxY, 'resize-s');
            addHandle(zone.maxX, zone.maxY, 'resize-se');
            addHandle(zone.minX, zone.cy, 'resize-w');
            addHandle(zone.cx, zone.minY, 'resize-n');
            addHandle(zone.minX, zone.minY, 'resize-nw');
            addHandle(zone.maxX, zone.minY, 'resize-ne');
            addHandle(zone.minX, zone.maxY, 'resize-sw');
        }
    });
    const nodeZoneMaxHalfHeightByCategory = new Map();
    groupedRowsByCategory.forEach((group, categoryKey) => {
        const category = normalizeErpDiagramCategory(categoryKey, '');
        if (!isErpDiagramNodeZoneCategory(category)) return;
        const maxHalfHeight = (Array.isArray(group) ? group : []).reduce((acc, row) => {
            const itemId = String(row && row.item_id ? row.item_id : '').trim();
            const item = itemId ? (plmById.get(itemId) || null) : null;
            return Math.max(acc, getErpDiagramNodeRenderHalfHeight(item && item.name ? item.name : ''));
        }, ERP_DIAGRAM_NODE_HALF_HEIGHT);
        nodeZoneMaxHalfHeightByCategory.set(category, maxHalfHeight);
    });

    const nodes = rows
        .filter((row) => isErpDiagramNodeZoneCategory(row && row.category))
        .sort(compareErpDiagramRows)
        .map((row, idx) => {
            const rowId = String(row && row.id ? row.id : '').trim();
            const itemId = String(row && row.item_id ? row.item_id : '').trim();
            const item = plmById.get(itemId) || {};
            const category = normalizeErpDiagramCategory(row && row.category);

            let nodeX = toNumber(row && row.x, NaN);
            let nodeY = toNumber(row && row.y, NaN);
            const zone = zonesByCategory.get(category) || null;

            if (erpDiagramZoneDragState
                && erpDiagramZoneDragState.preview
                && String(erpDiagramZoneDragState.category || '') === category) {
                const oldZone = getErpCategoryZone(category, persistedLayoutMap);
                const previewZone = getErpCategoryZone(category, baseLayoutMap);
                const mapped = mapErpPointBetweenZones(nodeX, nodeY, oldZone, previewZone);
                if (Number.isFinite(mapped.x) && Number.isFinite(mapped.y)) {
                    nodeX = mapped.x;
                    nodeY = mapped.y;
                }
            }

            const rowOrder = rowOrderByRowId.get(rowId) || { idx, total: Math.max(1, rows.length) };
            if (!Number.isFinite(nodeX) || !Number.isFinite(nodeY)) {
                const seed = `${itemId || idx}-${normalizeErpVariantCode(row && row.variant_code ? row.variant_code : '', 1)}-${rowId || idx}`;
                const fallback = isErpDiagramNodeZoneCategory(category)
                    ? getErpNodeZoneGridPoint(
                        category,
                        rowOrder.idx,
                        rowOrder.total,
                        baseLayoutMap,
                        nodeZoneMaxHalfHeightByCategory.get(category) || ERP_DIAGRAM_NODE_HALF_HEIGHT
                    )
                    : getErpDefaultNodePoint(seed, rowOrder.idx, rowOrder.total, category, baseLayoutMap);
                nodeX = fallback.x;
                nodeY = fallback.y;
            }

            if (zone) {
                const clamped = clampErpPointToZone(nodeX, nodeY, zone);
                nodeX = toNumber(clamped.x, nodeX);
                nodeY = toNumber(clamped.y, nodeY);
            }

            if (erpDiagramDragState && String(erpDiagramDragState.rowId) === rowId) {
                nodeX = toNumber(erpDiagramDragState.currentX, nodeX);
                nodeY = toNumber(erpDiagramDragState.currentY, nodeY);
            }

            return {
                id: rowId,
                row_id: rowId,
                variant_code: normalizeErpVariantCode(row && row.variant_code ? row.variant_code : '', 1),
                item_id: item.item_id || '',
                name: item.name || '',
                category,
                x: nodeX,
                y: nodeY
            };
        });

    nodes.forEach((node) => {
        if (!isErpDiagramNodeZoneCategory(node.category)) return;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const nodeClasses = ['plm-bom-node'];
        if (String(node.id) === String(activeErpDiagramNodeId)) nodeClasses.push('active');

        g.setAttribute('transform', `translate(${toNumber(node.x, 0)}, ${toNumber(node.y, 0)})`);
        g.setAttribute('class', nodeClasses.join(' '));
        g.style.cursor = 'pointer';

        const subtitleLines = getErpDiagramNodeSubtitleLines(node.name || '');
        const isTwoLineSubtitle = subtitleLines.length > 1;
        const nodeHalfHeight = getErpDiagramNodeRenderHalfHeight(node.name || '');

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(-ERP_DIAGRAM_NODE_HALF_WIDTH));
        rect.setAttribute('y', String(-nodeHalfHeight));
        rect.setAttribute('width', String(ERP_DIAGRAM_NODE_HALF_WIDTH * 2));
        rect.setAttribute('height', String(nodeHalfHeight * 2));
        rect.setAttribute('rx', '10');
        g.appendChild(rect);

        const subtitleTopY = isTwoLineSubtitle ? -1 : 9;
        const titleY = subtitleLines.length > 0 ? (isTwoLineSubtitle ? -15 : -10) : 0;

        const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t1.setAttribute('x', '0');
        t1.setAttribute('y', String(titleY));
        t1.setAttribute('class', 'plm-bom-node-title');
        t1.textContent = `${node.item_id || 'SIN ID'} [${node.variant_code}]`;
        g.appendChild(t1);

        if (subtitleLines.length) {
            const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t2.setAttribute('x', '0');
            t2.setAttribute('y', String(subtitleTopY));
            t2.setAttribute('class', 'plm-bom-node-subtitle');
            t2.setAttribute('dominant-baseline', 'auto');
            subtitleLines.forEach((line, idx) => {
                const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                span.setAttribute('x', '0');
                span.setAttribute('dy', idx === 0 ? '0' : '12');
                span.textContent = line;
                t2.appendChild(span);
            });
            g.appendChild(t2);
        }

        g.addEventListener('click', (ev) => {
            ev.stopPropagation();
            activeErpDiagramNodeId = String(node.id);
            renderErpDiagramGraph();
        });

        g.addEventListener('mousedown', (ev) => {
            if (ev.button !== 0) return;
            if (!canEditContent) return;
            ev.stopPropagation();
            ev.preventDefault();

            const start = erpWorldFromClient(ev.clientX, ev.clientY, host, width, height);
            erpDiagramDragState = {
                rowId: String(node.id),
                startX: start.x,
                startY: start.y,
                baseX: toNumber(node.x, 0),
                baseY: toNumber(node.y, 0),
                currentX: toNumber(node.x, 0),
                currentY: toNumber(node.y, 0)
            };
            let dragPreviewRaf = null;

            const scheduleNodeDragPreview = () => {
                if (dragPreviewRaf != null) return;
                dragPreviewRaf = window.requestAnimationFrame(() => {
                    dragPreviewRaf = null;
                    if (!erpDiagramDragState) return;
                    const previewX = Math.round(toNumber(erpDiagramDragState.currentX, toNumber(node.x, 0)));
                    const previewY = Math.round(toNumber(erpDiagramDragState.currentY, toNumber(node.y, 0)));
                    g.setAttribute('transform', `translate(${previewX}, ${previewY})`);
                });
            };

            const onMove = (moveEv) => {
                if (!erpDiagramDragState) return;
                const current = erpWorldFromClient(moveEv.clientX, moveEv.clientY, host, width, height);
                erpDiagramDragState.currentX = Math.round(erpDiagramDragState.baseX + (current.x - erpDiagramDragState.startX));
                erpDiagramDragState.currentY = Math.round(erpDiagramDragState.baseY + (current.y - erpDiagramDragState.startY));
                scheduleNodeDragPreview();
            };

            const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                if (dragPreviewRaf != null) {
                    window.cancelAnimationFrame(dragPreviewRaf);
                    dragPreviewRaf = null;
                }

                const drag = erpDiagramDragState;
                erpDiagramDragState = null;
                if (!drag) return;

                const finalX = Math.round(toNumber(drag.currentX, toNumber(drag.baseX, 0)));
                const finalY = Math.round(toNumber(drag.currentY, toNumber(drag.baseY, 0)));
                const category = getErpCategoryFromPosition(finalX, finalY, baseLayoutMap);

                assignErpDiagramRowToCategory(drag.rowId, category, finalX, finalY);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        });

        viewport.appendChild(g);
    });

    svg.addEventListener('mousedown', (ev) => {
        if (ev.button === 2) {
            beginErpDiagramPan(ev);
            return;
        }

    });

    svg.addEventListener('wheel', (ev) => {
        handleErpDiagramWheel(ev);
    }, { passive: false });

    svg.addEventListener('click', () => {
        if (erpDiagramZoneConfigOpenCategory) {
            erpDiagramZoneConfigOpenCategory = '';
            erpDiagramZoneConfigExpandedGroups = {};
            renderErpDiagramGraph();
            return;
        }

        if (activeErpDiagramNodeId) {
            activeErpDiagramNodeId = '';
            renderErpDiagramGraph();
        }
    });
}

function handleErpDiagramDragStart() {
    // reservado para compatibilidad en templates anteriores
}

function handleErpDiagramDragOver() {
    // reservado para compatibilidad en templates anteriores
}

function handleErpDiagramDragLeave() {
    // reservado para compatibilidad en templates anteriores
}

function handleErpDiagramDrop() {
    // reservado para compatibilidad en templates anteriores
}

function isErpDiagramEditableDragTarget(target) {
    if (!target || typeof target.closest !== 'function') return false;
    return Boolean(target.closest('input, select, textarea, button, option, .erp-diagram-cost-input, .erp-diagram-provider-select, .erp-diagram-cost-readonly'));
}

function startErpDiagramRowDrag(event, rowIdRaw) {
    if (!isErpDiagramContentEditingAllowed(false)) {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
        erpDiagramRowDragState = null;
        return;
    }

    const rowId = String(rowIdRaw || '').trim();
    if (!rowId) return;

    const dragTarget = event && event.target ? event.target : null;
    const currentTarget = event && event.currentTarget ? event.currentTarget : null;

    if (currentTarget && String(currentTarget.getAttribute && currentTarget.getAttribute('data-drag-locked') || '') === '1') {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
        erpDiagramRowDragState = null;
        return;
    }

    if (dragTarget && isErpDiagramEditableDragTarget(dragTarget)) {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();
        erpDiagramRowDragState = null;
        return;
    }

    if (event && typeof event.composedPath === 'function') {
        const pathNodes = event.composedPath() || [];
        if (pathNodes.some((node) => isErpDiagramEditableDragTarget(node))) {
            if (typeof event.preventDefault === 'function') event.preventDefault();
            erpDiagramRowDragState = null;
            return;
        }
    }

    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (active && isErpDiagramEditableDragTarget(active)) {
        const activeRow = active.closest && active.closest('tr.erp-diagram-row-draggable');
        const dragRow = currentTarget && typeof currentTarget.closest === 'function'
            ? currentTarget.closest('tr.erp-diagram-row-draggable')
            : null;
        if (!activeRow || !dragRow || activeRow === dragRow) {
            if (event && typeof event.preventDefault === 'function') event.preventDefault();
            erpDiagramRowDragState = null;
            return;
        }
    }

    const row = getErpDiagramRowById(rowId);
    if (!row) return;

    erpDiagramRowDragState = {
        rowId,
        itemId: String(row.item_id || '').trim()
    };

    if (event && event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        try {
            event.dataTransfer.setData('text/plain', rowId);
        } catch (_) {
            // noop
        }
    }
}

function endErpDiagramRowDrag() {
    erpDiagramRowDragState = null;
}

function toggleErpDiagramEditMode(forceValue = null) {
    const nextValue = typeof forceValue === 'boolean' ? forceValue : !erpDiagramContentEditMode;
    if (erpDiagramContentEditMode === nextValue) {
        renderErpDiagramGraph();
        return;
    }

    erpDiagramContentEditMode = nextValue;
    erpDiagramDragState = null;
    erpDiagramRowDragState = null;
    if (erpDiagramContentEditMode) {
        erpDiagramGridEditMode = false;
        erpDiagramZoneDragState = null;
        erpDiagramZoneConfigOpenCategory = '';
    }
    renderErpDiagramGraph();
}

function toggleErpDiagramGridEditMode(forceValue = null) {
    const nextValue = typeof forceValue === 'boolean' ? forceValue : !erpDiagramGridEditMode;
    if (erpDiagramGridEditMode === nextValue) {
        renderErpDiagramGraph();
        return;
    }

    erpDiagramGridEditMode = nextValue;
    erpDiagramZoneDragState = null;
    if (erpDiagramGridEditMode) {
        erpDiagramContentEditMode = false;
        erpDiagramDragState = null;
        erpDiagramRowDragState = null;
    } else {
        erpDiagramZoneConfigOpenCategory = '';
    }
    renderErpDiagramGraph();
}

function getErpDiagramRowById(rowIdRaw) {
    const rowId = String(rowIdRaw || '').trim();
    if (!rowId || !currentWorkspaceProject || !Array.isArray(currentWorkspaceProject.erp_diagram_rows)) return null;

    return currentWorkspaceProject.erp_diagram_rows.find((row) => String(row && row.id ? row.id : '').trim() === rowId) || null;
}

function refreshErpDiagramRowTotalCell(rowIdRaw) {
    const rowId = String(rowIdRaw || '').trim();
    if (!rowId) return;

    const row = getErpDiagramRowById(rowId);
    if (!row) return;

    const rows = document.querySelectorAll('#erp-diagram-graph tr.erp-diagram-row-draggable');
    for (let i = 0; i < rows.length; i += 1) {
        const tr = rows[i];
        const trRowId = String(tr && tr.dataset ? tr.dataset.erpRowId || '' : '').trim();
        if (trRowId !== rowId) continue;
        const totalCell = tr.querySelector('td.erp-col-total');
        if (totalCell) totalCell.textContent = formatErpDiagramRowTotal(row);
        break;
    }
}

function updateErpDiagramRowField(rowId, field, value, inputEl = null) {
    if (!isErpDiagramContentEditingAllowed(true)) return;

    const row = getErpDiagramRowById(rowId);
    const key = String(field || '').trim();
    if (!row || !ERP_DIAGRAM_EDITABLE_FIELDS.includes(key)) return;

    const rawValue = String(value ?? '').trim();

    if (key === 'value_status') {
        row[key] = normalizeErpValueStatus(rawValue, 'Supuesto');
    } else if (key === 'value_date') {
        row[key] = normalizeErpValueDate(rawValue);
    } else if (key === 'quoted_qty') {
        row[key] = rawValue === '' ? 0 : Math.max(1, Math.round(parseErpLocalizedNumber(rawValue, 1)));
    } else if (isErpDiagramGroupParentKey(key)) {
        setErpDiagramGroupValue(row, key, rawValue === '' ? 0 : rawValue);
    } else {
        if (key === 'cost_importacion') {
            row[key] = rawValue === '' ? 0 : parseErpImportPercentInput(rawValue);
        } else {
            row[key] = rawValue === '' ? 0 : Math.max(0, parseErpLocalizedNumber(rawValue, 0));
        }

        const parentKey = getErpDiagramGroupParentKeyByChildKey(key);
        if (parentKey) {
            if (parentKey === ERP_DIAGRAM_MACHINING_PARENT_KEY) {
                const minutesTotal = getErpDiagramMecanizadoMinutesTotal(row);
                row[parentKey] = minutesTotal > 0 ? getErpDiagramMecanizadoMinutesToCost(minutesTotal) : 0;
            } else {
                row[parentKey] = getErpDiagramGroupValue(row, parentKey);
            }
        }
    }

    applyErpDiagramImplicitGroupProviders(row);

    if (inputEl && typeof inputEl.value !== 'undefined') {
        if (key === 'cost_importacion') {
            inputEl.value = formatErpImportPercentInputValue(row[key], { allowZero: true });
        } else if (key === 'value_status') {
            inputEl.value = normalizeErpValueStatus(row[key], 'Supuesto');
            applyErpValueStatusClass(inputEl, row[key]);
        } else if (key === 'value_date') {
            inputEl.value = normalizeErpValueDate(row[key]);
        } else {
            inputEl.value = formatErpDiagramEditableInputValue(row[key], {
                allowZero: true,
                maxFractionDigits: getErpDiagramFieldMaxFractionDigits(row, key)
            });
        }
    }
    refreshErpDiagramRowTotalCell(rowId);
    queueErpDiagramPersist();
}

function updateErpDiagramRowProvider(rowId, providerValue) {
    if (!isErpDiagramContentEditingAllowed(true)) return;

    const row = getErpDiagramRowById(rowId);
    if (!row) return;

    row.provider_id = normalizeErpSupplierSelectionValue(providerValue);
    applyErpDiagramImplicitGroupProviders(row);
    queueErpDiagramPersist();
}

function updateErpDiagramRowGroupProvider(rowId, fieldKeyRaw, providerValue) {
    if (!isErpDiagramContentEditingAllowed(true)) return;

    const row = getErpDiagramRowById(rowId);
    if (!row) return;

    const fieldKey = String(fieldKeyRaw || '').trim();
    if (!fieldKey || !isErpDiagramGroupChildKey(fieldKey)) return;

    const parentKey = getErpDiagramGroupParentKeyByChildKey(fieldKey);
    if (!parentKey) return;
    if (fieldKey !== getErpDiagramGroupProviderChildKey(parentKey)) return;

    row[fieldKey] = normalizeErpSupplierSelectionValue(providerValue);
    applyErpDiagramImplicitGroupProviders(row);
    queueErpDiagramPersist();
}

function updateErpDiagramRowMpCategory(rowId, mpCategoryValue) {
    if (!isErpDiagramContentEditingAllowed(true)) return;

    const row = getErpDiagramRowById(rowId);
    if (!row) return;

    row.mp_category = String(mpCategoryValue || '').trim();
    row.mp_material = '';
    row.mp_reference = row.mp_category;

    renderErpDiagramGraph();
    queueErpDiagramPersist();
}

function updateErpDiagramRowMpMaterial(rowId, mpMaterialValue) {
    if (!isErpDiagramContentEditingAllowed(true)) return;

    const row = getErpDiagramRowById(rowId);
    if (!row) return;

    row.mp_material = String(mpMaterialValue || '').trim();
    row.mp_reference = getErpMpReferenceForSelection(row.category, row.mp_category, row.mp_material);
    renderErpDiagramGraph();
    queueErpDiagramPersist();
}

function renderErpPanel() {
    const homeView = document.getElementById('erp-home-view');
    const providersView = document.getElementById('erp-providers-view');
    const materialsView = document.getElementById('erp-materials-view');
    const diagramView = document.getElementById('erp-diagram-view');

    const moduleActions = document.getElementById('erp-module-actions');
    const providersBtn = document.getElementById('erp-panel-providers-btn');
    const materialsBtn = document.getElementById('erp-panel-mp-btn');
    const diagramBtn = document.getElementById('erp-panel-diagram-btn');

    const panel = String(erpActivePanel || 'home').toLowerCase();
    const isHome = panel === 'home';
    const isSuppliers = panel === 'suppliers';
    const isMaterials = panel === 'materials';
    const isDiagram = panel === 'diagram';

    if (homeView) homeView.style.display = isHome ? 'block' : 'none';
    if (providersView) providersView.style.display = isSuppliers ? 'block' : 'none';
    if (materialsView) materialsView.style.display = isMaterials ? 'block' : 'none';
    if (diagramView) diagramView.style.display = isDiagram ? 'block' : 'none';

    if (moduleActions) moduleActions.style.display = isHome ? 'flex' : 'none';

    if (providersBtn) providersBtn.classList.toggle('btn-primary', isSuppliers);
    if (materialsBtn) materialsBtn.classList.toggle('btn-primary', isMaterials);
    if (diagramBtn) diagramBtn.classList.toggle('btn-primary', isDiagram);

    renderErpHomePiecesTable();
    renderErpSuppliersTable();
    renderErpRawMaterialsTable();

    if (isMaterials) updateErpMpIdPreview();
    if (isDiagram) renderErpDiagramGraph();
}

function renderErpTable() {
    renderErpPanel();
}

function renderCpqTable() {
    const tbody = document.getElementById('cpq-items-body');
    if (!tbody || !currentWorkspaceProject) return;

    const rows = currentWorkspaceProject.cpq_items;
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center plm-empty">No hay reglas CPQ cargadas.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map((item, idx) => `
        <tr>
            <td>${item.option || '-'}</td>
            <td>${formatMoney(item.delta_cost)}</td>
            <td><button class="btn btn-sm" onclick="removeCpqItem(${idx})">Eliminar</button></td>
        </tr>
    `).join('');
}

function recalculateQuote(persist = false) {

    if (!currentWorkspaceProject) return;

    const qtyInput = document.getElementById('cpq-input-qty');
    const marginInput = document.getElementById('cpq-input-margin');

    const quantity = Math.max(1, Math.round(toNumber(qtyInput ? qtyInput.value : 1, 1)));
    const margin = Math.max(0, toNumber(marginInput ? marginInput.value : 25, 25));

    const baseCost = currentWorkspaceProject.erp_items
        .reduce((acc, item) => acc + toNumber(item.unit_cost, 0), 0);

    const variantCost = currentWorkspaceProject.cpq_items
        .reduce((acc, item) => acc + toNumber(item.delta_cost, 0), 0);

    const subtotal = (baseCost + variantCost) * quantity;
    const finalPrice = subtotal * (1 + (margin / 100));

    currentWorkspaceProject.cpq_settings = { quantity, margin };
    currentWorkspaceProject.cpq_summary = {
        base_cost: baseCost,
        variant_cost: variantCost,
        subtotal,
        final_price: finalPrice
    };

    if (qtyInput) qtyInput.value = String(quantity);
    if (marginInput) marginInput.value = String(margin);

    const baseEl = document.getElementById('cpq-base-cost');
    const variantEl = document.getElementById('cpq-variant-cost');
    const finalEl = document.getElementById('cpq-final-price');

    if (baseEl) baseEl.textContent = formatMoney(baseCost * quantity);
    if (variantEl) variantEl.textContent = formatMoney(variantCost * quantity);
    if (finalEl) finalEl.textContent = formatMoney(finalPrice);

    if (persist) {
        persistCurrentWorkspace(true).catch((e) => {
            console.error(e);
            notifyProject('No se pudo guardar configuracion CPQ.', 'error');
        });
    }
}

function renderWorkspace() {
    if (!currentWorkspaceProject) return;

    ensureBomKeybindings();
    maybeInitializeBomLayout();
    updateWorkspaceHeader();
    updateWorkspaceKPIs();
    renderPlmTable();
    renderErpTable();
    renderCpqTable();
    renderBomClassificationTable();
    renderBomGraph();
    renderPlmValuesPanel();
    renderPlmBitacoraPanel();
    updateBomSelectionLabels();

    const qtyInput = document.getElementById('cpq-input-qty');
    const marginInput = document.getElementById('cpq-input-margin');
    if (qtyInput) qtyInput.value = String(currentWorkspaceProject.cpq_settings.quantity || 1);
    if (marginInput) marginInput.value = String(currentWorkspaceProject.cpq_settings.margin || 25);

    recalculateQuote(false);
}

async function persistCurrentWorkspace(silent = false) {
    if (!currentWorkspaceProject) return false;
    try {
        currentWorkspaceProject = await saveProject(currentWorkspaceProject);
        if (!silent) notifyProject('Proyecto guardado correctamente.', 'success');
        return true;
    } catch (e) {
        console.error(e);
        notifyProject(e.message || 'No se pudo guardar el proyecto.', 'error');
        return false;
    }
}

function getMainPanelBreadcrumbLabel() {
    const section = String(plmActiveSection || 'plm').toLowerCase();
    if (section === 'erp') return 'ERP';
    if (section === 'bom') return 'BOM';
    if (section === 'values') return 'Valores';
    if (section === 'bitacora') return 'Bitacora';
    return 'PLM';
}

function getErpPanelBreadcrumbLabel() {
    const panel = String(erpActivePanel || 'home').toLowerCase();
    if (panel === 'materials') return 'Materia Prima';
    if (panel === 'suppliers') return 'Proveedores';
    if (panel === 'diagram') return 'Diagrama';
    return '';
}

function getVersionsPanelBreadcrumbLabel() {
    return 'Versiones';
}

function getBreadcrumbActiveVersion() {
    const contextId = String(plmBomVersionContextId || '').trim();
    if (contextId) {
        const inContext = getProjectVersionById(contextId);
        if (inContext) return inContext;
    }

    const openedId = String(selectedOpenedPlmVersionId || '').trim();
    if (!openedId) return null;
    return getProjectVersionById(openedId);
}

function buildWorkspaceBreadcrumbSegments() {
    const segments = [
        { label: 'Base de datos', onClick: () => showBaseDatosHome() },
        { label: 'Gestión de Proyectos', onClick: () => showProjectsView() }
    ];

    const projectLabel = String(currentWorkspaceProject && currentWorkspaceProject.name ? currentWorkspaceProject.name : 'Proyecto').trim() || 'Proyecto';

    if (plmWorkspaceMode === 'menu') {
        segments.push({ label: projectLabel, active: true });
        return segments;
    }

    const goToMenu = () => showPlmWorkspaceMenu();
    segments.push({ label: projectLabel, onClick: goToMenu });

    if (plmWorkspaceMode === 'versions') {
        if (plmVersionsFlowMode === 'open') {
            segments.push({
                label: getVersionsPanelBreadcrumbLabel(),
                onClick: () => {
                    setPlmWorkspaceMode('versions');
                    setPlmVersionsFlowMode('list');
                }
            });

            const version = getBreadcrumbActiveVersion();
            const versionLabel = String(version && version.name ? version.name : 'Version').trim() || 'Version';
            segments.push({ label: versionLabel, active: true });
            return segments;
        }

        if (plmVersionsFlowMode === 'compare') {
            segments.push({
                label: getVersionsPanelBreadcrumbLabel(),
                onClick: () => setPlmVersionsFlowMode('list')
            });
            segments.push({ label: 'Comparacion', active: true });
            return segments;
        }

        segments.push({ label: getVersionsPanelBreadcrumbLabel(), active: true });
        return segments;
    }

    if (plmWorkspaceMode === 'main' && isBomVersionContext()) {
        const version = getBreadcrumbActiveVersion();
        const versionLabel = String(version && version.name ? version.name : 'Version').trim() || 'Version';

        segments.push({
            label: getVersionsPanelBreadcrumbLabel(),
            onClick: () => {
                if (version && version.id) selectedOpenedPlmVersionId = String(version.id);
                setPlmWorkspaceMode('versions');
                if (selectedOpenedPlmVersionId) setPlmVersionsFlowMode('open');
                else setPlmVersionsFlowMode('list');
            }
        });

        segments.push({
            label: versionLabel,
            onClick: () => {
                if (version && version.id) selectedOpenedPlmVersionId = String(version.id);
                setPlmWorkspaceMode('versions');
                setPlmVersionsFlowMode('open');
            }
        });

        segments.push({ label: getMainPanelBreadcrumbLabel(), active: true });
        return segments;
    }

    if (String(plmActiveSection || '').toLowerCase() === 'erp') {
        const subLabel = getErpPanelBreadcrumbLabel();
        if (!subLabel) {
            segments.push({ label: 'ERP', active: true });
            return segments;
        }

        segments.push({
            label: 'ERP',
            onClick: () => {
                if (plmWorkspaceMode !== 'main') setPlmWorkspaceMode('main');
                showPlmSection('erp');
                setErpPanel('home');
            }
        });
        segments.push({ label: subLabel, active: true });
        return segments;
    }

    segments.push({ label: getMainPanelBreadcrumbLabel(), active: true });
    return segments;
}


function renderWorkspaceBreadcrumb(segments) {
    const root = document.getElementById('plm-workspace-breadcrumb');
    if (!root) return;

    root.innerHTML = '';
    const items = Array.isArray(segments) ? segments : [];

    items.forEach((segment, idx) => {
        if (idx > 0) {
            const sep = document.createElement('span');
            sep.className = 'plm-breadcrumb-separator';
            sep.textContent = '>';
            root.appendChild(sep);
        }

        const node = document.createElement('span');
        const label = String(segment && segment.label ? segment.label : '').trim();
        node.textContent = label;
        node.title = label;
        node.classList.add('plm-breadcrumb-node');

        const canClick = Boolean(segment && typeof segment.onClick === 'function' && !segment.active);
        if (canClick) {
            node.classList.add('breadcrumb-link');
            node.addEventListener('click', segment.onClick);
        } else {
            node.classList.add('plm-breadcrumb-active');
        }

        root.appendChild(node);
    });
}

function refreshWorkspacePanelBreadcrumb() {
    renderWorkspaceBreadcrumb(buildWorkspaceBreadcrumbSegments());
}

function refreshPlmWorkspaceHeaderActions() {
    const versionBtn = document.getElementById('plm-version-primary-btn');
    const compareBtn = document.getElementById('plm-version-compare-btn');
    const bomPrintBtn = document.getElementById('plm-bom-print-header-btn');
    const valuesPrintBtn = document.getElementById('plm-values-print-header-btn');
    const comparePrintBtn = document.getElementById('plm-version-compare-print-header-btn');
    const modifyBtn = document.getElementById('plm-version-modify-btn');
    const bitacoraAddBtn = document.getElementById('plm-bitacora-add-btn');
    const masterBomBtn = document.getElementById('plm-master-bom-header-btn');

    if (versionBtn) {
        const showVersionBtn = plmWorkspaceMode === 'versions'
            && plmVersionsFlowMode !== 'open'
            && plmVersionsFlowMode !== 'compare'
            && !plmVersionCompareSelectMode;
        const isEditingVersion = showVersionBtn
            && plmVersionsFlowMode === 'create'
            && Boolean(String(plmVersionEditTargetId || '').trim());
        versionBtn.style.display = showVersionBtn ? 'inline-flex' : 'none';
        versionBtn.textContent = isEditingVersion ? 'Guardar Cambios' : '+ Cargar Version';
    }
    if (bomPrintBtn) {
        const showBomPrintBtn = plmWorkspaceMode === 'main' && String(plmActiveSection || '').toLowerCase() === 'bom';
        bomPrintBtn.style.display = showBomPrintBtn ? 'inline-flex' : 'none';
    }

    if (valuesPrintBtn) {
        const showValuesPrintBtn = plmWorkspaceMode === 'main' && String(plmActiveSection || '').toLowerCase() === 'values';
        valuesPrintBtn.style.display = showValuesPrintBtn ? 'inline-flex' : 'none';
    }

    if (comparePrintBtn) {
        const showComparePrintBtn = plmWorkspaceMode === 'versions' && plmVersionsFlowMode === 'compare';
        comparePrintBtn.style.display = showComparePrintBtn ? 'inline-flex' : 'none';
    }

    if (compareBtn) {
        const isVersionsList = plmWorkspaceMode === 'versions' && plmVersionsFlowMode === 'list';
        const isVersionValues = plmWorkspaceMode === 'main'
            && String(plmActiveSection || '').toLowerCase() === 'values'
            && isBomVersionContext();
        const showCompareBtn = isVersionsList || isVersionValues;
        const isCompareSelectionState = isVersionsList && plmVersionCompareSelectMode;

        compareBtn.style.display = showCompareBtn ? 'inline-flex' : 'none';
        compareBtn.classList.toggle('plm-version-compare-active', isCompareSelectionState);

        if (isCompareSelectionState) {
            compareBtn.textContent = `Comparar (${selectedPlmCompareVersionIds.size})`;
        } else {
            compareBtn.textContent = 'Comparar';
        }
    }

    if (modifyBtn) {
        const isVersionBom = plmWorkspaceMode === 'main'
            && String(plmActiveSection || '').toLowerCase() === 'bom'
            && isBomVersionContext();
        modifyBtn.style.display = isVersionBom ? 'inline-flex' : 'none';
    }

    if (bitacoraAddBtn) {
        const isVersionBitacora = plmWorkspaceMode === 'main'
            && String(plmActiveSection || '').toLowerCase() === 'bitacora'
            && isBomVersionContext();
        bitacoraAddBtn.style.display = isVersionBitacora ? 'inline-flex' : 'none';
    }

    if (masterBomBtn) {
        const isMain = plmWorkspaceMode === 'main';
        const isPlm = String(plmActiveSection || '').toLowerCase() === 'plm';
        masterBomBtn.style.display = (isMain && isPlm) ? 'inline-flex' : 'none';
    }
}


function setPlmWorkspaceMode(mode = 'menu') {
    const selected = String(mode || 'menu').toLowerCase();
    plmWorkspaceMode = selected;

    const menuView = document.getElementById('plm-workspace-menu-view');
    const mainView = document.getElementById('plm-workspace-main-view');
    const versionsView = document.getElementById('plm-workspace-versions-view');

    const isMenu = selected === 'menu';
    const isVersions = selected === 'versions';
    const isMain = !isMenu && !isVersions;

    if (menuView) menuView.style.display = isMenu ? 'block' : 'none';
    if (mainView) mainView.style.display = isMain ? 'block' : 'none';
    if (versionsView) versionsView.style.display = isVersions ? 'block' : 'none';

    if (!isMain) clearBomVersionContext();
    if (!isVersions) resetPlmVersionCompareState(true);

    refreshWorkspacePanelBreadcrumb();
    refreshPlmWorkspaceHeaderActions();
}


function formatPlmVersionDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return '-';

    const parsed = new Date(raw);
    if (!Number.isFinite(parsed.getTime())) return raw;

    return parsed.toLocaleDateString('es-AR');
}

function formatPlmBitacoraDateTime(value) {
    const raw = String(value || '').trim();
    if (!raw) return '-';

    const parsed = new Date(raw);
    if (!Number.isFinite(parsed.getTime())) return raw;

    return parsed.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getVersionBitacoraRecords(version) {
    const source = version && typeof version === 'object' ? version : {};
    const records = Array.isArray(source.bitacora_records) ? source.bitacora_records : [];

    return records
        .map((entry, idx) => {
            const row = entry && typeof entry === 'object' ? entry : {};
            return {
                id: String(row.id || `vlog-${idx + 1}`),
                title: String(row.title || row.titulo || '').trim(),
                description: String(row.description || row.descripcion || '').trim(),
                created_at: String(row.created_at || row.date || row.fecha || '').trim()
            };
        })
        .filter((entry) => entry.title || entry.description)
        .sort((a, b) => {
            const ta = Date.parse(String(a && a.created_at ? a.created_at : '')) || 0;
            const tb = Date.parse(String(b && b.created_at ? b.created_at : '')) || 0;
            return tb - ta;
        });
}

function getProjectBitacoraRecords() {
    if (!currentWorkspaceProject) return [];

    const versions = Array.isArray(currentWorkspaceProject.plm_versions) ? currentWorkspaceProject.plm_versions : [];
    const rows = [];

    versions.forEach((version, idx) => {
        const versionName = String(version && version.name ? version.name : `Version ${idx + 1}`).trim() || `Version ${idx + 1}`;
        getVersionBitacoraRecords(version).forEach((entry) => {
            rows.push({
                created_at: String(entry.created_at || '').trim(),
                version_name: versionName,
                title: String(entry.title || '').trim(),
                description: String(entry.description || '').trim()
            });
        });
    });

    rows.sort((a, b) => {
        const ta = Date.parse(String(a && a.created_at ? a.created_at : '')) || 0;
        const tb = Date.parse(String(b && b.created_at ? b.created_at : '')) || 0;
        return tb - ta;
    });

    return rows;
}

function renderPlmBitacoraPanel() {
    const introTitleEl = document.getElementById('plm-bitacora-intro-title');
    const headEl = document.getElementById('plm-bitacora-head');
    const bodyEl = document.getElementById('plm-bitacora-body');
    const tableEl = document.getElementById('plm-bitacora-table');

    const labels = [
        document.getElementById('plm-bitacora-intro-label-1'),
        document.getElementById('plm-bitacora-intro-label-2'),
        document.getElementById('plm-bitacora-intro-label-3'),
        document.getElementById('plm-bitacora-intro-label-4'),
        document.getElementById('plm-bitacora-intro-label-5'),
        document.getElementById('plm-bitacora-intro-label-6')
    ];
    const values = [
        document.getElementById('plm-bitacora-intro-value-1'),
        document.getElementById('plm-bitacora-intro-value-2'),
        document.getElementById('plm-bitacora-intro-value-3'),
        document.getElementById('plm-bitacora-intro-value-4'),
        document.getElementById('plm-bitacora-intro-value-5'),
        document.getElementById('plm-bitacora-intro-value-6')
    ];

    if (!introTitleEl || !headEl || !bodyEl || !tableEl || labels.some((el) => !el) || values.some((el) => !el)) return;

    const activeVersion = getActiveBomVersion();
    const isVersionContext = Boolean(activeVersion);

    if (isVersionContext) {
        const itemCount = (Array.isArray(activeVersion.item_ids) && activeVersion.item_ids.length)
            || (Array.isArray(activeVersion.plm_items) ? activeVersion.plm_items.length : 0);

        introTitleEl.textContent = 'Informacion de Version';
        labels[0].textContent = 'Version';
        labels[1].textContent = 'Revision';
        labels[2].textContent = 'Items';
        labels[3].textContent = 'Creacion';
        labels[4].textContent = 'Modificacion';
        labels[5].textContent = 'Descripcion';

        values[0].textContent = String(activeVersion.name || '').trim() || 'Version';
        values[1].textContent = normalizePlmVersionRevision(activeVersion.revision, 1);
        values[2].textContent = formatBomQuantity(itemCount);
        values[3].textContent = formatPlmVersionDate(activeVersion.created_at);
        values[4].textContent = formatPlmVersionDate(activeVersion.updated_at || activeVersion.created_at);
        values[5].textContent = String(activeVersion.description || '').trim() || 'Sin descripcion';

        headEl.innerHTML = `
            <tr>
                <th>Fecha</th>
                <th>Titulo</th>
                <th>Descripcion</th>
            </tr>
        `;

        const rows = getVersionBitacoraRecords(activeVersion);
        tableEl.className = 'plm-bitacora-table version-context';
        if (!rows.length) {
            bodyEl.innerHTML = '<tr><td colspan="3" class="text-center plm-empty">Sin registros cargados para esta version.</td></tr>';
        } else {
            bodyEl.innerHTML = rows.map((row) => `
                <tr>
                    <td>${escapeHtml(formatPlmBitacoraDateTime(row.created_at))}</td>
                    <td>${escapeHtml(row.title || '-')}</td>
                    <td>${escapeHtml(row.description || '-')}</td>
                </tr>
            `).join('');
        }
    } else {
        const versions = Array.isArray(currentWorkspaceProject && currentWorkspaceProject.plm_versions) ? currentWorkspaceProject.plm_versions : [];
        const status = String(currentWorkspaceProject && currentWorkspaceProject.status ? currentWorkspaceProject.status : '').trim() || '-';
        const projectDate = String(currentWorkspaceProject && currentWorkspaceProject.date ? currentWorkspaceProject.date : '').trim() || '-';
        const lastModifiedIso = versions.reduce((latest, version) => {
            const candidate = String(version && (version.updated_at || version.created_at) ? (version.updated_at || version.created_at) : '').trim();
            const t = Date.parse(candidate) || 0;
            return t > latest ? t : latest;
        }, 0);

        introTitleEl.textContent = 'Informacion de Proyecto';
        labels[0].textContent = 'Proyecto';
        labels[1].textContent = 'Estado';
        labels[2].textContent = 'Versiones';
        labels[3].textContent = 'Fecha de Proyecto';
        labels[4].textContent = 'Ultima Modificacion';
        labels[5].textContent = 'Descripcion';

        values[0].textContent = String(currentWorkspaceProject && currentWorkspaceProject.name ? currentWorkspaceProject.name : '').trim() || 'Proyecto';
        values[1].textContent = status;
        values[2].textContent = formatBomQuantity(versions.length);
        values[3].textContent = projectDate;
        values[4].textContent = lastModifiedIso > 0 ? formatPlmBitacoraDateTime(new Date(lastModifiedIso).toISOString()) : '-';
        values[5].textContent = String(currentWorkspaceProject && currentWorkspaceProject.description ? currentWorkspaceProject.description : '').trim() || 'Sin descripcion';

        headEl.innerHTML = `
            <tr>
                <th>Fecha</th>
                <th>Version</th>
                <th>Titulo</th>
                <th>Descripcion</th>
            </tr>
        `;

        const rows = getProjectBitacoraRecords();
        tableEl.className = 'plm-bitacora-table project-context';
        if (!rows.length) {
            bodyEl.innerHTML = '<tr><td colspan="4" class="text-center plm-empty">Sin registros cargados.</td></tr>';
        } else {
            bodyEl.innerHTML = rows.map((row) => `
                <tr>
                    <td>${escapeHtml(formatPlmBitacoraDateTime(row.created_at))}</td>
                    <td>${escapeHtml(row.version_name || '-')}</td>
                    <td>${escapeHtml(row.title || '-')}</td>
                    <td>${escapeHtml(row.description || '-')}</td>
                </tr>
            `).join('');
        }
    }
}

function setPlmBitacoraRecordModalError(message = '') {
    const el = document.getElementById('plm-bitacora-record-modal-error');
    if (!el) {
        if (message) notifyProject(message, 'error');
        return;
    }

    const text = String(message || '').trim();
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
}

function openPlmVersionBitacoraRecordModal() {
    const version = getActiveBomVersion();
    if (!version) {
        notifyProject('Abra una version para crear registros.', 'error');
        return;
    }

    const modal = document.getElementById('plm-bitacora-record-modal');
    const titleEl = document.getElementById('plm-bitacora-record-title');
    const descriptionEl = document.getElementById('plm-bitacora-record-description');

    if (titleEl) titleEl.value = '';
    if (descriptionEl) descriptionEl.value = '';
    setPlmBitacoraRecordModalError('');

    if (modal) modal.style.display = 'flex';
    if (titleEl) setTimeout(() => titleEl.focus(), 0);
}

function closePlmVersionBitacoraRecordModal() {
    const modal = document.getElementById('plm-bitacora-record-modal');
    if (modal) modal.style.display = 'none';
    setPlmBitacoraRecordModalError('');
}

async function confirmPlmVersionBitacoraRecord() {
    if (!currentWorkspaceProject) return;

    const version = getActiveBomVersion();
    if (!version) {
        setPlmBitacoraRecordModalError('Version no encontrada.');
        return;
    }

    const titleEl = document.getElementById('plm-bitacora-record-title');
    const descriptionEl = document.getElementById('plm-bitacora-record-description');

    const title = String(titleEl && titleEl.value ? titleEl.value : '').trim();
    const description = String(descriptionEl && descriptionEl.value ? descriptionEl.value : '').trim();

    if (!title) {
        setPlmBitacoraRecordModalError('Ingrese un titulo.');
        return;
    }
    if (!description) {
        setPlmBitacoraRecordModalError('Ingrese una descripcion.');
        return;
    }

    const previousRecords = Array.isArray(version.bitacora_records) ? version.bitacora_records.slice() : [];
    const previousUpdatedAt = String(version.updated_at || '').trim();
    const nowIso = new Date().toISOString();
    const newRecord = {
        id: `vlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title,
        description,
        created_at: nowIso
    };

    version.bitacora_records = [newRecord, ...previousRecords].sort((a, b) => {
        const ta = Date.parse(String(a && a.created_at ? a.created_at : '')) || 0;
        const tb = Date.parse(String(b && b.created_at ? b.created_at : '')) || 0;
        return tb - ta;
    });
    version.updated_at = nowIso;

    const saved = await persistCurrentWorkspace(true);
    if (!saved) {
        version.bitacora_records = previousRecords;
        version.updated_at = previousUpdatedAt;
        return;
    }

    closePlmVersionBitacoraRecordModal();
    renderPlmBitacoraPanel();
    renderWorkspaceVersionsTable();
    notifyProject('Registro creado.', 'success');
}

function setPlmVersionsFlowMode(mode = 'list') {
    const selected = String(mode || 'list').toLowerCase();
    plmVersionsFlowMode = selected;
    if (selected !== 'create') plmVersionEditTargetId = '';
    if (selected !== 'compare') plmVersionComparisonIds = [];
    if (selected !== 'list') plmVersionCompareSelectMode = false;

    const listView = document.getElementById('plm-versions-list-view');
    const flowView = document.getElementById('plm-versions-flow-view');
    const compareView = document.getElementById('plm-versions-compare-view');
    const cardsView = document.getElementById('plm-versions-cards-view');
    const createView = document.getElementById('plm-versions-create-view');
    const existingView = document.getElementById('plm-versions-existing-view');
    const openView = document.getElementById('plm-version-open-view');

    const isList = selected === 'list';
    const isCards = selected === 'cards';
    const isCreate = selected === 'create';
    const isExisting = selected === 'existing';
    const isOpen = selected === 'open';
    const isCompare = selected === 'compare';

    if (listView) listView.style.display = isList ? 'block' : 'none';
    if (flowView) flowView.style.display = (isCards || isCreate || isExisting || isOpen) ? 'block' : 'none';
    if (compareView) compareView.style.display = isCompare ? 'block' : 'none';
    if (cardsView) cardsView.style.display = isCards ? 'block' : 'none';
    if (createView) createView.style.display = isCreate ? 'block' : 'none';
    if (existingView) existingView.style.display = isExisting ? 'block' : 'none';
    if (openView) openView.style.display = isOpen ? 'block' : 'none';

    refreshWorkspacePanelBreadcrumb();
    refreshPlmWorkspaceHeaderActions();

    if (isList) {
        selectedOpenedPlmVersionId = '';
        renderWorkspaceVersionsTable();
    }
    if (isCreate) renderPlmVersionSelectionTable();
    if (isExisting) renderExistingPlmVersionsTable();
    if (isCompare) renderPlmVersionComparisonView();
}


function resetPlmVersionCompareState(clearSnapshot = true) {
    plmVersionCompareSelectMode = false;
    selectedPlmCompareVersionIds = new Set();
    if (clearSnapshot) plmVersionComparisonIds = [];
}

function togglePlmVersionCompareSelection(versionId, checked) {
    const id = String(versionId || '').trim();
    if (!id) return;

    if (checked) selectedPlmCompareVersionIds.add(id);
    else selectedPlmCompareVersionIds.delete(id);

    refreshPlmWorkspaceHeaderActions();
}

function openPlmVersionCompareSelection(prefillVersionId = '') {
    const id = String(prefillVersionId || '').trim();

    setPlmWorkspaceMode('versions');
    setPlmVersionsFlowMode('list');

    plmVersionCompareSelectMode = true;
    selectedPlmCompareVersionIds = new Set();
    if (id) selectedPlmCompareVersionIds.add(id);

    renderWorkspaceVersionsTable();
    refreshWorkspacePanelBreadcrumb();
    refreshPlmWorkspaceHeaderActions();
}


function togglePlmVersionCompareMode() {
    if (!currentWorkspaceProject) return;

    const fromVersionValues = plmWorkspaceMode === 'main'
        && String(plmActiveSection || '').toLowerCase() === 'values'
        && isBomVersionContext();

    if (fromVersionValues) {
        const prefillId = String(plmBomVersionContextId || selectedOpenedPlmVersionId || '').trim();
        openPlmVersionCompareSelection(prefillId);
        notifyProject('Version actual preseleccionada. Seleccione otra(s) y presione Comparar nuevamente.', 'success');
        return;
    }

    if (plmWorkspaceMode !== 'versions') return;

    if (plmVersionsFlowMode === 'compare') {
        plmVersionComparisonIds = [];
        setPlmVersionsFlowMode('list');
        return;
    }

    if (plmVersionsFlowMode !== 'list') return;

    if (!plmVersionCompareSelectMode) {
        openPlmVersionCompareSelection('');
        notifyProject('Seleccione 2 o mas versiones y presione Comparar nuevamente.', 'success');
        return;
    }

    const selectedIds = Array.from(selectedPlmCompareVersionIds)
        .map((id) => String(id || '').trim())
        .filter(Boolean);

    if (selectedIds.length < 2) {
        notifyProject('Seleccione al menos 2 versiones para comparar.', 'error');
        return;
    }

    plmVersionComparisonIds = selectedIds;
    plmVersionCompareSelectMode = false;
    setPlmVersionsFlowMode('compare');
}

function getPlmValuesItemRowsForVersion(versionId = '') {
    if (!currentWorkspaceProject) return [];

    const id = String(versionId || '').trim();
    if (!id) return [];

    const prevContext = String(plmBomVersionContextId || '').trim();
    const prevActive = String(currentWorkspaceProject.active_plm_version_id || '').trim();

    try {
        plmBomVersionContextId = id;
        currentWorkspaceProject.active_plm_version_id = id;
        return getPlmValuesItemRows();
    } finally {
        plmBomVersionContextId = prevContext;
        currentWorkspaceProject.active_plm_version_id = prevActive;
    }
}

function calculatePlmVersionTotals(version) {
    const rows = getPlmValuesItemRowsForVersion(String(version && version.id ? version.id : '').trim());

    const totals = rows.reduce((acc, row) => {
        acc.fob += Math.max(0, toNumber(row && row.cost_fob_total, 0));
        acc.mecanizado += Math.max(0, toNumber(row && row.cost_mecanizado_total, 0));
        acc.tratamientos += Math.max(0, toNumber(row && row.cost_tratamientos_total, 0));
        acc.pintado += Math.max(0, toNumber(row && row.cost_pintado_total, 0));
        acc.importacion += Math.max(0, toNumber(row && row.cost_importacion_total, 0));
        acc.matriceria += Math.max(0, toNumber(row && row.cost_matriceria_total, 0));
        acc.matriceriaUnit += Math.max(0, toNumber(row && row.cost_matriceria_unit_total, 0));
        acc.totalUnit += Math.max(0, toNumber(row && row.total_cost, 0));
        return acc;
    }, {
        fob: 0,
        mecanizado: 0,
        tratamientos: 0,
        pintado: 0,
        importacion: 0,
        matriceria: 0,
        matriceriaUnit: 0,
        totalUnit: 0
    });

    const itemCount = rows.length
        ? new Set(rows.map((row) => String(row && row.id ? row.id : '').trim()).filter(Boolean)).size
        : (Array.isArray(version && version.item_ids) ? version.item_ids.length : 0);

    return {
        version,
        itemCount,
        ...totals
    };
}

function renderPlmVersionComparisonView() {
    const summaryBody = document.getElementById('plm-version-compare-summary-body');
    if (!summaryBody || !currentWorkspaceProject) return;

    const ids = Array.from(new Set((Array.isArray(plmVersionComparisonIds) ? plmVersionComparisonIds : [])
        .map((id) => String(id || '').trim())
        .filter(Boolean)));

    const versions = ids.map((id) => getProjectVersionById(id)).filter(Boolean);

    if (versions.length < 2) {
        summaryBody.innerHTML = '<tr><td colspan="10" class="text-center">Seleccione al menos 2 versiones para comparar.</td></tr>';
        renderPlmValuesChart('plm-version-compare-total-chart', [], 'bar');
        return;
    }

    const rows = versions.map((version) => calculatePlmVersionTotals(version));

    summaryBody.innerHTML = rows.map((row, idx) => {
        const versionName = String(row.version && row.version.name ? row.version.name : `Version ${idx + 1}`).trim() || `Version ${idx + 1}`;
        const rev = normalizePlmVersionRevision(row.version && row.version.revision, idx + 1);
        return `
            <tr>
                <td>${buildPlmValuesLegendCellHtml(versionName, idx)}</td>
                <td><span class="plm-meta-badge plm-revision-badge">${escapeHtml(rev)}</span></td>
                <td class="text-center">${escapeHtml(formatMoney(row.fob))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.mecanizado))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.tratamientos))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.pintado))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.importacion))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.matriceria))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.matriceriaUnit))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.totalUnit))}</td>
            </tr>
        `;
    }).join('');

    const totalChartRows = rows.map((row, idx) => ({
        key: String(row.version && row.version.name ? row.version.name : `Version ${idx + 1}`),
        total_cost: Math.max(0, toNumber(row.totalUnit, 0)),
        value_type: 'money'
    }));
    renderPlmValuesChart('plm-version-compare-total-chart', totalChartRows, 'bar');
}

function renderWorkspaceVersionsTable() {
    const tbody = document.getElementById('plm-versions-list-body');
    if (!tbody || !currentWorkspaceProject) return;

    const versionsSearchInput = document.getElementById('plm-versions-search');
    if (versionsSearchInput && versionsSearchInput.value !== getWorkspaceSearchQuery('versions')) versionsSearchInput.value = getWorkspaceSearchQuery('versions');

    const rows = Array.isArray(currentWorkspaceProject.plm_versions) ? currentWorkspaceProject.plm_versions : [];

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin versiones cargadas.</td></tr>';
        return;
    }

    const compareMode = plmWorkspaceMode === 'versions' && plmVersionsFlowMode === 'list' && plmVersionCompareSelectMode;

    tbody.innerHTML = rows.map((version, idx) => {
        const versionId = String(version.id || '');
        const safeId = versionId.replace(/'/g, "\'");

        const actionHtml = compareMode
            ? `<label class="plm-version-checkbox-hit"><input type="checkbox" class="plm-version-checkbox" data-version-id="${escapeHtml(versionId)}" onchange="togglePlmVersionCompareSelection('${safeId}', this.checked)" ${selectedPlmCompareVersionIds.has(versionId) ? 'checked' : ''}></label>`
            : `<button class="btn btn-sm" onclick="openPlmVersionActions('${safeId}')">Abrir Version</button>`;

        return `
            <tr>
                <td style="font-weight:700; color:var(--bpb-blue);">${escapeHtml(version.name || `Version ${idx + 1}`)}</td>
                <td>${escapeHtml(version.description || '-')}</td>
                <td><span class="plm-meta-badge plm-revision-badge">${escapeHtml(normalizePlmVersionRevision(version.revision, idx + 1))}</span></td>
                <td>${escapeHtml(formatPlmVersionDate(version.created_at))}</td>
                <td>${escapeHtml(formatPlmVersionDate(version.updated_at || version.created_at))}</td>
                <td>${actionHtml}</td>
            </tr>
        `;
    }).join('');

    applySearchToTbody(tbody, getWorkspaceSearchQuery('versions'), 6, 'No hay versiones coincidentes.');
}


function renderExistingPlmVersionsTable() {
    const tbody = document.getElementById('plm-existing-versions-body');
    if (!tbody || !currentWorkspaceProject) return;

    const rows = Array.isArray(currentWorkspaceProject.plm_versions) ? currentWorkspaceProject.plm_versions : [];

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin versiones cargadas.</td></tr>';
        return;
    }

    tbody.innerHTML = rows.map((version) => {
        const versionId = String(version.id || '');
        const safeId = versionId.replace(/'/g, "\'");

        return `
            <tr>
                <td style="font-weight:700; color:var(--bpb-blue);">${escapeHtml(version.name || 'Version')}</td>
                <td>${escapeHtml(version.description || '-')}</td>
                <td><span class="plm-meta-badge plm-revision-badge">${escapeHtml(normalizePlmVersionRevision(version.revision, 1))}</span></td>
                <td>${escapeHtml(formatPlmVersionDate(version.created_at))}</td>
                <td>${escapeHtml(formatPlmVersionDate(version.updated_at || version.created_at))}</td>
                <td><button class="btn btn-sm" onclick="openPlmVersionCopyFlow('${safeId}')">Copiar Version</button></td>
            </tr>
        `;
    }).join('');
}

function getPlmVersionSelectionCategoryRank(categoryRaw) {
    const category = String(categoryRaw || '').trim();
    if (category === 'Conjunto') return 1;
    if (category === 'Subconjunto 1') return 2;
    if (category === 'Subconjunto 1.1') return 3;
    if (category === 'Piezas') return 4;
    if (category === 'Buloneria') return 5;
    return 9;
}

function getPlmVersionSelectionToneClass(categoryRaw) {
    const category = String(categoryRaw || '').trim();
    if (category === 'Conjunto') return 'branch-conjunto';
    if (category === 'Subconjunto 1') return 'branch-sub1';
    if (category === 'Subconjunto 1.1') return 'branch-sub11';
    if (category === 'Buloneria') return 'branch-buloneria';
    return 'branch-pieza';
}

function renderPlmVersionSelectionNodeBadge(item, categoryRaw) {
    return renderBomPartBadge(item, getPlmVersionSelectionToneClass(categoryRaw));
}

function getPlmVersionSelectionHierarchyRows() {
    const empty = { rows: [], parentByChild: new Map(), descendantsById: new Map() };
    if (!currentWorkspaceProject) return empty;

    const baseItems = Array.isArray(currentWorkspaceProject.plm_items) ? currentWorkspaceProject.plm_items : [];
    const duplicateItems = Array.isArray(currentWorkspaceProject.bom_duplicate_nodes) ? currentWorkspaceProject.bom_duplicate_nodes : [];
    const items = baseItems.concat(duplicateItems);
    if (!items.length) return empty;

    const itemById = new Map();
    items.forEach((item) => {
        const itemId = String(item && item.id ? item.id : '').trim();
        if (itemId) itemById.set(itemId, item);
    });
    if (!itemById.size) return empty;

    const childrenByParent = new Map();
    const incomingByNode = new Map();
    const edges = Array.isArray(currentWorkspaceProject.bom_edges) ? currentWorkspaceProject.bom_edges : [];

    edges.forEach((edge) => {
        const targetId = String(edge && edge.target_id ? edge.target_id : '').trim();
        if (!targetId || !itemById.has(targetId)) return;

        let parentId = 'core';
        const rawSourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
        if (rawSourceId && rawSourceId !== 'core') {
            if (!itemById.has(rawSourceId) || rawSourceId === targetId) return;
            parentId = rawSourceId;
        }

        const siblings = childrenByParent.get(parentId) || [];
        if (!siblings.includes(targetId)) siblings.push(targetId);
        childrenByParent.set(parentId, siblings);
        incomingByNode.set(targetId, (incomingByNode.get(targetId) || 0) + 1);
    });

    const isBuloneriaNodeId = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId || !itemById.has(nodeId)) return false;
        const item = itemById.get(nodeId);
        return String(getBomCategory(item) || '').trim() === 'Buloneria';
    };

    const isStructuralCategory = (categoryRaw) => {
        const category = String(categoryRaw || '').trim();
        return category === 'Conjunto' || category === 'Subconjunto 1' || category === 'Subconjunto 1.1';
    };

    const hasVisibleTreeChildren = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId || !itemById.has(nodeId)) return false;
        const item = itemById.get(nodeId);
        const baseCategory = String(getBomCategory(item) || '').trim();
        const childIds = (childrenByParent.get(nodeId) || []).filter((childId) => !isBuloneriaNodeId(childId));
        if (!childIds.length) return false;
        if (isStructuralCategory(baseCategory)) return true;

        return childIds.some((childId) => {
            const childItem = itemById.get(String(childId || '').trim()) || {};
            return isStructuralCategory(getBomCategory(childItem));
        });
    };

    const sortIds = (idsRaw = []) => {
        const ids = Array.isArray(idsRaw) ? idsRaw.slice() : [];
        return ids.sort((aRaw, bRaw) => {
            const a = String(aRaw || '').trim();
            const b = String(bRaw || '').trim();
            const itemA = itemById.get(a) || {};
            const itemB = itemById.get(b) || {};

            const hasChildrenA = hasVisibleTreeChildren(a);
            const hasChildrenB = hasVisibleTreeChildren(b);
            if (hasChildrenA !== hasChildrenB) return hasChildrenA ? -1 : 1;

            const rankA = getPlmVersionSelectionCategoryRank(getBomCategory(itemA));
            const rankB = getPlmVersionSelectionCategoryRank(getBomCategory(itemB));
            if (rankA !== rankB) return rankA - rankB;

            const codeA = String(itemA.item_id || '').trim();
            const codeB = String(itemB.item_id || '').trim();
            const codeDiff = codeA.localeCompare(codeB, 'es', { numeric: true, sensitivity: 'base' });
            if (codeDiff !== 0) return codeDiff;

            const nameA = String(itemA.name || '').trim();
            const nameB = String(itemB.name || '').trim();
            return nameA.localeCompare(nameB, 'es', { numeric: true, sensitivity: 'base' });
        });
    };

    const coreChildren = sortIds((childrenByParent.get('core') || []).filter((id) => itemById.has(id)));
    const rootSet = new Set(coreChildren);
    const orphanRoots = sortIds(
        Array.from(itemById.keys()).filter((id) => (incomingByNode.get(id) || 0) === 0 && !rootSet.has(id))
    );
    const startRoots = coreChildren.concat(orphanRoots);

    const rows = [];
    const coveredNodeIds = new Set();
    const visibleParentByChild = new Map();
    const rowCategoryById = new Map();
    let rowCounter = 0;

    const structuralCategoryByDepth = (depthRaw) => {
        const depth = Math.max(1, toNumber(depthRaw, 1));
        if (depth <= 1) return 'Conjunto';
        if (depth === 2) return 'Subconjunto 1';
        return 'Subconjunto 1.1';
    };

    const displayColumnByCategory = (categoryRaw) => {
        const category = String(categoryRaw || '').trim();
        if (category === 'Conjunto') return 'conjunto';
        if (category === 'Subconjunto 1') return 'sub1';
        if (category === 'Subconjunto 1.1') return 'sub11';
        return 'pieza';
    };

    const columnBaseDepth = (columnRaw) => {
        const column = String(columnRaw || '').trim().toLowerCase();
        if (column === 'conjunto') return 1;
        if (column === 'sub1') return 2;
        if (column === 'sub11') return 3;
        return 4;
    };

    const walk = (nodeIdRaw, depthRaw = 1, visibleParentIdRaw = 'core', pathRaw = null) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId || !itemById.has(nodeId)) return [];

        const path = pathRaw instanceof Set ? new Set(pathRaw) : new Set();
        if (path.has(nodeId)) return [];
        path.add(nodeId);
        coveredNodeIds.add(nodeId);

        const children = sortIds((childrenByParent.get(nodeId) || []).filter((id) => itemById.has(id)));
        const depth = Math.max(1, toNumber(depthRaw, 1));
        const item = itemById.get(nodeId);
        const baseCategory = String(getBomCategory(item) || '').trim();
        const visibleParentId = String(visibleParentIdRaw || 'core').trim() || 'core';
        const isStructuralNode = isStructuralCategory(baseCategory);
        const isPieceLikeNode = !isStructuralNode && baseCategory !== 'Buloneria';

        if (baseCategory === 'Buloneria') {
            const passthroughRows = [];
            children.forEach((childId) => {
                const childRows = walk(childId, depth + 1, visibleParentId, path);
                childRows.forEach((rowId) => {
                    if (!passthroughRows.includes(rowId)) passthroughRows.push(rowId);
                });
            });
            return passthroughRows;
        }

        const parentDisplayCategory = visibleParentId !== 'core'
            ? String(rowCategoryById.get(visibleParentId) || '').trim()
            : '';

        if (parentDisplayCategory === 'Piezas' && isPieceLikeNode) {
            const passthroughRows = [];
            children.forEach((childId) => {
                const childRows = walk(childId, depth + 1, visibleParentId, path);
                childRows.forEach((rowId) => {
                    if (!passthroughRows.includes(rowId)) passthroughRows.push(rowId);
                });
            });
            return passthroughRows;
        }

        let category = 'Piezas';
        if (isStructuralNode) category = structuralCategoryByDepth(depth);

        const column = displayColumnByCategory(category);
        const baseDepth = columnBaseDepth(column);
        const indent = Math.max(0, depth - baseDepth) * 14;
        const rowId = `vrow-${++rowCounter}`;

        const row = {
            id: rowId,
            nodeId,
            item,
            canonicalId: getProjectBomCanonicalItemId(nodeId),
            parentId: visibleParentId,
            depth,
            category,
            childrenIds: [],
            column,
            indent
        };
        rows.push(row);

        rowCategoryById.set(rowId, category);
        visibleParentByChild.set(rowId, visibleParentId);

        const directChildRows = [];
        children.forEach((childId) => {
            const childItem = itemById.get(String(childId || '').trim()) || {};
            const childBaseCategory = String(getBomCategory(childItem) || '').trim();
            const childIsStructural = isStructuralCategory(childBaseCategory);
            const hiddenByPieceRule = category === 'Piezas' && !childIsStructural;
            const nextVisibleParent = (isBuloneriaNodeId(childId) || hiddenByPieceRule) ? visibleParentId : rowId;
            const childRows = walk(childId, depth + 1, nextVisibleParent, path);
            if (nextVisibleParent === rowId) {
                childRows.forEach((childRowId) => {
                    if (!directChildRows.includes(childRowId)) directChildRows.push(childRowId);
                });
            }
        });
        row.childrenIds = directChildRows;
        return [rowId];
    };

    startRoots.forEach((rootId) => walk(rootId, 1, 'core', new Set()));
    sortIds(Array.from(itemById.keys()).filter((id) => !coveredNodeIds.has(id))).forEach((id) => walk(id, 1, 'core', new Set()));

    const descendantsById = new Map();
    const childRowsByParent = new Map();
    rows.forEach((row) => {
        const rowId = String(row && row.id ? row.id : '').trim();
        const parentId = String(row && row.parentId ? row.parentId : '').trim() || 'core';
        if (!rowId || parentId === 'core') return;
        const list = childRowsByParent.get(parentId) || [];
        list.push(rowId);
        childRowsByParent.set(parentId, list);
    });

    rows.forEach((row) => {
        const rowId = String(row && row.id ? row.id : '').trim();
        if (!rowId) return;

        const result = [];
        const seen = new Set();
        const stack = (childRowsByParent.get(rowId) || []).slice();

        while (stack.length) {
            const current = String(stack.pop() || '').trim();
            if (!current || seen.has(current)) continue;
            seen.add(current);
            result.push(current);
            const children = childRowsByParent.get(current) || [];
            children.forEach((childId) => stack.push(String(childId || '').trim()));
        }

        descendantsById.set(rowId, result);
    });

    return { rows, parentByChild: visibleParentByChild, descendantsById };
}

function getPlmVersionSelectionCanonicalId(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId || nodeId === 'core') return nodeId;

    const mapped = String(plmVersionSelectionCanonicalByNodeId.get(nodeId) || '').trim();
    if (mapped) return mapped;

    const canonicalId = String(getProjectBomCanonicalItemId(nodeId) || '').trim();
    return canonicalId || nodeId;
}

function togglePlmVersionSelectionBranch(rowIdRaw) {
    const rowId = String(rowIdRaw || '').trim();
    if (!rowId) return;

    const descendants = plmVersionSelectionDescendantsById.get(rowId) || [];
    if (!descendants.length) return;

    const wasExpanded = plmVersionSelectionExpandedNodeIds.has(rowId);
    if (wasExpanded) {
        plmVersionSelectionExpandedNodeIds.delete(rowId);
    } else {
        plmVersionSelectionExpandedNodeIds.add(rowId);
    }

    const tbody = document.getElementById('plm-version-selection-body');
    if (!tbody) {
        renderPlmVersionSelectionTable();
        return;
    }

    const rowById = new Map();
    tbody.querySelectorAll('tr[data-row-id]').forEach((rowEl) => {
        const id = String(rowEl && rowEl.dataset ? rowEl.dataset.rowId : '').trim();
        if (id) rowById.set(id, rowEl);
    });
    if (!rowById.size) {
        renderPlmVersionSelectionTable();
        return;
    }

    const nodeRow = rowById.get(rowId);
    const nodeBtn = nodeRow ? nodeRow.querySelector('button.plm-version-tree-toggle[data-row-id]') : null;
    if (nodeBtn) {
        nodeBtn.classList.toggle('open', !wasExpanded);
        nodeBtn.title = !wasExpanded ? 'Ocultar hijos' : 'Mostrar hijos';
    }

    descendants.forEach((descIdRaw) => {
        const descId = String(descIdRaw || '').trim();
        if (!descId) return;
        const rowEl = rowById.get(descId);
        if (!rowEl) return;

        rowEl.style.display = isPlmVersionSelectionNodeVisible(descId) ? '' : 'none';
    });
}

function togglePlmVersionHierarchySelection(itemIdRaw, checkedRaw, sourceEl = null, ev = null) {
    const rowId = String(itemIdRaw || '').trim();
    if (!rowId) return;
    if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();

    const checked = Boolean(checkedRaw);
    const canonicalId = getPlmVersionSelectionCanonicalId(rowId);
    if (!canonicalId) return;
    if (checked) selectedPlmVersionItemIds.add(canonicalId);
    else selectedPlmVersionItemIds.delete(canonicalId);

    const descendants = plmVersionSelectionDescendantsById.get(rowId) || [];
    const affectedCanonicalIds = new Set([canonicalId]);
    descendants.forEach((childIdRaw) => {
        const childId = String(childIdRaw || '').trim();
        if (!childId) return;
        const childCanonicalId = getPlmVersionSelectionCanonicalId(childId);
        if (!childCanonicalId) return;
        affectedCanonicalIds.add(childCanonicalId);
        if (checked) selectedPlmVersionItemIds.add(childCanonicalId);
        else selectedPlmVersionItemIds.delete(childCanonicalId);
    });

    syncPlmVersionSelectionCheckboxes(affectedCanonicalIds);
    if (sourceEl && typeof sourceEl === 'object' && 'checked' in sourceEl) {
        sourceEl.checked = checked;
    }
}

function syncPlmVersionSelectionCheckboxes(affectedIdsRaw = null) {
    const body = document.getElementById('plm-version-selection-body');
    if (!body) return;

    let affectedIds = null;
    if (affectedIdsRaw instanceof Set) affectedIds = affectedIdsRaw;
    else if (Array.isArray(affectedIdsRaw)) affectedIds = new Set(affectedIdsRaw.map((id) => String(id || '').trim()).filter(Boolean));

    const boxes = body.querySelectorAll('input.plm-version-checkbox[data-row-id]');
    boxes.forEach((box) => {
        if (!box) return;
        const rowId = String(box.dataset.rowId || '').trim();
        if (!rowId) return;
        const canonicalId = getPlmVersionSelectionCanonicalId(rowId);
        if (!canonicalId) return;
        if (affectedIds && !affectedIds.has(canonicalId)) return;
        box.checked = selectedPlmVersionItemIds.has(canonicalId);
    });
}

function renderPlmVersionSelectionTable() {
    const tbody = document.getElementById('plm-version-selection-body');
    if (!tbody || !currentWorkspaceProject) return;

    const hierarchy = getPlmVersionSelectionHierarchyRows();
    const rows = Array.isArray(hierarchy.rows) ? hierarchy.rows : [];
    if (!rows.length) {
        plmVersionSelectionDescendantsById = new Map();
        plmVersionSelectionParentByChild = new Map();
        plmVersionSelectionCanonicalByNodeId = new Map();
        plmVersionSelectionExpandedNodeIds = new Set();
        plmVersionSelectionExpansionInitialized = false;
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay piezas en PLM para seleccionar.</td></tr>';
        return;
    }

    plmVersionSelectionDescendantsById = hierarchy.descendantsById instanceof Map
        ? hierarchy.descendantsById
        : new Map();

    const parentByChild = hierarchy.parentByChild instanceof Map ? hierarchy.parentByChild : new Map();
    plmVersionSelectionParentByChild = parentByChild;
    plmVersionSelectionCanonicalByNodeId = new Map();
    rows.forEach((row) => {
        const rowId = String(row && row.id ? row.id : '').trim();
        const nodeId = String(row && row.nodeId ? row.nodeId : '').trim();
        const canonicalId = String(row && row.canonicalId ? row.canonicalId : getProjectBomCanonicalItemId(nodeId || rowId)).trim();
        const normalizedCanonical = canonicalId || nodeId || rowId;
        if (rowId) plmVersionSelectionCanonicalByNodeId.set(rowId, normalizedCanonical);
        if (nodeId) plmVersionSelectionCanonicalByNodeId.set(nodeId, normalizedCanonical);
        if (normalizedCanonical) plmVersionSelectionCanonicalByNodeId.set(normalizedCanonical, normalizedCanonical);
    });
    const expandableIds = new Set(rows.filter((row) => Array.isArray(row.childrenIds) && row.childrenIds.length).map((row) => String(row.id || '').trim()).filter(Boolean));

    if (!plmVersionSelectionExpansionInitialized) {
        plmVersionSelectionExpandedNodeIds = new Set();
        plmVersionSelectionExpansionInitialized = true;
    } else {
        plmVersionSelectionExpandedNodeIds = new Set(
            Array.from(plmVersionSelectionExpandedNodeIds).filter((id) => expandableIds.has(String(id || '').trim()))
        );
    }

    const isRowVisible = (row) => {
        let parentId = String(row && row.parentId ? row.parentId : '').trim();
        let guard = 0;
        while (parentId && parentId !== 'core' && guard < 1000) {
            if (!plmVersionSelectionExpandedNodeIds.has(parentId)) return false;
            parentId = String(parentByChild.get(parentId) || '').trim();
            guard += 1;
        }
        return true;
    };

    const buildTreeCell = (row) => {
        const rowId = String(row && row.id ? row.id : '').trim();
        const hasChildren = Boolean(row && Array.isArray(row.childrenIds) && row.childrenIds.length);
        const isExpanded = hasChildren && plmVersionSelectionExpandedNodeIds.has(rowId);
        const rowIdJs = JSON.stringify(rowId);
        const toggleHtml = hasChildren
            ? `<button type="button" class="plm-version-tree-toggle ${isExpanded ? 'open' : ''}" data-row-id="${escapeHtml(rowId)}" onclick='togglePlmVersionSelectionBranch(${rowIdJs})' title="${isExpanded ? 'Ocultar hijos' : 'Mostrar hijos'}">\u25B8</button>`
            : '<span class="plm-version-tree-spacer"></span>';
        const badgeHtml = renderPlmVersionSelectionNodeBadge(row.item, row.category);
        const indent = Math.max(0, toNumber(row && row.indent, 0));

        return `
            <div class="plm-version-tree-cell" style="padding-left:${indent}px;">
                ${toggleHtml}
                <span class="plm-version-tree-content">${badgeHtml}</span>
            </div>
        `;
    };

    tbody.innerHTML = rows.map((row) => {
        const item = row && row.item ? row.item : {};
        const itemId = String(item && item.id ? item.id : '').trim();
        const rowId = String(row && row.id ? row.id : '').trim();
        const nodeId = String(row && row.nodeId ? row.nodeId : itemId).trim();
        const canonicalId = String(row && row.canonicalId ? row.canonicalId : getProjectBomCanonicalItemId(nodeId || rowId)).trim() || nodeId || rowId;
        const parentId = String(row && row.parentId ? row.parentId : 'core').trim() || 'core';
        const visible = isRowVisible(row);
        const checked = selectedPlmVersionItemIds.has(canonicalId) ? 'checked' : '';
        const rowIdJs = JSON.stringify(rowId);

        const category = String(row && row.category ? row.category : '').trim();
        const treeHtml = buildTreeCell(row);
        const conjuntoHtml = category === 'Conjunto' ? treeHtml : '-';
        const sub1Html = category === 'Subconjunto 1' ? treeHtml : '-';
        const sub11Html = category === 'Subconjunto 1.1' ? treeHtml : '-';
        const piezaHtml = (category !== 'Conjunto' && category !== 'Subconjunto 1' && category !== 'Subconjunto 1.1') ? treeHtml : '-';

        return `
            <tr data-row-id="${escapeHtml(rowId)}" data-node-id="${escapeHtml(nodeId)}" data-parent-row-id="${escapeHtml(parentId)}" style="${visible ? '' : 'display:none;'}">
                <td>${conjuntoHtml}</td>
                <td>${sub1Html}</td>
                <td>${sub11Html}</td>
                <td>${piezaHtml}</td>
                <td>${escapeHtml(item.revision || '-')}</td>
                <td>${escapeHtml(item.status || '-')}</td>
                <td><label class="plm-version-checkbox-hit"><input type="checkbox" class="plm-version-checkbox" data-row-id="${escapeHtml(rowId)}" data-node-id="${escapeHtml(nodeId)}" data-canonical-id="${escapeHtml(canonicalId)}" onclick="event.stopPropagation();" onchange='togglePlmVersionHierarchySelection(${rowIdJs}, this.checked, this, event)' ${checked}></label></td>
            </tr>
        `;
    }).join('');
}

function isPlmVersionSelectionNodeVisible(nodeIdRaw) {
    const nodeId = String(nodeIdRaw || '').trim();
    if (!nodeId) return false;

    let parentId = String(plmVersionSelectionParentByChild.get(nodeId) || '').trim();
    let guard = 0;
    while (parentId && parentId !== 'core' && guard < 1000) {
        if (!plmVersionSelectionExpandedNodeIds.has(parentId)) return false;
        parentId = String(plmVersionSelectionParentByChild.get(parentId) || '').trim();
        guard += 1;
    }
    return true;
}

function showPlmVersionsEntryCards() {
    setPlmVersionsFlowMode('cards');
}

function openPlmVersionCreateFlow() {
    plmVersionEditTargetId = '';
    selectedPlmVersionItemIds = new Set();
    plmVersionSelectionExpandedNodeIds = new Set();
    plmVersionSelectionDescendantsById = new Map();
    plmVersionSelectionCanonicalByNodeId = new Map();
    plmVersionSelectionExpansionInitialized = false;
    erpExpandedHomeItemIds = new Set();
    renderPlmVersionSelectionTable();
    setPlmVersionsFlowMode('create');
}

function openPlmVersionModifyFlow() {
    if (!currentWorkspaceProject) return;

    const id = String(selectedOpenedPlmVersionId || plmBomVersionContextId || '').trim();
    if (!id) {
        notifyProject('Version no encontrada.', 'error');
        return;
    }

    const version = getProjectVersionById(id);
    if (!version) {
        notifyProject('Version no encontrada.', 'error');
        return;
    }

    const itemIds = Array.isArray(version.item_ids) ? version.item_ids : [];
    selectedPlmVersionItemIds = new Set(itemIds.map((itemId) => String(itemId || '').trim()).filter(Boolean));
    selectedOpenedPlmVersionId = id;
    plmVersionEditTargetId = id;
    plmVersionSelectionExpandedNodeIds = new Set();
    plmVersionSelectionDescendantsById = new Map();
    plmVersionSelectionCanonicalByNodeId = new Map();
    plmVersionSelectionExpansionInitialized = false;

    setPlmWorkspaceMode('versions');
    setPlmVersionsFlowMode('create');
}

function openPlmVersionExistingFlow() {
    renderExistingPlmVersionsTable();
    setPlmVersionsFlowMode('existing');
}

function openPlmVersionCopyFlow(versionId) {
    const id = String(versionId || '').trim();
    if (!id) return;

    const version = getProjectVersionById(id);
    if (!version) {
        notifyProject('Version no encontrada.', 'error');
        return;
    }

    openPlmVersionMetaModal('copy', id);
}

function togglePlmVersionItemSelection(itemId, checked) {
    togglePlmVersionHierarchySelection(itemId, checked);
}

function syncPlmVersionSelectionFromDom() {
    const body = document.getElementById('plm-version-selection-body');
    if (!body) return;

    const boxes = body.querySelectorAll('input.plm-version-checkbox[data-row-id]');
    if (!boxes.length) return;

    const visibleCanonicalIds = new Set();
    const checkedCanonicalIds = new Set();

    boxes.forEach((box) => {
        if (!box) return;
        const rowId = String(box.dataset.rowId || '').trim();
        if (!rowId) return;
        const canonicalId = getPlmVersionSelectionCanonicalId(rowId);
        if (!canonicalId) return;
        visibleCanonicalIds.add(canonicalId);
        if (box.checked) checkedCanonicalIds.add(canonicalId);
    });

    visibleCanonicalIds.forEach((canonicalId) => {
        if (checkedCanonicalIds.has(canonicalId)) selectedPlmVersionItemIds.add(canonicalId);
        else selectedPlmVersionItemIds.delete(canonicalId);
    });
}

function deriveDefaultPlmVersionRevision() {
    return 'A';
}

function deriveDefaultPlmVersionName() {
    const versions = Array.isArray(currentWorkspaceProject && currentWorkspaceProject.plm_versions)
        ? currentWorkspaceProject.plm_versions
        : [];

    const used = new Set(versions.map((version) => String(version.name || '').trim().toLowerCase()).filter(Boolean));

    let idx = 1;
    while (used.has(`version ${idx}`)) idx += 1;
    return `Version ${idx}`;
}

function deriveCopiedPlmVersionName(baseName = '') {
    const versions = Array.isArray(currentWorkspaceProject && currentWorkspaceProject.plm_versions)
        ? currentWorkspaceProject.plm_versions
        : [];

    const used = new Set(versions.map((version) => String(version.name || '').trim().toLowerCase()).filter(Boolean));
    const normalizedBase = String(baseName || '').trim() || 'Version';
    const root = `${normalizedBase} - Copia`;

    if (!used.has(root.toLowerCase())) return root;

    let idx = 2;
    while (used.has(`${root} ${idx}`.toLowerCase())) idx += 1;
    return `${root} ${idx}`;
}

function getPlmVersionSelectionWithLinkedBuloneria(selectedCanonicalIdsRaw = []) {
    if (!currentWorkspaceProject) return [];

    const seed = Array.isArray(selectedCanonicalIdsRaw) ? selectedCanonicalIdsRaw : [];
    const selected = new Set(
        seed
            .map((id) => String(id || '').trim())
            .filter(Boolean)
            .map((id) => String(getProjectBomCanonicalItemId(id) || id).trim())
            .filter(Boolean)
    );
    if (!selected.size) return [];

    const projectItems = Array.isArray(currentWorkspaceProject.plm_items) ? currentWorkspaceProject.plm_items : [];
    const itemById = new Map();
    projectItems.forEach((item) => {
        const id = String(item && item.id ? item.id : '').trim();
        if (id) itemById.set(id, item);
    });
    if (!itemById.size) return Array.from(selected);

    const isBuloneriaCanonicalId = (itemIdRaw) => {
        const itemId = String(itemIdRaw || '').trim();
        if (!itemId) return false;
        const item = itemById.get(itemId);
        if (!item) return false;

        const explicitCategory = String(item && item.category ? item.category : '').trim();
        if (explicitCategory === 'Buloneria') return true;
        return String(getBomCategory(item) || '').trim() === 'Buloneria';
    };

    const edges = Array.isArray(currentWorkspaceProject.bom_edges) ? currentWorkspaceProject.bom_edges : [];
    let changed = true;
    while (changed) {
        changed = false;
        edges.forEach((edge) => {
            const rawTargetId = String(edge && edge.target_id ? edge.target_id : '').trim();
            if (!rawTargetId) return;
            const targetCanonicalId = String(getProjectBomCanonicalItemId(rawTargetId) || rawTargetId).trim();
            if (!targetCanonicalId || !isBuloneriaCanonicalId(targetCanonicalId)) return;

            const rawSourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
            const sourceCanonicalId = rawSourceId && rawSourceId !== 'core'
                ? String(getProjectBomCanonicalItemId(rawSourceId) || rawSourceId).trim()
                : 'core';
            if (sourceCanonicalId !== 'core' && !selected.has(sourceCanonicalId)) return;

            if (!selected.has(targetCanonicalId)) {
                selected.add(targetCanonicalId);
                changed = true;
            }
        });
    }

    // Regla de selección: si el padre no está marcado, el hijo no.
    // Se aplica a bulonería para evitar que entre sin su nodo padre.
    const hasSelectedParent = (targetCanonicalId) => {
        const targetId = String(targetCanonicalId || '').trim();
        if (!targetId) return false;

        for (const edge of edges) {
            const rawTargetId = String(edge && edge.target_id ? edge.target_id : '').trim();
            if (!rawTargetId) continue;
            const edgeTargetCanonical = String(getProjectBomCanonicalItemId(rawTargetId) || rawTargetId).trim();
            if (edgeTargetCanonical !== targetId) continue;

            const rawSourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
            if (!rawSourceId || rawSourceId === 'core') return true;
            const sourceCanonicalId = String(getProjectBomCanonicalItemId(rawSourceId) || rawSourceId).trim();
            if (sourceCanonicalId && selected.has(sourceCanonicalId)) return true;
        }

        return false;
    };

    let pruneChanged = true;
    while (pruneChanged) {
        pruneChanged = false;
        Array.from(selected).forEach((canonicalIdRaw) => {
            const canonicalId = String(canonicalIdRaw || '').trim();
            if (!canonicalId) return;
            if (!isBuloneriaCanonicalId(canonicalId)) return;
            if (hasSelectedParent(canonicalId)) return;
            selected.delete(canonicalId);
            pruneChanged = true;
        });
    }

    return Array.from(selected);
}

function getPlmVersionSelectionCategoryByCanonicalId() {
    const out = new Map();
    const hierarchy = getPlmVersionSelectionHierarchyRows();
    const rows = Array.isArray(hierarchy && hierarchy.rows) ? hierarchy.rows : [];
    rows.forEach((row) => {
        const canonicalId = String(row && row.canonicalId ? row.canonicalId : '').trim();
        const category = String(row && row.category ? row.category : '').trim();
        if (!canonicalId || !category) return;

        const prevCategory = String(out.get(canonicalId) || '').trim();
        if (!prevCategory) {
            out.set(canonicalId, category);
            return;
        }

        const prevRank = getPlmVersionSelectionCategoryRank(prevCategory);
        const nextRank = getPlmVersionSelectionCategoryRank(category);
        if (nextRank < prevRank) out.set(canonicalId, category);
    });
    return out;
}

function cloneVersionEdgesForSnapshot(edges = []) {
    const seed = Date.now();
    const rows = Array.isArray(edges) ? edges : [];

    return rows.map((edge, idx) => ({
        id: `vedge-${seed}-${idx + 1}`,
        source_id: String(edge && edge.source_id ? edge.source_id : '').trim(),
        target_id: String(edge && edge.target_id ? edge.target_id : '').trim(),
        quantity: normalizeBomQuantity(edge && edge.quantity, 1)
    }));
}

function cloneVersionDuplicateNodesForSnapshot(nodes = [], allowedSourceIds = null) {
    const seed = Date.now();
    const rows = Array.isArray(nodes) ? nodes : [];
    const allowed = allowedSourceIds instanceof Set ? allowedSourceIds : null;

    return rows
        .map((node, idx) => normalizeBomDuplicateNode(node, `vdup-${seed}-${idx + 1}`, allowed))
        .filter(Boolean)
        .map((node, idx) => ({
            ...node,
            id: String(node.id || `vdup-${seed}-${idx + 1}`)
        }));
}

function setPlmVersionModalUi(mode = 'create') {
    const normalized = String(mode || 'create').toLowerCase() === 'copy' ? 'copy' : 'create';
    const titleEl = document.getElementById('plm-version-modal-title');
    const subtitleEl = document.getElementById('plm-version-modal-subtitle');
    const confirmBtn = document.getElementById('plm-version-modal-confirm-btn');

    if (titleEl) titleEl.textContent = normalized === 'copy' ? 'Copiar Version PLM' : 'Nueva Version PLM';
    if (subtitleEl) subtitleEl.textContent = normalized === 'copy'
        ? 'Ingrese nombre y descripcion para la nueva version copiada.'
        : 'Ingrese nombre y descripcion para la version seleccionada.';
    if (confirmBtn) confirmBtn.textContent = normalized === 'copy' ? 'Copiar Version' : 'Cargar Version';
}

function buildVersionSnapshotData(selectedSetRaw) {
    if (!currentWorkspaceProject) return { edges: [], duplicateNodes: [] };

    const selectedCanonicalSet = new Set(
        (selectedSetRaw instanceof Set ? Array.from(selectedSetRaw) : Array.isArray(selectedSetRaw) ? selectedSetRaw : [])
            .map((id) => String(id || '').trim())
            .filter(Boolean)
            .map((id) => String(getProjectBomCanonicalItemId(id) || id).trim())
            .filter(Boolean)
    );
    if (!selectedCanonicalSet.size) return { edges: [], duplicateNodes: [] };

    const edges = Array.isArray(currentWorkspaceProject.bom_edges) ? currentWorkspaceProject.bom_edges : [];
    const projectDuplicateNodes = Array.isArray(currentWorkspaceProject.bom_duplicate_nodes)
        ? currentWorkspaceProject.bom_duplicate_nodes
        : [];
    const duplicateById = new Map();
    projectDuplicateNodes.forEach((node) => {
        const id = String(node && node.id ? node.id : '').trim();
        if (id) duplicateById.set(id, node);
    });

    const toCanonical = (nodeIdRaw) => {
        const nodeId = String(nodeIdRaw || '').trim();
        if (!nodeId || nodeId === 'core') return nodeId;
        const dup = duplicateById.get(nodeId);
        if (!dup) return nodeId;
        const sourceId = String(dup && dup.duplicate_source_id ? dup.duplicate_source_id : '').trim();
        return sourceId || nodeId;
    };

    const neededDuplicateIds = new Set();
    const includedEdges = edges.filter((edge) => {
        const sourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
        const targetId = String(edge && edge.target_id ? edge.target_id : '').trim();
        if (!targetId) return false;

        const targetCanonical = toCanonical(targetId);
        if (!selectedCanonicalSet.has(targetCanonical)) return false;

        if (sourceId !== 'core') {
            const sourceCanonical = toCanonical(sourceId);
            if (!selectedCanonicalSet.has(sourceCanonical)) return false;
        }

        if (duplicateById.has(sourceId)) neededDuplicateIds.add(sourceId);
        if (duplicateById.has(targetId)) neededDuplicateIds.add(targetId);
        return true;
    });

    const seed = Date.now();
    const snapshotEdges = includedEdges.map((edge, idx) => ({
        id: `vedge-${seed}-${idx + 1}`,
        source_id: String(edge && edge.source_id ? edge.source_id : '').trim(),
        target_id: String(edge && edge.target_id ? edge.target_id : '').trim(),
        quantity: normalizeBomQuantity(edge && edge.quantity, 1)
    }));

    const snapshotDuplicateNodes = projectDuplicateNodes
        .filter((node) => neededDuplicateIds.has(String(node && node.id ? node.id : '').trim()))
        .map((node) => normalizeBomDuplicateNode(
            node,
            String(node && node.id ? node.id : ''),
            selectedCanonicalSet
        ))
        .filter(Boolean)
        .map((node) => ({
            ...node,
            id: String(node.id || `vdup-${seed}-${Math.floor(Math.random() * 1000)}`)
        }));

    return {
        edges: snapshotEdges,
        duplicateNodes: snapshotDuplicateNodes
    };
}

function buildVersionSnapshotEdges(selectedSet) {
    return buildVersionSnapshotData(selectedSet).edges;
}

function openPlmVersionActions(versionId) {
    const id = String(versionId || '').trim();
    if (!id) return;

    const version = getProjectVersionById(id);
    if (!version) {
        notifyProject('Version no encontrada.', 'error');
        return;
    }

    selectedOpenedPlmVersionId = id;
    setPlmVersionsFlowMode('open');
}

function openSelectedVersionBitacora() {
    if (!currentWorkspaceProject) return;

    const version = getProjectVersionById(selectedOpenedPlmVersionId);
    if (!version) {
        notifyProject('Version no encontrada.', 'error');
        return;
    }

    plmBomVersionContextId = String(version.id || '');
    currentWorkspaceProject.active_plm_version_id = String(version.id || '');

    setPlmWorkspaceMode('main');
    showPlmSection('bitacora');
}

function openSelectedVersionBom() {
    if (!currentWorkspaceProject) return;

    const version = getProjectVersionById(selectedOpenedPlmVersionId);
    if (!version) {
        notifyProject('Version no encontrada.', 'error');
        return;
    }

    plmBomVersionContextId = String(version.id || '');
    currentWorkspaceProject.active_plm_version_id = String(version.id || '');

    setPlmWorkspaceMode('main');
    maybeInitializeBomLayout();
    showPlmSection('bom');
}

function openSelectedVersionValues() {
    if (!currentWorkspaceProject) return;

    const version = getProjectVersionById(selectedOpenedPlmVersionId);
    if (!version) {
        notifyProject('Version no encontrada.', 'error');
        return;
    }

    plmBomVersionContextId = String(version.id || '');
    currentWorkspaceProject.active_plm_version_id = String(version.id || '');

    setPlmWorkspaceMode('main');
    showPlmSection('values');
}

function getPlmNavigationState() {
    const project = currentWorkspaceProject && typeof currentWorkspaceProject === 'object'
        ? currentWorkspaceProject
        : null;
    const versions = project && Array.isArray(project.plm_versions)
        ? project.plm_versions
        : [];
    const currentVersionId = String(
        selectedOpenedPlmVersionId
        || plmBomVersionContextId
        || (project && project.active_plm_version_id ? project.active_plm_version_id : '')
        || ''
    ).trim();
    const selectedVersion = currentVersionId ? getProjectVersionById(currentVersionId) : null;
    const workspaceEl = document.getElementById('view-plm-workspace');
    const workspaceVisible = workspaceEl instanceof HTMLElement
        && window.getComputedStyle(workspaceEl).display !== 'none';

    return {
        workspace_visible: workspaceVisible,
        workspace_mode: String(plmWorkspaceMode || 'menu'),
        versions_flow_mode: String(plmVersionsFlowMode || 'list'),
        active_section: String(plmActiveSection || 'plm'),
        selected_version_id: String(selectedOpenedPlmVersionId || '').trim(),
        context_version_id: String(plmBomVersionContextId || '').trim(),
        active_version_id: String(project && project.active_plm_version_id ? project.active_plm_version_id : '').trim(),
        current_project: project ? {
            id: String(project.id || '').trim(),
            name: String(project.name || '').trim(),
            description: String(project.description || '').trim(),
            status: String(project.status || '').trim()
        } : null,
        selected_version: selectedVersion ? {
            id: String(selectedVersion.id || '').trim(),
            name: String(selectedVersion.name || '').trim(),
            revision: String(selectedVersion.revision || '').trim(),
            description: String(selectedVersion.description || '').trim()
        } : null,
        versions: versions.map((version, idx) => ({
            id: String(version && version.id ? version.id : '').trim(),
            name: String(version && version.name ? version.name : `Version ${idx + 1}`).trim(),
            revision: String(version && version.revision ? version.revision : '').trim(),
            description: String(version && version.description ? version.description : '').trim()
        }))
    };
}

function openMasterBomFromPlm() {
    if (!currentWorkspaceProject) return;

    clearBomVersionContext();
    currentWorkspaceProject.active_plm_version_id = '';

    setPlmWorkspaceMode('main');
    maybeInitializeBomLayout();
    showPlmSection('bom');
}

function setPlmVersionModalError(message = '') {
    const el = document.getElementById('plm-version-modal-error');
    if (!el) {
        if (message) notifyProject(message, 'error');
        return;
    }

    const text = String(message || '').trim();
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
}

function openPlmVersionMetaModal(mode = 'create', copySourceId = '') {
    if (!currentWorkspaceProject) return;

    const requestedMode = String(mode || 'create').toLowerCase() === 'copy' ? 'copy' : 'create';
    const sourceId = String(copySourceId || '').trim();

    if (requestedMode === 'create') {
        syncPlmVersionSelectionFromDom();
        if (!selectedPlmVersionItemIds.size) {
            notifyProject(plmVersionEditTargetId ? 'Seleccione al menos un item para modificar la version.' : 'Seleccione al menos un item para crear la version.', 'error');
            return;
        }
    }

    if (requestedMode === 'copy') {
        const source = getProjectVersionById(sourceId);
        if (!source) {
            notifyProject('Version no encontrada.', 'error');
            return;
        }
        plmVersionMetaMode = 'copy';
        plmVersionCopySourceId = sourceId;
    } else {
        plmVersionMetaMode = 'create';
        plmVersionCopySourceId = '';
    }

    const modal = document.getElementById('plm-version-meta-modal');
    const nameInput = document.getElementById('plm-version-modal-name');
    const descInput = document.getElementById('plm-version-modal-description');

    if (requestedMode === 'copy') {
        const source = getProjectVersionById(sourceId);
        const baseName = source && source.name ? source.name : deriveDefaultPlmVersionName();
        if (nameInput) nameInput.value = deriveCopiedPlmVersionName(baseName);
        if (descInput) descInput.value = String(source && source.description ? source.description : '').trim();
    } else {
        if (nameInput) nameInput.value = deriveDefaultPlmVersionName();
        if (descInput) descInput.value = '';
    }

    setPlmVersionModalUi(requestedMode);
    setPlmVersionModalError('');

    if (modal) modal.style.display = 'flex';
    if (nameInput) setTimeout(() => nameInput.focus(), 0);
}

function closePlmVersionMetaModal() {
    const modal = document.getElementById('plm-version-meta-modal');
    if (modal) modal.style.display = 'none';
    plmVersionMetaMode = 'create';
    plmVersionCopySourceId = '';
    setPlmVersionModalUi('create');
    setPlmVersionModalError('');
}

async function confirmPlmVersionMeta() {
    const nameInput = document.getElementById('plm-version-modal-name');
    const descInput = document.getElementById('plm-version-modal-description');

    const versionName = String(nameInput ? nameInput.value : '').trim();
    const versionDescription = String(descInput ? descInput.value : '').trim();

    if (!versionName) {
        setPlmVersionModalError('Ingrese un nombre para la version.');
        return;
    }

    if (!versionDescription) {
        setPlmVersionModalError('Ingrese una descripcion para la version.');
        return;
    }

    setPlmVersionModalError('');
    const created = plmVersionMetaMode === 'copy'
        ? await createPlmVersionFromExisting(plmVersionCopySourceId, versionName, versionDescription)
        : await createPlmVersionFromSelection(versionName, versionDescription);

    if (created) closePlmVersionMetaModal();
}

async function createPlmVersionFromSelection(versionName = '', versionDescription = '') {
    if (!currentWorkspaceProject) return false;

    const selectedIdsBase = Array.from(selectedPlmVersionItemIds)
        .map((id) => getPlmVersionSelectionCanonicalId(id))
        .map((id) => String(id || '').trim())
        .filter(Boolean);
    const selectedIds = getPlmVersionSelectionWithLinkedBuloneria(selectedIdsBase);
    if (!selectedIds.length) {
        notifyProject('Seleccione al menos un item para crear la version.', 'error');
        return false;
    }

    const selectedSet = new Set(selectedIds);
    const categoryByCanonicalId = getPlmVersionSelectionCategoryByCanonicalId();
    const selectedItems = (currentWorkspaceProject.plm_items || [])
        .filter((item) => selectedSet.has(String(item.id || '')))
        .map((item) => {
            const normalized = normalizePlmItem(item, String(item.id || ''));
            const canonicalId = String(normalized && normalized.id ? normalized.id : '').trim();
            const selectedCategory = String(categoryByCanonicalId.get(canonicalId) || '').trim();
            if (selectedCategory) normalized.category = selectedCategory;
            return normalized;
        });

    if (!selectedItems.length) {
        notifyProject('No se encontraron items validos para la version.', 'error');
        return false;
    }

    const normalizedVersionName = String(versionName || '').trim() || deriveDefaultPlmVersionName();
    const normalizedVersionDescription = String(versionDescription || '').trim();
    const normalizedRevision = deriveDefaultPlmVersionRevision();
    const versionId = `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();
    const snapshotData = buildVersionSnapshotData(selectedSet);

    const newVersion = {
        id: versionId,
        name: normalizedVersionName,
        description: normalizedVersionDescription,
        revision: normalizedRevision,
        created_at: nowIso,
        updated_at: nowIso,
        item_ids: selectedItems.map((item) => String(item.id)),
        plm_items: selectedItems,
        bom_edges: snapshotData.edges,
        bom_duplicate_nodes: snapshotData.duplicateNodes,
        bom_variant_selection: {},
        bitacora_records: []
    };

    if (!Array.isArray(currentWorkspaceProject.plm_versions)) currentWorkspaceProject.plm_versions = [];
    currentWorkspaceProject.plm_versions.unshift(newVersion);
    currentWorkspaceProject.active_plm_version_id = versionId;

    const saved = await persistCurrentWorkspace(true);
    if (!saved) return false;

    selectedPlmVersionItemIds = new Set();
    plmVersionEditTargetId = '';

    setPlmVersionsFlowMode('list');
    renderWorkspaceVersionsTable();
    renderExistingPlmVersionsTable();
    notifyProject(`Version creada con ${selectedItems.length} item(s).`, 'success');
    return true;
}


async function createPlmVersionFromExisting(sourceVersionId = '', versionName = '', versionDescription = '') {
    if (!currentWorkspaceProject) return false;

    const sourceId = String(sourceVersionId || '').trim();
    if (!sourceId) {
        notifyProject('Version no encontrada.', 'error');
        return false;
    }

    const source = getProjectVersionById(sourceId);
    if (!source) {
        notifyProject('Version no encontrada.', 'error');
        return false;
    }

    const sourceItems = Array.isArray(source.plm_items) ? source.plm_items : [];
    const normalizedItems = sourceItems
        .map((item) => normalizePlmItem(item, String(item && item.id ? item.id : '')))
        .filter((item) => String(item && item.id ? item.id : '').trim());

    const selectedItems = normalizedItems.length
        ? normalizedItems
        : (currentWorkspaceProject.plm_items || [])
            .filter((item) => (Array.isArray(source.item_ids) ? source.item_ids : []).includes(String(item && item.id ? item.id : '')))
            .map((item) => normalizePlmItem(item, String(item && item.id ? item.id : '')));

    if (!selectedItems.length) {
        notifyProject('No se encontraron items validos en la version origen.', 'error');
        return false;
    }

    const normalizedVersionName = String(versionName || '').trim() || deriveCopiedPlmVersionName(source.name || 'Version');
    const normalizedVersionDescription = String(versionDescription || '').trim();
    const normalizedRevision = deriveDefaultPlmVersionRevision();
    const versionId = `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();

    const newVersion = {
        id: versionId,
        name: normalizedVersionName,
        description: normalizedVersionDescription,
        revision: normalizedRevision,
        created_at: nowIso,
        updated_at: nowIso,
        item_ids: selectedItems.map((item) => String(item.id)),
        plm_items: selectedItems,
        bom_edges: cloneVersionEdgesForSnapshot(source.bom_edges),
        bom_duplicate_nodes: cloneVersionDuplicateNodesForSnapshot(source.bom_duplicate_nodes || [], new Set(selectedItems.map((item) => String(item.id)))),
        bom_variant_selection: cloneBomVariantSelectionMap(source.bom_variant_selection || {}, selectedItems.map((item) => String(item.id))),
        bitacora_records: []
    };

    if (!Array.isArray(currentWorkspaceProject.plm_versions)) currentWorkspaceProject.plm_versions = [];
    currentWorkspaceProject.plm_versions.unshift(newVersion);
    currentWorkspaceProject.active_plm_version_id = versionId;

    const saved = await persistCurrentWorkspace(true);
    if (!saved) return false;

    selectedOpenedPlmVersionId = versionId;
    renderWorkspaceVersionsTable();
    renderExistingPlmVersionsTable();
    setPlmVersionsFlowMode('list');
    notifyProject(`Version copiada con ${selectedItems.length} item(s).`, 'success');
    return true;
}

async function updatePlmVersionFromSelection(versionId = '') {
    if (!currentWorkspaceProject) return false;

    const id = String(versionId || plmVersionEditTargetId || selectedOpenedPlmVersionId || '').trim();
    if (!id) {
        notifyProject('Version no encontrada.', 'error');
        return false;
    }

    const version = getProjectVersionById(id);
    if (!version) {
        notifyProject('Version no encontrada.', 'error');
        return false;
    }

    const selectedIdsBase = Array.from(selectedPlmVersionItemIds)
        .map((itemId) => getPlmVersionSelectionCanonicalId(itemId))
        .map((itemId) => String(itemId || '').trim())
        .filter(Boolean);
    const selectedIds = getPlmVersionSelectionWithLinkedBuloneria(selectedIdsBase);
    if (!selectedIds.length) {
        notifyProject('Seleccione al menos un item para modificar la version.', 'error');
        return false;
    }

    const selectedSet = new Set(selectedIds);
    const categoryByCanonicalId = getPlmVersionSelectionCategoryByCanonicalId();
    const selectedItems = (currentWorkspaceProject.plm_items || [])
        .filter((item) => selectedSet.has(String(item.id || '')))
        .map((item) => {
            const normalized = normalizePlmItem(item, String(item.id || ''));
            const canonicalId = String(normalized && normalized.id ? normalized.id : '').trim();
            const selectedCategory = String(categoryByCanonicalId.get(canonicalId) || '').trim();
            if (selectedCategory) normalized.category = selectedCategory;
            return normalized;
        });

    if (!selectedItems.length) {
        notifyProject('No se encontraron items validos para la version.', 'error');
        return false;
    }

    const snapshotData = buildVersionSnapshotData(selectedSet);
    version.item_ids = selectedItems.map((item) => String(item.id));
    version.plm_items = selectedItems;
    version.bom_edges = snapshotData.edges;
    version.bom_duplicate_nodes = snapshotData.duplicateNodes;
    version.bom_variant_selection = cloneBomVariantSelectionMap(version.bom_variant_selection || {}, version.item_ids);
    version.updated_at = new Date().toISOString();

    currentWorkspaceProject.active_plm_version_id = id;

    const saved = await persistCurrentWorkspace(true);
    if (!saved) return false;

    selectedOpenedPlmVersionId = id;
    selectedPlmVersionItemIds = new Set();
    plmVersionEditTargetId = '';

    renderWorkspaceVersionsTable();
    renderExistingPlmVersionsTable();
    setPlmVersionsFlowMode('open');
    notifyProject(`Version actualizada con ${selectedItems.length} item(s).`, 'success');
    return true;
}

async function usePlmVersion(versionId, silent = false) {
    if (!currentWorkspaceProject) return;

    const id = String(versionId || '').trim();
    if (!id) return;

    const versions = Array.isArray(currentWorkspaceProject.plm_versions) ? currentWorkspaceProject.plm_versions : [];
    const target = versions.find((version) => String(version.id) === id);

    if (!target) {
        notifyProject('Version no encontrada.', 'error');
        return;
    }

    currentWorkspaceProject.active_plm_version_id = id;

    const saved = await persistCurrentWorkspace(true);
    if (!saved) return;

    renderWorkspaceVersionsTable();
    renderExistingPlmVersionsTable();

    if (!silent) {
        notifyProject(`Version en uso: ${target.name}.`, 'success');
    }
}

function handlePlmVersionPrimaryAction() {
    if (plmWorkspaceMode !== 'versions') return;

    if (plmVersionsFlowMode === 'create') {
        syncPlmVersionSelectionFromDom();
        if (plmVersionEditTargetId) {
            updatePlmVersionFromSelection(plmVersionEditTargetId);
            return;
        }
        openPlmVersionMetaModal();
        return;
    }

    if (plmVersionsFlowMode === 'existing' || plmVersionsFlowMode === 'open') {
        setPlmVersionsFlowMode('cards');
        return;
    }

    showPlmVersionsEntryCards();
}

function showPlmWorkspaceMenu() {
    plmVersionEditTargetId = '';
    selectedPlmVersionItemIds = new Set();
    selectedOpenedPlmVersionId = '';
    resetPlmVersionCompareState(true);
    clearPlmFormInputs();
    resetPlmEditMode();
    closePlmItemModal(false);
    closePlmBuloneriaModal(true);
    setPlmVersionsFlowMode('list');
    setPlmWorkspaceMode('menu');
}


function plmWorkspaceBack() {
    if (plmWorkspaceMode === 'versions') {
        if (plmVersionsFlowMode === 'compare') {
            plmVersionComparisonIds = [];
            setPlmVersionsFlowMode('list');
            return;
        }

        if (plmVersionsFlowMode === 'create') {
            if (plmVersionEditTargetId) {
                setPlmVersionsFlowMode('open');
            } else {
                setPlmVersionsFlowMode('cards');
            }
            return;
        }

        if (plmVersionsFlowMode === 'existing') {
            setPlmVersionsFlowMode('cards');
            return;
        }

        if (plmVersionsFlowMode === 'open') {
            setPlmVersionsFlowMode('list');
            return;
        }

        if (plmVersionsFlowMode === 'cards') {
            setPlmVersionsFlowMode('list');
            return;
        }

        if (plmVersionsFlowMode === 'list') {
            if (plmVersionCompareSelectMode) {
                resetPlmVersionCompareState(true);
                renderWorkspaceVersionsTable();
                refreshPlmWorkspaceHeaderActions();
                return;
            }
            showPlmWorkspaceMenu();
            return;
        }
    }

    if (plmWorkspaceMode === 'main') {
        if (isBomVersionContext()) {
            setPlmWorkspaceMode('versions');
            setPlmVersionsFlowMode('open');
            return;
        }

        if (String(plmActiveSection || '').toLowerCase() === 'bom') {
            showPlmSection('plm');
            return;
        }

        if (String(plmActiveSection || '').toLowerCase() === 'erp' && String(erpActivePanel || 'home').toLowerCase() !== 'home') {
            setErpPanel('home');
            return;
        }

        showPlmWorkspaceMenu();
        return;
    }

    if (plmWorkspaceMode === 'menu') {
        showProjectsView();
        return;
    }

    showProjectsView();
}


async function openPlmWorkspaceCard(cardName) {
    const selected = String(cardName || 'plm').toLowerCase();

    if (selected === 'versions') {
        setPlmWorkspaceMode('versions');
        setPlmVersionsFlowMode('list');
        refreshWorkspacePanelBreadcrumb();
        return;
    }

    clearBomVersionContext();

    if (selected === 'erp') {
        plmActiveSection = 'erp';
        erpActivePanel = 'home';
    } else if (selected === 'bom') plmActiveSection = 'bom';
    else if (selected === 'bitacora') plmActiveSection = 'bitacora';
    else plmActiveSection = 'plm';

    setPlmWorkspaceMode('main');
    showPlmSection(plmActiveSection);
    if (plmActiveSection === 'plm') {
        queuePlmEntryUiRefresh();
    }
    refreshWorkspacePanelBreadcrumb();
}

// Navigation
function showProjectsView() {
    if (typeof hideAllViews === 'function') hideAllViews();
    else {
        document.querySelectorAll('.panel, #view-home, #view-sub-home-activity').forEach(el => el.style.display = 'none');
    }

    const view = document.getElementById('view-projects');
    if (view) {
        view.style.display = 'block';
        if (typeof animateEntry === 'function') animateEntry('view-projects');
        renderProjectsTable();
        localStorage.setItem('lastView', 'projects');
        localStorage.removeItem('lastViewParam');
    }
}

async function openProjectWorkspace(projectId) {
    const id = String(projectId || '').trim();
    if (!id) return;

    let project = projectsCache.find((p) => String(p.id) === id);

    if (!project) {
        try {
            await fetchProjectsList();
            project = projectsCache.find((p) => String(p.id) === id);
        } catch (e) {
            console.error(e);
            notifyProject('No se pudieron cargar proyectos.', 'error');
            return;
        }
    }

    if (!project) {
        notifyProject('Proyecto no encontrado.', 'error');
        return;
    }

    currentWorkspaceProject = ensureProjectShape(project);
    selectedBomSourceId = null;
    selectedBomTargetId = null;
    activeBomNodeId = null;
    selectedBomEdgeId = null;
    bomLinkDragState = null;
    bomPanState = null;
    bomViewState.scale = 0.34;
    bomViewState.panX = 0;
    bomViewState.panY = 0;
    selectedPlmVersionItemIds = new Set();
    selectedOpenedPlmVersionId = '';
    plmVersionEditTargetId = '';
    resetPlmVersionCompareState(true);
    clearPlmFormInputs();
    resetPlmEditMode();
    closePlmItemModal(false);
    closePlmBuloneriaModal(true);
    clearBomVersionContext();
    erpActivePanel = 'home';
    erpDiagramAutoFitProjectId = '';

    showPlmWorkspace(id);
}


function showPlmWorkspace(projectId = '') {
    const explicitId = String(projectId || '').trim();
    const storedId = String(localStorage.getItem('lastViewParam') || '').trim();
    const targetId = explicitId || storedId;

    if (!currentWorkspaceProject && targetId) {
        openProjectWorkspace(targetId);
        return;
    }

    if (!currentWorkspaceProject) {
        showProjectsView();
        return;
    }

    if (typeof hideAllViews === 'function') hideAllViews();
    else {
        document.querySelectorAll('.panel, #view-home, #view-sub-home-activity').forEach(el => el.style.display = 'none');
    }

    const view = document.getElementById('view-plm-workspace');
    if (!view) return;

    view.style.display = 'block';
    if (typeof animateEntry === 'function') animateEntry('view-plm-workspace');

    renderWorkspace();
    showPlmWorkspaceMenu();

    localStorage.setItem('lastView', 'plm-workspace');
    localStorage.setItem('lastViewParam', currentWorkspaceProject.id);
}


const PLM_VALUES_PIE_COLORS = [
    '#cf1625',
    '#1f7ed8',
    '#f1c40f',
    '#2ecc71',
    '#1abc9c',
    '#e67e22',
    '#95a5a6',
    '#3498db',
    '#e74c3c',
    '#9b59b6'
];

const PLM_VALUES_CARD_DEFAULTS = {
    summary: { sortField: '', sortDir: 'desc', includeBuloneria: true, chartType: 'pie' },
    parts: { sortField: 'total_cost', sortDir: 'desc', includeBuloneria: true, chartType: 'pie' },
    mp: { sortField: 'total_cost', sortDir: 'desc', includeBuloneria: true, chartType: 'pie' },
    suppliers: { sortField: 'total_cost', sortDir: 'desc', includeBuloneria: true, chartType: 'pie' },
    conjuntos: { sortField: 'total_cost', sortDir: 'desc', includeBuloneria: true, chartType: 'pie' }
};

const PLM_VALUES_CARD_SORT_OPTIONS = {
    summary: [],
    parts: [
        { key: 'unit_cost', label: 'Costo unitario' },
        { key: 'total_cost', label: 'Costo total' }
    ],
    mp: [
        { key: 'qty', label: 'Cantidad de piezas' },
        { key: 'total_cost', label: 'Costo total' }
    ],
    suppliers: [
        { key: 'country', label: 'Nacionalidad' },
        { key: 'qty', label: 'Cantidad de piezas' },
        { key: 'total_cost', label: 'Costo total' }
    ],
    conjuntos: [
        { key: 'qty', label: 'Cantidad de piezas' },
        { key: 'total_cost', label: 'Costo total' }
    ]
};

let plmValuesCardConfigState = {};
let plmValuesConfigMenuOpenCard = '';
let plmValuesConfigOutsideClickBound = false;

function getPlmValuesCardSortOptions(cardKeyRaw) {
    const cardKey = String(cardKeyRaw || '').trim().toLowerCase();
    return Array.isArray(PLM_VALUES_CARD_SORT_OPTIONS[cardKey]) ? PLM_VALUES_CARD_SORT_OPTIONS[cardKey] : [];
}

function getPlmValuesCardConfig(cardKeyRaw) {
    const cardKey = String(cardKeyRaw || '').trim().toLowerCase();
    const defaults = PLM_VALUES_CARD_DEFAULTS[cardKey] || PLM_VALUES_CARD_DEFAULTS.parts;
    const cfg = plmValuesCardConfigState[cardKey] && typeof plmValuesCardConfigState[cardKey] === 'object'
        ? plmValuesCardConfigState[cardKey]
        : {};

    const options = getPlmValuesCardSortOptions(cardKey);
    const firstKey = options.length ? String(options[0].key || '').trim() : '';
    const sortField = options.some((opt) => String(opt.key || '').trim() === String(cfg.sortField || '').trim())
        ? String(cfg.sortField || '').trim()
        : (String(defaults.sortField || '').trim() || firstKey);

    const next = {
        sortField,
        sortDir: String(cfg.sortDir || defaults.sortDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc',
        includeBuloneria: cfg.includeBuloneria !== false,
        chartType: String(cfg.chartType || defaults.chartType || 'pie').toLowerCase() === 'bar' ? 'bar' : 'pie'
    };

    plmValuesCardConfigState[cardKey] = next;
    return next;
}

function closePlmValuesConfigMenus() {
    document.querySelectorAll('.plm-values-config-menu').forEach((menu) => {
        menu.style.display = 'none';
    });
    document.querySelectorAll('.plm-values-config-btn').forEach((btn) => btn.classList.remove('active'));
    plmValuesConfigMenuOpenCard = '';
}

function ensurePlmValuesConfigOutsideClick() {
    if (plmValuesConfigOutsideClickBound) return;

    document.addEventListener('click', (event) => {
        const target = event && event.target ? event.target : null;
        if (target && target.closest && (target.closest('.plm-values-config-menu') || target.closest('.plm-values-config-btn'))) {
            return;
        }
        closePlmValuesConfigMenus();
    });

    plmValuesConfigOutsideClickBound = true;
}

function renderPlmValuesConfigMenuContent(cardKeyRaw) {
    const cardKey = String(cardKeyRaw || '').trim().toLowerCase();
    const menu = document.getElementById(`plm-values-config-${cardKey}`);
    if (!menu) return;

    const cfg = getPlmValuesCardConfig(cardKey);
    const options = getPlmValuesCardSortOptions(cardKey);
    const arrow = cfg.sortDir === 'asc' ? '&#8593;' : '&#8595;';

    const filterRows = options.length
        ? options.map((opt) => {
            const key = String(opt.key || '').trim();
            const label = String(opt.label || key).trim();
            const checked = cfg.sortField === key ? 'checked' : '';
            return `<label class="plm-values-config-check"><input type="checkbox" ${checked} onchange="setPlmValuesSortField('${cardKey}', '${key}', this.checked)"><span>${escapeHtml(label)}</span></label>`;
        }).join('')
        : '<div class="plm-values-config-empty">Sin opciones para esta tarjeta.</div>';

    const chartPieChecked = cfg.chartType === 'pie' ? 'checked' : '';
    const chartBarChecked = cfg.chartType === 'bar' ? 'checked' : '';
    const buloneriaChecked = cfg.includeBuloneria ? 'checked' : '';

    menu.innerHTML = `
        <div class="plm-values-config-section">
            <div class="plm-values-config-title-row">
                <span>Filtrar por:</span>
                <button type="button" class="plm-values-config-sort-btn" onclick="togglePlmValuesSortDir('${cardKey}')">${arrow}</button>
            </div>
            ${filterRows}
        </div>
        <div class="plm-values-config-section">
            <div class="plm-values-config-title-row"><span>Configurar Filtro</span></div>
            <label class="plm-values-config-check"><input type="checkbox" ${buloneriaChecked} onchange="setPlmValuesIncludeBuloneria('${cardKey}', this.checked)"><span>Buloneria</span></label>
        </div>
        <div class="plm-values-config-section">
            <div class="plm-values-config-title-row"><span>Graficos</span></div>
            <label class="plm-values-config-check"><input type="checkbox" ${chartPieChecked} onchange="setPlmValuesChartType('${cardKey}', 'pie', this.checked)"><span>Grafico de Torta</span></label>
            <label class="plm-values-config-check"><input type="checkbox" ${chartBarChecked} onchange="setPlmValuesChartType('${cardKey}', 'bar', this.checked)"><span>Grafico de Barras</span></label>
        </div>
    `;
}

function togglePlmValuesConfigMenu(event, cardKeyRaw) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    ensurePlmValuesConfigOutsideClick();

    const cardKey = String(cardKeyRaw || '').trim().toLowerCase();
    const menu = document.getElementById(`plm-values-config-${cardKey}`);
    if (!menu) return;

    const willOpen = !(menu.style.display === 'block' && plmValuesConfigMenuOpenCard === cardKey);
    closePlmValuesConfigMenus();
    if (!willOpen) return;

    renderPlmValuesConfigMenuContent(cardKey);
    menu.style.display = 'block';
    plmValuesConfigMenuOpenCard = cardKey;

    const btn = event && event.currentTarget ? event.currentTarget : null;
    if (btn && btn.classList) btn.classList.add('active');
}

function setPlmValuesSortField(cardKeyRaw, fieldKeyRaw, checked) {
    if (!checked) return;
    const cardKey = String(cardKeyRaw || '').trim().toLowerCase();
    const fieldKey = String(fieldKeyRaw || '').trim();
    const cfg = getPlmValuesCardConfig(cardKey);
    cfg.sortField = fieldKey;
    renderPlmValuesPanel();
    renderPlmValuesConfigMenuContent(cardKey);
}

function togglePlmValuesSortDir(cardKeyRaw) {
    const cardKey = String(cardKeyRaw || '').trim().toLowerCase();
    const cfg = getPlmValuesCardConfig(cardKey);
    cfg.sortDir = cfg.sortDir === 'asc' ? 'desc' : 'asc';
    renderPlmValuesPanel();
    renderPlmValuesConfigMenuContent(cardKey);
}

function setPlmValuesIncludeBuloneria(cardKeyRaw, checked) {
    const cardKey = String(cardKeyRaw || '').trim().toLowerCase();
    const cfg = getPlmValuesCardConfig(cardKey);
    cfg.includeBuloneria = Boolean(checked);
    renderPlmValuesPanel();
    renderPlmValuesConfigMenuContent(cardKey);
}

function setPlmValuesChartType(cardKeyRaw, chartTypeRaw, checked) {
    if (!checked) return;
    const cardKey = String(cardKeyRaw || '').trim().toLowerCase();
    const chartType = String(chartTypeRaw || '').trim().toLowerCase() === 'bar' ? 'bar' : 'pie';
    const cfg = getPlmValuesCardConfig(cardKey);
    cfg.chartType = chartType;
    renderPlmValuesPanel();
    renderPlmValuesConfigMenuContent(cardKey);
}

function getPlmValuesFilteredRows(rows, cardKeyRaw) {
    const cfg = getPlmValuesCardConfig(cardKeyRaw);
    if (cfg.includeBuloneria) return [...rows];
    return rows.filter((row) => String(row && row.category ? row.category : '').trim() !== 'Buloneria');
}

function sortPlmValuesRows(rows, cardKeyRaw) {
    const cardKey = String(cardKeyRaw || '').trim().toLowerCase();
    const cfg = getPlmValuesCardConfig(cardKey);
    const field = String(cfg.sortField || '').trim();
    const dir = cfg.sortDir === 'asc' ? 1 : -1;

    const out = [...(Array.isArray(rows) ? rows : [])];
    if (!field) return out;

    out.sort((a, b) => {
        const av = a && Object.prototype.hasOwnProperty.call(a, field) ? a[field] : '';
        const bv = b && Object.prototype.hasOwnProperty.call(b, field) ? b[field] : '';

        const isStringField = field === 'country' || field === 'key' || field === 'name' || field === 'item_id';
        let diff = 0;

        if (isStringField) {
            diff = String(av || '').localeCompare(String(bv || ''), 'es', { sensitivity: 'base' });
        } else {
            diff = Math.max(0, toNumber(av, 0)) - Math.max(0, toNumber(bv, 0));
        }

        if (Math.abs(diff) > 0.0001) return diff * dir;

        const aKey = String((a && (a.item_id || a.key || a.name)) || '');
        const bKey = String((b && (b.item_id || b.key || b.name)) || '');
        return aKey.localeCompare(bKey, 'es', { sensitivity: 'base' }) * dir;
    });

    return out;
}

function getPlmValuesPieTooltip() {
    let tip = document.getElementById('plm-values-pie-tooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'plm-values-pie-tooltip';
        tip.className = 'plm-values-pie-tooltip';
        tip.style.display = 'none';
        document.body.appendChild(tip);
    }
    return tip;
}

function hidePlmValuesPieTooltip() {
    const tip = document.getElementById('plm-values-pie-tooltip');
    if (tip) tip.style.display = 'none';
}

function drawPlmValuesPieCanvas(canvas, rows, hoverIndex = -1) {
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = Math.max(180, Math.round(rect.width || Number(canvas.getAttribute('width')) || 300));
    const cssHeight = Math.max(180, Math.round(rect.height || Number(canvas.getAttribute('height')) || 300));

    const targetWidth = Math.round(cssWidth * dpr);
    const targetHeight = Math.round(cssHeight * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const total = rows.reduce((acc, row) => acc + Math.max(0, toNumber(row && row.value, 0)), 0);
    if (!rows.length || total <= 0) {
        canvas._plmPieState = null;
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.font = '600 14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sin datos', cssWidth / 2, cssHeight / 2);
        return;
    }

    const cx = cssWidth / 2;
    const cy = cssHeight / 2;
    const radius = Math.max(44, Math.min(cssWidth, cssHeight) / 2 - 16);
    const innerRadius = radius * 0.48;
    const slices = [];

    let startAngle = -Math.PI / 2;
    rows.forEach((row, idx) => {
        const ratio = row.value / total;
        const endAngle = startAngle + (Math.PI * 2 * ratio);
        const midAngle = (startAngle + endAngle) / 2;
        const explode = idx == hoverIndex ? 10 : 0;
        const offsetX = Math.cos(midAngle) * explode;
        const offsetY = Math.sin(midAngle) * explode;

        ctx.beginPath();
        ctx.moveTo(cx + offsetX, cy + offsetY);
        ctx.arc(cx + offsetX, cy + offsetY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = PLM_VALUES_PIE_COLORS[idx % PLM_VALUES_PIE_COLORS.length];
        ctx.fill();

        if (idx == hoverIndex) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
        }

        slices.push({ startAngle, endAngle, midAngle, idx });
        startAngle = endAngle;
    });

    // Draw inner donut core as fully opaque black to avoid color bleed.
    ctx.beginPath();
    ctx.arc(cx, cy, innerRadius + 0.8, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#000000';
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '600 12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Total', cx, cy - 10);

    const countChart = rows.length > 0 && rows.every((row) => String(row && row.valueType ? row.valueType : 'money') === 'count');

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px Segoe UI';
    ctx.fillText(countChart ? formatBomQuantity(total) : formatMoney(total), cx, cy + 10);

    canvas._plmPieState = {
        rows,
        total,
        slices,
        cx,
        cy,
        radius,
        innerRadius,
        cssWidth,
        cssHeight
    };
}

function handlePlmValuesPieHover(canvas, event) {
    if (!canvas || !event) return;

    const state = canvas._plmPieState;
    if (!state || !Array.isArray(state.rows) || !state.rows.length) {
        hidePlmValuesPieTooltip();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dx = x - state.cx;
    const dy = y - state.cy;
    const distance = Math.hypot(dx, dy);

    let hoverIndex = -1;
    if (distance >= state.innerRadius && distance <= state.radius + 12) {
        let angle = Math.atan2(dy, dx);
        if (angle < -Math.PI / 2) angle += Math.PI * 2;

        for (let i = 0; i < state.slices.length; i += 1) {
            const slice = state.slices[i];
            if (angle >= slice.startAngle && angle <= slice.endAngle) {
                hoverIndex = slice.idx;
                break;
            }
        }
    }

    if (canvas._plmPieHoverIndex !== hoverIndex) {
        canvas._plmPieHoverIndex = hoverIndex;
        drawPlmValuesPieCanvas(canvas, state.rows, hoverIndex);
    }

    if (hoverIndex < 0) {
        hidePlmValuesPieTooltip();
        return;
    }

    const row = state.rows[hoverIndex];
    if (!row) {
        hidePlmValuesPieTooltip();
        return;
    }

    const tip = getPlmValuesPieTooltip();
    const pct = state.total > 0 ? ((Math.max(0, toNumber(row.value, 0)) / state.total) * 100) : 0;
    const pctText = `${pct.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    if (String(row && row.valueType ? row.valueType : 'money') === 'count') {
        tip.textContent = `${row.key} - ${formatBomQuantity(row.value)} - ${pctText}`;
    } else {
        tip.textContent = `${row.key} - ${formatMoney(row.value)} - ${pctText}`;
    }
    tip.style.display = 'block';

    const tipRect = tip.getBoundingClientRect();
    const viewW = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewH = window.innerHeight || document.documentElement.clientHeight || 0;

    let left = event.clientX + 14;
    let top = event.clientY + 14;

    if (left + tipRect.width > viewW - 8) left = Math.max(8, event.clientX - tipRect.width - 14);
    if (top + tipRect.height > viewH - 8) top = Math.max(8, event.clientY - tipRect.height - 14);

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}

function renderPlmValuesPie(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const rows = (Array.isArray(entries) ? entries : [])
        .map((entry, idx) => ({
            key: String(entry && (entry.key || entry.name || entry.item_id) ? (entry.key || entry.name || entry.item_id) : '').trim() || `Dato ${idx + 1}`,
            value: Math.max(0, toNumber(entry && entry.total_cost, 0)),
            valueType: String(entry && entry.value_type ? entry.value_type : 'money').trim().toLowerCase() === 'count' ? 'count' : 'money'
        }))
        .filter((entry) => entry.value > 0);

    if (!canvas._plmPieHandlersBound) {
        canvas.addEventListener('mousemove', (event) => {
            if (canvas._plmChartMode !== 'pie') return;
            handlePlmValuesPieHover(canvas, event);
        });
        canvas.addEventListener('mouseleave', () => {
            if (canvas._plmChartMode !== 'pie') return;
            if (canvas._plmPieHoverIndex !== -1) {
                canvas._plmPieHoverIndex = -1;
                drawPlmValuesPieCanvas(canvas, canvas._plmPieRows || [], -1);
            }
            hidePlmValuesPieTooltip();
        });
        canvas._plmPieHandlersBound = true;
    }

    canvas._plmChartMode = 'pie';
    canvas._plmPieRows = rows;
    canvas._plmPieHoverIndex = -1;
    drawPlmValuesPieCanvas(canvas, rows, -1);
}

function handlePlmValuesBarHover(canvas, event) {
    if (!canvas || !event) return;

    const state = canvas._plmBarState;
    if (!state || !Array.isArray(state.bars) || !state.bars.length) {
        hidePlmValuesPieTooltip();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let hoverIndex = -1;
    for (let i = 0; i < state.bars.length; i += 1) {
        const b = state.bars[i];
        if (x >= b.x && x <= (b.x + b.w) && y >= b.y && y <= (b.y + b.h)) {
            hoverIndex = i;
            break;
        }
    }

    if (canvas._plmBarHoverIndex !== hoverIndex) {
        canvas._plmBarHoverIndex = hoverIndex;
        renderPlmValuesBar(canvas.id, canvas._plmBarEntries || []);
    }

    if (hoverIndex < 0) {
        hidePlmValuesPieTooltip();
        return;
    }

    const row = state.rows[hoverIndex];
    if (!row) {
        hidePlmValuesPieTooltip();
        return;
    }

    const tip = getPlmValuesPieTooltip();
    const pct = state.total > 0 ? ((Math.max(0, toNumber(row.value, 0)) / state.total) * 100) : 0;
    const pctText = `${pct.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    tip.textContent = `${row.key} - ${row.valueType === 'count' ? formatBomQuantity(row.value) : formatMoney(row.value)} - ${pctText}`;
    tip.style.display = 'block';

    const tipRect = tip.getBoundingClientRect();
    const viewW = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewH = window.innerHeight || document.documentElement.clientHeight || 0;

    let left = event.clientX + 14;
    let top = event.clientY + 14;
    if (left + tipRect.width > viewW - 8) left = Math.max(8, event.clientX - tipRect.width - 14);
    if (top + tipRect.height > viewH - 8) top = Math.max(8, event.clientY - tipRect.height - 14);

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
}

function renderPlmValuesBar(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const rows = (Array.isArray(entries) ? entries : [])
        .map((entry, idx) => ({
            key: String(entry && (entry.key || entry.name || entry.item_id) ? (entry.key || entry.name || entry.item_id) : '').trim() || `Dato ${idx + 1}`,
            value: Math.max(0, toNumber(entry && entry.total_cost, 0)),
            valueType: String(entry && entry.value_type ? entry.value_type : 'money').trim().toLowerCase() === 'count' ? 'count' : 'money'
        }))
        .filter((entry) => entry.value > 0);

    const rowsTotal = rows.reduce((acc, row) => acc + Math.max(0, toNumber(row && row.value, 0)), 0);
    let chartSourceRows = [...rows];
    if (rowsTotal > 0) {
        const majorRows = [];
        let othersValue = 0;
        let othersType = rows.length ? rows[0].valueType : 'money';

        rows.forEach((row) => {
            const val = Math.max(0, toNumber(row && row.value, 0));
            const ratio = rowsTotal > 0 ? (val / rowsTotal) : 0;
            if (ratio < 0.05) {
                othersValue += val;
                othersType = row && row.valueType ? row.valueType : othersType;
            } else {
                majorRows.push(row);
            }
        });

        if (othersValue > 0) {
            majorRows.push({ key: 'Otros', value: othersValue, valueType: othersType, isOthers: true });
        }

        chartSourceRows = majorRows.length ? majorRows : chartSourceRows;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = Math.max(180, Math.round(rect.width || Number(canvas.getAttribute('width')) || 300));
    const cssHeight = Math.max(180, Math.round(rect.height || Number(canvas.getAttribute('height')) || 300));

    const targetWidth = Math.round(cssWidth * dpr);
    const targetHeight = Math.round(cssHeight * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    hidePlmValuesPieTooltip();
    canvas._plmChartMode = 'bar';
    canvas._plmPieState = null;
    canvas._plmPieHoverIndex = -1;
    canvas._plmBarEntries = Array.isArray(entries) ? entries : [];

    if (!canvas._plmBarHandlersBound) {
        canvas.addEventListener('mousemove', (event) => {
            if (canvas._plmChartMode !== 'bar') return;
            handlePlmValuesBarHover(canvas, event);
        });
        canvas.addEventListener('mouseleave', () => {
            if (canvas._plmChartMode !== 'bar') return;
            if (canvas._plmBarHoverIndex !== -1) {
                canvas._plmBarHoverIndex = -1;
                renderPlmValuesBar(canvas.id, canvas._plmBarEntries || []);
            }
            hidePlmValuesPieTooltip();
        });
        canvas._plmBarHandlersBound = true;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (!chartSourceRows.length) {
        canvas._plmBarState = null;
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.font = '600 14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sin datos', cssWidth / 2, cssHeight / 2);
        return;
    }

    let chartRows = chartSourceRows.slice(0, 14);
    const othersIdx = chartSourceRows.findIndex((row) => Boolean(row && row.isOthers));
    if (othersIdx >= 0 && !chartRows.some((row) => Boolean(row && row.isOthers))) {
        chartRows = chartSourceRows.slice(0, 13).concat([chartSourceRows[othersIdx]]);
    }
    const maxValue = Math.max(...chartRows.map((r) => r.value), 1);
    const hoverIndex = Number.isFinite(canvas._plmBarHoverIndex) ? canvas._plmBarHoverIndex : -1;

    const margin = { top: 16, right: 12, bottom: 18, left: 92 };
    const availW = Math.max(80, cssWidth - margin.left - margin.right);
    const availH = Math.max(60, cssHeight - margin.top - margin.bottom);

    const maxValInt = Math.ceil(maxValue);
    const stepVal = Math.max(1, Math.ceil(maxValInt / 6));
    const gridMax = Math.max(stepVal, Math.ceil(maxValInt / stepVal) * stepVal);
    const scale = availH / gridMax;

    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.font = '11px Segoe UI';
    ctx.fillStyle = '#cfd2d6';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let val = 0; val <= gridMax; val += stepVal) {
        const y = margin.top + availH - (val * scale);
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + availW, y);
        ctx.stroke();

        const txt = chartRows[0].valueType === 'count' ? formatBomQuantity(val) : formatMoney(val);
        ctx.fillText(txt, margin.left - 10, y);
    }

    const slotW = availW / Math.max(chartRows.length, 1);
    const barW = Math.max(8, Math.min(34, slotW * 0.60));
    const barRects = [];

    chartRows.forEach((row, idx) => {
        const barH = Math.max(1, Math.round((row.value / gridMax) * availH));
        const x = margin.left + (idx * slotW) + ((slotW - barW) / 2);
        const y = margin.top + availH - barH;
        const color = PLM_VALUES_PIE_COLORS[idx % PLM_VALUES_PIE_COLORS.length];

        ctx.save();
        if (idx === hoverIndex) {
            ctx.shadowColor = 'rgba(255,255,255,0.35)';
            ctx.shadowBlur = 10;
        }
        ctx.fillStyle = color;
        if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, 4);
            ctx.fill();
            if (idx === hoverIndex) {
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = 1.4;
                ctx.stroke();
            }
        } else {
            ctx.fillRect(x, y, barW, barH);
            if (idx === hoverIndex) {
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = 1.4;
                ctx.strokeRect(x, y, barW, barH);
            }
        }
        ctx.restore();

        barRects.push({ x, y, w: barW, h: barH, idx });
    });

    canvas._plmBarState = {
        rows: chartRows,
        bars: barRects,
        total: chartRows.reduce((acc, row) => acc + Math.max(0, toNumber(row.value, 0)), 0)
    };
}

function renderPlmValuesChart(canvasId, entries, chartTypeRaw = 'pie') {
    const chartType = String(chartTypeRaw || 'pie').trim().toLowerCase() === 'bar' ? 'bar' : 'pie';
    if (chartType === 'bar') {
        renderPlmValuesBar(canvasId, entries);
    } else {
        renderPlmValuesPie(canvasId, entries);
    }
}

function getPlmValuesSeriesColor(indexRaw) {
    const idx = Math.max(0, Number(indexRaw) || 0);
    return PLM_VALUES_PIE_COLORS[idx % PLM_VALUES_PIE_COLORS.length];
}

function buildPlmValuesLegendCellHtml(labelRaw, indexRaw) {
    const label = String(labelRaw || '').trim() || '-';
    const color = getPlmValuesSeriesColor(indexRaw);
    return `<span class="plm-values-legend-cell"><span class="plm-values-legend-dot" style="background:${color};"></span><span>${escapeHtml(label)}</span></span>`;
}

function formatPlmValuesPercent(partRaw, totalRaw) {
    const part = Math.max(0, toNumber(partRaw, 0));
    const total = Math.max(0, toNumber(totalRaw, 0));
    if (total <= 0 || part <= 0) return '0,0%';
    const pct = (part / total) * 100;
    return `${pct.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function getPlmValuesItemRows() {
    if (!currentWorkspaceProject) return [];

    const items = getActivePlmItems();
    const qtyByItemId = new Map();
    getBomClassificationGroupedRows().forEach((row) => {
        const itemId = String(row && row.itemId ? row.itemId : '').trim();
        if (!itemId) return;
        qtyByItemId.set(itemId, Math.max(0, toNumber(row && row.qtyTotal, 0)));
    });
    const branchMap = getBomClassificationMap();
    const diagramRows = getErpDiagramRows();
    const rowById = new Map();

    diagramRows.forEach((row) => {
        const rowId = String(row && row.id ? row.id : '').trim();
        if (!rowId) return;
        rowById.set(rowId, row);
    });

    return items.map((item) => {
        const variantUi = getBomVariantUiStateForItem(item.id);
        const mappedQty = toNumber(qtyByItemId.get(String(item && item.id ? item.id : '').trim()), NaN);
        const qty = Number.isFinite(mappedQty) ? Math.max(0, mappedQty) : 1;
        const matched = variantUi && variantUi.matched ? variantUi.matched : null;
        const matchedRowId = String(matched && matched.row_id ? matched.row_id : '').trim();
        const matchedRow = matchedRowId ? (rowById.get(matchedRowId) || null) : null;

        const kg = Math.max(0, toNumber(matchedRow && matchedRow.kg, 0));
        const mts = Math.max(0, toNumber(matchedRow && matchedRow.mts, 0));
        const costMpXKg = Math.max(0, toNumber(matchedRow && matchedRow.cost_mp_x_kg, 0));
        const costMpXMt = Math.max(0, toNumber(matchedRow && matchedRow.cost_mp_x_mt, 0));
        const costMp = Math.max(0, toNumber(matchedRow && matchedRow.cost_mp, 0));
        const costFobUnit = costMp + (kg * costMpXKg) + (mts * costMpXMt);

        const costMecanizadoUnit = Math.max(0, toNumber(matchedRow ? getErpDiagramMecanizadoRowValue(matchedRow) : 0, 0));
        const costTratamientosUnit = Math.max(0, toNumber(matchedRow ? getErpDiagramGroupValue(matchedRow, ERP_DIAGRAM_TREATMENT_PARENT_KEY) : 0, 0));
        const costPintadoUnit = Math.max(0, toNumber(matchedRow && matchedRow.cost_pintado, 0));
        const costImportacionUnit = Math.max(0, toNumber(matchedRow ? getErpDiagramImportacionUnitCost(matchedRow) : 0, 0));

        const costMatriceriaTotal = Math.max(0, toNumber(matchedRow && matchedRow.cost_matriceria, 0));
        const quotedQty = Math.max(1, Math.round(toNumber(matchedRow && matchedRow.quoted_qty, 1)));
        const costMatriceriaUnit = costMatriceriaTotal / quotedQty;

        let unitCost = 0;
        if (matchedRow) {
            unitCost = Math.max(0, toNumber(getErpDiagramTotal(matchedRow), 0));
        } else if (matched) {
            unitCost = Math.max(0, toNumber(matched.cost_total, 0));
        }

        const totalCost = unitCost * qty;

        const providerSelection = String(matchedRow && matchedRow.provider_id ? matchedRow.provider_id : '').trim();
        const providerName = providerSelection
            ? getErpSupplierDisplayName(providerSelection, '-')
            : (String(variantUi.uiSelection && variantUi.uiSelection.proveedor ? variantUi.uiSelection.proveedor : '').trim() || '-');
        const providerCountry = providerSelection
            ? getErpSupplierCountryBySelection(providerSelection, '-')
            : '-';

        const branch = branchMap.get(String(item.id)) || { conjunto: '', sub1: '', sub11: '' };
        const conjunto = String(branch.conjunto || '').trim() || 'Sin conjunto';

        return {
            item_id: String(item && item.item_id ? item.item_id : '').trim() || '-',
            name: String(item && item.name ? item.name : '').trim() || '-',
            qty,
            unit_cost: unitCost,
            total_cost: totalCost,
            cost_fob_total: costFobUnit * qty,
            cost_mecanizado_total: costMecanizadoUnit * qty,
            cost_tratamientos_total: costTratamientosUnit * qty,
            cost_pintado_total: costPintadoUnit * qty,
            cost_importacion_total: costImportacionUnit * qty,
            cost_matriceria_total: costMatriceriaTotal,
            cost_matriceria_unit_total: costMatriceriaUnit * qty,
            materia_prima: String(variantUi.uiSelection && variantUi.uiSelection.materia_prima ? variantUi.uiSelection.materia_prima : '').trim() || '-',
            tipo_mp: String(variantUi.uiSelection && variantUi.uiSelection.tipo_mp ? variantUi.uiSelection.tipo_mp : '').trim() || '-',
            material: String(variantUi.uiSelection && variantUi.uiSelection.material ? variantUi.uiSelection.material : '').trim() || '-',
            proveedor: providerName,
            proveedor_pais: providerCountry,
            conjunto,
            category: getBomCategory(item)
        };
    });
}

function renderPlmValuesPanel() {
    ensurePlmValuesConfigOutsideClick();

    const introVersionEl = document.getElementById('plm-values-intro-version');
    const introRevisionEl = document.getElementById('plm-values-intro-revision');
    const introItemsEl = document.getElementById('plm-values-intro-items');
    const introCreatedEl = document.getElementById('plm-values-intro-created');
    const introUpdatedEl = document.getElementById('plm-values-intro-updated');
    const introDescriptionEl = document.getElementById('plm-values-intro-description');

    const activeVersion = getActiveBomVersion();
    const isVersionContext = Boolean(activeVersion);
    const itemCount = getActivePlmItems().length;

    if (introVersionEl) introVersionEl.textContent = isVersionContext
        ? (String(activeVersion.name || '').trim() || 'Version')
        : 'BOM Maestro';
    if (introRevisionEl) introRevisionEl.textContent = isVersionContext
        ? normalizePlmVersionRevision(activeVersion.revision, 1)
        : '-';
    if (introItemsEl) introItemsEl.textContent = formatBomQuantity(itemCount);
    if (introCreatedEl) introCreatedEl.textContent = isVersionContext
        ? formatPlmVersionDate(activeVersion.created_at)
        : '-';
    if (introUpdatedEl) introUpdatedEl.textContent = isVersionContext
        ? formatPlmVersionDate(activeVersion.updated_at || activeVersion.created_at)
        : '-';
    if (introDescriptionEl) {
        const desc = isVersionContext
            ? (String(activeVersion.description || '').trim() || 'Sin descripcion')
            : 'Resumen general del BOM maestro del proyecto.';
        introDescriptionEl.textContent = desc;
    }

    const kpi = {
        fob: document.getElementById('plm-values-kpi-fob'),
        mecanizado: document.getElementById('plm-values-kpi-mecanizado'),
        tratamientos: document.getElementById('plm-values-kpi-tratamientos'),
        pintado: document.getElementById('plm-values-kpi-pintado'),
        importacion: document.getElementById('plm-values-kpi-importacion'),
        matriceria: document.getElementById('plm-values-kpi-matriceria'),
        matriceriaUnit: document.getElementById('plm-values-kpi-matriceria-unit'),
        totalUnit: document.getElementById('plm-values-kpi-total-unit')
    };

    const kpiPct = {
        fob: document.getElementById('plm-values-kpi-fob-pct'),
        mecanizado: document.getElementById('plm-values-kpi-mecanizado-pct'),
        tratamientos: document.getElementById('plm-values-kpi-tratamientos-pct'),
        pintado: document.getElementById('plm-values-kpi-pintado-pct'),
        importacion: document.getElementById('plm-values-kpi-importacion-pct'),
        matriceria: document.getElementById('plm-values-kpi-matriceria-pct'),
        matriceriaUnit: document.getElementById('plm-values-kpi-matriceria-unit-pct'),
        totalUnit: document.getElementById('plm-values-kpi-total-unit-pct')
    };

    const partsBody = document.getElementById('plm-values-parts-body');
    const mpBody = document.getElementById('plm-values-mp-body');
    const suppliersBody = document.getElementById('plm-values-suppliers-body');
    const conjuntosBody = document.getElementById('plm-values-conjuntos-body');

    if (!kpi.fob || !kpi.mecanizado || !kpi.tratamientos || !kpi.pintado || !kpi.importacion || !kpi.matriceria || !kpi.matriceriaUnit || !kpi.totalUnit || !partsBody || !mpBody || !suppliersBody || !conjuntosBody) return;

    const rows = getPlmValuesItemRows();

    const summaryCfg = getPlmValuesCardConfig('summary');
    const summaryRowsSource = getPlmValuesFilteredRows(rows, 'summary');
    const totals = summaryRowsSource.reduce((acc, row) => {
        acc.fob += Math.max(0, toNumber(row && row.cost_fob_total, 0));
        acc.mecanizado += Math.max(0, toNumber(row && row.cost_mecanizado_total, 0));
        acc.tratamientos += Math.max(0, toNumber(row && row.cost_tratamientos_total, 0));
        acc.pintado += Math.max(0, toNumber(row && row.cost_pintado_total, 0));
        acc.importacion += Math.max(0, toNumber(row && row.cost_importacion_total, 0));
        acc.matriceria += Math.max(0, toNumber(row && row.cost_matriceria_total, 0));
        acc.matriceriaUnit += Math.max(0, toNumber(row && row.cost_matriceria_unit_total, 0));
        acc.totalUnit += Math.max(0, toNumber(row && row.total_cost, 0));
        return acc;
    }, {
        fob: 0,
        mecanizado: 0,
        tratamientos: 0,
        pintado: 0,
        importacion: 0,
        matriceria: 0,
        matriceriaUnit: 0,
        totalUnit: 0
    });

    kpi.fob.textContent = formatMoney(totals.fob);
    kpi.mecanizado.textContent = formatMoney(totals.mecanizado);
    kpi.tratamientos.textContent = formatMoney(totals.tratamientos);
    kpi.pintado.textContent = formatMoney(totals.pintado);
    kpi.importacion.textContent = formatMoney(totals.importacion);
    kpi.matriceria.textContent = formatMoney(totals.matriceria);
    kpi.matriceriaUnit.textContent = formatMoney(totals.matriceriaUnit);
    kpi.totalUnit.textContent = formatMoney(totals.totalUnit);

    const summaryPctBase = Math.max(0, totals.totalUnit);
    if (kpiPct.fob) kpiPct.fob.textContent = formatPlmValuesPercent(totals.fob, summaryPctBase);
    if (kpiPct.mecanizado) kpiPct.mecanizado.textContent = formatPlmValuesPercent(totals.mecanizado, summaryPctBase);
    if (kpiPct.tratamientos) kpiPct.tratamientos.textContent = formatPlmValuesPercent(totals.tratamientos, summaryPctBase);
    if (kpiPct.pintado) kpiPct.pintado.textContent = formatPlmValuesPercent(totals.pintado, summaryPctBase);
    if (kpiPct.importacion) kpiPct.importacion.textContent = formatPlmValuesPercent(totals.importacion, summaryPctBase);
    if (kpiPct.matriceria) kpiPct.matriceria.textContent = '-';
    if (kpiPct.matriceriaUnit) kpiPct.matriceriaUnit.textContent = formatPlmValuesPercent(totals.matriceriaUnit, summaryPctBase);
    if (kpiPct.totalUnit) kpiPct.totalUnit.textContent = summaryPctBase > 0 ? '100,0%' : '0,0%';

    const summaryChartRows = [
        { key: 'Costo FOB', total_cost: totals.fob, value_type: 'money' },
        { key: 'Costo Mecanizado', total_cost: totals.mecanizado, value_type: 'money' },
        { key: 'Costo Tratamientos', total_cost: totals.tratamientos, value_type: 'money' },
        { key: 'Costo Pintado', total_cost: totals.pintado, value_type: 'money' },
        { key: 'Costo Importacion', total_cost: totals.importacion, value_type: 'money' },
        { key: 'Costo de Matriceria Unitario', total_cost: totals.matriceriaUnit, value_type: 'money' }
    ];
    renderPlmValuesChart('plm-values-summary-pie', summaryChartRows, summaryCfg.chartType);

    const summaryFirstCol = document.querySelectorAll('.plm-values-card-summary tbody tr td:first-child');
    const summaryDotMap = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 6: 5 };
    summaryFirstCol.forEach((cell, idx) => {
        if (!cell) return;
        const baseLabel = String(cell.dataset.baseLabel || cell.textContent || '').trim();
        if (!baseLabel) return;
        cell.dataset.baseLabel = baseLabel;
        if (Object.prototype.hasOwnProperty.call(summaryDotMap, idx)) {
            cell.innerHTML = buildPlmValuesLegendCellHtml(baseLabel, summaryDotMap[idx]);
        } else {
            cell.textContent = baseLabel;
        }
    });

    const buildGroupedRows = (sourceRows, keyGetter) => {
        const map = new Map();
        (Array.isArray(sourceRows) ? sourceRows : []).forEach((row) => {
            const key = String(keyGetter(row) || '').trim() || '-';
            const bucket = map.get(key) || { key, qty: 0, total_cost: 0 };
            bucket.qty += Math.max(0, toNumber(row && row.qty, 0));
            bucket.total_cost += Math.max(0, toNumber(row && row.total_cost, 0));
            map.set(key, bucket);
        });
        return Array.from(map.values());
    };

    // Parts card
    const partsCfg = getPlmValuesCardConfig('parts');
    const partsSource = getPlmValuesFilteredRows(rows, 'parts');
    const sortedParts = sortPlmValuesRows(partsSource, 'parts');

    if (!sortedParts.length) {
        partsBody.innerHTML = '<tr><td colspan="6" class="text-center plm-empty">Sin datos.</td></tr>';
        renderPlmValuesChart('plm-values-parts-pie', [], partsCfg.chartType);
    } else {
        const partsMetric = partsCfg.sortField === 'unit_cost' ? 'unit_cost' : 'total_cost';
        const partsMetricTotal = sortedParts.reduce((acc, row) => acc + Math.max(0, toNumber(row && row[partsMetric], 0)), 0);

        partsBody.innerHTML = sortedParts.map((row, idx) => {
            const metricValue = Math.max(0, toNumber(row && row[partsMetric], 0));
            return `
            <tr>
                <td>${buildPlmValuesLegendCellHtml(row.item_id, idx)}</td>
                <td>${escapeHtml(row.name)}</td>
                <td class="text-center">${escapeHtml(formatBomQuantity(row.qty))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.unit_cost))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.total_cost))}</td>
                <td class="text-center">${escapeHtml(formatPlmValuesPercent(metricValue, partsMetricTotal))}</td>
            </tr>
        `;
        }).join('');

        const partsChart = sortedParts.map((row) => ({
            key: String(row.item_id || '-').trim() || '-',
            total_cost: Math.max(0, toNumber(row && row[partsMetric], 0)),
            value_type: 'money'
        }));
        renderPlmValuesChart('plm-values-parts-pie', partsChart, partsCfg.chartType);
    }

    // MP card
    const mpCfg = getPlmValuesCardConfig('mp');
    const mpSource = getPlmValuesFilteredRows(rows, 'mp');
    const mpMap = new Map();

    mpSource.forEach((row) => {
        const materia = String(row && row.materia_prima ? row.materia_prima : '').trim() || '-';
        const tipoMp = String(row && row.tipo_mp ? row.tipo_mp : '').trim() || '-';
        const key = `${materia}||${tipoMp}`;
        const bucket = mpMap.get(key) || { key: materia, tipo_mp: tipoMp, qty: 0, total_cost: 0 };
        bucket.qty += Math.max(0, toNumber(row && row.qty, 0));
        bucket.total_cost += Math.max(0, toNumber(row && row.total_cost, 0));
        mpMap.set(key, bucket);
    });

    const mpRows = sortPlmValuesRows(Array.from(mpMap.values()), 'mp');

    if (!mpRows.length) {
        mpBody.innerHTML = '<tr><td colspan="5" class="text-center plm-empty">Sin datos.</td></tr>';
        renderPlmValuesChart('plm-values-mp-pie', [], mpCfg.chartType);
    } else {
        const mpByQty = mpCfg.sortField === 'qty';
        const mpMetricTotal = mpRows.reduce((acc, row) => acc + (mpByQty ? Math.max(0, toNumber(row.qty, 0)) : Math.max(0, toNumber(row.total_cost, 0))), 0);

        mpBody.innerHTML = mpRows.map((row, idx) => {
            const metricValue = mpByQty ? Math.max(0, toNumber(row.qty, 0)) : Math.max(0, toNumber(row.total_cost, 0));
            return `
            <tr>
                <td>${buildPlmValuesLegendCellHtml(row.key, idx)}</td>
                <td class="text-center">${escapeHtml(row.tipo_mp || '-')}</td>
                <td class="text-center">${escapeHtml(formatBomQuantity(row.qty))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.total_cost))}</td>
                <td class="text-center">${escapeHtml(formatPlmValuesPercent(metricValue, mpMetricTotal))}</td>
            </tr>
        `;
        }).join('');

        const mpChart = mpRows.map((row) => ({
            key: row.key,
            total_cost: mpByQty ? Math.max(0, toNumber(row.qty, 0)) : Math.max(0, toNumber(row.total_cost, 0)),
            value_type: mpByQty ? 'count' : 'money'
        }));
        renderPlmValuesChart('plm-values-mp-pie', mpChart, mpCfg.chartType);
    }

    // Suppliers card
    const suppliersCfg = getPlmValuesCardConfig('suppliers');
    const supplierSource = getPlmValuesFilteredRows(rows, 'suppliers');
    const supplierMap = new Map();
    supplierSource.forEach((row) => {
        const key = String(row && row.proveedor ? row.proveedor : '').trim() || '-';
        const bucket = supplierMap.get(key) || { key, country: '-', qty: 0, total_cost: 0 };
        const country = String(row && row.proveedor_pais ? row.proveedor_pais : '').trim() || '-';
        if ((bucket.country === '-' || !bucket.country) && country && country !== '-') bucket.country = country;
        bucket.qty += Math.max(0, toNumber(row && row.qty, 0));
        bucket.total_cost += Math.max(0, toNumber(row && row.total_cost, 0));
        supplierMap.set(key, bucket);
    });

    const supplierRows = sortPlmValuesRows(Array.from(supplierMap.values()), 'suppliers');

    if (!supplierRows.length) {
        suppliersBody.innerHTML = '<tr><td colspan="5" class="text-center plm-empty">Sin datos.</td></tr>';
        renderPlmValuesChart('plm-values-suppliers-pie', [], suppliersCfg.chartType);
    } else {
        const supplierCountryCountMap = new Map();
        supplierRows.forEach((row) => {
            const countryKey = String(row && row.country ? row.country : '').trim() || '-';
            supplierCountryCountMap.set(countryKey, Math.max(0, toNumber(supplierCountryCountMap.get(countryKey), 0)) + 1);
        });

        const supplierMetricTotal = suppliersCfg.sortField === 'country'
            ? supplierRows.length
            : (suppliersCfg.sortField === 'qty'
                ? supplierRows.reduce((acc, row) => acc + Math.max(0, toNumber(row && row.qty, 0)), 0)
                : supplierRows.reduce((acc, row) => acc + Math.max(0, toNumber(row && row.total_cost, 0)), 0));

        suppliersBody.innerHTML = supplierRows.map((row, idx) => {
            const countryKey = String(row && row.country ? row.country : '').trim() || '-';
            const metricValue = suppliersCfg.sortField === 'country'
                ? Math.max(0, toNumber(supplierCountryCountMap.get(countryKey), 0))
                : (suppliersCfg.sortField === 'qty'
                    ? Math.max(0, toNumber(row && row.qty, 0))
                    : Math.max(0, toNumber(row && row.total_cost, 0)));
            return `
            <tr>
                <td>${buildPlmValuesLegendCellHtml(row.key, idx)}</td>
                <td class="text-center">${escapeHtml(row.country || '-')}</td>
                <td class="text-center">${escapeHtml(formatBomQuantity(row.qty))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.total_cost))}</td>
                <td class="text-center">${escapeHtml(formatPlmValuesPercent(metricValue, supplierMetricTotal))}</td>
            </tr>
        `;
        }).join('');

        let supplierChart = [];
        if (suppliersCfg.sortField === 'country') {
            const countryMap = new Map();
            supplierRows.forEach((row) => {
                const key = String(row && row.country ? row.country : '').trim() || '-';
                const bucket = countryMap.get(key) || { key, qty: 0 };
                bucket.qty += 1;
                countryMap.set(key, bucket);
            });
            supplierChart = Array.from(countryMap.values())
                .sort((a, b) => {
                    const diff = Math.max(0, toNumber(a.qty, 0)) - Math.max(0, toNumber(b.qty, 0));
                    if (Math.abs(diff) > 0.0001) return (suppliersCfg.sortDir === 'asc' ? diff : -diff);
                    return String(a.key || '').localeCompare(String(b.key || ''), 'es', { sensitivity: 'base' });
                })
                .map((row) => ({ key: row.key, total_cost: row.qty, value_type: 'count' }));
        } else if (suppliersCfg.sortField === 'qty') {
            supplierChart = supplierRows.map((row) => ({ key: row.key, total_cost: row.qty, value_type: 'count' }));
        } else {
            supplierChart = supplierRows.map((row) => ({ key: row.key, total_cost: row.total_cost, value_type: 'money' }));
        }

        renderPlmValuesChart('plm-values-suppliers-pie', supplierChart, suppliersCfg.chartType);
    }

    // Conjuntos card
    const conjuntosCfg = getPlmValuesCardConfig('conjuntos');
    const conjuntoSource = getPlmValuesFilteredRows(rows, 'conjuntos');
    const conjuntoRows = sortPlmValuesRows(buildGroupedRows(conjuntoSource, (row) => row.conjunto), 'conjuntos');

    if (!conjuntoRows.length) {
        conjuntosBody.innerHTML = '<tr><td colspan="4" class="text-center plm-empty">Sin datos.</td></tr>';
        renderPlmValuesChart('plm-values-conjuntos-pie', [], conjuntosCfg.chartType);
    } else {
        const conjByQty = conjuntosCfg.sortField === 'qty';
        const conjuntoMetricTotal = conjuntoRows.reduce((acc, row) => acc + (conjByQty ? Math.max(0, toNumber(row.qty, 0)) : Math.max(0, toNumber(row.total_cost, 0))), 0);

        conjuntosBody.innerHTML = conjuntoRows.map((row, idx) => {
            const metricValue = conjByQty ? Math.max(0, toNumber(row.qty, 0)) : Math.max(0, toNumber(row.total_cost, 0));
            return `
            <tr>
                <td>${buildPlmValuesLegendCellHtml(row.key, idx)}</td>
                <td class="text-center">${escapeHtml(formatBomQuantity(row.qty))}</td>
                <td class="text-center">${escapeHtml(formatMoney(row.total_cost))}</td>
                <td class="text-center">${escapeHtml(formatPlmValuesPercent(metricValue, conjuntoMetricTotal))}</td>
            </tr>
        `;
        }).join('');

        const conjuntoChart = conjuntoRows.map((row) => ({
            key: row.key,
            total_cost: conjByQty ? Math.max(0, toNumber(row.qty, 0)) : Math.max(0, toNumber(row.total_cost, 0)),
            value_type: conjByQty ? 'count' : 'money'
        }));

        renderPlmValuesChart('plm-values-conjuntos-pie', conjuntoChart, conjuntosCfg.chartType);
    }

    if (plmValuesConfigMenuOpenCard) {
        renderPlmValuesConfigMenuContent(plmValuesConfigMenuOpenCard);
        const openMenu = document.getElementById(`plm-values-config-${plmValuesConfigMenuOpenCard}`);
        if (openMenu) openMenu.style.display = 'block';
    }
}

function printPlmValuesReport() {
    if (!currentWorkspaceProject) return;

    // Refresh current Valores UI so printed data matches what user sees.
    renderPlmValuesPanel();

    const activeVersion = getActiveBomVersion();
    const isVersionContext = Boolean(activeVersion);

    const projectName = String(currentWorkspaceProject && currentWorkspaceProject.name ? currentWorkspaceProject.name : '').trim() || '-';
    const versionName = isVersionContext
        ? (String(activeVersion.name || '').trim() || 'Version')
        : 'BOM Maestro';
    const revision = isVersionContext ? normalizePlmVersionRevision(activeVersion.revision, 1) : '-';
    const itemCount = getActivePlmItems().length;
    const createdAt = isVersionContext ? formatPlmVersionDate(activeVersion.created_at) : '-';
    const updatedAt = isVersionContext ? formatPlmVersionDate(activeVersion.updated_at || activeVersion.created_at) : '-';
    const description = isVersionContext
        ? (String(activeVersion.description || '').trim() || 'Sin descripcion')
        : 'Resumen general del BOM maestro del proyecto.';

    const parseTableFromDom = (selector, limitRows = null) => {
        const table = document.querySelector(selector);
        if (!table) {
            return {
                headers: ['Dato'],
                rows: []
            };
        }

        const headers = Array.from(table.querySelectorAll('thead th'))
            .map((th) => String(th.textContent || '').trim())
            .filter((text) => text.length > 0);

        let rows = Array.from(table.querySelectorAll('tbody tr'))
            .filter((tr) => !tr.querySelector('td[colspan]'))
            .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => String(td.textContent || '').trim()));

        if (Number.isInteger(limitRows) && limitRows > 0) {
            rows = rows.slice(0, limitRows);
        }

        const fallbackHeaders = rows.length ? rows[0].map((_, idx) => `Columna ${idx + 1}`) : ['Dato'];
        return {
            headers: headers.length ? headers : fallbackHeaders,
            rows
        };
    };

    const captureChart = (canvasId) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof canvas.toDataURL !== 'function') return '';
        try {
            return canvas.toDataURL('image/png');
        } catch (e) {
            return '';
        }
    };

    const renderPrintableTable = (tableData, addDots = true) => {
        const headers = Array.isArray(tableData && tableData.headers) && tableData.headers.length
            ? tableData.headers
            : ['Dato'];
        const rows = Array.isArray(tableData && tableData.rows) ? tableData.rows : [];

        const theadHtml = `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;

        if (!rows.length) {
            return `<table>${theadHtml}<tbody><tr><td colspan="${headers.length}" class="center">Sin datos.</td></tr></tbody></table>`;
        }

        const bodyHtml = rows.map((row, rowIdx) => {
            return `<tr>${row.map((cell, colIdx) => {
                const value = escapeHtml(String(cell || '-'));
                if (colIdx === 0 && addDots) {
                    const color = getPlmValuesSeriesColor(rowIdx);
                    return `<td><span class="print-legend-cell"><span class="print-legend-dot" style="background:${color};"></span><span>${value}</span></span></td>`;
                }
                return `<td>${value}</td>`;
            }).join('')}</tr>`;
        }).join('');

        return `<table>${theadHtml}<tbody>${bodyHtml}</tbody></table>`;
    };

    const summaryData = parseTableFromDom('.plm-values-summary-table');
    const conjuntosData = parseTableFromDom('.plm-values-card-conjuntos table');
    const partsData = parseTableFromDom('.plm-values-card-parts table', 20);
    const mpData = parseTableFromDom('.plm-values-card-mp table');
    const suppliersData = parseTableFromDom('.plm-values-card-suppliers table');

    const cards = {
        summary: {
            title: 'Resumen de Costos',
            tableHtml: renderPrintableTable(summaryData, true),
            chartImg: captureChart('plm-values-summary-pie')
        },
        conjuntos: {
            title: 'Costos por Conjunto',
            tableHtml: renderPrintableTable(conjuntosData, true),
            chartImg: captureChart('plm-values-conjuntos-pie')
        },
        parts: {
            title: 'Piezas (maximo 20 Item ID)',
            tableHtml: renderPrintableTable(partsData, true),
            chartImg: captureChart('plm-values-parts-pie')
        },
        mp: {
            title: 'Materia Prima',
            tableHtml: renderPrintableTable(mpData, true),
            chartImg: captureChart('plm-values-mp-pie')
        },
        suppliers: {
            title: 'Proveedores',
            tableHtml: renderPrintableTable(suppliersData, true),
            chartImg: captureChart('plm-values-suppliers-pie')
        }
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        notifyProject('Permita ventanas emergentes para imprimir', 'error');
        return;
    }

    const today = new Date().toLocaleDateString('es-AR');
    const now = new Date().toLocaleString('es-AR');

    const styles = `
        <style>
            @media print {
                @page { margin: 0; size: A4; }

                body {
                    margin: 0;
                    padding: 0;
                    font-family: sans-serif;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .page-container {
                    position: relative;
                    width: 100%;
                    box-sizing: border-box;
                    padding-top: 160px;
                    padding-bottom: 140px;
                    padding-left: 1.5cm;
                    padding-right: 1.5cm;
                    display: block;
                    page-break-after: always;
                }

                .page-container:last-of-type {
                    page-break-after: auto;
                }

                .header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 120px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #cf1625;
                    padding: 0 1.5cm;
                    background: white;
                    z-index: 1000;
                    box-sizing: border-box;
                }

                .footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 100px;
                    border-top: 2px solid #cf1625;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 1.5cm;
                    background: white;
                    z-index: 1000;
                    box-sizing: border-box;
                }
            }

            body {
                margin: 0;
                font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: white;
                color: #222;
            }

            .header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 120px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #cf1625;
                padding: 0 1.5cm;
                background: white;
                z-index: 1000;
                box-sizing: border-box;
            }

            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 100px;
                border-top: 2px solid #cf1625;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 1.5cm;
                background: white;
                z-index: 1000;
                box-sizing: border-box;
            }

            .intro-card {
                border: 1px solid #333;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 14px;
                page-break-inside: avoid;
            }

            .intro-card h2 {
                margin: 0 0 10px;
                font-size: 18px;
            }

            .intro-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 6px 14px;
                font-size: 13px;
            }

            .intro-desc {
                margin: 10px 0 0;
                font-size: 13px;
                line-height: 1.35;
                color: #333;
            }

            .print-card {
                border: 1px solid #333;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 14px;
                page-break-inside: avoid;
            }

            .print-card h3 {
                margin: 0 0 8px;
                font-size: 16px;
                color: #333;
            }

            .print-card-grid {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 340px;
                gap: 12px;
                align-items: start;
            }

            .chart-box {
                border: 1px solid #bbb;
                border-radius: 8px;
                min-height: 250px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px;
                box-sizing: border-box;
            }

            .chart-box img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
            }

            .chart-empty {
                font-size: 12px;
                color: #777;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }

            thead { display: table-header-group; }

            th, td {
                border: 1px solid #666;
                padding: 6px 8px;
                vertical-align: top;
            }

            th {
                background: #f2f2f2;
                font-weight: 700;
                text-align: left;
            }

            tr { page-break-inside: avoid; }

            .center {
                text-align: center;
            }

            .print-legend-cell {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .print-legend-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                display: inline-block;
                flex: 0 0 10px;
            }

            .timestamp {
                margin-top: 8px;
                text-align: right;
                font-size: 11px;
                color: #555;
            }
        </style>
    `;

    const headerHtml = `
        <div class="header">
            <div style="display:flex; align-items:center; gap:20px;">
                <img src="/static/assets/iso_red.png" style="height:80px;">
                <div>
                    <h1 style="margin:0; font-size:26px; color:#333;">Reporte de Valores</h1>
                    <div style="font-size:16px; color:#666;">Oficina Tecnica - BPB</div>
                </div>
            </div>
            <div style="text-align:right; font-size:14px; color:#666;">
                <div>Generado: ${escapeHtml(today)}</div>
                <div>Proyecto: ${escapeHtml(projectName)}</div>
            </div>
        </div>
    `;

    const footerHtml = `
        <div class="footer">
            <div style="flex:1; text-align:left; font-size:18px; color:#cf1625; font-weight:bold;">OFICINA TECNICA</div>
            <div style="flex:1; text-align:center;">
                <img src="/static/assets/Oficina_Tecnica_v3.png" style="height:70px; opacity:0.8;">
            </div>
            <div style="flex:1;"></div>
        </div>
    `;

    const introHtml = `
        <div class="intro-card">
            <h2>Informacion de Version</h2>
            <div class="intro-grid">
                <div><strong>Proyecto:</strong> ${escapeHtml(projectName)}</div>
                <div><strong>Version:</strong> ${escapeHtml(versionName)}</div>
                <div><strong>Revision:</strong> ${escapeHtml(revision)}</div>
                <div><strong>Items:</strong> ${escapeHtml(formatBomQuantity(itemCount))}</div>
                <div><strong>Creacion:</strong> ${escapeHtml(createdAt)}</div>
                <div><strong>Modificacion:</strong> ${escapeHtml(updatedAt)}</div>
            </div>
            <p class="intro-desc"><strong>Descripcion:</strong> ${escapeHtml(description)}</p>
        </div>
    `;

    const renderCardHtml = (card) => {
        const chartHtml = card.chartImg
            ? `<img src="${card.chartImg}" alt="${escapeHtml(card.title)}">`
            : '<div class="chart-empty">Sin grafico.</div>';

        return `
            <div class="print-card">
                <h3>${escapeHtml(card.title)}</h3>
                <div class="print-card-grid">
                    <div>${card.tableHtml}</div>
                    <div class="chart-box">${chartHtml}</div>
                </div>
            </div>
        `;
    };

    const page1Html = `
        <div class="page-container">
            ${introHtml}
            ${renderCardHtml(cards.summary)}
            ${renderCardHtml(cards.conjuntos)}
            <div class="timestamp">Generado: ${escapeHtml(now)}</div>
        </div>
    `;

    const page2Html = `
        <div class="page-container">
            ${renderCardHtml(cards.parts)}
            <div class="timestamp">Piezas: se imprimen solo los primeros 20 Item ID.</div>
        </div>
    `;

    const page3Html = `
        <div class="page-container">
            ${renderCardHtml(cards.mp)}
            ${renderCardHtml(cards.suppliers)}
        </div>
    `;

    const doc = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Valores</title>
    ${styles}
</head>
<body>
    ${headerHtml}
    ${footerHtml}
    ${page1Html}
    ${page2Html}
    ${page3Html}
</body>
</html>
`;

    printWindow.document.open();
    printWindow.document.write(doc);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function printPlmBomGraphReport() {
    if (!currentWorkspaceProject) return;

    const inBomSection = plmWorkspaceMode === 'main' && String(plmActiveSection || '').toLowerCase() === 'bom';
    if (!inBomSection) return;

    renderBomGraph();

    const graphHost = document.getElementById('plm-bom-graph');
    const sourceSvg = graphHost ? graphHost.querySelector('svg.plm-bom-svg, svg') : null;
    if (!graphHost || !sourceSvg) {
        notifyProject('No hay grafico BOM para imprimir.', 'info');
        return;
    }

    const svgClone = sourceSvg.cloneNode(true);
    svgClone.removeAttribute('width');
    svgClone.removeAttribute('height');
    svgClone.style.width = '100%';
    svgClone.style.height = '100%';
    svgClone.style.display = 'block';

    // Print must include full BOM regardless of current pan/zoom.
    const viewportClone = svgClone.querySelector('.plm-bom-viewport');
    if (viewportClone) {
        viewportClone.setAttribute('transform', '');
    }

    try {
        const renderRingRadii = getBomRenderRingRadii();
        const maxRing = Math.max(
            toNumber(renderRingRadii && renderRingRadii.inner, 0),
            toNumber(renderRingRadii && renderRingRadii.conjunto, 0),
            toNumber(renderRingRadii && renderRingRadii.sub1, 0),
            toNumber(renderRingRadii && renderRingRadii.sub11, 0),
            toNumber(renderRingRadii && renderRingRadii.piezas, 0),
            toNumber(renderRingRadii && renderRingRadii.buloneria, 0)
        );

        let minX = -maxRing;
        let maxX = maxRing;
        let minY = -maxRing;
        let maxY = maxRing;

        const nodeHalfW = Math.max(12, toNumber(BOM_NODE_HALF_WIDTH, 0));
        const nodeHalfH = Math.max(12, toNumber(BOM_NODE_HALF_HEIGHT, 0));
        const nodePad = 16;

        const nodes = [{ x: 0, y: 0 }].concat(getActiveBomGraphNodes());
        nodes.forEach((node) => {
            const x = toNumber(node && node.x, 0);
            const y = toNumber(node && node.y, 0);
            minX = Math.min(minX, x - nodeHalfW - nodePad);
            maxX = Math.max(maxX, x + nodeHalfW + nodePad);
            minY = Math.min(minY, y - nodeHalfH - nodePad);
            maxY = Math.max(maxY, y + nodeHalfH + nodePad);
        });

        const pad = Math.max(70, Math.round(Math.max(maxX - minX, maxY - minY) * 0.06));
        const vbX = minX - pad;
        const vbY = minY - pad;
        const vbW = Math.max(100, (maxX - minX) + (pad * 2));
        const vbH = Math.max(100, (maxY - minY) + (pad * 2));

        svgClone.setAttribute('viewBox', `${vbX} ${vbY} ${vbW} ${vbH}`);
        svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    } catch (_) {
        // Fallback: keep original clone viewBox.
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        notifyProject('Permita ventanas emergentes para imprimir', 'error');
        return;
    }

    const svgMarkup = svgClone.outerHTML;
    const doc = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>BOM</title>
<link rel="stylesheet" href="/static/style.css">
<style>
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
    }

    body {
        margin: 0;
        padding: 10mm;
        background: #ffffff;
        box-sizing: border-box;
        font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .print-bom-only {
        width: 100%;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .print-bom-graph {
        width: min(100%, 1600px);
        height: 78vh;
        min-height: 620px;
        border: 1px solid #b5b5b5;
        border-radius: 10px;
        overflow: hidden;
        background: #0a0b10;
    }

    .print-bom-graph svg {
        width: 100%;
        height: 100%;
        display: block;
        background: #0a0b10;
    }

    .print-bom-graph .plm-bom-ring {
        stroke: rgba(255, 255, 255, 0.55) !important;
        stroke-width: 2.2 !important;
        stroke-dasharray: 9 7 !important;
        filter: none !important;
    }

    .print-bom-graph .plm-bom-edge,
    .print-bom-graph .plm-bom-edge.selected {
        stroke: rgba(207, 22, 37, 0.96) !important;
        stroke-width: 2.5 !important;
        opacity: 1 !important;
        animation: none !important;
        filter: none !important;
    }

    .print-bom-graph .plm-bom-edge-hit,
    .print-bom-graph .plm-bom-handle,
    .print-bom-graph .plm-bom-handle-hit,
    .print-bom-graph .plm-bom-edge-preview {
        display: none !important;
    }

    .print-bom-graph .plm-bom-node rect {
        fill: rgba(20, 20, 20, 0.98) !important;
        stroke: rgba(207, 22, 37, 0.82) !important;
        stroke-width: 1.6 !important;
    }

    .print-bom-graph .plm-bom-node.core rect {
        fill: rgba(207, 22, 37, 0.20) !important;
        stroke: rgba(207, 22, 37, 1) !important;
    }

    .print-bom-graph .plm-bom-node-title {
        fill: #f5f5f5 !important;
    }

    .print-bom-graph .plm-bom-node-subtitle {
        fill: #c8c8c8 !important;
    }

    .print-bom-graph .plm-bom-ring-chip-bg {
        stroke-width: 1.8 !important;
    }

    .print-bom-graph .plm-bom-edge-qty-wrap {
        border-color: rgba(207, 22, 37, 0.88) !important;
        background: rgba(10, 10, 10, 0.96) !important;
        box-shadow: none !important;
    }

    .print-bom-graph .plm-bom-edge-qty-input {
        color: #f1f1f1 !important;
    }

    @media print {
        @page {
            size: landscape;
            margin: 10mm;
        }

        body {
            margin: 0;
            padding: 0;
            background: #ffffff;
        }

        .print-bom-only {
            min-height: auto;
        }

        .print-bom-graph {
            width: 100%;
            height: calc(100vh - 20mm);
            min-height: 0;
            border-color: #888;
            break-inside: avoid;
            page-break-inside: avoid;
        }
    }
</style>
</head>
<body>
<main class="print-bom-only">
    <div class="print-bom-graph">${svgMarkup}</div>
</main>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(doc);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function printPlmVersionComparisonReport() {
    if (!currentWorkspaceProject) return;
    if (!(plmWorkspaceMode === 'versions' && plmVersionsFlowMode === 'compare')) return;

    renderPlmVersionComparisonView();

    const table = document.querySelector('#plm-versions-compare-view .plm-values-table-pane table');
    const chartCanvas = document.getElementById('plm-version-compare-total-chart');

    const headers = table
        ? Array.from(table.querySelectorAll('thead th')).map((th) => String(th.textContent || '').trim()).filter(Boolean)
        : [];

    const rows = table
        ? Array.from(table.querySelectorAll('tbody tr'))
            .filter((tr) => !tr.querySelector('td[colspan]'))
            .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => String(td.textContent || '').trim()))
        : [];

    const tableHtml = (() => {
        const safeHeaders = headers.length ? headers : ['Dato'];
        const thead = `<thead><tr>${safeHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;

        if (!rows.length) {
            return `<table>${thead}<tbody><tr><td colspan="${safeHeaders.length}" class="center">Sin datos para comparar.</td></tr></tbody></table>`;
        }

        const tbody = rows.map((row) => `
            <tr>
                ${row.map((cell) => `<td>${escapeHtml(cell || '-')}</td>`).join('')}
            </tr>
        `).join('');

        return `<table>${thead}<tbody>${tbody}</tbody></table>`;
    })();

    let chartImg = '';
    if (chartCanvas && typeof chartCanvas.toDataURL === 'function') {
        try {
            chartImg = chartCanvas.toDataURL('image/png');
        } catch (e) {
            chartImg = '';
        }
    }

    const selectedNames = (Array.isArray(plmVersionComparisonIds) ? plmVersionComparisonIds : [])
        .map((id) => getProjectVersionById(id))
        .filter(Boolean)
        .map((v) => String(v.name || '').trim())
        .filter(Boolean);

    const projectName = String(currentWorkspaceProject && currentWorkspaceProject.name ? currentWorkspaceProject.name : '').trim() || '-';
    const versionList = selectedNames.length ? selectedNames.join(' | ') : '-';
    const compareCount = String(selectedNames.length || 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        notifyProject('Permita ventanas emergentes para imprimir', 'error');
        return;
    }

    const today = new Date().toLocaleDateString('es-AR');
    const now = new Date().toLocaleString('es-AR');

    const styles = `
        <style>
            @media print {
                @page { margin: 0; size: A4; }

                body {
                    margin: 0;
                    padding: 0;
                    font-family: sans-serif;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .page-container {
                    position: relative;
                    width: 100%;
                    box-sizing: border-box;
                    padding-top: 160px;
                    padding-bottom: 140px;
                    padding-left: 1.5cm;
                    padding-right: 1.5cm;
                    display: block;
                    page-break-after: always;
                }

                .page-container:last-of-type { page-break-after: auto; }

                .header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 120px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #cf1625;
                    padding: 0 1.5cm;
                    background: white;
                    z-index: 1000;
                    box-sizing: border-box;
                }

                .footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 100px;
                    border-top: 2px solid #cf1625;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 1.5cm;
                    background: white;
                    z-index: 1000;
                    box-sizing: border-box;
                }
            }

            body {
                margin: 0;
                font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: white;
                color: #222;
            }

            .header, .footer {
                position: fixed;
                left: 0;
                right: 0;
                background: white;
                z-index: 1000;
                box-sizing: border-box;
                padding: 0 1.5cm;
            }

            .header {
                top: 0;
                height: 120px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #cf1625;
            }

            .footer {
                bottom: 0;
                height: 100px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 2px solid #cf1625;
            }

            .card {
                border: 1px solid #333;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 14px;
                page-break-inside: avoid;
            }

            .meta-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 6px 12px;
                font-size: 13px;
            }

            .meta-list {
                margin-top: 8px;
                font-size: 13px;
                line-height: 1.35;
                word-break: break-word;
            }

            .card-grid {
                display: flex;
                flex-direction: column;
                gap: 12px;
                align-items: stretch;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                font-size: 12px;
            }

            thead { display: table-header-group; }

            th, td {
                border: 1px solid #666;
                padding: 6px 8px;
                vertical-align: top;
                overflow-wrap: anywhere;
                word-break: break-word;
            }

            th { background: #f2f2f2; text-align: left; }
            .center { text-align: center; }

            .chart-box {
                border: 1px solid #bbb;
                border-radius: 8px;
                min-height: 250px;
                width: 100%;
                max-width: 560px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px;
                box-sizing: border-box;
            }

            .chart-box img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
            }

            .chart-empty { font-size: 12px; color: #777; }
            .timestamp { margin-top: 8px; text-align: right; font-size: 11px; color: #555; }
        </style>
    `;

    const headerHtml = `
        <div class="header">
            <div style="display:flex; align-items:center; gap:20px;">
                <img src="/static/assets/iso_red.png" style="height:80px;">
                <div>
                    <h1 style="margin:0; font-size:26px; color:#333;">Comparacion de Versiones</h1>
                    <div style="font-size:16px; color:#666;">Oficina Tecnica - BPB</div>
                </div>
            </div>
            <div style="text-align:right; font-size:14px; color:#666;">
                <div>Generado: ${escapeHtml(today)}</div>
                <div>Proyecto: ${escapeHtml(projectName)}</div>
            </div>
        </div>
    `;

    const footerHtml = `
        <div class="footer">
            <div style="flex:1; text-align:left; font-size:18px; color:#cf1625; font-weight:bold;">OFICINA TECNICA</div>
            <div style="flex:1; text-align:center;"><img src="/static/assets/Oficina_Tecnica_v3.png" style="height:70px; opacity:0.8;"></div>
            <div style="flex:1;"></div>
        </div>
    `;

    const doc = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comparacion de Versiones</title>
${styles}
</head>
<body>
${headerHtml}
${footerHtml}
<div class="page-container">
    <div class="card">
        <h2 style="margin:0 0 8px; font-size:18px;">Resumen de Comparacion</h2>
        <div class="meta-grid">
            <div><strong>Proyecto:</strong> ${escapeHtml(projectName)}</div>
            <div><strong>Versiones comparadas:</strong> ${escapeHtml(compareCount)}</div>
            <div><strong>Fecha:</strong> ${escapeHtml(today)}</div>
        </div>
        <div class="meta-list"><strong>Versiones:</strong> ${escapeHtml(versionList)}</div>
    </div>

    <div class="card">
        <h3 style="margin:0 0 8px; font-size:16px;">Totales por Version</h3>
        <div class="card-grid">
            <div>${tableHtml}</div>
            <div class="chart-box">${chartImg ? `<img src="${chartImg}" alt="Grafico comparacion">` : '<div class="chart-empty">Sin grafico.</div>'}</div>
        </div>
    </div>

    <div class="timestamp">Generado: ${escapeHtml(now)}</div>
</div>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(doc);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function showPlmSection(sectionName) {
    const selected = (sectionName || 'plm').toLowerCase();
    plmActiveSection = selected;

    const tabs = document.querySelectorAll('#view-plm-workspace .plm-tab-btn');
    tabs.forEach((tab) => {
        const tabName = (tab.dataset.plmTab || '').toLowerCase();
        tab.classList.toggle('active', tabName === selected);
    });

    const sections = document.querySelectorAll('#view-plm-workspace .plm-section');
    sections.forEach((section) => {
        const sectionId = (section.dataset.plmSection || '').toLowerCase();
        section.classList.toggle('active', sectionId === selected);
    });

    refreshWorkspacePanelBreadcrumb();
    refreshPlmWorkspaceHeaderActions();

    if (selected === 'bom') {
        setTimeout(() => {
            renderBomClassificationTable();
            renderBomGraph();
        }, 0);
    } else if (selected === 'plm') {
        queuePlmEntryUiRefresh();
    } else if (selected === 'erp') {
        renderErpPanel();
    } else if (selected === 'values') {
        renderPlmValuesPanel();
    } else if (selected === 'bitacora') {
        renderPlmBitacoraPanel();
    }
}

function appendProjectRow(tbody, project) {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.style.fontWeight = 'bold';
    tdName.style.color = 'var(--bpb-blue)';
    tdName.textContent = project.name || '-';

    const tdDate = document.createElement('td');
    tdDate.textContent = project.date || '-';

    const tdStatus = document.createElement('td');
    const badge = document.createElement('span');
    const normalizedStatus = String(project.status || '').toLowerCase();
    const isActive = normalizedStatus === 'activo';
    badge.className = `status-badge ${isActive ? 'approved' : 'pending'}`;
    badge.textContent = project.status || '-';
    tdStatus.appendChild(badge);

    const tdDesc = document.createElement('td');
    tdDesc.style.maxWidth = '300px';
    tdDesc.style.overflow = 'hidden';
    tdDesc.style.textOverflow = 'ellipsis';
    tdDesc.style.whiteSpace = 'nowrap';
    tdDesc.textContent = project.description || '-';

    const tdActions = document.createElement('td');
    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn-sm';
    actionBtn.textContent = 'Abrir Proyecto';
    actionBtn.onclick = () => openProjectWorkspace(project.id);

    tdActions.appendChild(actionBtn);

    tr.appendChild(tdName);
    tr.appendChild(tdDate);
    tr.appendChild(tdStatus);
    tr.appendChild(tdDesc);
    tr.appendChild(tdActions);
    tbody.appendChild(tr);
}

// Data Fetching & Rendering
async function renderProjectsTable() {
    const tbody = document.getElementById('projects-list-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando proyectos...</td></tr>';

    try {
        const projects = await fetchProjectsList();

        if (!projects.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay proyectos registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        projects.forEach((project) => appendProjectRow(tbody, project));
    } catch (e) {
        console.error('Error loading projects:', e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--bpb-blue);">Error al cargar proyectos.</td></tr>';
    }
}

async function renderSolidsTable(projectId) {
    const tbody = document.getElementById('solids-list-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando solidos...</td></tr>';

    try {
        const response = await fetch(`/api/solids/${projectId}`);
        const solids = await response.json();

        if (solids.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay solidos cargados para este proyecto.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        solids.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: bold;">${s.name}</td>
                <td>${s.revision || 'R.0'} ${s.date ? `<br><small style="color: var(--text-secondary);">${s.date}</small>` : ''}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm" onclick="viewSolidFile('${s.filename}')">Ver Archivo</button>
                        <a href="/solids/${encodeURIComponent(s.filename)}" download class="btn btn-sm" style="text-decoration: none;">Descargar</a>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error loading solids:', e);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="color: var(--bpb-blue);">Error al cargar solidos.</td></tr>';
    }
}

function showSolidsView(projectId, projectName) {
    if (typeof hideAllViews === 'function') hideAllViews();
    else {
        document.querySelectorAll('.panel, #view-home, #view-sub-home-activity').forEach(el => el.style.display = 'none');
    }

    const view = document.getElementById('view-solids');
    if (view) {
        view.style.display = 'block';
        if (typeof animateEntry === 'function') animateEntry('view-solids');

        currentViewProject = { id: projectId, name: projectName };
        document.getElementById('solids-project-name').textContent = projectName;
        renderSolidsTable(projectId);

        localStorage.setItem('lastView', 'solids');
        localStorage.setItem('lastViewParam', projectId);
    }
}

// Workspace actions
async function uploadPlmShortcutFile(file, kind) {
    if (!(file instanceof File)) return '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind === 'drawing' ? 'drawing' : 'cad');

    const response = await fetch('/api/plm-shortcut', {
        method: 'POST',
        body: formData
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || String(payload.status || '').toLowerCase() !== 'success') {
        const fallbackMessage = kind === 'drawing'
            ? 'No se pudo cargar el archivo de Plano.'
            : 'No se pudo cargar el archivo CAD.';
        throw new Error(String(payload.message || fallbackMessage));
    }

    const shortcut = String(payload.shortcut || '').trim();
    if (!shortcut) {
        throw new Error('El servidor no devolvio un acceso directo valido.');
    }

    return shortcut;
}

async function addPlmItem() {
    if (!currentWorkspaceProject) return;

    const itemIdEl = document.getElementById('plm-input-item-id');
    const nameEl = document.getElementById('plm-input-name');
    const descEl = document.getElementById('plm-input-description');
    const revEl = document.getElementById('plm-input-revision');
    const drawingEl = document.getElementById('plm-input-drawing');
    const cadEl = document.getElementById('plm-input-cad');

    const itemId = (itemIdEl ? itemIdEl.value : '').trim();
    const name = (nameEl ? nameEl.value : '').trim();
    const description = (descEl ? descEl.value : '').trim();
    const revision = (revEl ? revEl.value : '').trim();

    const drawingFile = drawingEl && drawingEl.files && drawingEl.files.length
        ? drawingEl.files[0]
        : null;
    const cadFile = cadEl && cadEl.files && cadEl.files.length
        ? cadEl.files[0]
        : null;

    if (!itemId || !name) {
        notifyProject('Complete Item ID y Nombre.', 'error');
        return;
    }
    const editId = String(plmEditingItemId || '').trim();
    if (!validatePlmItemCodeInput(itemId)) {
        const duplicateItem = findExistingPlmItemByCode(itemId, editId);
        if (duplicateItem) {
            const duplicateName = String(duplicateItem && duplicateItem.name ? duplicateItem.name : '').trim() || 'Sin nombre';
            const duplicateCode = String(duplicateItem && duplicateItem.item_id ? duplicateItem.item_id : '').trim() || normalizePlmItemCode(itemId);
            notifyProject(`Codigo en uso: ${duplicateCode}. Pieza existente: ${duplicateName}.`, 'error');
        } else {
            notifyProject('Codigo en uso. Ingrese un codigo distinto.', 'error');
        }
        return;
    }
    const editIndex = currentWorkspaceProject.plm_items.findIndex((item) => String(item.id || '') === editId);
    const existingItem = editIndex >= 0 ? currentWorkspaceProject.plm_items[editIndex] : null;

    let drawing = existingItem ? String(existingItem.drawing || '').trim() : '';
    let cad = existingItem ? String(existingItem.cad || '').trim() : '';

    try {
        if (drawingFile) {
            drawing = await uploadPlmShortcutFile(drawingFile, 'drawing');
        }

        const selectedCad = String(plmSelectedCadShortcut || '').trim();
        if (selectedCad) {
            cad = selectedCad;
        } else if (cadFile) {
            cad = await uploadPlmShortcutFile(cadFile, 'cad');
        }
    } catch (error) {
        notifyProject(String((error && error.message) || 'No se pudo crear el acceso directo.'), 'error');
        return;
    }

    if (editIndex >= 0) {
        const target = currentWorkspaceProject.plm_items[editIndex];
        target.item_id = itemId;
        target.name = name;
        target.description = description;
        target.revision = revision || String(target.revision || 'A');
        target.status = String(target.status || 'Activo').trim() || 'Activo';
        target.drawing = drawing;
        target.cad = cad;
    } else {
        const nextIndex = currentWorkspaceProject.plm_items.length;
        const position = getLooseNodeSpawnPosition(nextIndex, nextIndex + 1);

        currentWorkspaceProject.plm_items.push({
            id: `plm-${Date.now()}`,
            item_id: itemId,
            name,
            description,
            revision: revision || 'A',
            status: 'Activo',
            drawing,
            cad,
            category: '',
            x: position.x,
            y: position.y
        });
    }

    clearPlmFormInputs();
    resetPlmEditMode();
    closePlmItemModal(false);

    renderPlmTable();
    renderBomClassificationTable();
    renderBomGraph();
    updateWorkspaceKPIs();
    await persistCurrentWorkspace(true);
}

async function deleteCurrentPlmItem() {
    if (!currentWorkspaceProject) return;

    const editId = String(plmEditingItemId || '').trim();
    if (!editId) {
        notifyProject('No hay pieza seleccionada para eliminar.', 'error');
        return;
    }

    const idx = currentWorkspaceProject.plm_items.findIndex((item) => String(item.id || '').trim() === editId);
    if (idx < 0) {
        notifyProject('No se encontro la pieza a eliminar.', 'error');
        return;
    }

    await removePlmItem(idx);
    closePlmItemModal(false);
    notifyProject('Pieza eliminada.', 'success');
}

async function removePlmItem(index) {
    if (!currentWorkspaceProject) return;
    if (index < 0 || index >= currentWorkspaceProject.plm_items.length) return;

    const removed = currentWorkspaceProject.plm_items[index];
    currentWorkspaceProject.plm_items.splice(index, 1);

    const removedId = String(removed.id);
    if (String(plmEditingItemId || '') === removedId) {
        clearPlmFormInputs();
        resetPlmEditMode();
    }
    const duplicateNodes = getEditableBomDuplicateNodes();
    const removedDuplicateIds = [];
    for (let i = duplicateNodes.length - 1; i >= 0; i -= 1) {
        const dup = duplicateNodes[i];
        const dupId = String(dup && dup.id ? dup.id : '').trim();
        const dupSource = String(dup && dup.duplicate_source_id ? dup.duplicate_source_id : '').trim();
        if (!dupId) continue;
        if (dupSource === removedId) {
            removedDuplicateIds.push(dupId);
            duplicateNodes.splice(i, 1);
        }
    }

    const removedEdges = [];
    const removedNodeSet = new Set([removedId, ...removedDuplicateIds]);
    currentWorkspaceProject.bom_edges = currentWorkspaceProject.bom_edges.filter((edge) => {
        const sourceId = String(edge && edge.source_id ? edge.source_id : '').trim();
        const targetId = String(edge && edge.target_id ? edge.target_id : '').trim();
        const touch = removedNodeSet.has(sourceId) || removedNodeSet.has(targetId);
        if (touch) removedEdges.push(String(edge.id));
        return !touch;
    });

    if (selectedBomSourceId === removedId || removedDuplicateIds.includes(String(selectedBomSourceId || ''))) selectedBomSourceId = null;
    if (selectedBomTargetId === removedId || removedDuplicateIds.includes(String(selectedBomTargetId || ''))) selectedBomTargetId = null;
    if (activeBomNodeId === removedId || removedDuplicateIds.includes(String(activeBomNodeId || ''))) activeBomNodeId = null;
    if (removedEdges.includes(String(selectedBomEdgeId))) selectedBomEdgeId = null;

    renderPlmTable();
    renderBomClassificationTable();
    renderBomGraph();
    updateWorkspaceKPIs();
    updateBomSelectionLabels();
    await persistCurrentWorkspace(true);
}

function setErpPanel(panel = 'home') {
    const selected = String(panel || 'home').toLowerCase();
    if (selected === 'materials') erpActivePanel = 'materials';
    else if (selected === 'suppliers') erpActivePanel = 'suppliers';
    else if (selected === 'diagram') erpActivePanel = 'diagram';
    else erpActivePanel = 'home';
    renderErpPanel();
    refreshWorkspacePanelBreadcrumb();
}

function setErpSupplierModalError(message = '') {
    const el = document.getElementById('erp-supplier-modal-error');
    if (!el) {
        if (message) notifyProject(message, 'error');
        return;
    }
    const text = String(message || '').trim();
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
}

function toggleErpSupplierSupplyOption(event) {
    const target = event && event.target;
    if (!target || String(target.tagName || '').toUpperCase() !== 'OPTION') return;

    event.preventDefault();
    target.selected = !target.selected;
}

function openErpSupplierModal(supplierIdRaw = '') {
    if (!currentWorkspaceProject) return;

    const supplierId = String(supplierIdRaw || '').trim();
    const suppliers = Array.isArray(currentWorkspaceProject.erp_suppliers)
        ? currentWorkspaceProject.erp_suppliers
        : [];
    const editingSupplier = supplierId
        ? (suppliers.find((supplier) => String(supplier && supplier.id ? supplier.id : '').trim() === supplierId) || null)
        : null;

    const modal = document.getElementById('erp-supplier-modal');
    const titleEl = document.getElementById('erp-supplier-modal-title');
    const confirmBtn = document.getElementById('erp-supplier-modal-confirm-btn');
    const nameInput = document.getElementById('erp-supplier-name');
    const idInput = document.getElementById('erp-supplier-id');
    const countryInput = document.getElementById('erp-supplier-country');
    const descriptionInput = document.getElementById('erp-supplier-description');
    const suppliesSelect = document.getElementById('erp-supplier-supplies');

    erpSupplierEditId = editingSupplier ? supplierId : '';

    if (titleEl) titleEl.textContent = editingSupplier ? 'Modificar Proveedor' : 'Agregar Proveedor';
    if (confirmBtn) confirmBtn.textContent = editingSupplier ? 'Guardar Cambios' : 'Agregar Proveedor';

    if (nameInput) nameInput.value = editingSupplier ? String(editingSupplier.name || '') : '';
    if (idInput) idInput.value = editingSupplier ? String(editingSupplier.provider_id || '') : '';
    if (countryInput) countryInput.value = editingSupplier ? String(editingSupplier.country || '') : '';
    if (descriptionInput) descriptionInput.value = editingSupplier ? String(editingSupplier.description || '') : '';
    if (suppliesSelect) {
        const selectedSupplies = new Set(
            Array.isArray(editingSupplier && editingSupplier.supplies)
                ? editingSupplier.supplies.map((value) => String(value || '').trim())
                : []
        );
        Array.from(suppliesSelect.options || []).forEach((opt) => { opt.selected = false; });
        Array.from(suppliesSelect.options || []).forEach((opt) => {
            const value = String(opt && opt.value ? opt.value : '').trim();
            opt.selected = selectedSupplies.has(value);
        });
    }

    setErpSupplierModalError('');
    if (modal) modal.style.display = 'flex';
    if (nameInput) setTimeout(() => nameInput.focus(), 0);
}

function closeErpSupplierModal() {
    const modal = document.getElementById('erp-supplier-modal');
    const titleEl = document.getElementById('erp-supplier-modal-title');
    const confirmBtn = document.getElementById('erp-supplier-modal-confirm-btn');
    if (modal) modal.style.display = 'none';
    if (titleEl) titleEl.textContent = 'Agregar Proveedor';
    if (confirmBtn) confirmBtn.textContent = 'Agregar Proveedor';
    erpSupplierEditId = '';
    setErpSupplierModalError('');
}

async function confirmAddErpSupplier() {
    if (!currentWorkspaceProject) return;

    const nameInput = document.getElementById('erp-supplier-name');
    const idInput = document.getElementById('erp-supplier-id');
    const countryInput = document.getElementById('erp-supplier-country');
    const descriptionInput = document.getElementById('erp-supplier-description');
    const suppliesSelect = document.getElementById('erp-supplier-supplies');

    const name = String(nameInput ? nameInput.value : '').trim();
    const providerId = String(idInput ? idInput.value : '').trim();
    const country = String(countryInput ? countryInput.value : '').trim();
    const description = String(descriptionInput ? descriptionInput.value : '').trim();
    const supplies = suppliesSelect
        ? Array.from(suppliesSelect.selectedOptions || [])
            .map((opt) => String(opt && opt.value ? opt.value : '').trim())
            .filter((value) => value && ERP_SUPPLIER_SUPPLY_OPTIONS.includes(value))
        : [];

    if (!name) {
        setErpSupplierModalError('Ingrese el nombre del proveedor.');
        return;
    }

    if (!providerId) {
        setErpSupplierModalError('Ingrese el Proveedor ID.');
        return;
    }

    if (!supplies.length) {
        setErpSupplierModalError('Seleccione al menos una categoria en Provee.');
        return;
    }

    const suppliers = Array.isArray(currentWorkspaceProject.erp_suppliers)
        ? currentWorkspaceProject.erp_suppliers
        : (currentWorkspaceProject.erp_suppliers = []);
    const editingId = String(erpSupplierEditId || '').trim();
    const allowSharedProviderId = providerId === '-';
    if (!allowSharedProviderId) {
        const providerIdLower = providerId.toLowerCase();
        const duplicateProviderId = suppliers.find((supplier) => {
            const supplierId = String(supplier && supplier.id ? supplier.id : '').trim();
            if (editingId && supplierId === editingId) return false;
            return String(supplier && supplier.provider_id ? supplier.provider_id : '').trim().toLowerCase() === providerIdLower;
        });
        if (duplicateProviderId) {
            setErpSupplierModalError('Ya existe un proveedor con ese Proveedor ID.');
            return;
        }
    }

    setErpSupplierModalError('');

    const normalizedSupplier = normalizeErpSupplier({
        id: editingId || `sup-${Date.now()}`,
        name,
        provider_id: providerId,
        description,
        country,
        supplies
    });

    if (editingId) {
        const editIndex = suppliers.findIndex((supplier) => String(supplier && supplier.id ? supplier.id : '').trim() === editingId);
        if (editIndex >= 0) suppliers[editIndex] = normalizedSupplier;
        else suppliers.push(normalizedSupplier);
    } else {
        suppliers.push(normalizedSupplier);
    }

    closeErpSupplierModal();
    renderErpSuppliersTable();
    if (String(erpActivePanel || '').toLowerCase() === 'diagram') renderErpDiagramGraph();
    updateWorkspaceKPIs();
    await persistCurrentWorkspace(true);
    notifyProject(editingId ? 'Proveedor actualizado.' : 'Proveedor agregado.', 'success');
}

function setErpMpModalError(message = '') {
    const el = document.getElementById('erp-mp-modal-error');
    if (!el) {
        if (message) notifyProject(message, 'error');
        return;
    }
    const text = String(message || '').trim();
    el.textContent = text;
    el.style.display = text ? 'block' : 'none';
}

function updateErpMpIdPreview() {
    const categoryEl = document.getElementById('erp-mp-category');
    const idEl = document.getElementById('erp-mp-id');
    const category = String(categoryEl ? categoryEl.value : '').trim();
    if (idEl) idEl.value = category ? getNextErpMpId(category) : '';
}

function openErpMpModal(editingMaterialId = '') {
    if (!currentWorkspaceProject) return;

    const modal = document.getElementById('erp-mp-modal');
    const titleEl = document.getElementById('erp-mp-modal-title');
    const confirmBtn = document.getElementById('erp-mp-modal-confirm-btn');
    const categoryEl = document.getElementById('erp-mp-category');
    const idEl = document.getElementById('erp-mp-id');
    const referenceEl = document.getElementById('erp-mp-reference');
    const materialEl = document.getElementById('erp-mp-material');
    const materialId = String(editingMaterialId || '').trim();
    const materials = Array.isArray(currentWorkspaceProject.erp_raw_materials)
        ? currentWorkspaceProject.erp_raw_materials
        : [];
    const editingMaterial = materialId
        ? materials.find((item) => String(item && item.id ? item.id : '').trim() === materialId)
        : null;

    erpMpEditId = editingMaterial ? materialId : '';

    if (titleEl) titleEl.textContent = editingMaterial ? 'Modificar Materia Prima' : 'Agregar Materia Prima';
    if (confirmBtn) confirmBtn.textContent = editingMaterial ? 'Guardar Cambios' : 'Agregar MP';

    if (editingMaterial) {
        if (categoryEl) categoryEl.value = String(editingMaterial.category || '').trim();
        if (idEl) idEl.value = String(editingMaterial.mp_id || '').trim();
        if (referenceEl) referenceEl.value = String(editingMaterial.reference || '').trim();
        if (materialEl) materialEl.value = String(editingMaterial.material || '').trim();
    } else {
        if (categoryEl) categoryEl.value = '';
        if (referenceEl) referenceEl.value = '';
        if (materialEl) materialEl.value = '';
        updateErpMpIdPreview();
    }

    setErpMpModalError('');

    if (modal) modal.style.display = 'flex';
    if (categoryEl) setTimeout(() => categoryEl.focus(), 0);
}

function closeErpMpModal() {
    const modal = document.getElementById('erp-mp-modal');
    const titleEl = document.getElementById('erp-mp-modal-title');
    const confirmBtn = document.getElementById('erp-mp-modal-confirm-btn');
    if (modal) modal.style.display = 'none';
    if (titleEl) titleEl.textContent = 'Agregar Materia Prima';
    if (confirmBtn) confirmBtn.textContent = 'Agregar MP';
    erpMpEditId = '';
    setErpMpModalError('');
}

async function confirmAddErpMp() {
    if (!currentWorkspaceProject) return;

    const categoryEl = document.getElementById('erp-mp-category');
    const idEl = document.getElementById('erp-mp-id');
    const referenceEl = document.getElementById('erp-mp-reference');
    const materialEl = document.getElementById('erp-mp-material');

    const category = String(categoryEl ? categoryEl.value : '').trim();
    const editingId = String(erpMpEditId || '').trim();
    const mpId = String(idEl ? idEl.value : '').trim() || getNextErpMpId(category);
    const reference = String(referenceEl ? referenceEl.value : '').trim();
    const material = String(materialEl ? materialEl.value : '').trim();

    if (!category || !ERP_SUPPLY_CATEGORIES.includes(category)) {
        setErpMpModalError('Seleccione el tipo de materia prima.');
        return;
    }

    if (!reference) {
        setErpMpModalError('Ingrese la referencia.');
        return;
    }

    if (!material) {
        setErpMpModalError('Ingrese el material.');
        return;
    }

    setErpMpModalError('');

    if (!Array.isArray(currentWorkspaceProject.erp_raw_materials)) currentWorkspaceProject.erp_raw_materials = [];
    const materials = currentWorkspaceProject.erp_raw_materials;
    const normalizedMaterial = normalizeErpRawMaterial({
        id: editingId || `mp-${Date.now()}`,
        category,
        mp_id: mpId,
        reference,
        material
    });

    if (editingId) {
        const editIndex = materials.findIndex((item) => String(item && item.id ? item.id : '').trim() === editingId);
        if (editIndex >= 0) materials[editIndex] = normalizedMaterial;
        else materials.push(normalizedMaterial);
    } else {
        materials.push(normalizedMaterial);
    }

    closeErpMpModal();
    renderErpRawMaterialsTable();
    if (String(erpActivePanel || '').toLowerCase() === 'diagram') renderErpDiagramGraph();
    updateWorkspaceKPIs();
    await persistCurrentWorkspace(true);
    notifyProject(editingId ? 'Materia Prima actualizada.' : 'Materia Prima agregada.', 'success');
}

async function addErpItem() {
    if (!currentWorkspaceProject) return;

    const supplierEl = document.getElementById('erp-input-supplier');
    const materialEl = document.getElementById('erp-input-material');
    const costEl = document.getElementById('erp-input-cost');
    const leadEl = document.getElementById('erp-input-lead');

    const supplier = (supplierEl ? supplierEl.value : '').trim();
    const material = (materialEl ? materialEl.value : '').trim();
    const unitCost = toNumber(costEl ? costEl.value : 0, NaN);
    const leadTime = Math.max(0, Math.round(toNumber(leadEl ? leadEl.value : 0, 0)));

    if (!supplier || !material || !Number.isFinite(unitCost)) {
        notifyProject('Complete proveedor, material y costo unitario.', 'error');
        return;
    }

    currentWorkspaceProject.erp_items.push({
        id: `erp-${Date.now()}`,
        supplier,
        material,
        unit_cost: unitCost,
        lead_time: leadTime
    });

    if (supplierEl) supplierEl.value = '';
    if (materialEl) materialEl.value = '';
    if (costEl) costEl.value = '';
    if (leadEl) leadEl.value = '';

    renderErpTable();
    updateWorkspaceKPIs();
    recalculateQuote(false);
    await persistCurrentWorkspace(true);
}

async function removeErpItem(index) {
    if (!currentWorkspaceProject) return;
    if (index < 0 || index >= currentWorkspaceProject.erp_items.length) return;
    currentWorkspaceProject.erp_items.splice(index, 1);
    renderErpTable();
    updateWorkspaceKPIs();
    recalculateQuote(false);
    await persistCurrentWorkspace(true);
}

async function addCpqItem() {
    if (!currentWorkspaceProject) return;

    const optionEl = document.getElementById('cpq-input-option');
    const deltaEl = document.getElementById('cpq-input-delta');

    const option = (optionEl ? optionEl.value : '').trim();
    const deltaCost = toNumber(deltaEl ? deltaEl.value : 0, NaN);

    if (!option || !Number.isFinite(deltaCost)) {
        notifyProject('Complete opcion e impacto de costo.', 'error');
        return;
    }

    currentWorkspaceProject.cpq_items.push({
        id: `cpq-${Date.now()}`,
        option,
        delta_cost: deltaCost
    });

    if (optionEl) optionEl.value = '';
    if (deltaEl) deltaEl.value = '';

    renderCpqTable();
    updateWorkspaceKPIs();
    recalculateQuote(false);
    await persistCurrentWorkspace(true);
}

async function removeCpqItem(index) {
    if (!currentWorkspaceProject) return;
    if (index < 0 || index >= currentWorkspaceProject.cpq_items.length) return;
    currentWorkspaceProject.cpq_items.splice(index, 1);
    renderCpqTable();
    updateWorkspaceKPIs();
    recalculateQuote(false);
    await persistCurrentWorkspace(true);
}

async function saveProjectWorkspace() {
    await persistCurrentWorkspace(false);
}

// Modals
function showAddProjectModal() {
    const modal = document.getElementById('add-project-modal');
    if (modal) modal.style.display = 'flex';
    setProjectModalError('');
}

function closeAddProjectModal() {
    const modal = document.getElementById('add-project-modal');
    if (modal) modal.style.display = 'none';

    const nameInput = document.getElementById('new-project-name');
    const descInput = document.getElementById('new-project-description');
    if (nameInput) nameInput.value = '';
    if (descInput) descInput.value = '';
    setProjectModalError('');
}

async function confirmAddProject() {
    const nameInput = document.getElementById('new-project-name');
    const descInput = document.getElementById('new-project-description');

    const name = (nameInput ? nameInput.value : '').trim();
    const description = (descInput ? descInput.value : '').trim();

    if (!name) {
        setProjectModalError('Por favor ingrese un nombre.');
        return;
    }

    setProjectModalError('');

    const newProj = ensureProjectShape({
        id: Date.now().toString(),
        name,
        description,
        date: new Date().toLocaleDateString(),
        status: 'Activo'
    });

    try {
        const savedProject = await saveProject(newProj);
        currentWorkspaceProject = ensureProjectShape(savedProject);
        erpExpandedHomeItemIds = new Set();
        closeAddProjectModal();
        renderProjectsTable();
        showPlmWorkspace(savedProject.id);
    } catch (e) {
        console.error('Error adding project:', e);
        setProjectModalError(e.message || 'No se pudo crear el proyecto.');
        notifyProject(e.message || 'No se pudo crear el proyecto.', 'error');
    }
}

function showAddSolidModal() {
    const modal = document.getElementById('add-solid-modal');
    if (modal) modal.style.display = 'flex';
}

function closeAddSolidModal() {
    const modal = document.getElementById('add-solid-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('new-solid-name').value = '';
        document.getElementById('new-solid-revision').value = '';
        clearSolidFile();
    }
}

// File Upload Logic for Solids
function handleSolidFileSelect(input) {
    const file = input.files[0];
    if (file) {
        document.getElementById('upload-placeholder-solid').style.display = 'none';
        document.getElementById('preview-container-solid').style.display = 'flex';
        document.getElementById('solid-filename').textContent = file.name;
    }
}

function clearSolidFile(event) {
    if (event) event.stopPropagation();
    document.getElementById('fileInputSolid').value = '';
    document.getElementById('upload-placeholder-solid').style.display = 'flex';
    document.getElementById('preview-container-solid').style.display = 'none';
    document.getElementById('solid-filename').textContent = '';
}

async function confirmAddSolid() {
    if (!currentViewProject) return;

    const name = document.getElementById('new-solid-name').value.trim();
    const revision = document.getElementById('new-solid-revision').value.trim();
    const fileInput = document.getElementById('fileInputSolid');
    const file = fileInput.files[0];

    if (!name || !file) {
        alert('Complete el nombre y seleccione un archivo.');
        return;
    }

    const formData = new FormData();
    formData.append('projectId', currentViewProject.id);
    formData.append('name', name);
    formData.append('revision', revision);
    formData.append('file', file);

    try {
        const response = await fetch('/api/add-solid', {
            method: 'POST',
            body: formData
        });

        const res = await response.json();
        if (res.status === 'success') {
            closeAddSolidModal();
            renderSolidsTable(currentViewProject.id);
        } else {
            alert('Error: ' + res.message);
        }
    } catch (e) {
        console.error('Error uploading solid:', e);
    }
}

function viewSolidFile(filename) {
    window.open(`/solids/${encodeURIComponent(filename)}`, '_blank');
}

// Search Logic
function filterProjects() {
    const query = document.getElementById('project-search').value.toLowerCase();
    const rows = document.querySelectorAll('#projects-list-body tr');
    rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function filterSolids() {
    const query = document.getElementById('solid-search').value.toLowerCase();
    const rows = document.querySelectorAll('#solids-list-body tr');
    rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

// Global Exports
window.showProjectsView = showProjectsView;
window.showSolidsView = showSolidsView;
window.showPlmWorkspace = showPlmWorkspace;
window.showPlmSection = showPlmSection;
window.updateWorkspaceTableSearch = updateWorkspaceTableSearch;
window.showPlmWorkspaceMenu = showPlmWorkspaceMenu;
window.plmWorkspaceBack = plmWorkspaceBack;
window.showPlmVersionsEntryCards = showPlmVersionsEntryCards;
window.openPlmVersionCreateFlow = openPlmVersionCreateFlow;
window.openPlmVersionModifyFlow = openPlmVersionModifyFlow;
window.openPlmVersionExistingFlow = openPlmVersionExistingFlow;
window.openPlmVersionCopyFlow = openPlmVersionCopyFlow;
window.togglePlmVersionCompareMode = togglePlmVersionCompareMode;
window.togglePlmVersionCompareSelection = togglePlmVersionCompareSelection;
window.setErpPanel = setErpPanel;
window.autoArrangeErpDiagramNodes = autoArrangeErpDiagramNodes;
window.toggleErpDiagramEditMode = toggleErpDiagramEditMode;
window.toggleErpDiagramGridEditMode = toggleErpDiagramGridEditMode;
window.startErpDiagramRowDrag = startErpDiagramRowDrag;
window.endErpDiagramRowDrag = endErpDiagramRowDrag;
window.openErpSupplierModal = openErpSupplierModal;
window.closeErpSupplierModal = closeErpSupplierModal;
window.confirmAddErpSupplier = confirmAddErpSupplier;
window.toggleErpSupplierSupplyOption = toggleErpSupplierSupplyOption;
window.openErpMpModal = openErpMpModal;
window.closeErpMpModal = closeErpMpModal;
window.confirmAddErpMp = confirmAddErpMp;
window.updateErpMpIdPreview = updateErpMpIdPreview;
window.handleErpDiagramDragStart = handleErpDiagramDragStart;
window.handleErpDiagramDragOver = handleErpDiagramDragOver;
window.handleErpDiagramDragLeave = handleErpDiagramDragLeave;
window.handleErpDiagramDrop = handleErpDiagramDrop;
window.updateErpDiagramRowField = updateErpDiagramRowField;
window.updateErpDiagramRowProvider = updateErpDiagramRowProvider;
window.updateErpDiagramRowGroupProvider = updateErpDiagramRowGroupProvider;
window.updateErpDiagramRowMpCategory = updateErpDiagramRowMpCategory;
window.updateErpDiagramRowMpMaterial = updateErpDiagramRowMpMaterial;
window.focusErpDiagramRowById = focusErpDiagramRowById;
window.togglePlmVersionSelectionBranch = togglePlmVersionSelectionBranch;
window.togglePlmVersionHierarchySelection = togglePlmVersionHierarchySelection;
window.togglePlmVersionItemSelection = togglePlmVersionItemSelection;
window.createPlmVersionFromSelection = createPlmVersionFromSelection;
window.usePlmVersion = usePlmVersion;
window.openPlmVersionActions = openPlmVersionActions;
window.openSelectedVersionBitacora = openSelectedVersionBitacora;
window.openSelectedVersionBom = openSelectedVersionBom;
window.openSelectedVersionValues = openSelectedVersionValues;
window.getPlmNavigationState = getPlmNavigationState;
window.openPlmVersionBitacoraRecordModal = openPlmVersionBitacoraRecordModal;
window.closePlmVersionBitacoraRecordModal = closePlmVersionBitacoraRecordModal;
window.confirmPlmVersionBitacoraRecord = confirmPlmVersionBitacoraRecord;
window.printPlmValuesReport = printPlmValuesReport;
window.printPlmBomGraphReport = printPlmBomGraphReport;
window.printPlmVersionComparisonReport = printPlmVersionComparisonReport;
window.openMasterBomFromPlm = openMasterBomFromPlm;
window.handlePlmVersionPrimaryAction = handlePlmVersionPrimaryAction;
window.closePlmVersionMetaModal = closePlmVersionMetaModal;
window.confirmPlmVersionMeta = confirmPlmVersionMeta;
window.openPlmWorkspaceCard = openPlmWorkspaceCard;
window.openProjectWorkspace = openProjectWorkspace;
window.openPlmItemModal = openPlmItemModal;
window.closePlmItemModal = closePlmItemModal;
window.handlePlmItemModalBackdrop = handlePlmItemModalBackdrop;
window.openPlmBuloneriaModal = openPlmBuloneriaModal;
window.closePlmBuloneriaModal = closePlmBuloneriaModal;
window.handlePlmBuloneriaModalBackdrop = handlePlmBuloneriaModalBackdrop;
window.setPlmBuloneriaCategory = setPlmBuloneriaCategory;
window.updatePlmBuloneriaSearch = updatePlmBuloneriaSearch;
window.togglePlmBuloneriaItemSelection = togglePlmBuloneriaItemSelection;
window.insertSelectedBuloneriaToPlm = insertSelectedBuloneriaToPlm;
window.validatePlmItemCodeInput = validatePlmItemCodeInput;
window.addPlmItem = addPlmItem;
window.deleteCurrentPlmItem = deleteCurrentPlmItem;
window.startPlmItemEdit = startPlmItemEdit;
window.openPlmFileShortcut = openPlmFileShortcut;
window.triggerPlmFilePicker = triggerPlmFilePicker;
window.updatePlmFileButtonState = updatePlmFileButtonState;
window.removePlmItem = removePlmItem;
window.connectSelectedBomNodes = connectSelectedBomNodes;
window.clearBomSelection = clearBomSelection;
window.autoArrangeBomNodes = autoArrangeBomNodes;
window.toggleBomEditMode = toggleBomEditMode;
window.removeBomEdge = removeBomEdge;
window.updateBomEdgeQuantity = updateBomEdgeQuantity;
window.focusBomNodeById = focusBomNodeById;
window.toggleBomSpecialMode = toggleBomSpecialMode;
window.updateBomSpecialQuantity = updateBomSpecialQuantity;
window.updateBomVariantSelection = updateBomVariantSelection;
window.toggleGraphMaximize = toggleGraphMaximize;
window.addErpItem = addErpItem;
window.removeErpItem = removeErpItem;
window.addCpqItem = addCpqItem;
window.removeCpqItem = removeCpqItem;
window.recalculateQuote = recalculateQuote;
window.saveProjectWorkspace = saveProjectWorkspace;
window.showAddProjectModal = showAddProjectModal;
window.closeAddProjectModal = closeAddProjectModal;
window.confirmAddProject = confirmAddProject;
window.showAddSolidModal = showAddSolidModal;
window.closeAddSolidModal = closeAddSolidModal;
window.confirmAddSolid = confirmAddSolid;
window.handleSolidFileSelect = handleSolidFileSelect;
window.clearSolidFile = clearSolidFile;
window.viewSolidFile = viewSolidFile;
window.filterProjects = filterProjects;
window.filterSolids = filterSolids;







