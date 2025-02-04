import zipfile
import csv
import io
from pydantic import BaseModel
from typing import List, Dict
import os
import tempfile
from datetime import datetime
from src.lib.logging import get_logger

DATA_DIR = os.getenv('DATA_DIR', 'arpa-exporter/src/data')

class UploadInfo(BaseModel):
    upload_id: str
    filename_in_zip: str
    directory_location: str
    agency_name: str
    ec_code: str
    reporting_period_name: str
    validity: str


def handle_zipping(source_paths_raw: str):
    # Convert source paths into a dictionary
    source_paths_dict = csv.DictReader(io.StringIO(source_paths_raw))
    zip_path = os.path.join(DATA_DIR, 'uploads_metadata.zip')
    print(source_paths_dict.fieldnames)

    add_metadata_to_zipfile(zip_path, source_paths_raw, datetime.now())
    build_zipfile(zip_path, source_paths_dict)

def add_metadata_to_zipfile(zip_path: str, source_paths_raw: str, zip_date: datetime):
    # metadata is all the source_paths_raw in the form of a CSV
    source_paths_dict = csv.DictReader(io.StringIO(source_paths_raw))

    # save source_paths_dict into a csv file:
    with tempfile.NamedTemporaryFile(mode="w") as metadata_csv_temp:
        writer = csv.DictWriter(metadata_csv_temp, fieldnames=source_paths_dict.fieldnames)
        writer.writeheader()
        for source_path in source_paths_dict:
            writer.writerow(source_path)

        with zipfile.ZipFile(zip_path, 'a') as zipf:
            zipf.write(metadata_csv_temp, arcname=f'/metadata/upload_metadata_{zip_date.strftime("%Y-%m-%d-%H-%M-%S")}.csv')

def build_zipfile(zip_path: str, upload_info: List[Dict[str,str]]):
    logger = get_logger(total_source_files=len(upload_info))
    files_added = 0
    with zipfile.ZipFile(zip_path, 'a') as zipf:
        for upload_dict in upload_info:
            upload = UploadInfo(**upload_dict)
            entry_logger = logger.bind(source_path=os.path.join(DATA_DIR, 'raw_uploads', f'{upload.upload_id}.xlsm'), entry_path=upload.directory_location)
            if upload.directory_location in zipf.namelist():
                entry_logger.info("file already exists in archive")
            else:
                try:
                    zipf.write(os.path.join(DATA_DIR, 'raw_uploads', f'{upload.upload_id}.xlsm'), arcname=upload.directory_location)
                except:
                    entry_logger.exception(
                        "error writing source file to entry in archive"
                    )
                    raise
                files_added += 1
                entry_logger.info("Added file to the archive.")

    logger.info("updated zip archive", files_added=files_added)

# For testing import the zip-file and convert the csv data into a string that can be passed into the next function
def extract_CSV_file():
    with open(os.path.join(DATA_DIR, 'uploads_metadata.csv'), 'r') as file:
        data = file.read()
    return data
handle_zipping(extract_CSV_file())
