let connection;

/**
 * Initialiserer koblingen til Trimble Connect med en gang utvidelsen laster.
 */
async function initialize() {
    try {
        connection = await TrimbleConnectWorkspace.connect();
        console.log("Trimble Connect Extension initialized");
    } catch (error) {
        console.error("Kunne ikke koble til Trimble Connect:", error);
    }
}

initialize();

document.getElementById('runCheck').addEventListener('click', async () => {
    if (!connection) {
        alert("Utvidelsen er ikke koblet til 3D-vieweren ennå.");
        return;
    }

    const workspace = connection.ui.workspace;

    // Hent verdier fra input-feltene
    const eyeOffset = parseFloat(document.getElementById('eyeHeight').value) || 0;
    const objOffset = parseFloat(document.getElementById('objHeight').value) || 0;

    try {
        // 1. Be brukeren velge startpunkt (Observatør)
        // pickPosition returnerer {x, y, z} i modell-koordinater
        const pickA = await workspace.pickPosition();
        if (!pickA) return; // Bruker avbrøt

        // Juster høyden kun hvis offset er definert (> 0)
        const start = { 
            x: pickA.x, 
            y: pickA.y, 
            z: eyeOffset > 0 ? pickA.z + eyeOffset : pickA.z 
        };

        // 2. Be brukeren velge sluttpunkt (Objekt/Skilt)
        const pickB = await workspace.pickPosition();
        if (!pickB) return;

        // Juster høyden kun hvis offset er definert (> 0)
        const end = { 
            x: pickB.x, 
            y: pickB.y, 
            z: objOffset > 0 ? pickB.z + objOffset : pickB.z 
        };

        // 3. Beregn retning og total distanse
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dz = end.z - start.z;
        const totalDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const direction = { x: dx / totalDistance, y: dy / totalDistance, z: dz / totalDistance };

        // 4. Utfør Raycast (Sjekk for hindringer)
        // Vi sjekker om strålen treffer noe før den når frem til punkt B
        const raycastResult = await workspace.raycast({
            origin: start,
            direction: direction,
            maxDistance: totalDistance
        });

        // 5. Visualisering
        // Vi bruker en liten toleranse (0.05m) for å unngå at den treffer selve målpunktet
        const isBlocked = raycastResult && raycastResult.distance < (totalDistance - 0.05);
        const lineColor = isBlocked ? { r: 255, g: 0, b: 0, a: 1 } : { r: 0, g: 255, b: 0, a: 1 };

        await workspace.addGraphicPrimitives([
            {
                type: 'line',
                start: start,
                end: isBlocked ? raycastResult.position : end,
                color: lineColor,
                width: 5
            }
        ]);

        // 6. Oppdater UI med status
        const resBox = document.getElementById('resultBox');
        resBox.style.display = 'block';
        resBox.className = isBlocked ? 'result fail' : 'result ok';
        resBox.innerText = isBlocked 
            ? `Sikt hindret etter ${raycastResult.distance.toFixed(2)}m` 
            : `Fri sikt bekreftet (${totalDistance.toFixed(2)}m)`;

    } catch (err) {
        console.error("Feil under siktkontroll:", err);
    }
});
