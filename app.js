let connection = null;

/**
 * Initialiserer tilkoblingen til Trimble Connect
 */
async function initializeExtension() {
    const statusEl = document.getElementById('status');
    const buttonEl = document.getElementById('runCheck');

    if (typeof TrimbleConnectWorkspace === 'undefined') {
        statusEl.innerText = "Status: Feil - SDK ikke funnet!";
        statusEl.style.color = "red";
        return;
    }

    try {
        // Oppretter kontakt med Trimble Connect
        connection = await TrimbleConnectWorkspace.connect();
        
        statusEl.innerText = "Status: Koblet til Trimble Connect";
        buttonEl.disabled = false;
        buttonEl.innerText = "Start ny kontroll";
        console.log("Utvidelse er klar.");
    } catch (error) {
        statusEl.innerText = "Status: Tilkobling feilet";
        console.error("Initialisering feilet:", error);
    }
}

/**
 * Hovedfunksjon for siktkontroll
 */
async function performSightCheck() {
    const workspace = connection.ui.workspace;
    const resBox = document.getElementById('resultBox');
    
    resBox.style.display = "none";
    
    try {
        // 1. Hent verdier fra UI
        const eyeOffset = parseFloat(document.getElementById('eyeHeight').value) || 0;
        const objOffset = parseFloat(document.getElementById('objHeight').value) || 0;

        // 2. Plukk Startpunkt (Observatør)
        // Trimble Connect setter automatisk vieweren i "pick mode"
        const pickA = await workspace.pickPosition();
        if (!pickA) return;

        const start = { 
            x: pickA.x, 
            y: pickA.y, 
            z: pickA.z + eyeOffset 
        };

        // 3. Plukk Sluttpunkt (Mål)
        const pickB = await workspace.pickPosition();
        if (!pickB) return;

        const end = { 
            x: pickB.x, 
            y: pickB.y, 
            z: pickB.z + objOffset 
        };

        // 4. Beregn avstand og retning
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dz = end.z - start.z;
        const totalDist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const direction = { x: dx/totalDist, y: dy/totalDist, z: dz/totalDist };

        // 5. Kjør kollisjonstest (Raycast)
        const hit = await workspace.raycast({
            origin: start,
            direction: direction,
            maxDistance: totalDist
        });

        // Sjekk om vi traff noe før vi nådde målet (med 10cm margin)
        const isBlocked = hit && hit.distance < (totalDist - 0.1);
        
        // 6. Visualisering
        const lineColor = isBlocked ? { r: 255, g: 0, b: 0, a: 1 } : { r: 0, g: 255, b: 0, a: 1 };
        
        await workspace.addGraphicPrimitives([
            {
                type: 'line',
                start: start,
                end: isBlocked ? hit.position : end,
                color: lineColor,
                width: 4
            }
        ]);

        // 7. Vis resultat i panelet
        resBox.style.display = "block";
        if (isBlocked) {
            resBox.className = "result fail";
            resBox.innerText = `SIKT HINDRET!\nTreffpunkt etter ${hit.distance.toFixed(2)}m`;
        } else {
            resBox.className = "result ok";
            resBox.innerText = `FRI SIKT!\nLengde: ${totalDist.toFixed(2)}m`;
        }

    } catch (err) {
        console.error("Feil under utførelse:", err);
        alert("Det oppstod en feil under plukking av punkt. Sjekk konsollen.");
    }
}

// Start initialisering
initializeExtension();

// Lytt etter klikk på knappen
document.getElementById('runCheck').addEventListener('click', performSightCheck);
