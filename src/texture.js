// ============================================================================
// texture.js — Carregamento de TEXTURAS (assincrono)
// loadTexture() devolve um WebGLTexture NA HORA, ja utilizavel, com um pixel
// placeholder 1x1; quando a imagem termina de baixar, ela e enviada a GPU
// (com flipY e mipmaps). Se a imagem falhar, geramos uma textura procedural
// (xadrez) escrevendo os pixels direto num Uint8Array — sem usar API 2D de canvas.
// ============================================================================

/**
 * Cria uma textura a partir de dados crus (Uint8Array RGBA). Usada para o
 * placeholder e para o fallback procedural.
 */
function createDataTexture(gl, width, height, data, repeat = true) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
}

/** Gera os pixels de um padrao xadrez (fallback) num Uint8Array RGBA. */
function checkerPixels(size = 64, squares = 8, colorA = [200, 80, 200], colorB = [40, 40, 60]) {
    const data = new Uint8Array(size * size * 4);
    const cell = size / squares;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const isA = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0;
            const c = isA ? colorA : colorB;
            const i = (y * size + x) * 4;
            data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
        }
    }
    return data;
}

/**
 * Carrega uma textura de imagem de forma assincrona.
 * @param {WebGL2RenderingContext} gl
 * @param {string} url caminho da imagem
 * @param {{repeat?:boolean}} options
 * @returns {WebGLTexture} textura utilizavel imediatamente (com placeholder)
 */
export function loadTexture(gl, url, options = {}) {
    const repeat = options.repeat !== false;

    // Placeholder 1x1 (cinza) para a textura ja poder ser usada antes do download.
    const tex = createDataTexture(gl, 1, 1, new Uint8Array([160, 160, 160, 255]), repeat);

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        // WebGL le imagens com a origem no canto oposto ao do HTML; flipY corrige.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); // restaura o estado global

        const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
        // Mipmaps deixam texturas distantes (ex.: o chao) suaves e sem cintilacao.
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.onerror = () => {
        // Falhou (ex.: arquivo ausente) -> textura procedural xadrez bem visivel.
        console.warn(`Textura "${url}" nao carregou; usando fallback procedural.`);
        const size = 64;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, checkerPixels(size));
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    };
    image.src = url;

    return tex;
}
