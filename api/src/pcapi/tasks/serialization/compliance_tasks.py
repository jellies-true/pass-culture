from pcapi.routes.serialization import BaseModel


class GetComplianceScoreRequest(BaseModel):
    offer_id: str
    offer_name: str | None = None
    offer_description: str | None = None
    offer_subcategory_id: str | None = None
    rayon: str | None = None
    macro_rayon: str | None = None
    stock_price: float | None = None
    image_url: str | None = None
    offer_type_label: str | None = None
    offer_sub_type_label: str | None = None
    author: str | None = None
    performer: str | None = None

    def to_dict(self) -> dict:
        return {
            "offer_id": self.offer_id,
            "offer_name": self.offer_name,
            "offer_description": self.offer_description,
            "offer_subcategory_id": self.offer_subcategory_id,
            "rayon": self.rayon,
            "macro_rayon": self.macro_rayon,
            "stock_price": self.stock_price,
            "image_url": self.image_url,
            "offer_type_label": self.offer_type_label,
            "offer_sub_type_label": self.offer_sub_type_label,
            "author": self.author,
            "performer": self.performer,
        }
