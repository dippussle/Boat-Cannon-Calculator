// Boat Cannon Calculator - Lazy Chunk Stacked Boats (2D Mode)

// Constants
// MOTION_PER_BOAT derived empirically from in-game entity telemetry (324 blocks / (98t * 80b))
const MOTION_PER_BOAT = 0.0413265304548704;

// DOM Elements
const originXInput = document.getElementById("origin-x");
const originZInput = document.getElementById("origin-z");
const targetXInput = document.getElementById("target-x");
const targetZInput = document.getElementById("target-z");

const maxBoatStackInput = document.getElementById("max-boat-stack");
const maxTicksInput = document.getElementById("max-ticks");
const cannonDelayInput = document.getElementById("cannon-delay");
const powderSnowVersionInput = document.getElementById("powder-snow-version");

const btnCalculate = document.getElementById("btn-calculate");

const solverTbody = document.getElementById("solver-tbody");
const resultsCount = document.getElementById("results-count");

const tpCommandText = document.getElementById("tp-command");
const btnCopyCommand = document.getElementById("btn-copy-command");

// State
let solverResults = [];
let selectedResult = null;

// Listeners
btnCalculate.addEventListener("click", runSolver);

btnCopyCommand.addEventListener("click", () => {
  if (!selectedResult) return;
  const cmd = tpCommandText.textContent.trim();
  
  navigator.clipboard.writeText(cmd).then(() => {
    const originalText = btnCopyCommand.textContent;
    btnCopyCommand.textContent = "Copied!";
    btnCopyCommand.style.background = "var(--color-success)";
    btnCopyCommand.style.color = "#fff";
    setTimeout(() => {
      btnCopyCommand.textContent = originalText;
      btnCopyCommand.style.background = "";
      btnCopyCommand.style.color = "";
    }, 1500);
  });
});

// Math helper
function calculateDistance2D(p1, p2) {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  return Math.sqrt(dx*dx + dz*dz);
}

// Solver logic
function runSolver() {
  const originX = parseFloat(originXInput.value) || 0;
  const originZ = parseFloat(originZInput.value) || 0;
  const targetX = parseFloat(targetXInput.value) || 0;
  const targetZ = parseFloat(targetZInput.value) || 0;
  
  const origin = [originX, originZ];
  const target = [targetX, targetZ];
  
  const maxBoatStack = parseInt(maxBoatStackInput.value, 10) || 50;
  const maxTicks = parseInt(maxTicksInput.value, 10) || 200;
  const cannonDelay = parseInt(cannonDelayInput.value, 10) || 0;
  const powderSnowMult = parseFloat(powderSnowVersionInput.value) || 0.95;
  
  // Base motion per boat without snow factor = 0.0413265304548704 / 0.95
  const effectiveMotion = (0.0413265304548704 / 0.95) * powderSnowMult;
  
  const dx = target[0] - origin[0];
  const dz = target[1] - origin[1];
  const dxAbs = Math.abs(dx);
  const dzAbs = Math.abs(dz);
  
  const dist = calculateDistance2D(origin, target);
  if (dist === 0) {
    alert("Origin and Target cannot be at the exact same location.");
    return;
  }
  
  solverResults = [];
  
  // Loop ticks from 1 to maxTicks
  for (let t = 1; t <= maxTicks; t++) {
    const effectiveTicks = t + cannonDelay;
    if (effectiveTicks <= 0) continue;
    
    const bxIdeal = dxAbs / (effectiveTicks * effectiveMotion);
    const bzIdeal = dzAbs / (effectiveTicks * effectiveMotion);
    
    // Check floor and ceiling integers for boat counts
    const bxCandidates = new Set([
      Math.max(0, Math.min(maxBoatStack, Math.floor(bxIdeal))),
      Math.max(0, Math.min(maxBoatStack, Math.ceil(bxIdeal)))
    ]);
    
    const bzCandidates = new Set([
      Math.max(0, Math.min(maxBoatStack, Math.floor(bzIdeal))),
      Math.max(0, Math.min(maxBoatStack, Math.ceil(bzIdeal)))
    ]);
    
    for (const bx of bxCandidates) {
      for (const bz of bzCandidates) {
        if (bx === 0 && bz === 0) continue;
        
        const vx = effectiveTicks * bx * effectiveMotion * (dx >= 0 ? 1 : -1);
        const vz = effectiveTicks * bz * effectiveMotion * (dz >= 0 ? 1 : -1);
        
        const landingPos = [origin[0] + vx, origin[1] + vz];
        const error = calculateDistance2D(landingPos, target);
        
        const launchDist = calculateDistance2D(origin, target);
        const landDist = calculateDistance2D(origin, landingPos);
        let statusText = "Exact";
        let statusClass = "exact";
        
        if (Math.abs(landDist - launchDist) > 0.1) {
          if (landDist > launchDist) {
            statusText = "Overshoot";
            statusClass = "overshoot";
          } else {
            statusText = "Undershoot";
            statusClass = "undershoot";
          }
        }
        
        solverResults.push({
          ticks: effectiveTicks,
          bx: bx,
          bz: bz,
          origin: origin,
          landingPos: landingPos,
          error: error,
          status: statusText,
          statusClass: statusClass,
          target: target
        });
      }
    }
  }
  
  // Sort by error ascending
  solverResults.sort((a, b) => a.error - b.error);
  
  // Deduplicate results
  const seen = new Set();
  solverResults = solverResults.filter(res => {
    const key = `${res.ticks}_${res.bx}_${res.bz}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  solverResults = solverResults.slice(0, 10);
  
  renderSolverTable();
  
  if (solverResults.length > 0) {
    selectResult(0);
  }
}

// Render solver solutions inside HTML table
function renderSolverTable() {
  solverTbody.innerHTML = "";
  resultsCount.textContent = `${solverResults.length} solutions`;
  
  if (solverResults.length === 0) {
    solverTbody.innerHTML = `<tr><td colspan="6" class="table-placeholder">No solutions found. Try adjusting parameters.</td></tr>`;
    return;
  }
  
  solverResults.forEach((res, idx) => {
    const tr = document.createElement("tr");
    if (selectedResult && selectedResult.ticks === res.ticks && selectedResult.bx === res.bx && selectedResult.bz === res.bz) {
      tr.classList.add("selected");
    }
    
    const posStr = `(${res.landingPos[0].toFixed(1)}, ${res.landingPos[1].toFixed(1)})`;
    
    tr.innerHTML = `
      <td><strong>${res.ticks}</strong></td>
      <td>${res.bx}</td>
      <td>${res.bz}</td>
      <td>${posStr}</td>
      <td class="${res.error < 1 ? 'text-success' : 'text-warning'}">${res.error.toFixed(2)}m</td>
      <td><span class="status-pill ${res.statusClass}">${res.status}</span></td>
    `;
    
    tr.addEventListener("click", () => selectResult(idx));
    solverTbody.appendChild(tr);
  });
}

// Set selected configuration and update teleport command
function selectResult(index) {
  selectedResult = solverResults[index];
  
  const rows = solverTbody.querySelectorAll("tr");
  rows.forEach((row, rIdx) => {
    if (rIdx === index) {
      row.classList.add("selected");
    } else {
      row.classList.remove("selected");
    }
  });
  
  const x = selectedResult.landingPos[0].toFixed(2);
  const z = selectedResult.landingPos[1].toFixed(2);
  tpCommandText.textContent = `/tp @p ${x} ~ ${z}`;
}
