import gzip
with gzip.open("archive.zip", 'r') as fh:
    try:
        fh.read(1)
    except OSError:
        print('input_file is not a valid gzip file by OSError')