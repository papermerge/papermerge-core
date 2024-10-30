from pydantic import BaseModel, ConfigDict


class CreateUser(BaseModel):
    username: str
    email: str
    password: str

    # Config
    model_config = ConfigDict(from_attributes=True)


class UpdateUser(BaseModel):
    username: str
    email: str
    password: str | None = None
