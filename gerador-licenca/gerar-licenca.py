# -*- coding: utf-8 -*-
"""
Gerador de licenca do Dex Balance  ---  USO DO ADMINISTRADOR
============================================================

A loja roda o "Mostrar ID da Maquina.bat" e te envia o ID.
Voce roda este gerador com esse ID e ele cria o arquivo licenca.key.
Envie o licenca.key para a loja colocar na MESMA pasta do servidor.py.

Uso:
    python gerar-licenca.py                 (pergunta o ID)
    python gerar-licenca.py AA:BB:CC:DD:EE:FF
"""
import hashlib
import hmac
import os
import sys

# IMPORTANTE: este segredo precisa ser IDENTICO ao do servidor.py (_LIC_SECRET).
_L1 = "DXB25"
_L2 = "AL-SEC"
_L3 = "FRQ-BAL"
_LIC_SECRET = _L1 + _L2 + _L3


def gerar_chave(machine_id):
    return hmac.new(
        _LIC_SECRET.encode("utf-8"),
        machine_id.strip().upper().encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:32].upper()


def salvar(machine_id):
    chave = gerar_chave(machine_id)
    saida = os.path.join(os.path.dirname(os.path.abspath(__file__)), "licenca.key")
    with open(saida, "w", encoding="utf-8") as f:
        f.write(chave)
    print("")
    print("  Maquina : " + machine_id.strip().upper())
    print("  Chave   : " + chave)
    print("  Arquivo : " + saida)
    print("")
    print("  Envie o arquivo licenca.key para a loja.")
    print("  Ele deve ficar na MESMA pasta do servidor.py.")
    print("")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        salvar(sys.argv[1])
    else:
        mid = input("  ID da maquina (enviado pela loja): ")
        if not mid.strip():
            print("  Nenhum ID informado.")
        else:
            salvar(mid)
