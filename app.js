let connection = null;
let attempts = 0;

async function startApp() {
    const btn = document.getElementById('runCheck');
    const status = document.getElementById('status-bar');

    // Sjekk om TrimbleConnectWorkspace eksisterer, hvis ikke vent 500ms og prøv igjen
    if (typeof TrimbleConnectWorkspace === 'undefined') {
        attempts++;
        if (attempts < 10) {
            status.innerText = `Leter etter SDK (forsøk ${attempts})...`;
            setTimeout(startApp, 500);
        } else {
            status.innerText = "Feil: Kunne ikke laste Trimble SDK. Sjekk internett.";
            status.style.color = "red";
        }
        return;
    }

    try {
        status.innerText = "Kobler til Trimble Connect...";
        connection = await TrimbleConnectWorkspace.connect();
        status.innerText = "Klar til bruk!";
        btn.disabled = false;
        btn.innerText = "Start ny kontroll";
    } catch (e) {
        status.innerText = "Tilkobling feilet: " + e.message;
    }
}

document.getElementById('runCheck').addEventListener('click', async () => {
    const workspace = connection.ui.workspace;
    const eyeOffset = parseFloat(document.getElementById('eyeHeight').value) || 0;
    const objOffset = parseFloat(document.getElementById('objHeight').value) || 0;

    try {
        // Punkt A
        const pickA = await workspace.pickPosition();
        if (!pickA) return;
        const start = { x: pickA.x, y: pickA.y, z: pickA.z + eyeOffset };

        // Punkt B
        const pickB = await workspace.pickPosition();
        if (!pickB) return;
        const end = { x: pickB.x, y: pickB.y, z: pickB.z + objOffset };

        // Raycast
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dz = end.z - start.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const dir = { x: dx/dist, y: dy/dist, z: dz/dist };

        const hit = await workspace.raycast({ origin: start, direction: dir, maxDistance: dist });
        const isBlocked = hit && hit.distance < (dist - 0.1);

        // Tegn
        await workspace.addGraphicPrimitives([{
            type: 'line',
            start: start,
            end: isBlocked ? hit.position : end,
            color: isBlocked ? { r: 255, g: 0, b: 0, a: 1 } : { r: 0, g: 255, b: 0, a: 1 },
            width: 5
        }]);

        const res = document.getElementById('resultBox');
        res.style.display = "block";
        res.className = isBlocked ? "result fail" : "result ok";
        res.innerText = isBlocked ? "HINDRET SIKT" : "FRI SIKT";

    } catch (err) {
        console.error(err);
    }
});

// Start loopen
startApp();
