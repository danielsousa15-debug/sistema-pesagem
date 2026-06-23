# Passo a passo — Sistema de Pesagem Dex Balance

Guia simples e direto. As **Partes 1 a 5 você faz só UMA vez por computador**.
Depois, no dia a dia, é só a **Parte 6**.

---

## PARTE 1 — Instalar o Python no computador (só uma vez)

1. No computador, abra o navegador e vá em **https://www.python.org/downloads/**
2. Clique no botão **"Download Python 3.x"**
3. Abra o arquivo baixado (fica na pasta *Downloads*)
4. **PASSO MAIS IMPORTANTE:** na primeira tela do instalador, lá embaixo,
   marque a caixinha **"Add python.exe to PATH"**
5. Clique em **"Install Now"** e espere terminar. Clique em **"Close"**

**Como saber se deu certo:** aperte **Windows**, digite `cmd`, abra o
*Prompt de Comando*, digite `python --version` e tecle Enter.
Deve aparecer `Python 3.x.x`.

---

## PARTE 2 — Conectar o computador e o tablet na mesma rede

O computador da loja fica conectado por **cabo de rede** (ethernet) no roteador.
O tablet fica no **Wi-Fi do mesmo roteador**. Isso é suficiente — eles se comunicam
normalmente porque estão na mesma rede local.

```
[Balança USB] ---> [Computador - CABO] ---+
                                          +--- [Roteador] --- [Tablet Wi-Fi]
                     [outros dispositivos]+
```

> Não precisa que o computador tenha Wi-Fi. O cabo é melhor: mais estável e sem
> risco de cair a conexão durante o uso.

---

## PARTE 3 — Conectar a balança Urano US POP-S (só uma vez)

1. Ligue a balança
2. Conecte o cabo: ponta **USB-A** no computador, ponta **USB-B** na balança
3. Espere o Windows reconhecer (instala o driver sozinho)
4. **Selecione o protocolo `Prot F`** na balança. Com o prato vazio:
   - Aperte **`F`** e depois **`3`** — o visor mostra o protocolo atual
   - Aperte **`P`** até aparecer **`Prot F`**
   - Aperte **`E`** para confirmar
5. Pronto — o sistema encontra a porta e lê o peso automaticamente

> Se a balança mostrar "Desconectada" mesmo ligada: o protocolo foi trocado.
> Refaça o passo 4 para voltar ao **Prot F**.
> Os 6 protocolos são: USE-P2, USECB2, Prot 1, Prot 3, Prot 4, **Prot F** (use este).

---

## PARTE 4 — Instalar o sistema (só uma vez)

Com a balança conectada e o Python instalado:

1. Abra a pasta com os arquivos do sistema
2. Clique com o **botão DIREITO** em **`instalar.bat`** →
   **"Executar como administrador"** → clique **"Sim"** na janela do Windows
3. O instalador vai:
   - Instalar as dependências Python automaticamente
   - Mostrar a lista de lojas — **digite o número da sua loja** e tecle Enter
   - Detectar o IP do computador automaticamente

### Atenção ao IP — leia antes de confirmar

O instalador detecta o IP do computador automaticamente e mostra na tela:

```
IP detectado automaticamente: 192.168.1.105
Confirme ou corrija o IP (Enter = aceitar):
```

Se o computador tiver **apenas o cabo de rede** (sem Wi-Fi), o IP detectado
já é o certo — só aperte Enter.

Se o computador tiver **cabo E Wi-Fi ao mesmo tempo**, o instalador pode
pegar o IP errado. Antes de confirmar, abra o `cmd` e rode `ipconfig`:

```
Adaptador Ethernet:
   Endereço IPv4: 192.168.1.105  <-- USE ESTE (é o do cabo)

Adaptador Wi-Fi:
   Endereço IPv4: 192.168.1.88   <-- ignore este
```

Digite o IP do **Adaptador Ethernet** e tecle Enter.

4. O instalador também:
   - Libera as portas no Firewall do Windows (8080 e 8765)
   - Configura o servidor para **iniciar automaticamente** com o Windows
5. Quando perguntar **"Iniciar o servidor agora? (S/N)"** → digite **S**

