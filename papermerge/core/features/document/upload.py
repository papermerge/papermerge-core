from fastapi import UploadFile
from botocore.exceptions import ClientError

from papermerge.core.config import get_settings


class FileTooLargeError(Exception):
    pass

class R2UploadError(Exception):
    pass


config = get_settings()

CHUNK_SIZE = 5 * 1024 * 1024


async def stream_file_to_r2(
    file: UploadFile,
    object_key: str,
    content_type: str,
) -> int:
    """
    Stream file directly to R2 without storing locally.

    Returns:
        Actual file size in bytes

    Raises:
        FileTooLargeError: If file exceeds max_file_size
        R2UploadError: If upload fails
    """
    s3_client = get_r2_client()  # Your existing client
    bucket_name = config.bucket_name
    max_file_size = config.max_file_size_mb * 1024 * 1024

    # For small files (< 5MB), simple upload
    if file.size and file.size < CHUNK_SIZE:
        content = await file.read()

        if len(content) > max_file_size:
            raise FileTooLargeError(
                f"File size {len(content)} exceeds maximum {max_file_size}"
            )

        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=object_key,
                Body=content,
                ContentType=content_type
            )
            return len(content)
        except ClientError as e:
            raise R2UploadError(f"Upload failed: {e}")

    # For large files, use multipart upload


    try:
        # Initiate multipart upload
        multipart = s3_client.create_multipart_upload(
            Bucket=bucket_name,
            Key=object_key,
            ContentType=content_type
        )
        upload_id = multipart['UploadId']

        parts = []
        part_number = 1
        total_size = 0

        # Stream in chunks
        while True:
            chunk = await file.read(CHUNK_SIZE)
            if not chunk:
                break

            total_size += len(chunk)

            # Check size limit
            if total_size > max_file_size:
                # Abort upload
                s3_client.abort_multipart_upload(
                    Bucket=bucket_name,
                    Key=object_key,
                    UploadId=upload_id
                )
                raise FileTooLargeError(
                    f"File size exceeds maximum {max_file_size}"
                )

            # Upload part
            response = s3_client.upload_part(
                Bucket=bucket_name,
                Key=object_key,
                PartNumber=part_number,
                UploadId=upload_id,
                Body=chunk
            )

            parts.append({
                'PartNumber': part_number,
                'ETag': response['ETag']
            })
            part_number += 1

        # Complete upload
        s3_client.complete_multipart_upload(
            Bucket=bucket_name,
            Key=object_key,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )

        return total_size

    except FileTooLargeError:
        raise
    except Exception as e:
        # Abort on any error
        try:
            s3_client.abort_multipart_upload(
                Bucket=bucket_name,
                Key=object_key,
                UploadId=upload_id
            )
        except:
            pass
        raise R2UploadError(f"Multipart upload failed: {e}")



def get_r2_client():
    from papermerge.storage import get_storage_backend

    backend = get_storage_backend()
    return backend.client
