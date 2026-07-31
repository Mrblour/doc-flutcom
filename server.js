const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

const startTime = performance.now();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. OBTENER INFORMACIÓN DEL FRAMEWORK
// ==========================================
function getFrameworkInfo() {
    let version = '1.0.0';
    let name = 'flutcom';
    try {
        const configPath = path.join(process.cwd(), 'flutcom.config.js');
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            const versionMatch = content.match(/version\s*:\s*["']([^"']+)["']/);
            const nameMatch = content.match(/nombre\s*:\s*["']([^"']+)["']/);
            if (versionMatch) version = versionMatch[1];
            if (nameMatch) name = nameMatch[1].toLowerCase();
        }
    } catch (e) {}
    return { name, version };
}

// ==========================================
// 2. OBTENER IP DE RED LOCAL
// ==========================================
function getNetworkIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Ignorar IPv6 y localhost (127.0.0.1)
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
}

// ==========================================
// 3. LOGICA SEGURA DEL SERVIDOR
// ==========================================
const mimeTypes = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff': 'font/woff',
    '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf'
};

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const decodedPath = decodeURIComponent(parsedUrl.pathname);
    const basePath = process.cwd();
    let filePath = path.join(basePath, decodedPath);

    console.log(`[REQ] ${req.method} ${req.url}`);

    // 🔒 PARCHE DE SEGURIDAD IMPORTANTÍSIMO: Evitar "Directory Traversal"
    // Usar path.relative para evitar problemas de mayúsculas/minúsculas en Windows
    const relativePath = path.relative(basePath, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        console.log(`[403] Forbidden: ${filePath}`);
        res.writeHead(403);
        res.end('403 - Forbidden');
        return;
    }

    if (decodedPath === '/') {
        filePath = path.join(basePath, 'index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`[404] Not Found: ${filePath}`);
                res.writeHead(404);
                res.end('404 - Not Found');
            } else {
                console.log(`[500] Error ${error.code}: ${filePath}`);
                res.writeHead(500);
                res.end(`500 - Server Error: ${error.code}`);
            }
        } else {
            console.log(`[200] OK: ${filePath}`);
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Content-Length': content.length 
            });
            res.end(content);
        }
    });
});

// ==========================================
// 4. INICIO Y CONSOLA ESTILO ASTRO
// ==========================================
server.listen(PORT, '0.0.0.0', () => {
    const { name, version } = getFrameworkInfo();
    const networkIp = getNetworkIp();
    const startupTime = Math.round(performance.now() - startTime);

    // Colores ANSI
    const reset = "\x1b[0m";
    const green = "\x1b[32m";
    const dim = "\x1b[90m";
    const cyan = "\x1b[36m";
    const bold = "\x1b[1m";

    console.log();
    console.log(`  🚀  ${green}${bold}${name}${reset}  ${green}v${version}${reset} ${dim}started in ${startupTime}ms${reset}`);
    console.log();
    console.log(`  ${dim}┃${reset} Local    ${cyan}http://localhost:${PORT}/${reset}`);
    if (networkIp) {
        console.log(`  ${dim}┃${reset} Network  ${cyan}http://${networkIp}:${PORT}/${reset}`);
    } else {
        console.log(`  ${dim}┃${reset} Network  ${dim}use --host to expose${reset}`);
    }
    console.log();
});