---

## PARTE 5 — Configurar o tablet (só uma vez)

1. Conecte o tablet no **Wi-Fi da loja** (mesmo roteador do computador)
2. Abra o **Chrome**
3. Na barra de endereço, digite o IP que apareceu no instalador, ex.:

   **`http://192.168.1.105:8080`**

4. A tela do sistema deve abrir com o badge **"Balança conectada"** em verde
5. Para virar atalho em tela cheia:
   - Toque no menu **⋮** (3 pontinhos) → **"Adicionar à tela inicial"**
   - Agora tem um ícone na tela do tablet, igual a um aplicativo
6. Para a tela não apagar sozinha:
   **Configurações → Tela → Tempo limite da tela** → maior tempo possível

> Se o IP mudar depois (roteador reiniciado, por ex.), veja a seção de Problemas.
> Peça ao TI para **fixar o IP do computador** no roteador — assim nunca muda.

---

## PARTE 6 — DIA A DIA (é só isto, todo dia)

**No computador:**
1. Ligue o computador — o servidor **sobe automaticamente** (não precisa fazer nada)
2. Confira que a **balança está ligada e conectada** pelo cabo USB

**No tablet:**
3. Toque no ícone do sistema na tela inicial
4. Olhe o badge no topo:
   - **"Balança conectada"** (verde) → tudo certo, pode pesar
   - **"Balança desconectada"** (amarelo) → confira o cabo USB e se a balança está ligada

**Pesar:**
5. Coloque a **massa/disco** no prato → o sistema **tara sozinho** (zera a base)
6. Toque em **PIZZAS** (ou CALZONES / CHEESEBREAD)
7. Toque no grupo: **MAIS PEDIDAS**, **CLÁSSICAS** ou **ESPECIAIS**
8. Toque no **sabor**
9. Toque no **tamanho/massa** — a grade mostra a gramatura de cada combinação
10. Coloque a mussarela olhando o número e a cor:
    - Azul = ainda falta
    - Amarelo = quase lá (faltam de 5 a 20 g)
    - **Verde = PESO IDEAL** — pode fechar a pizza
    - **Vermelho + apito = passou** — a tela pisca: tire um pouco de mussarela
11. Retire a pizza pronta do prato → o sistema volta sozinho para a tela inicial

**No fim do dia:**
12. Pode desligar o computador normalmente — o servidor para junto

> Para parar o servidor sem desligar o computador: dê dois cliques em **`parar.bat`**
> Para ligar manualmente (sem reiniciar): dê dois cliques em **`iniciar.bat`**

---

## PARTE 7 — Problemas

| Problema | O que fazer |
|---|---|
| Badge "Balança desconectada" | Confira o cabo USB e se a balança está ligada. Verifique se está no protocolo **Prot F** (Parte 3). Tire e recoloque o cabo — reconecta sozinho. |
| Tablet não abre a página | Tablet e computador no **mesmo roteador**? Teste no computador: `http://localhost:8080`. Se abrir lá mas não no tablet, rode `liberar-firewall.bat` novamente. |
| IP do computador mudou | No computador: abra `cmd`, digite `ipconfig`, veja **"Endereço IPv4"** do **Adaptador Ethernet**. Use esse IP no tablet. Peça ao TI para **fixar o IP** no roteador. |
| Não toca o apito | Toque uma vez na tela do tablet (o Android libera o som só após o primeiro toque). Confira o volume. |
| Gramatura errada | Os números ficam no início do arquivo `sistema.html` (objeto `FICHA`). Edite e salve. |

---

## Arquivos da pasta

| Arquivo | Para que serve |
|---|---|
| `instalar.bat` | Instalação completa (roda uma vez por computador) |
| `iniciar.bat` | Liga o servidor manualmente |
| `parar.bat` | Para o servidor sem desligar o computador |
| `liberar-firewall.bat` | Libera as portas no firewall (incluído no instalar) |
| `sistema.html` | O app — telas e gramaturas |
| `servidor.py` | O programa que lê a balança |
| `config.json` | Configurações da loja (loja_id, IP, PIN) |
| `servidor.log` | Registro do que aconteceu (útil se der erro) |
