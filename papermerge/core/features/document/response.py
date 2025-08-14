from pathlib import Path
import mimetypes
from urllib.parse import quote

from fastapi.responses import FileResponse


class DocumentFileResponse(FileResponse):
    def __init__(self, path, filename: str = None, content_disposition_type: str = "attachment", **kwargs):
        # Auto-detect content type
        content_type, _ = mimetypes.guess_type(path)
        if not content_type:
            extension = Path(path).suffix.lower()
            content_type_map = {
                '.pdf': 'application/pdf',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.tiff': 'image/tiff',
                '.tif': 'image/tiff',
            }
            content_type = content_type_map.get(extension, 'application/octet-stream')

        # If no filename provided, use the file's name
        if filename is None:
            filename = Path(path).name

        # Prepare headers
        headers = kwargs.get('headers', {})

        # Set Content-Disposition header with proper filename encoding
        # This handles filenames with special characters or unicode
        filename_ascii = filename.encode('ascii', 'ignore').decode('ascii')
        filename_utf8 = quote(filename)

        disposition = f'{content_disposition_type}; filename="{filename_ascii}"'
        if filename != filename_ascii:
            disposition += f"; filename*=UTF-8''{filename_utf8}"

        headers['Content-Disposition'] = disposition
        kwargs['headers'] = headers

        super().__init__(
            path=path,
            media_type=content_type,
            **kwargs
        )
