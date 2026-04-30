import random
import string


def code_sig_generator():
    """Generate a random code for the SIGACE system"""
    prefix = "SIG"
    while True:
        # Generate 5 random digits to complete the 8 characters
        numbers = "".join(random.choices(string.digits, k=5))
        code = f"{prefix}{numbers}"

        yield code


print(code_sig_generator())
