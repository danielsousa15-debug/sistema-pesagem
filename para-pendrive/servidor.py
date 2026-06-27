# -*- coding: utf-8 -*-
"""
Servidor de pesagem de mussarela — Urano US POP-S
==================================================

Arquitetura:
  Balanca USB -> COM virtual no Windows -> este servidor Python (notebook)
  Tablet Android (Wi-Fi) -> Chrome -> http://192.168.68.103:8080 (sistema.html)
                                   -> ws://192.168.68.103:8765 (peso em tempo real)

O que este script faz:
  1. Procura automaticamente a porta COM da balanca (COM1 a COM20).
  2. Le o peso pela serial e converte para GRAMAS INTEIRAS.
  3. Serve um WebSocket em 0.0.0.0:8765 e envia {"grams": 123, "connected": true}.
  4. Serve o arquivo sistema.html via HTTP em 0.0.0.0:8080 (com CORS liberado).
  5. Reconecta sozinho se a balanca cair, e aceita varios tablets ao mesmo tempo.
  6. Registra tudo em servidor.log.

Robusto a falhas: roda sem balanca (o tablet mostra "Desconectada") e volta a
funcionar sozinho assim que a balanca for reconectada.
"""

import asyncio
import csv
import datetime
import hashlib
import hmac
import json
import logging
import os
import re
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import serial
import serial.tools.list_ports

# Importa a funcao serve do websockets de forma compativel com varias versoes
# (a API moderna fica em websockets.asyncio.server; a legada em websockets).
try:
    from websockets.asyncio.server import serve as ws_serve  # websockets >= 13
except Exception:  # pragma: no cover - fallback para versoes 11/12
    from websockets import serve as ws_serve

# ---------------------------------------------------------------------------
# Configuracoes
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # pasta deste script
HTTP_HOST = "0.0.0.0"        # todas as interfaces (tablet acessa via Wi-Fi)
HTTP_PORT = 8080
WS_HOST = "0.0.0.0"          # todas as interfaces
WS_PORT = 8765
BAUD_RATE = 9600             # Urano US POP-S: 9600 bps, 8N1
SERIAL_PORTS = [f"COM{i}" for i in range(1, 21)]  # COM1 .. COM20
STALE_AFTER = 3.0            # segundos sem leitura valida -> considera desconectada
RECONNECT_DELAY = 2.0        # espera entre tentativas de reconexao
REOPEN_AFTER = 5.0           # segundos sem resposta -> fecha e reabre a porta (auto-cura)

# A US POP-S e uma balanca ETIQUETADORA: nao envia peso sozinha. Ela responde
# ao comando ENQ (0x05) devolvendo a etiqueta com o campo "PESO L:" (peso liquido).
# Por isso o servidor PERGUNTA o peso varias vezes por segundo (polling).
ENQ = b"\x05"                # comando de solicitacao de peso
POLL_RESPONSE_WAIT = 0.18    # tempo MAXIMO de espera pela resposta (~143ms ciclo da balanca)
POLL_INTERVAL = 0.01         # pausa minima entre leituras (poll agressivo)

