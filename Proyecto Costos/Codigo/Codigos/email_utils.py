import os
import smtplib
from email.message import EmailMessage
from typing import Optional, List
from config import EMAIL_TO, DEFAULT_FROM_NAME, SMTP_DEFAULTS
from utils import log, parse_recipients


def _get_smtp_setting(env_key: str, default_key: str, aliases: Optional[List[str]] = None):
    """Devuelve el valor SMTP desde env o el fallback definido en config."""
    keys = [env_key] + list(aliases or [])
    for key in keys:
        env_val = os.environ.get(key)
        if env_val is not None and env_val != "":
            return env_val
    return SMTP_DEFAULTS.get(default_key)


def send_email(
    subject: str,
    body: str,
    attachment_path: Optional[str] = None,
    recipients_override: Optional[List[str]] = None,
) -> bool:
    """Envía un correo simple usando los datos de entorno o los defaults de config."""
    host = _get_smtp_setting("SMTP_HOST", "host", aliases=["EMAIL_HOST"])
    user = _get_smtp_setting("SMTP_USER", "user", aliases=["EMAIL_USER", "EMAIL_DIRECTION", "FROM_EMAIL"])
    password = _get_smtp_setting("SMTP_PASS", "pass", aliases=["EMAIL_PASSWORD"])
    port = int(_get_smtp_setting("SMTP_PORT", "port", aliases=["EMAIL_PORT"]) or 587)

    use_ssl_env = os.environ.get("SMTP_SSL")
    if use_ssl_env is None:
        use_ssl_env = os.environ.get("EMAIL_SECURE")
    if use_ssl_env is None:
        use_ssl = bool(SMTP_DEFAULTS.get("ssl"))
    else:
        use_ssl = use_ssl_env not in {"", "0", "false", "False"}

    use_starttls_env = os.environ.get("SMTP_STARTTLS")
    if use_starttls_env is None:
        use_starttls_env = os.environ.get("EMAIL_STARTTLS")
    if use_starttls_env is None:
        use_starttls = bool(SMTP_DEFAULTS.get("starttls", True))
    else:
        use_starttls = use_starttls_env not in {"", "0", "false", "False"}

    sender_addr = _get_smtp_setting("SMTP_FROM", "from_addr", aliases=["FROM_EMAIL", "EMAIL_DIRECTION"]) or "no-reply@bpbargentina.com"
    sender_name = _get_smtp_setting("SMTP_FROM_NAME", "from_name", aliases=["EMAIL_FROM_NAME"]) or DEFAULT_FROM_NAME
    recipients = recipients_override if recipients_override is not None else parse_recipients(os.environ.get("EMAIL_TO") or EMAIL_TO)

    if not host:
        log("SMTP_HOST no configurado; no se enviaran correos.", "WARN")
        return False
    if not recipients:
        log("EMAIL_TO no definido o vacio; no se enviaran correos.", "WARN")
        return False

    try:
        log(f"Enviando email via {host}:{port} ssl={use_ssl} starttls={use_starttls} a {recipients}", "INFO")
        msg = EmailMessage()
        msg["From"] = f"{sender_name} <{sender_addr}>"
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        msg.set_content(body)

        if attachment_path and os.path.isfile(attachment_path):
            try:
                with open(attachment_path, "rb") as f:
                    data = f.read()
                msg.add_attachment(data, maintype="application", subtype="pdf", filename=os.path.basename(attachment_path))
            except Exception as exc:
                log(f"No se pudo adjuntar {attachment_path}: {exc}", "WARN")

        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)

        with server:
            server.ehlo()
            if use_starttls and not use_ssl:
                server.starttls()
                server.ehlo()
            if user:
                server.login(user, password or "")
            server.send_message(msg, from_addr=sender_addr, to_addrs=recipients)
            log("Email enviado correctamente.", "INFO")
            return True
    except Exception as exc:
        log(f"No se pudo enviar email: {exc}", "ERROR")
        return False
