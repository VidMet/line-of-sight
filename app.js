let connection = null;

// Initialiserer forbindelsen med feilhåndtering
async function init() {
    try {
        console.log("Prøver å koble til Workspace API...");
        connection = await TrimbleConnectWorkspace.connect();
        console.log("Suksess: Koblet til Trimble Connect!");
    } catch (e) {
        console.error("Tilkobling feilet:", e);
    }
}

init();

document.getElementById('runCheck').addEventListener('click', async () => {
    console.log("Knapp trykket");
    
    if (!connection) {
        console.log("Ingen tilkobling funnet, prøver på nytt...");
        await init();
    }

    const workspace = connection.ui.workspace;

    try {
        // Hent høyder
        const eyeOffset = parseFloat(document.getElementById('eyeHeight').value) || 0;
        const objOffset = parseFloat(document.getElementById('objHeight').value) || 0;

        console.log("Venter på klikk i 3D-vinduet for STARTPUNKT...");
        // Sett markøren i "plukk-modus" manuelt hvis mulig
        const pickA = await workspace.pickPosition();
        
        if (!pickA) {
            console.log("Klikk avbrutt eller ikke registrert");
            return;
        }
        console.log("Startpunkt registrert:", pickA);

        const start = { 
            x: pickA.x, 
            y: pickA.y, 
            z: pickA.z + eyeOffset 
        };

        console.log("Venter på klikk for SLUTTPUNKT...");
        const pickB = await workspace.pickPosition();
        
        if (!pickB) return;
        console.log("Sluttpunkt registrert:", pickB);

        const end = { 
            x: pickB.x, 
            y: pickB.y, 
            z: pickB.z + objOffset 
        };

        // Beregn vektor
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dz = end.z - start.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const dir = { x: dx/dist, y: dy/dist, z: dz/dist };

        console.log("Skyter stråle (Raycast)...");
        const hit = await workspace.raycast({
            origin: start,
            direction: dir,
            maxDistance: dist
        });

        const isBlocked = hit && hit.distance < (dist - 0.1);
        console.log("Resultat:", isBlocked ? "Blokkert" : "Fri sikt");

        // Tegn linjen
        await workspace.addGraphicPrimitives([
            {
                type: 'line',
                start: start,
                end: isBlocked ? hit.position : end,
                color: isBlocked ? { r: 255, g: 0, b: 0, a: 1 } : { r: 0, g: 255, b: 0, a: 1 },
                width: 5
            }
        ]);

        document.getElementById('resultBox').style.display = 'block';
        document.getElementById('resultBox').innerText = isBlocked ? "Sikt hindret!" : "Fri sikt!";

    } catch (err) {
        console.error("En feil oppstod i loopen:", err);
    }
});