# ---------------------------------------------------------------------------
# Logging (arquivo + console)
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(os.path.join(BASE_DIR, "servidor.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("pesagem")

# ---------------------------------------------------------------------------
# LICENCA — trava o sistema a uma maquina autorizada (modelo igual ao DEX Label)
# O administrador gera o arquivo licenca.key a partir do ID da maquina. Sem uma
# chave valida na pasta, o HTTP serve apenas a pagina de bloqueio com o ID.
# ---------------------------------------------------------------------------
_L1 = "DXB25"
_L2 = "AL-SEC"
_L3 = "FRQ-BAL"
_LIC_SECRET = _L1 + _L2 + _L3
LICENSE_PATH = os.path.join(BASE_DIR, "licenca.key")


def get_machine_id():
    """ID estavel desta maquina: MAC da placa de rede (hostname como reserva)."""
    mac = uuid.getnode()
    # Bit 41 ligado = uuid.getnode nao encontrou um MAC real e gerou um aleatorio.
    if (mac >> 40) & 0x01:
        return socket.gethostname().strip().upper()
    return ":".join("%02X" % ((mac >> shift) & 0xFF) for shift in range(40, -1, -8))


def license_key_for(machine_id):
    """Chave esperada para um ID (mesmo algoritmo do gerador do administrador)."""
    return hmac.new(
        _LIC_SECRET.encode("utf-8"),
        machine_id.strip().upper().encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:32].upper()


def check_license():
    """True se existe um licenca.key valido para esta maquina."""
    try:
        with open(LICENSE_PATH, "r", encoding="utf-8") as f:
            stored = f.read().strip().upper()
    except OSError:
        return False
    return bool(stored) and stored == license_key_for(get_machine_id())


LICENSE_BLOCKED_PAGE = """<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dex Balance - Sem licenca</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background:#0f0f0f; color:#fff;
         display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .box { text-align:center; padding:48px 32px; max-width:440px; width:100%; }
  .lock { font-size:64px; margin-bottom:24px; }
  h1 { font-size:22px; font-weight:900; margin-bottom:10px; }
  p { font-size:14px; color:#888; margin-bottom:28px; line-height:1.7; }
  .label { font-size:11px; color:#555; margin-bottom:6px; text-transform:uppercase; letter-spacing:1px; }
  .id-box { background:#1a1a1a; border:1px solid #333; border-radius:8px;
            padding:14px 20px; font-size:16px; color:#a3e635; font-family:monospace;
            word-break:break-all; user-select:all; cursor:text; }
  .hint { margin-top:12px; font-size:12px; color:#444; }
</style>
</head>
<body>
  <div class="box">
    <div class="lock">&#128274;</div>
    <h1>Licenca necessaria</h1>
    <p>Este computador nao esta autorizado a usar o Dex Balance.<br>
       Envie o ID abaixo para o administrador e receba o arquivo <strong>licenca.key</strong>.</p>
    <div class="label">ID desta maquina</div>
    <div class="id-box">%%MACHINE_ID%%</div>
    <div class="hint">Clique no codigo para selecionar e copie (Ctrl+C)</div>
  </div>
</body>
</html>"""

# ---------------------------------------------------------------------------
# AUTO-ATUALIZACAO — baixa versoes novas do GitHub a cada reinicio
# ---------------------------------------------------------------------------
_UPDATE_BASE = (
    "https://raw.githubusercontent.com/danielsousa15-debug/"
    "sistema-pesagem/master/para-pendrive/"
)
_UPDATE_FILES = ["sistema.html", "servidor.py"]

def _auto_update():
    """
    Verifica GitHub por versoes novas de sistema.html e servidor.py.
    - Se sistema.html mudou: substitui (HTTP serve o arquivo novo na proxima requisicao).
    - Se servidor.py mudou: substitui e reinicia o processo.
    - Qualquer falha de rede e silenciosa; o servidor sobe normalmente.
    Timeout: 5 s por arquivo (maximo 10 s no total antes de continuar).
    """
    servidor_atualizado = False
    for nome in _UPDATE_FILES:
        local = os.path.join(BASE_DIR, nome)
        url = _UPDATE_BASE + nome
        try:
            with urllib.request.urlopen(url, timeout=5) as resp:
                novo = resp.read()
            try:
                with open(local, "rb") as f:
                    atual = f.read()
            except OSError:
                atual = b""
            if novo != atual:
                tmp = local + ".tmp"
                with open(tmp, "wb") as f:
                    f.write(novo)
                os.replace(tmp, local)          # atomico no mesmo volume
                log.info("[update] %s atualizado.", nome)
                if nome == "servidor.py":
                    servidor_atualizado = True
        except Exception as exc:
            log.debug("[update] %s sem acesso ao GitHub: %s", nome, exc)

    if servidor_atualizado:
        log.info("[update] Reiniciando para aplicar nova versao do servidor...")
        time.sleep(0.3)
        try:
            os.execv(
                sys.executable,
                [sys.executable, os.path.abspath(__file__)] + sys.argv[1:],
            )
        except Exception:
            log.warning("[update] Reinicio automatico falhou — reinicie manualmente.")

# ---------------------------------------------------------------------------
# CONFIG.JSON — credenciais do Supabase, identificacao da loja e PIN admin
# ---------------------------------------------------------------------------
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
CONFIG = {}

def carregar_config():
    """Le o config.json e preenche valores padrao para campos ausentes."""
    global CONFIG
    try:
        with open(CONFIG_PATH, encoding="utf-8") as f:
            CONFIG = json.load(f)
    except Exception as e:
        log.warning("config.json nao lido (%s). Usando valores padrao.", e)
        CONFIG = {}
    CONFIG.setdefault("supabase_url", "")
    CONFIG.setdefault("supabase_key", "")
    CONFIG.setdefault("porta_com", "AUTO")
    CONFIG.setdefault("ip_servidor", "192.168.68.103")
    CONFIG.setdefault("admin_pin", "1234")
    CONFIG.setdefault("loja_id", "")
    CONFIG.setdefault("loja_nome", "")

def salvar_config_arquivo():
    """Grava o CONFIG atual de volta no config.json."""
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(CONFIG, f, ensure_ascii=False, indent=2)

# ---------------------------------------------------------------------------
# SUPABASE — envio das pesagens via REST API (HTTP puro, sem bibliotecas)
# Em caso de falha, salva em logs/pesagens_backup.csv como fallback.
# ---------------------------------------------------------------------------
CSV_CAMPOS = ["criado_em", "data", "hora", "loja_id", "loja_nome", "familia",
              "sabor", "tamanho", "ingrediente", "alvo_g", "real_g", "diferenca_g", "status"]

TREINO_CAMPOS = ["criado_em", "data", "hora", "loja_id", "loja_nome",
                 "operador", "sessao_id", "tentativa_numero",
                 "familia", "sabor", "tamanho",
                 "alvo_g", "real_g", "diferenca_g", "resultado"]

def supabase_post_pesagem(registro):
    """Envia um registro de pesagem ao Supabase. Retorna True se enviou, senao salva no CSV."""
    url = (CONFIG.get("supabase_url") or "").rstrip("/")
    key = CONFIG.get("supabase_key") or ""
    if url and key and "SEU-PROJETO" not in url:
        try:
            body = json.dumps(registro).encode("utf-8")
            req = urllib.request.Request(
                url + "/rest/v1/pesagens", data=body, method="POST",
                headers={
                    "apikey": key,
                    "Authorization": "Bearer " + key,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                if 200 <= resp.status < 300:
                    log.info("Pesagem -> Supabase: %s %s alvo=%dg real=%dg (%s)",
                             registro["sabor"], registro["ingrediente"],
                             registro["alvo_g"], registro["real_g"], registro["status"])
                    return True
                log.error("Supabase respondeu HTTP %s", resp.status)
        except Exception as e:
            log.error("Falha ao enviar ao Supabase: %s", e)
    else:
        log.warning("Supabase nao configurado; salvando pesagem no backup CSV.")
    salvar_csv_backup(registro)
    return False

def salvar_csv_backup(registro):
    """Acrescenta o registro em logs/pesagens_backup.csv (inclui loja_id e loja_nome)."""
    try:
        pasta = os.path.join(BASE_DIR, "logs")
        os.makedirs(pasta, exist_ok=True)
        caminho = os.path.join(pasta, "pesagens_backup.csv")
        novo = not os.path.exists(caminho)
        with open(caminho, "a", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=CSV_CAMPOS)
            if novo:
                w.writeheader()
            w.writerow({c: registro.get(c, "") for c in CSV_CAMPOS})
        log.info("Pesagem salva no backup CSV.")
    except Exception as e:
        log.error("Falha ao salvar CSV de backup: %s", e)


def supabase_post_treino(registro):
    """Envia um registro de treino ao Supabase (tabela treinos). Fallback CSV."""
    url = (CONFIG.get("supabase_url") or "").rstrip("/")
    key = CONFIG.get("supabase_key") or ""
    if url and key and "SEU-PROJETO" not in url:
        try:
            body = json.dumps(registro).encode("utf-8")
            req = urllib.request.Request(
                url + "/rest/v1/treinos", data=body, method="POST",
                headers={
                    "apikey": key,
                    "Authorization": "Bearer " + key,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                if 200 <= resp.status < 300:
                    log.info("Treino -> Supabase: %s op=%s tentativa=%d %s",
                             registro.get("sabor"), registro.get("operador"),
                             registro.get("tentativa_numero", 0), registro.get("resultado"))
                    return True
                log.error("Supabase treino respondeu HTTP %s", resp.status)
        except Exception as e:
            log.error("Falha ao enviar treino ao Supabase: %s", e)
    else:
        log.warning("Supabase nao configurado; salvando treino no backup CSV.")
    salvar_csv_treino(registro)
    return False


def salvar_csv_treino(registro):
    """Acrescenta o registro em logs/treinos_backup.csv."""
    try:
        pasta = os.path.join(BASE_DIR, "logs")
        os.makedirs(pasta, exist_ok=True)
        caminho = os.path.join(pasta, "treinos_backup.csv")
        novo = not os.path.exists(caminho)
        with open(caminho, "a", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=TREINO_CAMPOS)
            if novo:
                w.writeheader()
            w.writerow({c: registro.get(c, "") for c in TREINO_CAMPOS})
        log.info("Treino salvo no backup CSV.")
    except Exception as e:
        log.error("Falha ao salvar CSV de treino: %s", e)

# ---------------------------------------------------------------------------
# Estado compartilhado entre as threads (serial) e o asyncio (websocket)
# Leituras/escritas de int/bool em Python sao atomicas o suficiente aqui.
# ---------------------------------------------------------------------------
latest_grams = 0           # ultimo peso lido, em gramas inteiras
scale_connected = False    # True quando a porta esta aberta e recebendo dados
scale_estavel = True       # False quando a balanca esta "instavel" (peso em movimento)
scale_port = None          # nome da porta COM em uso (ex.: "COM3")
last_read_ts = 0.0         # momento da ultima leitura valida (time.time())
STOP = threading.Event()   # sinaliza o encerramento das threads

# ---------------------------------------------------------------------------
# Parser de peso — trata todos os formatos da Urano US POP-S
#   "  0.070 kg" -> 70    |  "  70 g" -> 70
#   " 0.070kg"   -> 70    |  "70g"    -> 70
# Estrategia: extrai o numero e detecta a unidade (kg tem prioridade sobre g).
# Sem unidade, usa heuristica: numero com casa decimal = kg, inteiro = gramas.
# ---------------------------------------------------------------------------
_NUM_RE = re.compile(r"-?\d+(?:[.,]\d+)?")
# Etiqueta longa (USE-P2 com datas): campo "PESO L:  0.006kg" (peso liquido).
_PESO_L_RE = re.compile(r"PESO\s*L\s*:?\s*(-?\d+(?:[.,]\d+)?)\s*(kg|g)", re.I)
# Numero seguido de unidade, ex.: "0,000 kg" (USE-P2 compacto) ou "0.070 kg".
_PESO_UNID_RE = re.compile(r"(-?\d+(?:[.,]\d+)?)\s*(kg|g)\b", re.I)


def parse_grams(raw):
    """Converte a resposta da balanca em gramas inteiras. Retorna int ou None.

    Cobre os formatos do protocolo USE-P2 da US POP-S:
      1) Etiqueta longa (com datas): campo "PESO L:".
      2) Etiqueta compacta (sem datas, 56 bytes): o peso vem como "0,000 kg" no
         meio dos caracteres de controle (ESC ...). Pega o numero seguido de
         "kg"/"g" e ignora preco/total (que vem sem unidade).
      3) Formatos continuos simples: "  0.070 kg", "70g".
    """
    if raw is None:
        return None

    # 1) Rotulo PESO L tem prioridade (etiqueta longa).
    m = _PESO_L_RE.search(raw)
    if m:
        value = float(m.group(1).replace(",", "."))
        return int(round(value * 1000.0 if m.group(2).lower() == "kg" else value))

    # 2) Numero seguido de unidade kg/g (etiqueta compacta e formatos simples).
    m = _PESO_UNID_RE.search(raw)
    if m:
        value = float(m.group(1).replace(",", "."))
        return int(round(value * 1000.0 if m.group(2).lower() == "kg" else value))

    # 3) Fallback: numero sem unidade (heuristica: casa decimal = kg).
    s = raw.strip().lower()
    if not s or "peso" in s:
        return None
    m = _NUM_RE.search(s)
    if not m:
        return None
    try:
        value = float(m.group(0).replace(",", "."))
    except ValueError:
        return None
    grams = value * 1000.0 if ("." in s or "," in s) else value
    return int(round(grams))


# ---------------------------------------------------------------------------
# Deteccao e leitura da balanca (roda em thread separada)
# ---------------------------------------------------------------------------
def _candidate_ports():
    """Lista as portas COM a testar, priorizando adaptadores USB-serial conhecidos."""
    known = ("usb", "ch340", "ch9102", "ftdi", "prolific", "cp210", "silicon", "serial")
    detected = list(serial.tools.list_ports.comports())
    preferred, normal = [], []
    for p in detected:
        desc = (p.description or "").lower() + (p.manufacturer or "").lower()
        (preferred if any(k in desc for k in known) else normal).append(p.device)
    # Acrescenta COM1..COM20 que por acaso nao apareceram na enumeracao.
    extras = [c for c in SERIAL_PORTS if c not in preferred + normal]
    # Ordem de tentativa: USB-serial -> demais detectadas -> COM1..20 restantes.
    ordered = []
    for dev in preferred + normal + extras:
        if dev not in ordered:
            ordered.append(dev)
    return ordered


def ler_peso(ser):
    """Envia ENQ e retorna a resposta da balanca ASSIM QUE o quadro chega.

    Retorna no fim do quadro (ETX 0x03 do Prot F) ou quando ja da pra parsear o
    peso. Nao espera o peso estabilizar -> leitura ao vivo, sem delay.
    """
    ser.reset_input_buffer()
    ser.write(ENQ)
    ser.flush()
    deadline = time.time() + POLL_RESPONSE_WAIT
    data = b""
    while time.time() < deadline:
        n = ser.in_waiting
        if n:
            data += ser.read(n)
            # Fim do quadro Prot F = ETX (0x03); ou ja temos um peso parseavel.
            if b"\x03" in data or parse_grams(data.decode("ascii", errors="ignore")) is not None:
                break
        else:
            time.sleep(0.002)
    return data.decode("ascii", errors="ignore")


def find_scale_port():
    """Abre a primeira porta que responder com um peso valido. Retorna o Serial aberto."""
    for dev in _candidate_ports():
        try:
            ser = serial.Serial(
                dev, BAUD_RATE, bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE, stopbits=serial.STOPBITS_ONE, timeout=0.5,
            )
        except (serial.SerialException, OSError):
            continue  # porta ocupada ou inexistente
        try:
            # Pergunta o peso algumas vezes; a US POP-S responde ao ENQ com a etiqueta.
            for _ in range(4):
                if parse_grams(ler_peso(ser)) is not None:
                    log.info("Balanca detectada em %s", dev)
                    return ser
            ser.close()
        except (serial.SerialException, OSError):
            try:
                ser.close()
            except Exception:
                pass
            continue
    return None


def serial_worker():
    """Loop infinito: conecta, le o peso e reconecta sozinho em caso de falha."""
    global latest_grams, scale_connected, scale_estavel, scale_port, last_read_ts
    ser = None
    while not STOP.is_set():
        # (Re)conexao
        if ser is None:
            ser = find_scale_port()
            if ser is None:
                scale_connected = False
                scale_port = None
                log.warning("Balanca nao encontrada. Nova tentativa em %.0fs...", RECONNECT_DELAY)
                STOP.wait(RECONNECT_DELAY)
                continue
            scale_port = ser.port
            scale_connected = True
            last_read_ts = time.time()  # acabou de ler na deteccao (evita reabrir na hora)

        # Leitura: pergunta o peso (ENQ) e interpreta a resposta.
        try:
            raw = ler_peso(ser)
            grams = parse_grams(raw)
            if grams is not None:
                latest_grams = grams
                last_read_ts = time.time()
                scale_connected = True
                scale_estavel = True
            elif "III" in raw:
                # Balanca RESPONDEU, mas o peso esta INSTAVEL (movimento/despejo).
                # Ela esta viva: atualiza o relogio (evita falso "desconectada") e
                # sinaliza instavel para o tablet mostrar "estabilizando".
                last_read_ts = time.time()
                scale_connected = True
                scale_estavel = False
            else:
                # Sem resposta (quadro vazio).
                if time.time() - last_read_ts > STALE_AFTER:
                    scale_connected = False
                # AUTO-CURA: muito tempo sem resposta (balanca em standby, desligada
                # ou travada) -> fecha e reabre a porta para forcar nova deteccao.
                # Assim que a balanca voltar a responder, a leitura volta sozinha.
                if time.time() - last_read_ts > REOPEN_AFTER:
                    log.warning("Sem resposta da balanca ha %.0fs; reabrindo a porta %s...",
                                REOPEN_AFTER, scale_port)
                    try:
                        ser.close()
                    except Exception:
                        pass
                    ser = None
                    scale_connected = False
                    continue
            STOP.wait(POLL_INTERVAL)
        except (serial.SerialException, OSError) as e:
            log.error("Erro na serial (%s): %s. Reconectando...", scale_port, e)
            try:
                ser.close()
            except Exception:
                pass
            ser = None
            scale_connected = False
            STOP.wait(RECONNECT_DELAY)

    if ser is not None:
        try:
            ser.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Servidor HTTP (serve sistema.html e libera CORS para o tablet)
# ---------------------------------------------------------------------------
class CorsRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # CORS liberado + sem cache (garante que o tablet pegue a versao nova).
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

    def do_GET(self):
        # Trava de licenca: sem chave valida, serve apenas a pagina de bloqueio.
        if not check_license():
            page = LICENSE_BLOCKED_PAGE.replace(
                "%%MACHINE_ID%%", get_machine_id()).encode("utf-8")
            self.send_response(403)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(page)))
            self.end_headers()
            self.wfile.write(page)
            return
        if self.path in ("/", ""):
            self.path = "/sistema.html"
        return super().do_GET()

    def log_message(self, fmt, *args):
        log.info("HTTP %s - %s", self.address_string(), fmt % args)


def start_http_server():
    httpd = ThreadingHTTPServer((HTTP_HOST, HTTP_PORT), CorsRequestHandler)
    log.info("HTTP servindo em http://%s:%d  (tablet: http://192.168.68.103:%d)",
             HTTP_HOST, HTTP_PORT, HTTP_PORT)
    httpd.serve_forever()


# ---------------------------------------------------------------------------
# Servidor WebSocket (envia o peso em tempo real para todos os tablets)
# ---------------------------------------------------------------------------
CLIENTS = set()


def mensagem_config():
    """Dados (nao-secretos) que o tablet usa no dashboard e no painel."""
    return {"tipo": "config_atual", "data": {
        "supabase_url": CONFIG.get("supabase_url", ""),
        "supabase_key": CONFIG.get("supabase_key", ""),
        "ip_servidor": CONFIG.get("ip_servidor", ""),
        "loja_id": CONFIG.get("loja_id", ""),
        "loja_nome": CONFIG.get("loja_nome", ""),
    }}


async def ws_handler(websocket, *args):
    """Conexao do tablet: envia a config inicial e processa as mensagens recebidas."""
    # Trava de licenca: sem chave valida, recusa a conexao (nao envia peso).
    if not check_license():
        try:
            await websocket.send(json.dumps({"tipo": "sem_licenca"}))
            await websocket.close(code=4003, reason="sem licenca")
        except Exception:
            pass
        return
    CLIENTS.add(websocket)
    peer = getattr(websocket, "remote_address", ("?",))[0]
    log.info("Tablet conectado (%s) — %d cliente(s)", peer, len(CLIENTS))
    try:
        await websocket.send(json.dumps(mensagem_config()))  # manda a config na conexao
    except Exception:
        pass
    try:
        async for msg in websocket:
            await processar_mensagem(websocket, msg)
    except Exception:
        pass
    finally:
        CLIENTS.discard(websocket)
        log.info("Tablet desconectado (%s) — %d cliente(s)", peer, len(CLIENTS))


async def processar_mensagem(ws, msg):
    """Trata as mensagens vindas do tablet: log de pesagem, verificar PIN, salvar config."""
    try:
        m = json.loads(msg)
    except Exception:
        return
    tipo = m.get("tipo")
    if tipo == "log":
        await registrar_pesagem(m.get("data", {}))
    elif tipo == "treino":
        await registrar_treino(m.get("data", {}))
    elif tipo == "verificar_pin":
        ok = str(m.get("pin", "")) == str(CONFIG.get("admin_pin", ""))
        resp = {"tipo": "pin_resultado", "ok": ok}
        if ok:
            resp["config"] = mensagem_config()["data"]
            resp["pin_padrao"] = str(CONFIG.get("admin_pin", "")) in ("1234", "0000")
        await ws.send(json.dumps(resp))
    elif tipo == "config":
        await salvar_config_ws(ws, m)


async def registrar_pesagem(data):
    """Monta o registro (loja do config + data/hora do servidor) e envia ao Supabase."""
    agora = datetime.datetime.now()
    registro = {
        "criado_em": agora.isoformat(timespec="seconds"),
        "data": agora.strftime("%Y-%m-%d"),
        "hora": agora.strftime("%H:%M:%S"),
        "loja_id": CONFIG.get("loja_id", ""),
        "loja_nome": CONFIG.get("loja_nome", ""),
        "familia": str(data.get("familia", "")),
        "sabor": str(data.get("sabor", "")),
        "tamanho": str(data.get("tamanho", "")),
        "ingrediente": str(data.get("ingrediente", "")),
        "alvo_g": int(data.get("alvo_g", 0)),
        "real_g": int(data.get("real_g", 0)),
        "diferenca_g": int(data.get("diferenca_g", 0)),
        "status": data.get("status", "OK"),
    }
    # POST numa thread para nao travar o loop do WebSocket.
    await asyncio.to_thread(supabase_post_pesagem, registro)


async def registrar_treino(data):
    """Monta o registro de treino (loja do config + timestamp do servidor) e envia ao Supabase."""
    agora = datetime.datetime.now()
    registro = {
        "criado_em": agora.isoformat(timespec="seconds"),
        "data": agora.strftime("%Y-%m-%d"),
        "hora": agora.strftime("%H:%M:%S"),
        "loja_id": CONFIG.get("loja_id", ""),
        "loja_nome": CONFIG.get("loja_nome", ""),
        "operador": str(data.get("operador", "")),
        "sessao_id": str(data.get("sessao_id", "")),
        "tentativa_numero": int(data.get("tentativa_numero", 0)),
        "familia": str(data.get("familia", "")),
        "sabor": str(data.get("sabor", "")),
        "tamanho": str(data.get("tamanho", "")),
        "alvo_g": int(data.get("alvo_g", 0)),
        "real_g": int(data.get("real_g", 0)),
        "diferenca_g": int(data.get("diferenca_g", 0)),
        "resultado": str(data.get("resultado", "")),
    }
    await asyncio.to_thread(supabase_post_treino, registro)


async def salvar_config_ws(ws, m):
    """Valida o PIN e grava o config.json (inclui troca de PIN). So o admin chega aqui."""
    if str(m.get("pin", "")) != str(CONFIG.get("admin_pin", "")):
        await ws.send(json.dumps({"tipo": "config_resultado", "erro": "PIN inválido"}))
        return
    data = m.get("data", {})
    for campo in ["supabase_url", "supabase_key", "ip_servidor", "loja_id", "loja_nome", "porta_com"]:
        if campo in data and data[campo] is not None:
            CONFIG[campo] = data[campo]
    if data.get("novo_pin"):
        CONFIG["admin_pin"] = str(data["novo_pin"])
    try:
        salvar_config_arquivo()
        carregar_config()
        await ws.send(json.dumps({"tipo": "config_resultado", "ok": True}))
        novo = json.dumps(mensagem_config())  # avisa todos os tablets (ex.: troca de loja)
        await asyncio.gather(*[c.send(novo) for c in list(CLIENTS)], return_exceptions=True)
        log.info("Config atualizada via painel (loja=%s).", CONFIG.get("loja_id"))
    except Exception as e:
        await ws.send(json.dumps({"tipo": "config_resultado", "erro": str(e)}))


async def broadcaster():
    """A cada 100ms envia o peso atual para todos os tablets conectados."""
    while True:
        if CLIENTS:
            connected = bool(scale_connected) and (time.time() - last_read_ts < STALE_AFTER)
            payload = json.dumps({
                "grams": latest_grams,
                "connected": connected,
                "estavel": connected and scale_estavel,
                "port": scale_port,
            })
            results = await asyncio.gather(
                *[c.send(payload) for c in list(CLIENTS)], return_exceptions=True
            )
            # Remove silenciosamente clientes que cairam.
            for client, res in zip(list(CLIENTS), results):
                if isinstance(res, Exception):
                    CLIENTS.discard(client)
        await asyncio.sleep(0.03)   # envia o peso ~33x/seg


async def main_async():
    async with ws_serve(ws_handler, WS_HOST, WS_PORT):
        log.info("WebSocket servindo em ws://%s:%d", WS_HOST, WS_PORT)
        await broadcaster()


# ---------------------------------------------------------------------------
# Inicializacao
# ---------------------------------------------------------------------------
def main():
    _auto_update()      # verifica GitHub antes de qualquer outra coisa
    carregar_config()
    log.info("=" * 60)
    log.info("Dex Balance — servidor iniciando")
    log.info("Loja: %s — %s", CONFIG.get("loja_id"), CONFIG.get("loja_nome"))
    log.info("Licenca: %s (ID da maquina: %s)",
             "VALIDA" if check_license() else "AUSENTE/INVALIDA -- sistema bloqueado",
             get_machine_id())
    log.info("Supabase: %s", "configurado" if (CONFIG.get("supabase_url") and "SEU-PROJETO" not in CONFIG.get("supabase_url", "")) else "NAO configurado (usando backup CSV)")
    log.info("=" * 60)

    # Thread da balanca (daemon: encerra junto com o processo).
    threading.Thread(target=serial_worker, name="serial", daemon=True).start()
    # Thread do HTTP.
    threading.Thread(target=start_http_server, name="http", daemon=True).start()

    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        log.info("Encerrando a pedido do usuario...")
    finally:
        STOP.set()


if __name__ == "__main__":
    main()
