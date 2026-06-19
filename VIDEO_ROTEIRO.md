# 🎬 Roteiro do Vídeo de Demonstração (1–3 min)

Roteiro curto para gravar a demonstração do **Museu Virtual 3D**. A ideia é mostrar, em ordem, **todos os requisitos técnicos** funcionando, de forma fluida e bonita.

> Dica geral: antes de gravar, deixe o servidor rodando (`python -m http.server 8000`) e a página aberta em `http://localhost:8000`. Fale com calma e mexa o mouse devagar (movimentos lentos ficam melhores no vídeo).

---

## Sequência sugerida (com narração)

**0:00 – 0:15 · Abertura**
- Mostre a tela inicial com o overlay (título "Museu Virtual 3D" e os controles).
- Narração: *"Este é um passeio virtual 3D feito em WebGL2 puro, com shaders GLSL. Tudo aqui — geometria, texturas e iluminação — é gerado por código."*
- Clique na cena para travar o mouse (Pointer Lock).

**0:15 – 0:45 · Caminhada em 1ª pessoa (câmera + perspectiva + interação)**
- Ande com **W A S D**, olhe ao redor com o **mouse**, segure **Shift** para correr um pouco.
- Narração: *"A navegação é em primeira pessoa: WASD e setas para andar, mouse para olhar, com projeção em perspectiva."*
- Aproxime-se da escultura central para dar profundidade à cena.

**0:45 – 1:10 · Escultura central girando (animação por transformação)**
- Pare de frente para o pedestal central e mostre o **torus dourado girando** com o cubo esmeralda no meio.
- Vá até um dos cantos e mostre o **cubo vermelho** e o **torus laranja** também animados.
- Narração: *"As esculturas são animadas por transformações geométricas — rotação dependente do tempo, com deltaTime."*

**1:10 – 1:35 · Quadros texturizados + cor sólida**
- Caminhe rente às paredes mostrando os **quadros emoldurados** (texturas) e os **pedestais de cor sólida**.
- Narração: *"Os quadros são objetos texturizados; pedestais e esculturas usam cor sólida. O chão é de madeira com faixa de mármore."*

**1:35 – 2:10 · O Sol se movendo + mudança de iluminação (Phong + luz em movimento)**
- Olhe para cima e para os lados para enquadrar o **Sol** (esfera brilhante) cruzando o céu.
- Observe por alguns segundos: a **cor do céu muda**, a **luz fica alaranjada** no entardecer e o **brilho especular** se desloca na esfera/torus dourados.
- Mostre o HUD no canto ("Céu: Dia / Entardecer / Noite").
- Narração: *"O Sol é uma luz pontual em movimento. A iluminação de Phong é calculada por fragmento — repare no especular acompanhando o Sol e no ciclo dia, entardecer e noite."*

**2:10 – 2:30 · Fechamento**
- Dê uma última volta panorâmica.
- Narração: *"Tudo em WebGL2 cru, sem engine gráfica — apenas gl-matrix para álgebra linear. Obrigado!"*

---

## 🎥 Como gravar a tela no Windows

### Opção A — Xbox Game Bar (já vem no Windows 10/11, mais simples)
1. Pressione **`Win + G`** para abrir a Game Bar.
2. No widget **Capturar**, clique no botão de **gravar** (círculo) — ou use o atalho **`Win + Alt + R`** para iniciar/parar.
3. Para gravar o **áudio do microfone**, ative o microfone no mesmo widget (ou **`Win + Alt + M`**).
4. Pare a gravação com **`Win + Alt + R`**. O vídeo fica em **`Vídeos\Capturas`** (`Videos\Captures`).

> Observação: a Game Bar grava a **janela ativa** (deixe o navegador em foco, de preferência em tela cheia com **F11**).

### Opção B — OBS Studio (mais controle, gratuito)
1. Baixe e instale o **OBS Studio** (https://obsproject.com).
2. Em **Fontes (Sources)** → **+** → **Captura de Tela** (Display Capture) ou **Captura de Janela** (Window Capture) e selecione o navegador.
3. Clique em **Iniciar Gravação**; ao terminar, **Parar Gravação**.
4. O arquivo fica na pasta definida em **Configurações → Saída → Caminho de Gravação** (padrão: `Vídeos`).

### Dicas de qualidade
- Coloque o navegador em **tela cheia (F11)** antes de gravar.
- Grave em **1080p** se possível e mantenha movimentos de mouse **suaves**.
- Edite o início/fim se precisar (o app **Fotos** do Windows corta vídeo: abrir vídeo → **Editar → Recortar**).
- Depois de gravar, **suba o vídeo** (YouTube "não listado", Google Drive, etc.) e **cole o link no README** em `[LINK DO VÍDEO AQUI]`.
