# Sistema de Pesagem de Mussarela — Urano US POP-S

Sistema para padronizar a gramatura de mussarela das pizzas, calzones e cheesebreads.
O **notebook (Windows 11)** lê a balança pela USB e o **tablet Android** mostra a tela
de pesagem em tempo real, conectado pelo Wi-Fi.

```
  Balança Urano US POP-S
        │ cabo USB-A → USB-B
        ▼
  Notebook Windows 11  (IP fixo 192.168.68.103)
   ├─ servidor.py  → WebSocket  ws://192.168.68.103:8765  (peso ao vivo)
   └─ servidor.py  → HTTP        http://192.168.68.103:8080 (a tela)
        │ Wi-Fi
        ▼
  Tablet Android 13 (Chrome) → http://192.168.68.103:8080
```

---

## 1. Instalar o Python

1. Baixe o **Python 3.12** em <https://www.python.org/downloads/>.
2. **MUITO IMPORTANTE:** na primeira tela do instalador, marque a caixa
   **"Add python.exe to PATH"** antes de clicar em *Install Now*.
3. Conclua a instalação.
4. Para conferir, abra o **Prompt de Comando** e digite `python --version`.
   Deve aparecer algo como `Python 3.12.x`.

## 2. Conectar a balança

1. Ligue a balança Urano US POP-S.
2. Conecte o cabo **USB-A** (notebook) → **USB-B** (balança).
3. O Windows instala sozinho uma **porta COM virtual** (ex.: COM3).
   O servidor encontra essa porta automaticamente — você não precisa configurar nada.

## 3. Instalar as dependências

1. Abra a pasta `sistema-pesagem`.
2. Dê um duplo clique em **`instalar.bat`**.
3. Aguarde a mensagem **"Instalação concluída!"** e feche a janela.
   (Isso instala `pyserial` e `websockets`.)

## 4. Iniciar o sistema

1. Dê um duplo clique em **`iniciar.bat`**.
2. O servidor sobe sem janela preta e o Chrome abre em tela cheia no próprio notebook.
3. Aparece a mensagem: **"Sistema iniciado! No tablet, acesse: http://192.168.68.103:8080"**.

> Para **encerrar**: feche o navegador e finalize o processo **`pythonw.exe`** no
> **Gerenciador de Tarefas** (Ctrl+Shift+Esc → aba *Detalhes*).

## 5. Abrir no tablet Android

1. Garanta que o tablet está na **mesma rede Wi-Fi** do notebook.
2. Abra o **Chrome** no tablet.
3. Acesse: **`http://192.168.68.103:8080`**
4. Toque no menu do Chrome (⋮) → **"Adicionar à tela inicial"** para virar um atalho
   em tela cheia. Para travar a tela ligada, use *Configurações → Tela → Tempo limite*.

### Como usar a tela
- **Passo 1:** escolha o grupo — PIZZAS · CALZONES · CHEESEBREAD.
- **Passo 2:** escolha o sabor (lista em ordem alfabética).
- **Passo 3:** escolha o tamanho/massa (o botão já mostra a gramatura alvo).
- **Passo 4:** pese a mussarela acompanhando o peso gigante e a cor:
  - 🟦 **Adicione mussarela** — ainda longe do alvo
  - 🟨 **Quase lá** — entre 20 g e 5 g abaixo do alvo
  - 🟩 **PESO IDEAL** — dentro de ± 5 g do alvo
  - 🟥 **EXCEDIDO** — passou do alvo + 5 g: a tela pisca e toca o alarme. Remova mussarela.

> **Modo demo (testar sem balança):** com a tela aberta, aperte a tecla **`D`** num
> teclado (ou conecte um teclado USB ao tablet). O peso sobe sozinho para você ver
> as cores e o alarme funcionando. Aperte `D` de novo para desligar.

---

## 6. Como identificar a porta COM (Gerenciador de Dispositivos)

Normalmente **não é preciso** — o servidor detecta sozinho. Mas se quiser conferir:

1. Clique com o botão direito no **Iniciar** → **Gerenciador de Dispositivos**.
2. Abra **"Portas (COM e LPT)"**.
3. Procure algo como **"USB-SERIAL CH340 (COM3)"** ou **"Dispositivo Serial USB (COMx)"**.
   O número entre parênteses (ex.: **COM3**) é a porta da balança.
4. Dica: desconecte e reconecte o cabo USB e veja qual item some e reaparece —
   esse é o da balança.

## 7. Balança Urano US POP-S — como o sistema lê o peso (não precisa configurar)

A US POP-S é uma **balança etiquetadora**: ela **não** envia o peso sozinha — ela
**responde sob comando**. O servidor já trata isso automaticamente: a cada ~0,2 s ele
envia o byte **ENQ (0x05)** e a balança devolve a etiqueta completa
(`DATA / TARA / PESO L / R$/kg / TOTAL`). O sistema usa o campo **`PESO L:`**
(peso líquido). Tudo a **9600 8N1**.

**Importante — protocolo serial:** a US POP-S tem 6 protocolos seriais selecionáveis
pela tecla **[F][3]** (USE-P2, USECB2, Prot 1, Prot 3, Prot 4, **Prot F**). O sistema usa o
**`Prot F`** — é o único que transmite o **peso ao vivo** (formato `STX 00.298 ETX`, em kg).
Os protocolos `USE-P2`/`USECB2` são de etiqueta/impressão e ficam "congelados", não servem.

