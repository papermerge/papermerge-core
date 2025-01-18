def verify_password(str_password, hashed_password):
    from passlib.hash import pbkdf2_sha256

    return pbkdf2_sha256.verify(str_password, hashed_password)
