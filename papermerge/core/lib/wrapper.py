import logging
import subprocess

logger = logging.getLogger(__name__)


class Wrapper:

    def __init__(self, exec_name, check=True, dry_run=False):
        self.exec_name = exec_name
        self.check = check,
        # usefull for debugging purpose
        self.dry_run = dry_run

    def get_cmd(self):
        cmd = []

        if self.exec_name:
            cmd.extend([self.exec_name])

        return cmd

    def call_no_args(self):

        cmd = self.get_cmd()
        self.run(cmd)

    def run(self, cmd):

        command_to_run = ' '.join(cmd)

        if (self.dry_run):
            logger.debug(f"Dry run: {command_to_run}")

        logger.debug(f"subprocess: {command_to_run}")

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
        return ret
