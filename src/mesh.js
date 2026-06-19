// ============================================================================
// mesh.js — Classe Mesh
// Recebe a geometria gerada em geometry.js, sobe os buffers (posicao, normal,
// UV e indices) para a GPU e organiza tudo num VAO (Vertex Array Object). Assim,
// desenhar vira apenas: bind do VAO + drawElements.
// As "location" dos atributos sao fixas (0,1,2) e batem com o phong.vert.
// ============================================================================

// Locais dos atributos — devem coincidir com os layout(location=...) do shader.
const ATTRIB_POSITION = 0;
const ATTRIB_NORMAL = 1;
const ATTRIB_UV = 2;

export class Mesh {
    /**
     * @param {WebGL2RenderingContext} gl
     * @param {{positions:Float32Array, normals:Float32Array, uvs:Float32Array, indices:(Uint16Array|Uint32Array)}} geometry
     */
    constructor(gl, geometry) {
        this.gl = gl;

        // O VAO guarda toda a configuracao de atributos -> um bind e desenhamos.
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Cada atributo vira um VBO separado (layout simples e legivel).
        this._createAttribute(geometry.positions, ATTRIB_POSITION, 3);
        this._createAttribute(geometry.normals, ATTRIB_NORMAL, 3);
        this._createAttribute(geometry.uvs, ATTRIB_UV, 2);

        // Buffer de indices (EBO).
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

        this.indexCount = geometry.indices.length;
        // Suporta indices de 16 ou 32 bits automaticamente.
        this.indexType = geometry.indices instanceof Uint32Array
            ? gl.UNSIGNED_INT
            : gl.UNSIGNED_SHORT;

        // Encerra o VAO para nao alterarmos seu estado sem querer depois.
        gl.bindVertexArray(null);
    }

    /**
     * Cria um VBO, envia os dados e habilita o atributo no VAO corrente.
     * @param {Float32Array} data
     * @param {number} location indice do atributo (bate com o shader)
     * @param {number} size componentes por vertice (3 = xyz, 2 = uv)
     */
    _createAttribute(data, location, size) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    }

    /** Desenha a malha (assume que o programa/uniforms ja foram configurados). */
    draw() {
        const gl = this.gl;
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);
        gl.bindVertexArray(null);
    }
}
