import random
import string


def generate_code_sig() -> str:
    """Genera un código SIG de 7 caracteres aleatorios"""
    prefix = "SIG"
    suffix = random.randint(1000, 9999)
    code_sig = f"{prefix}{suffix}"
    return code_sig
