"""Single shared slowapi Limiter instance.
Both main.py (exception handler / app.state.limiter) and routers must import
this same object — never construct a new Limiter elsewhere."""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
