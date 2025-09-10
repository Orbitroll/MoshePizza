import logging
from pathlib import Path

LOG_DIR = Path(__file__).resolve().parent
ADMIN_LOG = LOG_DIR / "admin.log"
FREQUENT_LOG = LOG_DIR / "frequent.log"
GUEST_LOG = LOG_DIR / "guest.log"


def _get_logger(name: str, file_path: Path) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.FileHandler(file_path)
        formatter = logging.Formatter("%(asctime)s - %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger


admin_logger = _get_logger("admin", ADMIN_LOG)
frequent_logger = _get_logger("frequent", FREQUENT_LOG)
guest_logger = _get_logger("guest", GUEST_LOG)


def log_admin(message: str) -> None:
    admin_logger.info(message)


def log_frequent_user(message: str) -> None:
    frequent_logger.info(message)


def log_guest(message: str) -> None:
    guest_logger.info(message)