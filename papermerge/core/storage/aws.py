from urllib.parse import quote

from papermerge.core import config

settings = config.get_settings()


class AWSS3Storage:

    def sign_url(self, path: str, valid_for: int) -> str:
        from papermerge.core.cloudfront import sign_url as cf_sign_url

        encoded_path = quote(str(path))
        url = f"https://{settings.papermerge__main__cf_domain}/{encoded_path}"
        return cf_sign_url(url, valid_for)
