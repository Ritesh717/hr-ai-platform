from dataclasses import dataclass

from fastapi import Query


@dataclass
class PaginationParams:
    offset: int
    limit: int


def pagination_params(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> PaginationParams:
    return PaginationParams(offset=offset, limit=limit)
