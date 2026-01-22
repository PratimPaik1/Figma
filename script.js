
const state = {
    elements: [],
    selected: null,
    drag: null,
    id: 0
};

const canvas = document.getElementById("canvas");
const layersList = document.getElementById("layersList");
const props = document.getElementById("properties");

/* LOCALSTORAGE */

const STORAGE_KEY = "hackdesign_state";
const THEME_KEY = "hackdesign_theme";

function saveState() {
    const dataToSave = {
        elements: state.elements,
        id: state.id
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.elements = data.elements || [];
            state.id = data.id || 0;
            state.elements.forEach(el => draw(el));
            updateLayers();
        } catch (e) {
            console.error("Error loading saved state:", e);
        }
    }
}

/* THEME TOGGLE */
function toggleTheme() {
    const canvas = document.getElementById("canvas");
    const themeBtn = document.getElementById("themeBtn");

    if (canvas.classList.contains("light-theme")) {
        canvas.classList.remove("light-theme");
        localStorage.setItem(THEME_KEY, "dark");
        themeBtn.textContent = "Dark";
    } else {
        canvas.classList.add("light-theme");
        localStorage.setItem(THEME_KEY, "light");
        themeBtn.textContent = "Light";
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
    const canvas = document.getElementById("canvas");
    const themeBtn = document.getElementById("themeBtn");

    if (savedTheme === "light") {
        canvas.classList.add("light-theme");
        themeBtn.textContent = "Light";
    } else {
        canvas.classList.remove("light-theme");
        themeBtn.textContent = "Dark";
    }
}

function clearStorage() {
    if (confirm("Are you sure you want to clear all saved designs?")) {
        localStorage.removeItem(STORAGE_KEY);
        state.elements = [];
        state.selected = null;
        state.id = 0;
        canvas.innerHTML = "";
        clearSelection();
        updateProps();
        updateLayers();
    }
}

// Load state and theme on page load
window.addEventListener("DOMContentLoaded", () => {
    loadTheme();
    loadState();
});

/* CREATE ELEMENT */
function create(type) {
    const el = {
        id: "el-" + state.id++,
        type,
        x: 50,
        y: 50,
        w: 120,
        h: 120,
        color: "#3b82f6",
        text: "Edit text"
    };
    state.elements.push(el);
    draw(el);
    select(el);
    saveState();
}

/* DRAW */
function draw(el) {
    const d = document.createElement("div");
    d.id = el.id;
    d.className = `element ${el.type}`;
    updateDOM(el, d);

    if (el.type === "text") {
        d.textContent = el.text;
        d.ondblclick = () => {
            d.contentEditable = true;
            d.focus();
        };
        d.onblur = () => {
            d.contentEditable = false;
            el.text = d.textContent;
            saveState();
        };
    }

    d.onmousedown = e => {
        startDrag(e, el);
    };
    canvas.appendChild(d);
}

/* UPDATE DOM */
function updateDOM(el, d = document.getElementById(el.id)) {
    d.style.left = el.x + "px";
    d.style.top = el.y + "px";
    d.style.width = el.w + "px";
    d.style.height = el.h + "px";

    if (el.type !== "text") {
        d.style.background = el.color;
    } else {
        d.style.color = el.color;
    }
}

/* SELECT */
function select(el) {
    clearSelection();
    state.selected = el;
    const d = document.getElementById(el.id);
    d.classList.add("selected");
    addHandles(d);
    updateProps();
    updateLayers();
}

function clearSelection() {
    document.querySelectorAll(".resize-handle").forEach(h => h.remove());
    document.querySelectorAll(".element").forEach(e => e.classList.remove("selected"));
    state.selected = null;
}

/* DRAG */
function startDrag(e, el) {
    select(el);
    state.drag = { el, x: e.clientX, y: e.clientY };
}

document.onmousemove = e => {
    if (!state.drag) return;
    const dx = e.clientX - state.drag.x;
    const dy = e.clientY - state.drag.y;
    state.drag.x = e.clientX;
    state.drag.y = e.clientY;
    state.drag.el.x += dx;
    state.drag.el.y += dy;
    updateDOM(state.drag.el);
    updateProps();
};

document.onmouseup = () => {
    if (state.drag) {
        saveState();
    }
    state.drag = null;
};

/* RESIZE HANDLES */
function addHandles(d) {
    ["nw", "ne", "sw", "se"].forEach(pos => {
        const h = document.createElement("div");
        h.className = `resize-handle ${pos}`;
        h.onmousedown = e => {
            e.stopPropagation();
            document.onmousemove = ev => {
                state.selected.w += ev.movementX;
                state.selected.h += ev.movementY;
                updateDOM(state.selected);
                updateProps();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                saveState();
            };
        };
        d.appendChild(h);
    });
}

/* PROPERTIES */
function updateProps() {
    if (!state.selected) {
        props.innerHTML = "Select an element";
        return;
    }

    props.innerHTML = `
        <h3 style="margin-bottom: 15px; color: var(--text-primary);">Color: <span id="colorCode" style="color: ${state.selected.color};">${state.selected.color}</span></h3>
        
        <label style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: block;">Position X</label>
        <input class="property-input" type="number" value="${state.selected.x}" id="px">
        
        <label style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: block;">Position Y</label>
        <input class="property-input" type="number" value="${state.selected.y}" id="py">
        
        <label style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: block;">Width</label>
        <input class="property-input" type="number" value="${state.selected.w}" id="pw">
        
        <label style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: block;">Height</label>
        <input class="property-input" type="number" value="${state.selected.h}" id="ph">

        <label style="font-size: 12px; color: var(--text-secondary); margin-top: 10px; display: block;">Element Color</label>
        <input class="property-input" type="color" id="pc" value="${state.selected.color}">
    `;

    px.oninput = () => { state.selected.x = +px.value; updateDOM(state.selected); saveState(); };
    py.oninput = () => { state.selected.y = +py.value; updateDOM(state.selected); saveState(); };
    pw.oninput = () => { state.selected.w = +pw.value; updateDOM(state.selected); saveState(); };
    ph.oninput = () => { state.selected.h = +ph.value; updateDOM(state.selected); saveState(); };
    pc.oninput = () => {
        state.selected.color = pc.value;
        const colorCode = document.getElementById("colorCode");
        colorCode.textContent = pc.value;
        colorCode.style.color = pc.value;
        updateDOM(state.selected);
        saveState();
    };
}

/* DELETE FEATURE */
function deleteSelected() {
    if (!state.selected) return;
    document.getElementById(state.selected.id).remove();
    state.elements = state.elements.filter(e => e !== state.selected);
    state.selected = null;
    props.innerHTML = "Select an element";
    updateLayers();
    saveState();
}

document.addEventListener("keydown", e => {
    if (e.key === "Delete") deleteSelected();
});

/* EXPORT FUNCTIONS */
let exportType = null;

function exportJSON() {
    exportType = "json";
    const modal = document.getElementById("exportModal");
    document.getElementById("modalTitle").textContent = "Export as JSON";
    document.getElementById("modalBody").innerHTML = `
        <p>Your design will be exported as a JSON file containing all elements and their properties.</p>
        <p><strong>Elements:</strong> ${state.elements.length}</p>
    `;
    modal.classList.add("active");
}

function exportHTML() {
    exportType = "html";
    const modal = document.getElementById("exportModal");
    document.getElementById("modalTitle").textContent = "Export as HTML";
    document.getElementById("modalBody").innerHTML = `
        <p>Your design will be exported as a standalone HTML file that displays your canvas.</p>
        <p><strong>Canvas Size:</strong> 800x600px</p>
        <p><strong>Elements:</strong> ${state.elements.length}</p>
    `;
    modal.classList.add("active");
}

function closeExportModal() {
    document.getElementById("exportModal").classList.remove("active");
    exportType = null;
}

function confirmExport() {
    if (exportType === "json") {
        downloadJSON();
    } else if (exportType === "html") {
        downloadHTML();
    }
    closeExportModal();
}

function downloadJSON() {
    const data = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        canvas: {
            width: 800,
            height: 600
        },
        elements: state.elements
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `design-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function downloadHTML() {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Exported Design</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: system-ui, sans-serif;
            background: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .canvas {
            background: white;
            width: 800px;
            height: 600px;
            position: relative;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .element {
            position: absolute;
        }

        .rectangle {
            background: #3b82f6;
        }

        .circle {
            background: #22c55e;
            border-radius: 50%;
        }

        .text {
            padding: 6px;
            color: #000;
            font-family: Arial, sans-serif;
        }

        .footer {
            margin-top: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div>
        <div class="canvas" id="canvas">
${state.elements.map(el => `            <div class="element ${el.type}" style="left: ${el.x}px; top: ${el.y}px; width: ${el.w}px; height: ${el.h}px; ${el.type !== 'text' ? `background: ${el.color}` : `color: ${el.color}`};">${el.type === 'text' ? el.text : ''}</div>`).join('\n')}
        </div>
        <div class="footer">
            <p>Exported from Layers on ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `design-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
}

/* LAYERS */
function updateLayers() {
    layersList.innerHTML = "";
    state.elements.forEach(el => {
        const l = document.createElement("div");
        l.className = "layer-item" + (state.selected === el ? " selected" : "");
        l.textContent = el.type + " (" + el.id + ")";
        l.onclick = () => select(el);
        layersList.appendChild(l);
    });
}