Se a balança ficar "Desconectada" mesmo ligada, o protocolo foi trocado. Para corrigir,
com o prato vazio: **[F] [3]** → aperte **[P]** até o visor mostrar **`Prot F`** → **[E]**.

> ⚠️ Cuidado: apertar **[P]** dentro do menu **[F][3]** TROCA o protocolo. Fora desse menu,
> [P] apenas imprime. Se o sistema parar de ler peso de repente, foi o protocolo que mudou.

(Confirmado em teste: protocolo Prot F, detectada na **COM4**, peso ao vivo ~5 leituras/seg.)

> ⚖️ **Zere antes de pesar:** com o prato vazio, aperte **ZERO / TARA** na balança até
> marcar **0 g**. Sem isso ela pode marcar ~5–6 g de sobra e a gramatura sai maior que a real.

---

## 8. Solução de problemas (Troubleshooting)

### A balança não conecta (badge fica "⚠ Balança desconectada")
- Confira se o cabo USB está firme nas duas pontas e a balança ligada.
- Veja em **servidor.log** (na pasta) se aparece "Balanca nao encontrada".
- **Feche qualquer outro programa usando a porta COM** (software da balança, PuTTY,
  Arduino IDE, etc.) — só **um** programa por vez consegue abrir a COM. Esta é a causa
  nº 1: se outro app estiver com a COM4 aberta, o servidor não consegue ler.
- Tire e recoloque o cabo USB; o servidor reconecta sozinho em poucos segundos.
- Não precisa configurar a balança (o servidor pergunta o peso sozinho — veja a seção 7).

### O tablet não acessa http://192.168.68.103:8080
- Tablet e notebook precisam estar **na mesma rede Wi-Fi** (não use rede de convidados).
- Confirme que o IP do notebook continua **192.168.68.103**: no notebook rode
  `ipconfig` no Prompt e veja o "Endereço IPv4". Se mudou, peça ao TI para fixar o IP
  ou ajuste o endereço no atalho do tablet.
- **Libere o Firewall** (veja abaixo) — é a causa mais comum.
- Teste primeiro **no próprio notebook** abrindo `http://localhost:8080`. Se funcionar
  lá mas não no tablet, o problema é rede/firewall.

### A porta COM está errada / pegou outro dispositivo
- O servidor testa COM1 a COM20 e valida se chega peso de verdade, então raramente erra.
- Se houver vários adaptadores USB-serial, desconecte os outros enquanto testa.
- Reinicie o `iniciar.bat` após reconectar a balança.

### O som de alarme não toca
- O Android só libera áudio após um **toque na tela**. Toque uma vez em qualquer botão.
- Confira o volume do tablet (e que não está no modo silencioso).

### Liberar as portas no Windows Defender Firewall  ⚠️ (faça isto uma vez)
O tablet só acessa o notebook se o Firewall permitir as portas **8080** e **8765**.

**Jeito rápido (PowerShell como Administrador):**
```powershell
New-NetFirewallRule -DisplayName "Pesagem HTTP 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
New-NetFirewallRule -DisplayName "Pesagem WS 8765"  -Direction Inbound -Protocol TCP -LocalPort 8765 -Action Allow
```

**Pelo menu (sem comandos):**
1. Abra **"Firewall do Windows Defender com Segurança Avançada"**.
2. Clique em **"Regras de Entrada"** → **"Nova Regra…"**.
3. Tipo **Porta** → **TCP** → Portas específicas: **8080** → **Permitir a conexão** →
   marque os 3 perfis → nome "Pesagem HTTP 8080".
4. Repita para a porta **8765** ("Pesagem WS 8765").

---

## Onde ficam as gramaturas (para ajustar)

Todas as gramaturas estão no início do arquivo **`sistema.html`**, no objeto `FICHA`
(em gramas). É só editar os números e salvar — não precisa mexer no resto do código.

| Grupo | Tamanho/massa | Mussarela (base) |
|------|----------------|-----------------:|
| Pizza | Broto Tradicional (7") | 70 g |
| Pizza | Média Tradicional / Fina (12") | 140 g |
| Pizza | Média Pan (12") | 200 g |
| Pizza | Grande Tradicional / Fina / Finíssima (14") | 200 g |
| Pizza | Gigante Tradicional / Fina (16") | 250 g |
| Calzone | 8.5" | 50 g |
| Cheesebread | 8.5" | 100 g |

**Observações da ficha técnica (conferidas na planilha "Ficha Técnica 2026"):**
- O sabor **MUSSARELA** (pizza só de queijo) leva mais que os demais — ex.: Broto 100 g,
  Grande 300 g, Gigante Tradicional 375 g. Esses valores já estão nos *overrides* do `FICHA`.
- **FRANGO REQUEIJÃO não leva mussarela**, exceto na massa **Pan** (Média Pan = 100 g).
- A média (12") tradicional/fina usa **140 g** (e a Pan usa **200 g**) conforme a planilha.
  Se a sua operação usa 130 g, basta trocar o `base` da MED no `FICHA`.
