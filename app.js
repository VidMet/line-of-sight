let connection;
let workspace;

// Initialiser kobling til Trimble Connect
window.onclick = async () => {
    if (!connection) {
        connection = await TrimbleConnectWorkspace.connect();
        workspace = connection.ui.workspace;
        console.log("Koblet til Trimble Connect");
    }
};

document.getElementById('runCheck').addEventListener('click', async () => {
    const eyeOffset = parseFloat(document.getElementById('eyeHeight').value);
    const objOffset = parseFloat(document.getElementById('objHeight').value);

    // 1. Be brukeren velge to punkter
    // Merk: pickPositions er en forenklet fremstilling av API-flyten
    const posA = await workspace.pickPosition({ prompt: "Klikk på observatørpunkt" });
    const posB = await workspace.pickPosition({ prompt: "Klikk på objektet (skiltet)" });

    if (posA && posB) {
        // Juster høyder
        const start = { x: posA.x, y: posA.y, z: posA.z + eyeOffset };
        const end = { x: posB.x, y: posB.y, z: posB.z + objOffset };

        // 2. Beregn retning og distanse
        const direction = {
            x: end.x - start.x,
            y: end.y - start.y,
            z: end.z - start.z
        };
        const distance = Math.sqrt(direction.x**2 + direction.y**2 + direction.z**2);

        // 3. Utfør Raycast (Kollisjonssjekk)
        const raycastResult = await workspace.raycast({
            origin: start,
            direction: direction,
            maxDistance: distance
        });

        // 4. Konklusjon og Visualisering
        let isBlocked = raycastResult && raycastResult.distance < (distance - 0.1);
        let color = isBlocked ? { r: 255, g: 0, b: 0, a: 1 } : { r: 0, g: 255, b: 0, a: 1 };

        // Tegn linjen i 3D-visningen
        await workspace.addGraphicPrimitives([
            {
                type: 'line',
                start: start,
                end: isBlocked ? raycastResult.position : end,
                color: color,
                width: 3
            }
        ]);

        // Oppdater UI
        const resBox = document.getElementById('resultBox');
        resBox.style.display = 'block';
        resBox.className = isBlocked ? 'result fail' : 'result ok';
        resBox.innerText = isBlocked ? `Sikt hindret etter ${raycastResult.distance.toFixed(2)}m` : "Fri sikt bekreftet!";
    }
});