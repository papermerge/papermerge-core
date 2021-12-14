from rest_framework import serializers as rest_serializers


class OcrSerializer(rest_serializers.Serializer):
    doc_id = id = rest_serializers.CharField(max_length=32, required=True)
    lang = rest_serializers.CharField(required=True)
