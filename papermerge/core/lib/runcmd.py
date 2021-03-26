import logging
import subprocess


logger = logging.getLogger(__name__)


def run(cmd):
    logger.debug(
        f"Run:{'|'.join(cmd)}"
    )

    ret = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        encoding="utf-8"
    )

    if ret.returncode != 0:
        logger.error((
            f"returncode={ret.returncode}"
            f" stdout={ret.stdout}"
            f" stderr={ret.stderr}"
        ))
