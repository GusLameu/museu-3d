#version 300 es
// ============================================================================
// phong.frag — Fragment Shader (GLSL ES 3.00)
// Iluminacao de PHONG calculada POR FRAGMENTO: ambiente + difusa + especular.
// A cor base de cada fragmento vem de uma TEXTURA (uUseTexture == 1) OU de uma
// COR SOLIDA (uColor). Objetos emissivos (o Sol) ignoram a iluminacao e brilham.
// Calcular por fragmento (e nao por vertice) deixa os reflexos especulares
// suaves e corretos mesmo em malhas de baixa resolucao.
// ============================================================================
precision highp float;

// Dados interpolados vindos do vertex shader (em espaco do mundo).
in vec3 vFragPos;
in vec3 vNormal;
in vec2 vUv;

// --- Iluminacao ---
uniform vec3  uLightPos;    // posicao da luz pontual (o Sol) no mundo
uniform vec3  uLightColor;  // cor * intensidade da luz (varia no ciclo do dia)
uniform vec3  uViewPos;     // posicao da camera (para o especular)
uniform vec3  uAmbient;     // luz ambiente (cor/intensidade) — tambem muda no dia

// --- Material do objeto ---
uniform vec3      uColor;            // cor solida (usada quando nao ha textura)
uniform int       uUseTexture;       // 1 = amostra textura; 0 = usa uColor
uniform sampler2D uTexture;          // textura do objeto
uniform float     uShininess;        // expoente especular (brilho mais concentrado = maior)
uniform float     uSpecularStrength; // intensidade do reflexo especular
uniform float     uEmissive;         // > 0.5 => objeto emissivo (nao recebe sombra/luz)

out vec4 fragColor;

// Atenuacao suave da luz pontual por distancia. Mantemos fraca (constante pequena)
// porque o "Sol" fica longe (alto no ceu) e nao queremos escurecer demais o salao.
const float ATTENUATION_K = 0.00035;

void main() {
    // 1) Cor base: textura OU cor solida.
    vec3 baseColor = (uUseTexture == 1) ? texture(uTexture, vUv).rgb : uColor;

    // 2) Objetos emissivos (a esfera do Sol) brilham sozinhos — saem sem iluminacao.
    if (uEmissive > 0.5) {
        fragColor = vec4(baseColor, 1.0);
        return;
    }

    // 3) Vetores normalizados usados no modelo de Phong.
    vec3 N = normalize(vNormal);                 // normal da superficie
    vec3 L = normalize(uLightPos - vFragPos);    // fragmento -> luz
    vec3 V = normalize(uViewPos - vFragPos);     // fragmento -> camera
    vec3 R = reflect(-L, N);                      // reflexao da luz na superficie

    // 4) Atenuacao por distancia (caracteristica de luz pontual).
    float dist = length(uLightPos - vFragPos);
    float attenuation = 1.0 / (1.0 + ATTENUATION_K * dist * dist);

    // 5) Componente AMBIENTE: iluminacao base que nunca deixa nada 100% preto.
    vec3 ambient = uAmbient * baseColor;

    // 6) Componente DIFUSA (Lei de Lambert): depende do angulo luz x normal.
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * uLightColor * baseColor;

    // 7) Componente ESPECULAR (Phong): brilho na direcao do reflexo.
    float spec = pow(max(dot(V, R), 0.0), uShininess);
    vec3 specular = uSpecularStrength * spec * uLightColor;

    // 8) Cor final = ambiente + (difusa + especular) atenuadas pela distancia.
    vec3 color = ambient + (diffuse + specular) * attenuation;

    fragColor = vec4(color, 1.0);
}
