"""
Backup/Restore module for Papermerge DMS.

Backups and restores documents and their associated files.
The result of backup operation is a (zipped) tar archive which
contains following:

     1. backup.json file
     2. sidecars/ folder
     3. docs/  folder
     4. <username1>/, <username2>, ... i.e. one folder per user
        with folder title being user's username

 [1] backup.json file contains all necessary info to restore the database.
(all users, their nodes, tags etc).
 [2] sidecars/ contains the exact content of <media_root>/sidecars/ folder
 [3] docs/ contains the exact content of <media_root>/docs/ folder

 [1] is used to restore database content.
 [2] and [3] are used to restore associated files.

 [4] Contains same folder system as users see in web frontend, grouped by
 username. Instead of documents, in folder structure symbolic links are used.
 Symbolic links point to the last version (i.e. associated file) of the
 document. Whatever is in these folders (in <username1>, <username2>, ...) is
 NOT used to restore the data (i.e. it is redundant) instead they are
 human-readable i.e. make backup archive easier to use by human to quickly
 assert the content of the archive.

 Note that before restoring the backup archive the DB schema should exist i.e.
 you first need to:

     $ ./manage.py migrate

     and only after

     $  ./manage.py restore <backup_archive>
"""
from .backup import backup_data
from .restore import restore_data

__all__ = ['backup_data', 'restore_data']
