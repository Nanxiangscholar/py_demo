// ==================== API 配置 ====================
// 后端 API 地址（Python FastAPI 运行在 8008 端口）
const API_BASE = 'http://127.0.0.1:8008/api';

// 统一错误处理函数
async function handleResponse(res) {
    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMessage = errorData?.detail || res.statusText || '请求失败';
        throw new Error(errorMessage);
    }
    return res.json();
}

// ==================== API 调用函数 ====================
const api = {
    // 设施相关
    getFacilities: async (type = '') => {
        const url = type ? `${API_BASE}/facilities?facility_type=${type}` : `${API_BASE}/facilities`;
        const res = await fetch(url);
        return handleResponse(res);
    },

    getFacilityTree: async () => {
        const res = await fetch(`${API_BASE}/facilities/tree?include_metrics=true`);
        return handleResponse(res);
    },

    getFacility: async (id) => {
        const res = await fetch(`${API_BASE}/facilities/${id}`);
        return handleResponse(res);
    },

    createFacility: async (data) => {
        const res = await fetch(`${API_BASE}/facilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    updateFacility: async (id, data) => {
        const res = await fetch(`${API_BASE}/facilities/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    deleteFacility: async (id) => {
        const res = await fetch(`${API_BASE}/facilities/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            const errorMessage = errorData?.detail || res.statusText || '删除失败';
            throw new Error(errorMessage);
        }
        return true;
    },

    // 指标相关
    getMetrics: async () => {
        const res = await fetch(`${API_BASE}/metrics`);
        return handleResponse(res);
    },

    getFacilityMetrics: async (facilityId) => {
        const res = await fetch(`${API_BASE}/metrics/facility/${facilityId}`);
        return handleResponse(res);
    },

    getMetric: async (id) => {
        const res = await fetch(`${API_BASE}/metrics/${id}`);
        return handleResponse(res);
    },

    createMetric: async (data) => {
        const res = await fetch(`${API_BASE}/metrics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    updateMetric: async (id, data) => {
        const res = await fetch(`${API_BASE}/metrics/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    deleteMetric: async (id) => {
        const res = await fetch(`${API_BASE}/metrics/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            const errorMessage = errorData?.detail || res.statusText || '删除失败';
            throw new Error(errorMessage);
        }
        return true;
    },

    // 指标值相关
    createMetricValue: async (data) => {
        const res = await fetch(`${API_BASE}/metrics/values`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse(res);
    },

    getMetricValues: async (metricId, limit = 100) => {
        const res = await fetch(`${API_BASE}/metrics/${metricId}/values?limit=${limit}`);
        return handleResponse(res);
    },

    getLatestMetricValue: async (metricId) => {
        const res = await fetch(`${API_BASE}/metrics/${metricId}/values/latest`);
        if (!res.ok) return null;
        return res.json();
    }
};

// ==================== 全局状态 ====================
let facilities = [];
let facilityTree = [];
let currentMetricId = null;
let currentMetric = null;
let deleteCallback = null;

// ==================== 工具函数 ====================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function shortId(id) {
    return id.substring(0, 8) + '...';
}

function formatType(type) {
    const types = {
        datacenter: '数据中心',
        room: '房间',
        sensor: '传感器'
    };
    return types[type] || type;
}

// ==================== 面板切换 ====================
function showPanel(panelName) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`${panelName}-panel`).classList.add('active');
    document.querySelector(`[data-tab="${panelName}"]`)?.classList.add('active');
}

// ==================== 树形视图渲染 ====================
function renderTree() {
    const container = document.getElementById('facility-tree');
    if (!facilityTree || facilityTree.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🏢</div><p>暂无设施数据</p></div>';
        return;
    }

    container.innerHTML = facilityTree.map(node => renderTreeNode(node, 0)).join('');
    bindTreeEvents();
}

function renderTreeNode(node, depth) {
    const hasChildren = node.children && node.children.length > 0;
    const hasMetrics = node.metrics && node.metrics.length > 0;

    let html = `
        <div class="tree-node" data-id="${node.id}">
            <div class="tree-node-header">
                <div class="tree-node-title">
                    <button class="tree-toggle ${hasChildren ? '' : 'leaf'}">
                        ${hasChildren ? '▶' : '•'}
                    </button>
                    <span class="tree-name">${node.name}</span>
                    <span class="tree-type ${node.facility_type}">${formatType(node.facility_type)}</span>
                </div>
                <div class="tree-actions">
                    <button class="btn btn-sm btn-secondary edit-facility" data-id="${node.id}">编辑</button>
                    <button class="btn btn-sm btn-danger delete-facility" data-id="${node.id}">删除</button>
                </div>
            </div>
            ${hasMetrics ? `
                <div class="tree-metrics">
                    ${node.metrics.map(m => `<span class="tree-metric" data-metric-id="${m.id}">${m.name} (${m.unit || '-'})</span>`).join('')}
                </div>
            ` : ''}
            ${hasChildren ? `
                <div class="tree-children">
                    ${node.children.map(child => renderTreeNode(child, depth + 1)).join('')}
                </div>
            ` : ''}
        </div>
    `;

    return html;
}

function bindTreeEvents() {
    // 展开/收起
    document.querySelectorAll('.tree-toggle:not(.leaf)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            btn.classList.toggle('expanded');
            const children = btn.closest('.tree-node').querySelector('.tree-children');
            children?.classList.toggle('show');
        });
    });

    // 点击指标查看历史数据
    document.querySelectorAll('.tree-metric').forEach(el => {
        el.addEventListener('click', () => {
            const metricId = el.dataset.metricId;
            showMetricValues(metricId);
        });
    });

    // 编辑设施
    document.querySelectorAll('.edit-facility').forEach(btn => {
        btn.addEventListener('click', () => {
            const facilityId = btn.dataset.id;
            editFacility(facilityId);
        });
    });

    // 删除设施
    document.querySelectorAll('.delete-facility').forEach(btn => {
        btn.addEventListener('click', () => {
            const facilityId = btn.dataset.id;
            confirmDelete(`确定要删除此设施吗？这将级联删除所有子设施和关联指标。`, async () => {
                try {
                    await api.deleteFacility(facilityId);
                    showToast('设施删除成功');
                    await loadFacilities();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        });
    });
}

// ==================== 设施列表渲染 ====================
function renderFacilityTable() {
    const tbody = document.getElementById('facility-tbody');
    const typeFilter = document.getElementById('facility-type-filter').value;

    let filtered = facilities;
    if (typeFilter) {
        filtered = facilities.filter(f => f.facility_type === typeFilter);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">暂无数据</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(f => {
        const parent = facilities.find(p => p.parent_id === f.id);
        return `
            <tr>
                <td><small>${shortId(f.id)}</small></td>
                <td><strong>${f.name}</strong></td>
                <td><span class="tree-type ${f.facility_type}">${formatType(f.facility_type)}</span></td>
                <td>${parent ? parent.name : '-'}</td>
                <td>${f.description || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-secondary edit-facility" data-id="${f.id}">编辑</button>
                    <button class="btn btn-sm btn-danger delete-facility" data-id="${f.id}">删除</button>
                </td>
            </tr>
        `;
    }).join('');

    // 绑定事件
    tbody.querySelectorAll('.edit-facility').forEach(btn => {
        btn.addEventListener('click', () => editFacility(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete-facility').forEach(btn => {
        btn.addEventListener('click', () => {
            confirmDelete('确定要删除此设施吗？', async () => {
                try {
                    await api.deleteFacility(btn.dataset.id);
                    showToast('设施删除成功');
                    await loadFacilities();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        });
    });
}

// ==================== 指标列表渲染 ====================
function renderMetricsTable(metrics) {
    const tbody = document.getElementById('metric-tbody');

    if (!metrics || metrics.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">该设施暂无指标</td></tr>';
        return;
    }

    tbody.innerHTML = metrics.map(m => {
        const facility = facilities.find(f => f.id === m.facility_id);
        return `
            <tr>
                <td><small>${shortId(m.id)}</small></td>
                <td><strong>${m.name}</strong></td>
                <td>${m.unit || '-'}</td>
                <td>${m.data_type}</td>
                <td>${facility?.name || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-success view-values" data-id="${m.id}">查看数据</button>
                    <button class="btn btn-sm btn-secondary edit-metric" data-id="${m.id}">编辑</button>
                    <button class="btn btn-sm btn-danger delete-metric" data-id="${m.id}">删除</button>
                </td>
            </tr>
        `;
    }).join('');

    // 绑定事件
    tbody.querySelectorAll('.view-values').forEach(btn => {
        btn.addEventListener('click', () => showMetricValues(btn.dataset.id));
    });
    tbody.querySelectorAll('.edit-metric').forEach(btn => {
        btn.addEventListener('click', () => editMetric(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete-metric').forEach(btn => {
        btn.addEventListener('click', () => {
            confirmDelete('确定要删除此指标吗？这将删除所有历史数据。', async () => {
                try {
                    await api.deleteMetric(btn.dataset.id);
                    showToast('指标删除成功');
                    const facilityId = document.getElementById('metric-facility-filter').value;
                    if (facilityId) await loadFacilityMetrics(facilityId);
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        });
    });
}

// ==================== 指标值渲染 ====================
function renderMetricValues(values) {
    const tbody = document.getElementById('metric-values-tbody');

    if (!values || values.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center">暂无历史数据</td></tr>';
        return;
    }

    tbody.innerHTML = values.map(v => `
        <tr>
            <td>${new Date(v.timestamp).toLocaleString('zh-CN')}</td>
            <td><strong>${v.value}</strong></td>
        </tr>
    `).join('');
}

// ==================== 查看指标值 ====================
async function showMetricValues(metricId) {
    try {
        currentMetricId = metricId;
        currentMetric = await api.getMetric(metricId);

        document.getElementById('metric-values-title').textContent = `${currentMetric.name} - 历史数据`;
        document.getElementById('metric-info').innerHTML = `
            <strong>指标：</strong>${currentMetric.name} |
            <strong>单位：</strong>${currentMetric.unit || '-'} |
            <strong>类型：</strong>${currentMetric.data_type}
        `;

        const values = await api.getMetricValues(metricId);
        renderMetricValues(values);

        // 切换到指标值面板
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.getElementById('metric-values-panel').classList.add('active');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================== 加载数据 ====================
async function loadFacilities() {
    try {
        facilities = await api.getFacilities();
        facilityTree = await api.getFacilityTree();
        renderTree();
        renderFacilityTable();
        updateParentOptions();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadFacilityMetrics(facilityId) {
    try {
        const metrics = await api.getFacilityMetrics(facilityId);
        renderMetricsTable(metrics);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================== 更新下拉选项 ====================
function updateParentOptions() {
    const parentSelect = document.getElementById('facility-parent');
    const metricFacilitySelect = document.getElementById('metric-facility');
    const metricFilterSelect = document.getElementById('metric-facility-filter');

    const options = facilities.map(f => `<option value="${f.id}">${f.name} (${formatType(f.facility_type)})</option>`).join('');

    parentSelect.innerHTML = '<option value="">无（根设施）</option>' + options;
    metricFacilitySelect.innerHTML = '<option value="">请选择设施</option>' + options;
    metricFilterSelect.innerHTML = '<option value="">选择设施...</option>' + options;
}

// 根据设施类型获取可用的父设施类型
function getAllowedParentTypes(childType) {
    switch (childType) {
        case 'datacenter':
            return []; // 数据中心不能有父设施
        case 'room':
            return ['datacenter']; // 房间只能属于数据中心
        case 'sensor':
            return ['room']; // 传感器只能属于房间
        default:
            return [];
    }
}

// 根据设施类型更新父设施选项
function updateParentOptionsByType(childType) {
    const parentSelect = document.getElementById('facility-parent');
    const allowedTypes = getAllowedParentTypes(childType);

    if (allowedTypes.length === 0) {
        // 数据中心：不能选择父设施
        parentSelect.innerHTML = '<option value="">数据中心必须为顶级设施</option>';
        parentSelect.disabled = true;
        parentSelect.value = '';
    } else {
        // 过滤符合类型的父设施
        const allowedFacilities = facilities.filter(f => allowedTypes.includes(f.facility_type));

        if (allowedFacilities.length === 0) {
            parentSelect.innerHTML = `<option value="">暂无可用的${formatType(allowedTypes[0])}作为父设施</option>`;
            parentSelect.disabled = true;
            parentSelect.value = '';
        } else {
            const options = allowedFacilities.map(f => `<option value="${f.id}">${f.name} (${formatType(f.facility_type)})</option>`).join('');
            parentSelect.innerHTML = '<option value="">请选择父设施</option>' + options;
            parentSelect.disabled = false;
        }
    }
}

// ==================== 设施表单 ====================
function openFacilityModal(facility = null) {
    const modal = document.getElementById('facility-modal');
    const form = document.getElementById('facility-form');
    const title = document.getElementById('facility-modal-title');

    form.reset();
    document.getElementById('facility-id').value = '';

    if (facility) {
        title.textContent = '编辑设施';
        document.getElementById('facility-id').value = facility.id;
        document.getElementById('facility-name').value = facility.name;
        document.getElementById('facility-type').value = facility.facility_type;
        document.getElementById('facility-type').disabled = true;
        // 编辑模式：恢复原有的父设施选项
        updateParentOptions();
        document.getElementById('facility-parent').value = facility.parent_id || '';
        // 编辑模式下禁用父设施选择（避免破坏层级关系）
        document.getElementById('facility-parent').disabled = true;
        document.getElementById('facility-description').value = facility.description || '';
    } else {
        title.textContent = '新增设施';
        document.getElementById('facility-type').disabled = false;
        document.getElementById('facility-parent').disabled = false;
        // 根据默认选择的类型初始化父设施选项
        const initialType = document.getElementById('facility-type').value;
        updateParentOptionsByType(initialType);
    }

    modal.classList.add('show');
}

function editFacility(id) {
    const facility = facilities.find(f => f.id === id);
    if (facility) openFacilityModal(facility);
}

async function saveFacility(e) {
    e.preventDefault();

    const id = document.getElementById('facility-id').value;
    const data = {
        name: document.getElementById('facility-name').value,
        facility_type: document.getElementById('facility-type').value,
        parent_id: document.getElementById('facility-parent').value || null,
        description: document.getElementById('facility-description').value || null
    };

    try {
        if (id) {
            await api.updateFacility(id, { name: data.name, description: data.description });
            showToast('设施更新成功');
        } else {
            await api.createFacility(data);
            showToast('设施创建成功');
        }
        closeModal('facility-modal');
        await loadFacilities();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================== 指标表单 ====================
function openMetricModal(metric = null) {
    const modal = document.getElementById('metric-modal');
    const form = document.getElementById('metric-form');
    const title = document.getElementById('metric-modal-title');

    form.reset();
    document.getElementById('metric-id').value = '';

    if (metric) {
        title.textContent = '编辑指标';
        document.getElementById('metric-id').value = metric.id;
        document.getElementById('metric-name').value = metric.name;
        document.getElementById('metric-unit').value = metric.unit || '';
        document.getElementById('metric-datatype').value = metric.data_type;
        document.getElementById('metric-facility').value = metric.facility_id;
        document.getElementById('metric-facility').disabled = true;
        document.getElementById('metric-description').value = metric.description || '';
    } else {
        title.textContent = '新增指标';
        document.getElementById('metric-facility').disabled = false;
    }

    modal.classList.add('show');
}

function editMetric(id) {
    api.getMetric(id).then(metric => {
        if (metric) openMetricModal(metric);
    }).catch(err => showToast(err.message, 'error'));
}

async function saveMetric(e) {
    e.preventDefault();

    const id = document.getElementById('metric-id').value;
    const data = {
        name: document.getElementById('metric-name').value,
        unit: document.getElementById('metric-unit').value || null,
        data_type: document.getElementById('metric-datatype').value,
        facility_id: document.getElementById('metric-facility').value,
        description: document.getElementById('metric-description').value || null
    };

    try {
        if (id) {
            await api.updateMetric(id, { name: data.name, unit: data.unit, description: data.description });
            showToast('指标更新成功');
        } else {
            await api.createMetric(data);
            showToast('指标创建成功');
        }
        closeModal('metric-modal');
        await loadFacilityMetrics(data.facility_id);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================== 指标值表单 ====================
function openMetricValueModal() {
    const modal = document.getElementById('metric-value-modal');
    const form = document.getElementById('metric-value-form');

    form.reset();
    // 设置默认时间为当前时间
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('metric-value-timestamp').value = now.toISOString().slice(0, 16);

    modal.classList.add('show');
}

async function saveMetricValue(e) {
    e.preventDefault();

    const data = {
        metric_id: currentMetricId,
        value: document.getElementById('metric-value-input').value,
        timestamp: document.getElementById('metric-value-timestamp').value ? new Date(document.getElementById('metric-value-timestamp').value).toISOString() : null
    };

    try {
        await api.createMetricValue(data);
        showToast('指标值记录成功');
        closeModal('metric-value-modal');

        const values = await api.getMetricValues(currentMetricId);
        renderMetricValues(values);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ==================== 弹窗操作 ====================
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function confirmDelete(message, callback) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-message').textContent = message;
    deleteCallback = callback;
    modal.classList.add('show');
}

// ==================== 事件绑定 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 标签切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showPanel(btn.dataset.tab);
        });
    });

    // 设施操作
    document.getElementById('add-facility').addEventListener('click', () => openFacilityModal());
    document.getElementById('facility-form').addEventListener('submit', saveFacility);
    document.getElementById('refresh-facilities').addEventListener('click', loadFacilities);
    document.getElementById('facility-type-filter').addEventListener('change', renderFacilityTable);

    // 设施类型改变时更新父设施选项（仅新增时）
    document.getElementById('facility-type').addEventListener('change', (e) => {
        const facilityId = document.getElementById('facility-id').value;
        // 只有在新增模式下才动态更新父设施选项
        if (!facilityId) {
            updateParentOptionsByType(e.target.value);
        }
    });

    // 指标操作
    document.getElementById('add-metric').addEventListener('click', () => openMetricModal());
    document.getElementById('metric-form').addEventListener('submit', saveMetric);
    document.getElementById('refresh-metrics').addEventListener('click', () => {
        const facilityId = document.getElementById('metric-facility-filter').value;
        if (facilityId) loadFacilityMetrics(facilityId);
    });
    document.getElementById('metric-facility-filter').addEventListener('change', (e) => {
        if (e.target.value) loadFacilityMetrics(e.target.value);
    });

    // 指标值操作
    document.getElementById('add-metric-value').addEventListener('click', openMetricValueModal);
    document.getElementById('metric-value-form').addEventListener('submit', saveMetricValue);

    // 弹窗关闭
    document.querySelectorAll('.close, .cancel-btn').forEach(el => {
        el.addEventListener('click', () => {
            el.closest('.modal').classList.remove('show');
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    });

    // 确认删除
    document.getElementById('confirm-delete').addEventListener('click', () => {
        if (deleteCallback) deleteCallback();
        document.getElementById('confirm-modal').classList.remove('show');
        deleteCallback = null;
    });

    // 初始化加载数据
    loadFacilities();
});
