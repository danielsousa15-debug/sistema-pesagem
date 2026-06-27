# -*- coding: utf-8 -*-
"""Mostra o ID desta maquina para solicitar a licenca ao administrador."""
import socket
import uuid


def get_machine_id():
    """Mesmo calculo usado pelo servidor.py (MAC da placa, hostname como reserva)."""
    mac = uuid.getnode()
    if (mac >> 40) & 0x01:
        return socket.gethostname().strip().upper()
    return ":".join("%02X" % ((mac >> shift) & 0xFF) for shift in range(40, -1, -8))


print("")
print("  ==========================================")
print("  Dex Balance -- ID desta maquina")
print("  ==========================================")
print("")
print("  " + get_machine_id())
print("")
print("  Envie este codigo para o administrador")
print("  para receber o arquivo licenca.key e")
print("  coloca-lo na pasta do Dex Balance.")
print("")
input("  Pressione Enter para fechar...")
